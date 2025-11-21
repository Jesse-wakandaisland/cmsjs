@echo off
REM Start PocketBase server for Windows

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set PB_DIR=%PROJECT_DIR%\pocketbase
set PB_EXECUTABLE=%PB_DIR%\pocketbase.exe

if not exist "%PB_EXECUTABLE%" (
  echo [31mPocketBase not found[0m
  echo.
  echo Please install PocketBase first:
  echo   npm run install:pocketbase
  echo.
  echo Or manually download from:
  echo   https://pocketbase.io/docs/
  echo   Extract to: %PB_DIR%
  exit /b 1
)

echo [32mStarting PocketBase (CMS.js Backend)...[0m
echo.
echo   Admin UI:     http://127.0.0.1:8090/_/
echo   API:          http://127.0.0.1:8090/api/
echo   Data Dir:     %PB_DIR%\pb_data
echo.
echo Press Ctrl+C to stop
echo.

cd /d "%PB_DIR%"
pocketbase.exe serve --http="127.0.0.1:8090" --dir="%PB_DIR%\pb_data" --migrationsDir="%PB_DIR%\pb_migrations" --hooksDir="%PB_DIR%\pb_hooks"
