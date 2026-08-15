# ============================================================
# LubeLogger Upstream Update Script
# ============================================================
# Run this script whenever the LubeLogger team releases a new
# version and you want to absorb those changes while keeping
# your custom Pump UI changes.
#
# Usage:  .\update-from-upstream.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# Ensure Portable Git is on the PATH
$gitPaths = @(
    "C:\Users\taits\AppData\Local\PortableGit2\cmd",
    "C:\Users\taits\AppData\Local\PortableGit2\mingw64\bin",
    "C:\Users\taits\AppData\Local\PortableGit2\usr\bin"
)
foreach ($p in $gitPaths) {
    if ($env:PATH -notlike "*$p*") { $env:PATH = "$p;$env:PATH" }
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  LubeLogger Upstream Update" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Run this script from C:\Users\taits\LubeLogger" -ForegroundColor Red
    exit 1
}

$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

$dirty = git status --porcelain
if ($dirty) {
    Write-Host ""
    Write-Host "WARNING: You have uncommitted changes. Please commit or stash first." -ForegroundColor Yellow
    git status --short
    exit 1
}

Write-Host ""
Write-Host "[1/4] Fetching latest changes from upstream LubeLogger..." -ForegroundColor Green
git fetch upstream
Write-Host "      Done." -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Updating main branch to match upstream..." -ForegroundColor Green
git checkout main
git merge upstream/main --ff-only
Write-Host "      main is now up to date." -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Rebasing your custom changes onto updated main..." -ForegroundColor Green
git checkout custom-pump-ui
git rebase main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "CONFLICT DETECTED - See above. Resolve, then run: git rebase --continue" -ForegroundColor Yellow
    exit 1
}
Write-Host "      Rebase complete. Your changes are preserved." -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Update Summary:"
git log --oneline -6
Write-Host ""
Write-Host "SUCCESS! LubeLogger updated. Your custom Pump UI changes are intact." -ForegroundColor Cyan
Write-Host "Next: dotnet run" -ForegroundColor White
