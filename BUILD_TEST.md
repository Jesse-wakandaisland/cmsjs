# Build Test Instructions

This document explains how to test the complete CMS.js platform using Docker Compose. The Docker setup will catch ALL build errors during the compilation process.

---

## ✅ What Was Done

1. **Reverted PocketBase Removal** - All PocketBase backend code restored
2. **Created Complete Docker Setup**:
   - `Dockerfile` - Multi-stage build for frontend (Vite → Nginx)
   - `Dockerfile.pocketbase` - PocketBase backend container
   - `docker-compose.yml` - Complete orchestration with 3 services
   - `nginx.conf` - Production-ready Nginx config with API proxy
   - `DOCKER.md` - Comprehensive documentation

3. **Build Process Features**:
   - **Multi-stage builds** catch all compilation errors
   - **No caching option** for clean builds
   - **Health checks** ensure services start properly
   - **Network isolation** for security
   - **Volume persistence** for data

---

## 🚀 Quick Test (Build Everything)

### Option 1: Test Build Only (No Running)

This will build everything and catch any errors:

```bash
cd ~/cmsjs
git pull

# Build all containers (will catch ALL build errors)
docker-compose build

# Build without cache (completely clean build)
docker-compose build --no-cache
```

**If the build succeeds**, you'll see:
```
Successfully built <image-id>
Successfully tagged cmsjs-frontend:latest
Successfully tagged cmsjs-pocketbase:latest
```

**If there are errors**, Docker will stop and show exactly what failed.

---

### Option 2: Build AND Run (Full Test)

This builds AND starts all services:

```bash
cd ~/cmsjs
git pull

# Build and start everything
docker-compose up --build

# Or run in background
docker-compose up --build -d

# View logs
docker-compose logs -f
```

**Access the platform:**
- Frontend: http://localhost:3000
- PocketBase Admin: http://localhost:8090/_/
- PocketBase API: http://localhost:8090/api/

**Stop everything:**
```bash
docker-compose down
```

---

## 🛠️ Development Mode (Hot Reload)

For development with automatic reload on code changes:

```bash
# Start with dev profile
docker-compose --profile dev up

# Access:
# - Dev Server (hot reload): http://localhost:3001
# - Production Build: http://localhost:3000
# - PocketBase: http://localhost:8090
```

---

## 🔍 Debugging Build Errors

### 1. Verbose Build Output

```bash
# See detailed build output
docker-compose build --progress=plain

# Build specific service with verbose output
docker-compose build --progress=plain frontend
docker-compose build --progress=plain pocketbase
```

### 2. Check Build Steps

```bash
# Frontend build stages:
# Stage 1: npm install (catches dependency errors)
# Stage 2: npm run build (catches Vite build errors)
# Stage 3: nginx setup (catches config errors)

# PocketBase build:
# - Downloads PocketBase binary
# - Copies hooks and migrations
# - Sets up permissions
```

### 3. Test Individual Services

```bash
# Build only frontend
docker-compose build frontend

# Build only pocketbase
docker-compose build pocketbase
```

### 4. Enter Build Container

```bash
# Start a shell in the build environment
docker run --rm -it -v $(pwd):/app -w /app node:18-alpine sh

# Inside container, test build manually:
> npm install
> npm run build
> ls -la dist/
```

---

## ✅ What Docker Catches

### Frontend Build Errors:

1. **Dependency Issues**
   - Missing packages
   - Version conflicts
   - Installation failures

2. **TypeScript/JavaScript Errors**
   - Syntax errors
   - Import errors
   - Type errors (if TypeScript enabled)

3. **Vite Build Errors**
   - Module not found
   - Build configuration errors
   - Asset processing errors

4. **Nginx Configuration Errors**
   - Invalid nginx.conf syntax
   - Missing files
   - Port conflicts

### PocketBase Build Errors:

1. **Download Issues**
   - Failed to download binary
   - Checksum mismatch
   - Network errors

2. **Permission Issues**
   - Executable permissions
   - File access

3. **Hook/Migration Errors**
   - Missing files
   - Syntax errors in hooks

---

## 📊 Build Success Indicators

### Frontend Build Success:

```
Step 1/X : FROM node:18-alpine AS builder
 ---> <hash>
Step 2/X : WORKDIR /app
 ---> Running in <id>
 ---> <hash>
...
Step X/X : CMD ["nginx", "-g", "daemon off;"]
 ---> Running in <id>
 ---> <hash>
Successfully built <hash>
Successfully tagged cmsjs_frontend:latest
```

### PocketBase Build Success:

```
Step 1/X : FROM alpine:latest
 ---> <hash>
...
Step X/X : CMD ["./pocketbase", "serve", ...]
 ---> Running in <id>
 ---> <hash>
Successfully built <hash>
Successfully tagged cmsjs_pocketbase:latest
```

---

## 🧪 Testing After Build

### 1. Check Services Are Running

```bash
docker-compose ps

# Should show:
# NAME                 STATUS          PORTS
# cmsjs-frontend       Up              0.0.0.0:3000->80/tcp
# cmsjs-pocketbase     Up (healthy)    0.0.0.0:8090->8090/tcp
```

### 2. Test Frontend

```bash
# Test from command line
curl http://localhost:3000

# Should return HTML

# Test in browser
# Visit: http://localhost:3000
# Open DevTools Console (F12)
# Should see: "🚀 CMS.js Initializing..."
```

### 3. Test PocketBase

```bash
# Test API
curl http://localhost:8090/api/health

# Test Admin UI
curl http://localhost:8090/_/
```

### 4. Test Integration

```bash
# Frontend should be able to reach PocketBase
docker-compose exec frontend wget -O- http://pocketbase:8090/api/health

# Should return: {"code":200,"message":"Success"}
```

---

## 🐛 Common Build Issues & Fixes

### Issue: "npm install" fails

**Cause**: Missing or corrupted package-lock.json

**Fix**:
```bash
# Delete package-lock.json and node_modules
rm package-lock.json
rm -rf node_modules

# Rebuild
docker-compose build --no-cache frontend
```

### Issue: "npm run build" fails

**Cause**: Vite configuration or source code errors

**Fix**:
```bash
# Check build locally first
npm install
npm run build

# Look for errors in output
# Fix errors, then rebuild Docker
docker-compose build frontend
```

### Issue: PocketBase download fails

**Cause**: Network issues or wrong version

**Fix**: Edit `Dockerfile.pocketbase` and change version:
```dockerfile
ARG PB_VERSION=0.20.3  # Change to latest version
```

### Issue: "Cannot connect to PocketBase"

**Cause**: Network configuration

**Fix**: Check `docker-compose.yml` network settings:
```yaml
networks:
  cmsjs-network:
    driver: bridge
```

---

## 📋 Pre-Flight Checklist

Before running Docker build:

- [ ] Git pulled latest changes
- [ ] Docker is installed and running
- [ ] Docker Compose is installed
- [ ] Ports 3000 and 8090 are free
- [ ] Sufficient disk space (2-3 GB)
- [ ] Internet connection (for downloading base images and PocketBase)

---

## 🎯 Expected Results

### Successful Build:

1. **Frontend Image**: ~50-100 MB (Nginx + static files)
2. **PocketBase Image**: ~30-50 MB (Alpine + PocketBase binary)
3. **Total Build Time**: 2-5 minutes (first time)
4. **Services Running**: 2 containers (frontend + pocketbase)
5. **Health Check**: PocketBase shows "healthy" status

### After Successful Build:

```bash
docker-compose ps

NAME                 IMAGE                  STATUS
cmsjs-frontend       cmsjs_frontend         Up 30 seconds
cmsjs-pocketbase     cmsjs_pocketbase       Up 30 seconds (healthy)
```

---

## 🔄 Rebuild After Code Changes

```bash
# Quick rebuild (uses cache)
docker-compose up --build

# Clean rebuild (no cache)
docker-compose build --no-cache
docker-compose up
```

---

## 📝 Summary

**To test everything and catch all errors:**

```bash
# Clone/pull repo
cd ~/cmsjs
git pull

# Build (catches all errors)
docker-compose build --no-cache

# If build succeeds:
docker-compose up -d

# Check it works:
curl http://localhost:3000
curl http://localhost:8090/api/health

# View in browser:
# http://localhost:3000
```

**If ANY errors occur during build, Docker will stop and show exactly what went wrong!**

---

## 📖 Documentation

- **DOCKER.md** - Complete Docker documentation
- **README.md** - Platform overview
- **package.json** - Dependencies and scripts

---

**Built by**: Claude
**Date**: 2025-11-21
**Status**: Ready for testing ✅
