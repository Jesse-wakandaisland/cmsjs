# Deployment Scripts

This directory contains deployment scripts for CMS.js Docker setup.

## Available Scripts

### Linux/macOS: `deploy.sh`

Bash script for Unix-like systems.

```bash
# Make executable (first time only)
chmod +x deploy.sh

# Basic deployment
./deploy.sh

# Clean build (no cache)
./deploy.sh --no-cache

# Development mode (hot reload)
./deploy.sh --dev

# Show logs after deployment
./deploy.sh --logs

# Cleanup (remove all containers and volumes)
./deploy.sh --cleanup

# Help
./deploy.sh --help
```

### Windows (CMD): `deploy.bat`

Batch script for Windows Command Prompt.

```cmd
REM Basic deployment
deploy.bat

REM Clean build
deploy.bat --rebuild

REM Development mode
deploy.bat --dev

REM Show logs
deploy.bat --logs
```

### Windows (PowerShell): `deploy.ps1`

PowerShell script for Windows.

```powershell
# Basic deployment
.\deploy.ps1

# Clean build
.\deploy.ps1 -NoCache

# Development mode
.\deploy.ps1 -Dev

# Show logs
.\deploy.ps1 -Logs

# Cleanup
.\deploy.ps1 -Cleanup

# Help
.\deploy.ps1 -Help
```

## What the Scripts Do

1. **Check Dependencies**
   - Verify Docker is installed
   - Verify Docker Compose is installed
   - Check Docker daemon is running

2. **Check Ports**
   - Ensure ports 3000 and 8090 are available
   - Warn if ports are in use

3. **Setup Environment**
   - Create .env from .env.example if needed
   - Prompt to configure credentials

4. **Stop Existing Containers**
   - Gracefully stop any running containers

5. **Build Images**
   - Build frontend (Vite → Nginx)
   - Build PocketBase backend
   - Optional: clean build with --no-cache

6. **Start Services**
   - Start all containers
   - Wait for health checks
   - Verify services are responding

7. **Show Status**
   - Display container status
   - Show access URLs
   - List useful commands

## Options

### All Scripts Support

- **Clean Build**: Build without cache for troubleshooting
- **Dev Mode**: Start with hot reload for development
- **Logs**: Show logs after deployment
- **Cleanup**: Remove all containers and volumes
- **Help**: Show usage information

## After Deployment

Services will be available at:

- **Frontend**: http://localhost:3000
- **PocketBase Admin**: http://localhost:8090/_/
- **PocketBase API**: http://localhost:8090/api/

## Troubleshooting

If deployment fails:

```bash
# Check Docker is running
docker info

# View detailed logs
docker-compose logs

# Clean build
./deploy.sh --no-cache

# Cleanup and retry
./deploy.sh --cleanup
./deploy.sh
```

## Manual Deployment

If scripts don't work, use Docker Compose directly:

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Bash 4.0+ (Linux/macOS)
- PowerShell 5.0+ or CMD (Windows)

## Notes

- Scripts will prompt before overwriting .env
- Ports must be available (3000, 8090)
- First build takes 3-5 minutes
- Subsequent builds are faster (cached layers)

---

**Choose your platform and run the appropriate script!**
