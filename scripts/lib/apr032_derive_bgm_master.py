import argparse
import json
import os
import platform

import numpy as np
import soundfile as sf

# The APR-032 helper only ever runs inside a short Windows working directory and
# only ever receives bare local filenames. Attempts 1 and 2 failed because deep
# fixed staging paths exceeded the Windows MAX_PATH ceiling that libsndfile and
# os.open still enforce, so path length is now a hard precondition, not a hope.
MAX_TOOL_PATH_LENGTH = 200


def local_name(value: str, label: str) -> str:
    if value in ("", ".", ".."):
        raise ValueError(f"{label} must be a bare local filename")
    if os.path.isabs(value) or os.path.splitdrive(value)[0]:
        raise ValueError(f"{label} must not be absolute")
    separators = {"/", "\\", os.sep}
    if os.altsep:
        separators.add(os.altsep)
    if any(separator in value for separator in separators):
        raise ValueError(f"{label} must not contain a path separator")
    if value != os.path.basename(value):
        raise ValueError(f"{label} must be a bare local filename")
    return value


def bounded_path(name: str, label: str) -> str:
    absolute = os.path.abspath(name)
    if len(absolute) >= MAX_TOOL_PATH_LENGTH:
        raise ValueError(f"{label} resolves to {len(absolute)} characters, above the {MAX_TOOL_PATH_LENGTH} limit")
    return absolute


def finite_audio(audio: np.ndarray, label: str) -> None:
    if not np.all(np.isfinite(audio)):
        raise ValueError(f"{label} contains non-finite samples")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--gain-db", required=True, type=float)
    args = parser.parse_args()

    if args.gain_db != -2.8:
        raise ValueError("gain_db must be exactly -2.8")

    source_name = local_name(args.source, "source")
    destination_name = local_name(args.destination, "destination")
    if source_name == destination_name:
        raise ValueError("source and destination must differ")

    source_absolute = bounded_path(source_name, "source")
    destination_absolute = bounded_path(destination_name, "destination")
    if not os.path.isfile(source_name):
        raise FileNotFoundError(f"source is missing: {source_absolute}")
    if os.path.exists(destination_name):
        raise FileExistsError(f"destination already exists: {destination_absolute}")

    audio, sample_rate = sf.read(source_name, dtype="float64", always_2d=True)
    if audio.shape[0] == 0:
        raise ValueError("source audio is empty")
    if sample_rate != 44100 or audio.shape[1] != 2:
        raise ValueError("source must decode as 44.1 kHz stereo")
    finite_audio(audio, "source")

    scalar = 10.0 ** (args.gain_db / 20.0)
    derived = audio * scalar
    finite_audio(derived, "derived")
    source_peak = float(np.max(np.abs(audio)))
    derived_peak = float(np.max(np.abs(derived)))
    if derived_peak > 1.0:
        raise ValueError("constant gain would clip")

    descriptor = os.open(destination_name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    try:
        with sf.SoundFile(
            descriptor,
            mode="w",
            samplerate=sample_rate,
            channels=2,
            format="MP3",
            subtype="MPEG_LAYER_III",
            closefd=False,
            compression_level=0.0,
            bitrate_mode="CONSTANT",
        ) as output:
            output.write(derived)
            output.flush()
    finally:
        os.close(descriptor)

    result = {
        "python_version": platform.python_version(),
        "soundfile_version": sf.__version__,
        "libsndfile_version": sf.__libsndfile_version__,
        "numpy_version": np.__version__,
        "execution_cwd": os.getcwd(),
        "source_argument": source_name,
        "destination_argument": destination_name,
        "source_absolute_path_length": len(source_absolute),
        "destination_absolute_path_length": len(destination_absolute),
        "sample_rate_hz": int(sample_rate),
        "channels": int(audio.shape[1]),
        "decoded_frames": int(audio.shape[0]),
        "gain_db": args.gain_db,
        "linear_scalar": scalar,
        "source_absolute_peak": source_peak,
        "derived_preencode_absolute_peak": derived_peak,
        "encoder": {
            "format": "MP3",
            "subtype": "MPEG_LAYER_III",
            "compression_level": 0.0,
            "bitrate_mode": "CONSTANT",
        },
    }
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
