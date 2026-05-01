#!/usr/bin/env python3
"""Generate one VibeVoice-Realtime WAV file from a prepared text file.

This script is intentionally small: Node scripts own queueing, approval, and
MP3 conversion; this file only runs the VibeVoice model inside the local WSL
venv.
"""

from __future__ import annotations

import argparse
import copy
import glob
import json
import os
import sys
import time
import traceback
from pathlib import Path

import torch


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Donggri VibeVoice-Realtime file inference")
    parser.add_argument("--model-path", default="microsoft/VibeVoice-Realtime-0.5B")
    parser.add_argument("--batch-json")
    parser.add_argument("--txt-path")
    parser.add_argument("--speaker-name")
    parser.add_argument("--output-wav")
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu", "mps"])
    parser.add_argument("--dtype", default="auto", choices=["auto", "float16", "float32", "bfloat16"])
    parser.add_argument("--attn", default="sdpa", choices=["sdpa", "flash_attention_2"])
    parser.add_argument("--cfg-scale", type=float, default=1.5)
    parser.add_argument("--ddpm-steps", type=int, default=5)
    return parser.parse_args()


def repo_root() -> Path:
    configured = os.environ.get("VIBEVOICE_REPO")
    if configured:
        return Path(configured).expanduser().resolve()
    return Path("/mnt/e/VibeVoiceLocal/VibeVoice")


def select_device(requested: str) -> str:
    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def select_dtype(device: str, requested: str) -> torch.dtype:
    if requested == "float16":
        return torch.float16
    if requested == "bfloat16":
        return torch.bfloat16
    if requested == "float32":
        return torch.float32
    if device == "cuda":
        # GTX 1660 Ti does not support BF16; FP16 keeps VRAM lower than FP32.
        return torch.float16
    return torch.float32


def move_cached_prompt(value, device: str, dtype: torch.dtype):
    if torch.is_tensor(value):
        if value.is_floating_point():
            return value.to(device=device, dtype=dtype)
        return value.to(device=device)
    if hasattr(value, "key_cache") and hasattr(value, "value_cache"):
        value.key_cache = [move_cached_prompt(entry, device, dtype) for entry in value.key_cache]
        value.value_cache = [move_cached_prompt(entry, device, dtype) for entry in value.value_cache]
        return value
    if hasattr(value, "past_key_values") and hasattr(value, "items"):
        return value.__class__(**{key: move_cached_prompt(entry, device, dtype) for key, entry in value.items()})
    if isinstance(value, dict):
        return {key: move_cached_prompt(entry, device, dtype) for key, entry in value.items()}
    if isinstance(value, list):
        return [move_cached_prompt(entry, device, dtype) for entry in value]
    if isinstance(value, tuple):
        return tuple(move_cached_prompt(entry, device, dtype) for entry in value)
    return value


class VoiceMapper:
    def __init__(self, voices_dir: Path) -> None:
        self.voices_dir = voices_dir
        self.voice_presets = self._load_presets()

    def _load_presets(self) -> dict[str, str]:
        if not self.voices_dir.exists():
            raise FileNotFoundError(f"VibeVoice voices directory not found: {self.voices_dir}")
        presets: dict[str, str] = {}
        for file_name in glob.glob(str(self.voices_dir / "**" / "*.pt"), recursive=True):
            path = Path(file_name).resolve()
            presets[path.stem.lower()] = str(path)
        if not presets:
            raise FileNotFoundError(f"No VibeVoice .pt voice presets found under {self.voices_dir}")
        return dict(sorted(presets.items()))

    def get(self, speaker_name: str) -> str:
        key = speaker_name.lower()
        if key in self.voice_presets:
            return self.voice_presets[key]
        matches = [path for name, path in self.voice_presets.items() if key in name or name in key]
        if len(matches) == 1:
            return matches[0]
        if len(matches) > 1:
            raise ValueError(f"Multiple voice presets match '{speaker_name}'. Use a more specific name.")
        available = ", ".join(self.voice_presets.keys())
        raise ValueError(f"Voice preset not found: {speaker_name}. Available presets: {available}")


def load_modules(vibevoice_repo: Path):
    sys.path.insert(0, str(vibevoice_repo))
    from vibevoice.modular.modeling_vibevoice_streaming_inference import (  # noqa: PLC0415
        VibeVoiceStreamingForConditionalGenerationInference,
    )
    from vibevoice.processor.vibevoice_streaming_processor import (  # noqa: PLC0415
        VibeVoiceStreamingProcessor,
    )

    return VibeVoiceStreamingForConditionalGenerationInference, VibeVoiceStreamingProcessor


def load_targets(args: argparse.Namespace) -> list[dict[str, str]]:
    if args.batch_json:
        batch_path = Path(args.batch_json).resolve()
        if not batch_path.exists():
            raise FileNotFoundError(f"Batch JSON not found: {batch_path}")
        payload = json.loads(batch_path.read_text(encoding="utf-8"))
        targets = payload.get("items", payload if isinstance(payload, list) else [])
        if not isinstance(targets, list) or not targets:
            raise ValueError(f"Batch JSON has no items: {batch_path}")
        return targets

    missing = [name for name in ["txt_path", "speaker_name", "output_wav"] if not getattr(args, name)]
    if missing:
        raise ValueError(f"Missing required single-file args: {', '.join(missing)}")
    return [
        {
            "id": Path(args.output_wav).stem,
            "txt_path": args.txt_path,
            "speaker_name": args.speaker_name,
            "output_wav": args.output_wav,
        }
    ]


def main() -> int:
    args = parse_args()
    targets = load_targets(args)
    vibevoice_repo = repo_root()
    model_cls, processor_cls = load_modules(vibevoice_repo)

    device = select_device(args.device)
    dtype = select_dtype(device, args.dtype)
    target_device = "cpu" if device == "cpu" else device

    voices_dir = vibevoice_repo / "demo" / "voices" / "streaming_model"
    voice_mapper = VoiceMapper(voices_dir)
    voice_cache: dict[str, object] = {}

    started_at = time.time()
    print(
        json.dumps(
            {
                "status": "loading",
                "provider": "vibevoice-realtime-0.5b",
                "model_path": args.model_path,
                "device": device,
                "dtype": str(dtype),
                "attn": args.attn,
                "targets": len(targets),
            },
            ensure_ascii=False,
        ),
        flush=True,
    )

    processor = processor_cls.from_pretrained(args.model_path)

    try:
        model = model_cls.from_pretrained(
            args.model_path,
            torch_dtype=dtype,
            device_map=(target_device if target_device in {"cuda", "cpu"} else None),
            attn_implementation=args.attn,
        )
    except Exception:
        if args.attn != "sdpa":
            model = model_cls.from_pretrained(
                args.model_path,
                torch_dtype=dtype,
                device_map=(target_device if target_device in {"cuda", "cpu"} else None),
                attn_implementation="sdpa",
            )
        else:
            raise

    if device == "mps":
        model.to("mps")
    model.eval()
    model.set_ddpm_inference_steps(num_steps=args.ddpm_steps)

    completed = []
    for index, target in enumerate(targets, start=1):
        target_id = target.get("id") or Path(target["output_wav"]).stem
        txt_path = Path(target["txt_path"]).resolve()
        output_wav = Path(target["output_wav"]).resolve()
        speaker_name = target["speaker_name"]
        if not txt_path.exists():
            raise FileNotFoundError(f"Input text file not found for {target_id}: {txt_path}")

        script_text = txt_path.read_text(encoding="utf-8").strip()
        if not script_text:
            raise ValueError(f"Input text file is empty for {target_id}: {txt_path}")

        if speaker_name not in voice_cache:
            voice_sample = voice_mapper.get(speaker_name)
            cached_prompt = torch.load(voice_sample, map_location=target_device, weights_only=False)
            voice_cache[speaker_name] = move_cached_prompt(cached_prompt, target_device, dtype)

        cached_prompt = voice_cache[speaker_name]
        print(
            json.dumps(
                {
                    "status": "generating",
                    "index": index,
                    "total": len(targets),
                    "id": target_id,
                    "speaker_name": speaker_name,
                    "output_wav": str(output_wav),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )

        inputs = processor.process_input_with_cached_prompt(
            text=script_text.replace("’", "'").replace("“", '"').replace("”", '"'),
            cached_prompt=cached_prompt,
            padding=True,
            return_tensors="pt",
            return_attention_mask=True,
        )

        for key, value in inputs.items():
            if torch.is_tensor(value):
                inputs[key] = value.to(target_device)

        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_new_tokens=None,
                cfg_scale=args.cfg_scale,
                tokenizer=processor.tokenizer,
                generation_config={"do_sample": False},
                verbose=True,
                all_prefilled_outputs=copy.deepcopy(cached_prompt),
            )

        if not outputs.speech_outputs or outputs.speech_outputs[0] is None:
            raise RuntimeError(f"VibeVoice did not produce speech output for {target_id}.")

        output_wav.parent.mkdir(parents=True, exist_ok=True)
        processor.save_audio(outputs.speech_outputs[0], output_path=str(output_wav))
        duration = float(outputs.speech_outputs[0].shape[-1]) / 24000.0
        completed.append({"id": target_id, "output_wav": str(output_wav), "duration_seconds": round(duration, 3)})
        print(
            json.dumps(
                {
                    "status": "completed_item",
                    "id": target_id,
                    "output_wav": str(output_wav),
                    "duration_seconds": round(duration, 3),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )

    print(
        json.dumps(
            {
                "status": "completed",
                "completed": len(completed),
                "items": completed,
                "elapsed_seconds": round(time.time() - started_at, 3),
            },
            ensure_ascii=False,
        ),
        flush=True,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error": str(exc),
                    "traceback": traceback.format_exc(limit=8),
                },
                ensure_ascii=False,
            ),
            file=sys.stderr,
            flush=True,
        )
        raise SystemExit(1)
