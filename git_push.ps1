$git = "C:\Users\VSB CSE-38\.gemini\antigravity-ide\scratch\mingit\cmd\git.exe"
if (-not (Test-Path $git)) {
    $git = "git.exe"
}

$repoDir = "C:\Users\VSB CSE-38\.gemini\antigravity-ide\scratch\ai-interview-portal"
Set-Location $repoDir

Write-Host "Using Git: $git" -ForegroundColor Cyan
& $git --version

# Disable SSL revocation check in Git for this college/lab network
& $git config --global http.sslBackend "schannel"
& $git config --global http.schannelCheckRevoke "false"

# User identity
& $git config --global user.name "kishor1432502"
& $git config --global user.email "kishor25066@gmail.com"

# Initialize if needed
if (-not (Test-Path "$repoDir\.git")) {
    & $git init
    Write-Host "Initialized local Git repo." -ForegroundColor Green
}

# Set remote origin
& $git remote remove origin 2>$null
& $git remote add origin "https://github.com/kishor1432502/AI-Interview-Portal.git"
Write-Host "Remote origin set to https://github.com/kishor1432502/AI-Interview-Portal.git" -ForegroundColor Green

# Stage all files (.gitignore automatically protects smtp_config.json)
& $git add -A
Write-Host "Files staged." -ForegroundColor Green

# Commit
& $git commit -m "feat: Aegis AI Interview Portal with Real Gmail OTP, 10 AI Questions & Anti-Cheat"
Write-Host "Committed changes." -ForegroundColor Green

# Set branch to main
& $git branch -M main

Write-Host "Ready to push." -ForegroundColor Yellow
