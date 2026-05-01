#!/usr/bin/env python3
"""Probe VibeVoice-1.5B support in the official local checkout.

The current official repository keeps the 1.5B weights visible on Hugging Face,
but the old TTS inference entrypoint is not part of the supported path. This
script records that state without failing the main asset pipeline.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Probe VibeVoice-1.5B local generation availability")
    parser.add_argument("--model-path", default="microsoft/VibeVoice-1.5B")
    parser.add_argument("--txt-path", required=True)
    parser.add_argument("--speaker-name", required=True)
    parser.add_argument("--output-wav", required=True)
    parser.add_argument("--allow-heavy-load", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    vibevoice_repo = Path(os.environ.get("VIBEVOICE_REPO", "/mnt/e/VibeVoiceLocal/VibeVoice"))
    legacy_entrypoint = vibevoice_repo / "demo" / "inference_from_file.py"

    if not legacy_entrypoint.exists():
        print(
            json.dumps(
                {
                    "status": "unavailable",
                    "provider": "vibevoice-1.5b",
                    "model_path": args.model_path,
                    "reason": "The official VibeVoice checkout does not include demo/inference_from_file.py for 1.5B TTS generation.",
                    "txt_path": args.txt_path,
                    "speaker_name": args.speaker_name,
                    "output_wav": args.output_wav,
                },
                ensure_ascii=False,
            )
        )
        return 0

    if not args.allow_heavy_load:
        print(
            json.dumps(
                {
                    "status": "unavailable",
                    "provider": "vibevoice-1.5b",
                    "model_path": args.model_path,
                    "reason": "Legacy 1.5B entrypoint exists, but heavy generation is disabled unless --allow-heavy-load is passed.",
                    "legacy_entrypoint": str(legacy_entrypoint),
                },
                ensure_ascii=False,
            )
        )
        return 0

    print(
        json.dumps(
            {
                "status": "unavailable",
                "provider": "vibevoice-1.5b",
                "model_path": args.model_path,
                "reason": "Heavy 1.5B generation is intentionally not automated until the official entrypoint is validated locally.",
                "legacy_entrypoint": str(legacy_entrypoint),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
