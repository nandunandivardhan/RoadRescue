# Automated k6 Installer for Windows (No Admin Rights Required)
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Automated k6 Load Tester Installer for Windows   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$k6Version = "v0.56.0"
$downloadUrl = "https://github.com/grafana/k6/releases/download/$k6Version/k6-$k6Version-windows-amd64.zip"
$zipPath = "$env:TEMP\k6.zip"
$extractPath = "$PSScriptRoot\tools"

Write-Host "Downloading official k6 binary ($k6Version)..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

Write-Host "Extracting k6..." -ForegroundColor Yellow
if (!(Test-Path $extractPath)) {
    New-Item -ItemType Directory -Path $extractPath | Out-Null
}
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

$binPath = "$extractPath\k6-$k6Version-windows-amd64"
Write-Host "k6 successfully downloaded to: $binPath\k6.exe" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run k6 load tests using:" -ForegroundColor White
Write-Host ".\tools\k6-$k6Version-windows-amd64\k6.exe run `"`Vulnerability Test Results\k6-load-test.js`"` --env TARGET_URL=http://localhost:8080/api" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
