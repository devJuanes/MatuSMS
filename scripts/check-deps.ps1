#Requires -Version 5.1
Write-Host "MatuSMS — checking dependencies..." -ForegroundColor Cyan

$ok = $true

function Test-Cmd($name, $cmd) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $v = & $cmd --version 2>$null | Select-Object -First 1
        Write-Host "[OK] $name : $v" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $name" -ForegroundColor Red
        $script:ok = $false
    }
}

Test-Cmd "Node.js" "node"
Test-Cmd "pnpm" "pnpm"
Test-Cmd "Flutter" "flutter"

if (Get-Service Redis -ErrorAction SilentlyContinue) {
    $redis = Get-Service Redis
    Write-Host "[OK] Redis service: $($redis.Status)" -ForegroundColor Green
} else {
    Write-Host "[WARN] Redis Windows service not found — use Upstash REDIS_URL" -ForegroundColor Yellow
}

if (-not $ok) {
    Write-Host "`nInstall missing dependencies before running MatuSMS." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll core dependencies found." -ForegroundColor Green
