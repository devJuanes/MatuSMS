#Requires -Version 5.1
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Starting MatuSMS Dashboard..." -ForegroundColor Cyan
pnpm --filter @matusms/web dev
