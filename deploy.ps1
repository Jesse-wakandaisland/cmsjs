#!/usr/bin/env pwsh

#############################################
# CMS.js Deployment Script (PowerShell)
# Automated deployment for Docker Compose
#############################################

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_NAME = "cmsjs"
$FRONTEND_PORT = 3000
$POCKETBASE_PORT = 8090

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     CMS.js Deployment Script          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Dependencies {
    Write-Info "Checking dependencies..."

    try {
        $null = docker --version
        Write-Success "Docker is installed"
    } catch {
        Write-Error "Docker is not installed"
        Write-Host "Install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    }

    try {
        $null = docker-compose --version
        Write-Success "Docker Compose is installed"
    } catch {
        Write-Error "Docker Compose is not installed"
        exit 1
    }

    try {
        $null = docker info 2>$null
        Write-Success "Docker daemon is running"
    } catch {
        Write-Error "Docker daemon is not running"
        Write-Host "Start Docker Desktop and try again"
        exit 1
    }
}

function Check-Ports {
    Write-Info "Checking if ports are available..."

    $frontendInUse = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue
    if ($frontendInUse) {
        Write-Warning "Port $FRONTEND_PORT is already in use"
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne "y") { exit 1 }
    } else {
        Write-Success "Port $FRONTEND_PORT is available"
    }

    $pocketbaseInUse = Get-NetTCPConnection -LocalPort $POCKETBASE_PORT -ErrorAction SilentlyContinue
    if ($pocketbaseInUse) {
        Write-Warning "Port $POCKETBASE_PORT is already in use"
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne "y") { exit 1 }
    } else {
        Write-Success "Port $POCKETBASE_PORT is available"
    }
}

function Setup-Environment {
    Write-Info "Setting up environment..."

    if (-not (Test-Path .env)) {
        if (Test-Path .env.example) {
            Copy-Item .env.example .env
            Write-Success "Created .env from .env.example"
            Write-Warning "Please edit .env and set your credentials"
            Read-Host "Press enter to continue"
        } else {
            Write-Warning "No .env.example found, skipping environment setup"
        }
    } else {
        Write-Success ".env file exists"
    }
}

function Stop-ExistingContainers {
    Write-Info "Stopping existing containers..."

    try {
        docker-compose down 2>$null
        Write-Success "Stopped existing containers"
    } catch {
        Write-Info "No running containers found"
    }
}

function Build-Images {
    param([switch]$NoCache)

    Write-Info "Building Docker images..."
    Write-Host ""

    $buildArgs = @()
    if ($NoCache) {
        Write-Warning "Building without cache (clean build)"
        $buildArgs += "--no-cache"
    }

    docker-compose build @buildArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        exit 1
    }
    Write-Success "Docker images built successfully"
}

function Start-Services {
    param([switch]$DevMode)

    Write-Info "Starting services..."
    Write-Host ""

    if ($DevMode) {
        Write-Info "Starting in development mode..."
        docker-compose --profile dev up -d
    } else {
        docker-compose up -d
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start services"
        exit 1
    }
    Write-Success "Services started successfully"
}

function Wait-ForHealth {
    Write-Info "Waiting for services to be healthy..."

    $maxWait = 60
    $counter = 0

    while ($counter -lt $maxWait) {
        $status = docker-compose ps
        if ($status -match "healthy") {
            Write-Success "Services are healthy"
            return
        }

        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $counter++
    }

    Write-Host ""
    Write-Warning "Health check timeout (services may still be starting)"
}

function Verify-Deployment {
    Write-Info "Verifying deployment..."

    $status = docker-compose ps
    if ($status -match "Up") {
        Write-Success "Containers are running"
    } else {
        Write-Error "Containers are not running"
        docker-compose ps
        exit 1
    }

    Start-Sleep -Seconds 2

    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" -TimeoutSec 5 -UseBasicParsing
        Write-Success "Frontend is responding on port $FRONTEND_PORT"
    } catch {
        Write-Warning "Frontend is not responding yet (may still be starting)"
    }

    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$POCKETBASE_PORT/api/health" -TimeoutSec 5 -UseBasicParsing
        Write-Success "PocketBase is responding on port $POCKETBASE_PORT"
    } catch {
        Write-Warning "PocketBase is not responding yet (may still be starting)"
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        Deployment Summary              ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host ""

    docker-compose ps

    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:         http://localhost:$FRONTEND_PORT"
    Write-Host "  PocketBase Admin: http://localhost:$POCKETBASE_PORT/_/"
    Write-Host "  PocketBase API:   http://localhost:$POCKETBASE_PORT/api/"
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  View logs:        docker-compose logs -f"
    Write-Host "  Stop services:    docker-compose down"
    Write-Host "  Restart:          docker-compose restart"
    Write-Host "  Rebuild:          .\deploy.ps1 -NoCache"
    Write-Host ""
}

function Show-Logs {
    Write-Info "Showing recent logs..."
    Write-Host ""
    docker-compose logs --tail=50
    Write-Host ""
    Write-Info "Follow logs with: docker-compose logs -f"
}

function Cleanup {
    Write-Warning "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    Write-Success "Cleanup complete"
}

# Main deployment flow
function Main {
    param(
        [switch]$NoCache,
        [switch]$Rebuild,
        [switch]$Logs,
        [switch]$Dev,
        [switch]$Cleanup,
        [switch]$Help
    )

    if ($Help) {
        Write-Host "Usage: .\deploy.ps1 [OPTIONS]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  -NoCache, -Rebuild   Build without cache (clean build)"
        Write-Host "  -Dev                 Start in development mode with hot reload"
        Write-Host "  -Logs                Show logs after deployment"
        Write-Host "  -Cleanup             Remove all containers and volumes"
        Write-Host "  -Help                Show this help message"
        Write-Host ""
        exit 0
    }

    if ($Cleanup) {
        Cleanup
        exit 0
    }

    Print-Header
    Check-Dependencies
    Check-Ports
    Setup-Environment
    Stop-ExistingContainers

    if ($NoCache -or $Rebuild) {
        Build-Images -NoCache
    } else {
        Build-Images
    }

    if ($Dev) {
        Start-Services -DevMode
    } else {
        Start-Services
    }

    Wait-ForHealth
    Verify-Deployment
    Show-Status

    if ($Logs) {
        Show-Logs
    }

    Write-Success "Deployment complete!"
    Write-Host ""
}

# Run main function
Main @args
