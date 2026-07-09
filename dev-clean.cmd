@echo off
cd /d "%~dp0"

echo.
echo  JojobaWorks local dev server (clean start)
echo  -----------------------------------------
echo  Stopping anything on the dev port, then starting...
echo.

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
