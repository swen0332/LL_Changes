# ============================================================
# LubeLogger Run Script
# ============================================================
$dotnetDir = "$env:LOCALAPPDATA\dotnet"
$env:DOTNET_ROOT = $dotnetDir
$env:PATH = "$dotnetDir;$env:PATH"

Write-Host "Starting LubeLogger..." -ForegroundColor Green
& "$dotnetDir\dotnet.exe" run
