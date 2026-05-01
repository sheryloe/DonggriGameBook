param(
  [string]$Model = "gpt-image-2",
  [int]$From = 1,
  [int]$Limit = 0
)

$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $true
}

Set-Location (Resolve-Path "$PSScriptRoot\..")

function Convert-SecureStringToPlainText {
  param([SecureString]$Secure)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
}

$secureKey = Read-Host "OpenAI API key" -AsSecureString
$plainKey = Convert-SecureStringToPlainText -Secure $secureKey

if ([string]::IsNullOrWhiteSpace($plainKey)) {
  throw "OpenAI API key is empty."
}

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,

    [Parameter(Mandatory = $true)]
    [ScriptBlock]$Command
  )

  Write-Host ""
  Write-Host "==> $Label"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Label"
  }
}

try {
  $env:OPENAI_API_KEY = $plainKey

  if ($From -le 1 -and $Limit -le 0) {
    Invoke-Native "openai-images:part1" { npm.cmd run openai-images:part1 -- --count 40 --model $Model }
  }
  elseif ($Limit -gt 0) {
    Invoke-Native "openai-images:part1 from $From limit $Limit" { npm.cmd run openai-images:part1 -- --from $From --limit $Limit --model $Model }
  }
  else {
    Invoke-Native "openai-images:part1 from $From" { npm.cmd run openai-images:part1 -- --from $From --model $Model }
  }
  Invoke-Native "poster korean overlay" { node.exe scripts/generate-part1-korean-posters.mjs }
  Invoke-Native "dashboard:media-catalog" { npm.cmd run dashboard:media-catalog }
  Invoke-Native "dashboard:media-sync" { npm.cmd run dashboard:media-sync }
  Invoke-Native "dashboard:modern" { npm.cmd run dashboard:modern }
  Invoke-Native "private:export" { npm.cmd run private:export }
  Invoke-Native "build:part1" { npm.cmd run build:part1 }
}
finally {
  Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
  $plainKey = $null
}
