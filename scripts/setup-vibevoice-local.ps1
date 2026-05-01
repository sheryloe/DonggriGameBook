param(
  [string]$VibeVoiceHome = "E:\VibeVoiceLocal",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

function Convert-ToWslPath {
  param([Parameter(Mandatory = $true)][string]$WindowsPath)
  $resolved = [System.IO.Path]::GetFullPath($WindowsPath)
  $drive = $resolved.Substring(0, 1).ToLowerInvariant()
  $rest = $resolved.Substring(2).Replace("\", "/")
  return "/mnt/$drive$rest"
}

if (-not (Test-Path "E:\")) {
  throw "E: drive is required for VibeVoice local setup."
}

New-Item -ItemType Directory -Force -Path $VibeVoiceHome | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $VibeVoiceHome "hf-cache") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $VibeVoiceHome "torch-cache") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $VibeVoiceHome "work") | Out-Null

[Environment]::SetEnvironmentVariable("VIBEVOICE_HOME", $VibeVoiceHome, "User")
[Environment]::SetEnvironmentVariable("HF_HOME", (Join-Path $VibeVoiceHome "hf-cache"), "User")
[Environment]::SetEnvironmentVariable("TORCH_HOME", (Join-Path $VibeVoiceHome "torch-cache"), "User")

$wslHome = Convert-ToWslPath $VibeVoiceHome
$setupScript = Join-Path $VibeVoiceHome "setup-vibevoice-local.sh"
$skipInstallFlag = if ($SkipInstall) { "1" } else { "0" }

$preflightScript = @'
missing=()
for cmd in git git-lfs ffmpeg ffprobe python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    missing+=("$cmd")
  fi
done
if ! python3 -m venv --help >/dev/null 2>&1; then
  missing+=("python3-venv")
fi
printf '%s\n' "${missing[@]}"
'@

$missingTools = @(wsl -e bash -lc $preflightScript | Where-Object { $_ -and $_.Trim().Length -gt 0 })
if ($missingTools.Count -gt 0) {
  Write-Host "[setup] Installing WSL prerequisites as root: $($missingTools -join ', ')"
  wsl -u root -e bash -lc "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y git git-lfs ffmpeg python3-venv python3-pip wget tar"
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$bashScript = @"
#!/usr/bin/env bash
set -euo pipefail

VIBE_HOME="$wslHome"
REPO_DIR="`$VIBE_HOME/VibeVoice"
VENV_DIR="`$VIBE_HOME/venv"
HF_HOME="`$VIBE_HOME/hf-cache"
TORCH_HOME="`$VIBE_HOME/torch-cache"
REF="e73d1e17c3754f046352014856a922f8208fb5d3"
SKIP_INSTALL="$skipInstallFlag"

export HF_HOME TORCH_HOME

mkdir -p "`$VIBE_HOME" "`$HF_HOME" "`$TORCH_HOME" "`$VIBE_HOME/work"

missing=()
for cmd in git git-lfs ffmpeg ffprobe python3; do
  if ! command -v "`$cmd" >/dev/null 2>&1; then
    missing+=("`$cmd")
  fi
done

if ! python3 -m venv --help >/dev/null 2>&1; then
  missing+=("python3-venv")
fi

if [ "`${#missing[@]}" -gt 0 ]; then
  echo "[setup] Missing tools: `${missing[*]}"
  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    sudo -n apt-get update
    sudo -n apt-get install -y git git-lfs ffmpeg python3-venv python3-pip wget tar
  else
    echo "[setup] Install prerequisites in WSL first:"
    echo "sudo apt-get update && sudo apt-get install -y git git-lfs ffmpeg python3-venv python3-pip wget tar"
    exit 2
  fi
fi

if [ ! -d "`$REPO_DIR/.git" ]; then
  git clone https://github.com/microsoft/VibeVoice.git "`$REPO_DIR"
fi

cd "`$REPO_DIR"
git fetch --all --tags
git checkout "`$REF"
git lfs install --local || true

if [ "`$SKIP_INSTALL" != "1" ]; then
  python3 -m venv "`$VENV_DIR"
  . "`$VENV_DIR/bin/activate"
  python -m pip install --upgrade pip setuptools wheel
  python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  python -m pip install -e ".[streamingtts]"
  bash demo/download_experimental_voices.sh
fi

if [ ! -f "`$VENV_DIR/bin/activate" ]; then
  echo "[setup] Venv is not installed yet: `$VENV_DIR"
  echo "[setup] Re-run without -SkipInstall to install Python dependencies."
  exit 0
fi

. "`$VENV_DIR/bin/activate"
python - <<'PY'
import torch
print({"torch": torch.__version__, "cuda_available": torch.cuda.is_available(), "cuda_device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None})
PY

echo "[setup] VibeVoice local setup complete: `$VIBE_HOME"
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($setupScript, $bashScript, $utf8NoBom)

$wslSetupScript = Convert-ToWslPath $setupScript
wsl -e bash $wslSetupScript
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "VIBEVOICE_HOME=$VibeVoiceHome"
Write-Host "HF_HOME=$(Join-Path $VibeVoiceHome "hf-cache")"
Write-Host "TORCH_HOME=$(Join-Path $VibeVoiceHome "torch-cache")"
