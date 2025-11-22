@echo off
REM #############################################
REM CMS.js Deployment Script for Windows
REM Automated deployment for Docker Compose
REM #############################################

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=cmsjs
set FRONTEND_PORT=3000
set POCKETBASE_PORT=8090

REM Colors (limited in CMD)
set "INFO=[INFO]"
set "SUCCESS=[OK]"
set "WARNING=[WARN]"
set "ERROR=[ERROR]"

echo.
echo ================================================
echo      CMS.js Deployment Script (Windows)
echo ================================================
echo.

REM Check Docker
echo %INFO% Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not installed
    echo Install Docker Desktop from: https://docs.docker.com/desktop/install/windows-overview/
    exit /b 1
)
echo %SUCCESS% Docker is installed

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker Compose is not installed
    exit /b 1
)
echo %SUCCESS% Docker Compose is installed

REM Check Docker daemon
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker daemon is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)
echo %SUCCESS% Docker daemon is running

REM Setup environment
echo %INFO% Setting up environment...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo %SUCCESS% Created .env from .env.example
        echo %WARNING% Please edit .env and set your credentials
        pause
    )
) else (
    echo %SUCCESS% .env file exists
)

REM Stop existing containers
echo %INFO% Stopping existing containers...
docker-compose down >nul 2>&1
echo %SUCCESS% Stopped existing containers

REM Build images
echo %INFO% Building Docker images...
echo.

set BUILD_ARGS=
if "%1"=="--no-cache" (
    echo %WARNING% Building without cache
    set BUILD_ARGS=--no-cache
)
if "%1"=="--rebuild" (
    echo %WARNING% Building without cache
    set BUILD_ARGS=--no-cache
)

docker-compose build %BUILD_ARGS%
if errorlevel 1 (
    echo %ERROR% Docker build failed
    exit /b 1
)
echo %SUCCESS% Docker images built successfully

REM Start services
echo %INFO% Starting services...
echo.

if "%1"=="--dev" (
    echo %INFO% Starting in development mode...
    docker-compose --profile dev up -d
) else (
    docker-compose up -d
)

if errorlevel 1 (
    echo %ERROR% Failed to start services
    exit /b 1
)
echo %SUCCESS% Services started successfully

REM Wait for services
echo %INFO% Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Verify deployment
echo %INFO% Verifying deployment...

docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo %ERROR% Containers are not running
    docker-compose ps
    exit /b 1
)
echo %SUCCESS% Containers are running

REM Show status
echo.
echo ================================================
echo            Deployment Summary
echo ================================================
echo.

docker-compose ps

echo.
echo Access URLs:
echo   Frontend:         http://localhost:%FRONTEND_PORT%
echo   PocketBase Admin: http://localhost:%POCKETBASE_PORT%/_/
echo   PocketBase API:   http://localhost:%POCKETBASE_PORT%/api/
echo.
echo Useful commands:
echo   View logs:        docker-compose logs -f
echo   Stop services:    docker-compose down
echo   Restart:          docker-compose restart
echo   Rebuild:          deploy.bat --rebuild
echo.

if "%1"=="--logs" (
    echo %INFO% Showing logs...
    docker-compose logs --tail=50
    echo.
)

echo %SUCCESS% Deployment complete!
echo.

if "%1"=="--logs" (
    echo Press Ctrl+C to exit logs, or close this window
    docker-compose logs -f
)

endlocal
