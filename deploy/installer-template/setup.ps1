# Trialvo Opt2 setup (Windows) — docker login + compose up
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "agent.env")) {
  Write-Error "Missing agent.env — re-download the installer from Trialvo."
}

Get-Content "agent.env" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_.Split('=', 2)
  if ($parts.Length -eq 2) {
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
  }
}

$registry = if ($env:TRIAL_REGISTRY) { $env:TRIAL_REGISTRY } else { "registry.trialvo.com" }
$user = if ($env:TRIAL_REGISTRY_USER) { $env:TRIAL_REGISTRY_USER } else { "trial" }
$token = $env:TRIAL_REGISTRY_TOKEN
if (-not $token) { Write-Error "TRIAL_REGISTRY_TOKEN missing in agent.env" }

Write-Host "Logging into $registry (scoped pull token)..."
$token | docker login $registry -u $user --password-stdin

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example — edit DOMAIN / passwords, then re-run."
  exit 0
}

Write-Host "Starting trial stack..."
docker compose up -d
Write-Host "Done. Agent must reach CONTROL_PLANE_URL."
