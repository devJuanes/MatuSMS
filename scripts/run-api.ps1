#Requires -Version 5.1
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Starting MatuSMS API..." -ForegroundColor Cyan
pnpm --filter @matusms/api dev
