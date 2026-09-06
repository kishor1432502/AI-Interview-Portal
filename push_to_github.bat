@echo off
title Push Aegis Portal to GitHub
echo ========================================================
echo  Pushing Aegis AI Interview Portal to GitHub
echo  Repository: https://github.com/kishor1432502/AI-Interview-Portal
echo ========================================================
echo.

cd /d "%~dp0"

REM Refresh PATH so Git is recognized
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd"

git --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in PATH yet.
    echo Please wait for Git installation to finish or restart terminal.
    pause
    exit /b 1
)

echo [1/5] Initializing Git repository...
if not exist ".git" (
    git init
)

echo [2/5] Setting Git user config...
git config user.name "kishor1432502"
git config user.email "kishor25066@gmail.com"

echo [3/5] Adding remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/kishor1432502/AI-Interview-Portal.git

echo [4/5] Staging files (excluding smtp_config.json for security)...
git add .

echo [5/5] Committing changes...
git commit -m "feat: Aegis AI Interview Portal with Real Gmail OTP, 10 AI Questions & Anti-Cheat"

echo.
echo Pushing to GitHub (main branch)...
git branch -M main
git push -u origin main --force

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo  SUCCESS! Project successfully pushed to GitHub!
    echo  View at: https://github.com/kishor1432502/AI-Interview-Portal
    echo ========================================================
) else (
    echo ========================================================
    echo  If push failed due to authentication, please enter
    echo  your GitHub Personal Access Token (PAT) when prompted.
    echo ========================================================
)
echo.
pause
