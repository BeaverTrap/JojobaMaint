@echo off
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not on your PATH.
  pause
  exit /b 1
)

call npm run dev:clean
if errorlevel 1 (
  echo.
  echo Dev server exited with an error.
  pause
  exit /b 1
)
