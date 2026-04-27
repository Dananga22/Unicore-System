$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $root "Unicore-System"
$frontend = Join-Path $projectRoot "frontend"
$backend = Join-Path $projectRoot "backend"
$maven = Join-Path $projectRoot "apache-maven-3.9.6\bin\mvn.cmd"

Write-Host "Reinstalling frontend dependencies..."
Push-Location $frontend
npm install
Pop-Location

Write-Host "Rebuilding backend..."
Push-Location $backend
& $maven clean install
Pop-Location

Write-Host "Submission prep complete."
