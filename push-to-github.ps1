# =============================================================
# push-to-github.ps1 — Helper script to link and push to GitHub
# =============================================================

param (
    [string]$RepoUrl = ""
)

$env:PATH = "C:\Users\taits\AppData\Local\PortableGit2\cmd;C:\Users\taits\AppData\Local\PortableGit2\mingw64\bin;C:\Users\taits\AppData\Local\PortableGit2\usr\bin;" + $env:PATH

if (-not $RepoUrl) {
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host " Link LubeLogger Custom to Your GitHub Repository" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Step 1: Go to https://github.com/new and create a new repository (e.g. 'lubelogger')." -ForegroundColor Yellow
    Write-Host "Step 2: Copy the repository URL (e.g. https://github.com/username/lubelogger.git)." -ForegroundColor Yellow
    Write-Host ""
    $RepoUrl = Read-Host "Paste your GitHub Repository URL here"
}

if (-not $RepoUrl) {
    Write-Host "No URL provided. Operation cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configuring remote 'origin' -> $RepoUrl..." -ForegroundColor Green

# Remove existing origin if any
git remote remove origin 2>$null

# Add origin
git remote add origin $RepoUrl

Write-Host "Pushing custom-pump-ui to GitHub main branch..." -ForegroundColor Green
git push -u origin custom-pump-ui:main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Your code is now published to GitHub." -ForegroundColor Green
    Write-Host "GitHub Actions is now automatically building your Docker container image." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push encountered an error. If GitHub asks for authentication, use a GitHub Personal Access Token." -ForegroundColor Yellow
}
