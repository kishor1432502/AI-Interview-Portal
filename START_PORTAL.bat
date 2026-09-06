@echo off
title Aegis AI Interview Portal Launcher
color 0b
echo ========================================================
echo         AEGIS AI INTERVIEW PORTAL - LAUNCHER
echo ========================================================
echo.
echo Starting secure local web server on port 8080...
start "" powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
timeout /t 2 >nul
echo.
echo Opening Portal in your default browser...
start http://localhost:8080/
echo.
echo Portal is now running live at http://localhost:8080/
echo You can keep this window open while using the portal.
echo ========================================================
pause
