# CMS.js Docker Deployment

Complete Docker Compose setup for CMS.js with PocketBase backend and Vite frontend.

## Quick Start

### 1. Production Build & Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access services:
# - Frontend: http://localhost:3000
# - PocketBase Admin: http://localhost:8090/_/
# - PocketBase API: http://localhost:8090/api/
```

### 2. Development Mode (Hot Reload)

```bash
# Start with development profile
docker-compose --profile dev up

# Access services:
# - Dev Frontend (hot reload): http://localhost:3001
# - Production Frontend: http://localhost:3000
# - PocketBase: http://localhost:8090
```

### 3. Build Only (Test for Errors)

```bash
# Build all images (catches build errors)
docker-compose build

# Build with no cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build frontend
docker-compose build pocketbase
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│ Docker Compose Network (cmsjs-network)     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ frontend (Nginx + Vite Build)         │ │
│  │ Port: 3000 → 80                       │ │
│  │ - Serves static files                 │ │
│  │ - Proxies /api/ to PocketBase         │ │
│  │ - Proxies /_/ to PocketBase Admin     │ │
│  └───────────────┬───────────────────────┘ │
│                  │                          │
│                  ↓                          │
│  ┌───────────────────────────────────────┐ │
│  │ pocketbase (Alpine + PocketBase)      │ │
│  │ Port: 8090                            │ │
│  │ - SQLite database                     │ │
│  │ - REST API                            │ │
│  │ - Admin UI                            │ │
│  │ - Hooks & Migrations                  │ │
│  │ Volume: pocketbase_data → /pb_data   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ frontend-dev (Node + Vite Dev Server) │ │
│  │ Port: 3001 → 3000                     │ │
│  │ - Hot Module Replacement              │ │
│  │ - Volume mounted for live reload      │ │
│  │ Profile: dev (optional)               │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Services

### 1. PocketBase Backend

**Image**: Alpine Linux + PocketBase 0.20.3
**Port**: `8090:8090`
**Volumes**:
- `pocketbase_data:/pb_data` - Persistent database
- `./pocketbase/pb_hooks:/pb_hooks:ro` - JavaScript hooks (read-only)
- `./pocketbase/pb_migrations:/pb_migrations:ro` - Migrations (read-only)

**Health Check**: Checks `/api/health` endpoint every 10s

### 2. Frontend (Production)

**Build**: Multi-stage
1. Node 18 Alpine - Build with Vite
2. Nginx Alpine - Serve static files

**Port**: `3000:80`
**Features**:
- Optimized production build
- Gzip compression
- Static asset caching (1 year)
- API proxy to PocketBase
- SPA fallback routing

### 3. Frontend Dev (Optional)

**Image**: Node 18 Alpine
**Port**: `3001:3000`
**Profile**: `dev` (only runs with `--profile dev`)
**Features**:
- Hot Module Replacement
- Volume mounted for live changes
- Auto-installs dependencies

---

## Commands

### Start/Stop Services

```bash
# Start all (production)
docker-compose up -d

# Start with dev mode
docker-compose --profile dev up -d

# Stop all
docker-compose down

# Stop and remove volumes (DELETES DATA!)
docker-compose down -v

# Restart specific service
docker-compose restart frontend
docker-compose restart pocketbase
```

### Logs & Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f pocketbase

# Check service status
docker-compose ps

# View resource usage
docker stats
```

### Build & Rebuild

```bash
# Build all images
docker-compose build

# Build without cache (clean build)
docker-compose build --no-cache

# Build and start
docker-compose up --build

# Build specific service
docker-compose build frontend
```

### Database & Data

```bash
# Backup PocketBase data
docker-compose exec pocketbase ./pocketbase backup /pb_data

# Access PocketBase shell
docker-compose exec pocketbase sh

# View database location
docker volume inspect cmsjs_pocketbase_data

# Copy data from container
docker cp cmsjs-pocketbase:/pb_data ./backup/
```

### Debugging

```bash
# Enter frontend container
docker-compose exec frontend sh

# Enter PocketBase container
docker-compose exec pocketbase sh

# View container details
docker-compose exec frontend ls -la /usr/share/nginx/html
docker-compose exec pocketbase ls -la /pb_data

# Test nginx config
docker-compose exec frontend nginx -t

# Check network
docker network ls
docker network inspect cmsjs_cmsjs-network
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# PocketBase Admin (created on first run)
PB_ADMIN_EMAIL=admin@cmsjs.local
PB_ADMIN_PASSWORD=your_secure_password

# Application URLs (override defaults)
VITE_POCKETBASE_URL=http://pocketbase:8090
VITE_ELECTRIC_URL=ws://pocketbase:5133
```

---

## Production Deployment

### 1. Build for Production

```bash
# Clean build
docker-compose build --no-cache

# Test the build
docker-compose up

# Access: http://localhost:3000
```

### 2. Deploy to Server

```bash
# On your server
git clone <your-repo>
cd cmsjs

# Copy environment
cp .env.example .env
nano .env  # Edit credentials

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### 3. Production Checklist

- [ ] Change `PB_ADMIN_PASSWORD` in `.env`
- [ ] Configure firewall (allow 3000, 8090)
- [ ] Set up reverse proxy (Nginx/Caddy) for HTTPS
- [ ] Configure domain names
- [ ] Set up automatic backups
- [ ] Enable log rotation
- [ ] Monitor resource usage

---

## Troubleshooting

### Build Errors

```bash
# Clean everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Frontend Won't Start

```bash
# Check logs
docker-compose logs frontend

# Verify build output
docker-compose exec frontend ls -la /usr/share/nginx/html

# Test nginx config
docker-compose exec frontend nginx -t
```

### PocketBase Issues

```bash
# Check if PocketBase is healthy
docker-compose ps

# View PocketBase logs
docker-compose logs pocketbase

# Access PocketBase shell
docker-compose exec pocketbase sh

# Manually test PocketBase
docker-compose exec pocketbase ./pocketbase serve --help
```

### Network Issues

```bash
# Inspect network
docker network inspect cmsjs_cmsjs-network

# Test connectivity
docker-compose exec frontend ping pocketbase
docker-compose exec pocketbase ping frontend
```

### Port Conflicts

If ports 3000 or 8090 are in use:

```yaml
# Edit docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"  # Change 3000 to 8080
  pocketbase:
    ports:
      - "9090:8090"  # Change 8090 to 9090
```

---

## Development Workflow

### 1. Hot Reload Development

```bash
# Start dev mode
docker-compose --profile dev up

# Edit code in src/
# Changes auto-reload at http://localhost:3001
```

### 2. Test Production Build

```bash
# Build production image
docker-compose build frontend

# Start production mode
docker-compose up

# Test at http://localhost:3000
```

### 3. Debug Build Issues

```bash
# Build with output
docker-compose build --progress=plain frontend

# Run build step manually
docker run --rm -it node:18-alpine sh
> cd /app
> npm install
> npm run build
```

---

## Performance Optimization

### Frontend

- Nginx gzip compression enabled
- Static assets cached for 1 year
- Multi-stage build (minimal image size)

### PocketBase

- SQLite with optimized settings
- Persistent volume for data
- Health checks for reliability

### Network

- Internal Docker network (no external exposure)
- Direct container-to-container communication

---

## Backup & Restore

### Backup

```bash
# Backup PocketBase data
docker-compose exec pocketbase ./pocketbase backup /pb_data

# Copy backup to host
docker cp cmsjs-pocketbase:/pb_data/backups ./backups/

# Or backup entire volume
docker run --rm -v cmsjs_pocketbase_data:/data -v $(pwd):/backup alpine tar czf /backup/pocketbase-backup.tar.gz -C /data .
```

### Restore

```bash
# Stop services
docker-compose down

# Restore from backup
docker run --rm -v cmsjs_pocketbase_data:/data -v $(pwd):/backup alpine tar xzf /backup/pocketbase-backup.tar.gz -C /data

# Start services
docker-compose up -d
```

---

## Scaling & High Availability

### Horizontal Scaling (Frontend)

```yaml
# docker-compose.yml
services:
  frontend:
    deploy:
      replicas: 3
```

### Load Balancer

Add Nginx load balancer:

```yaml
services:
  loadbalancer:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - frontend
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

---

## Security Best Practices

1. **Change default passwords** in `.env`
2. **Use HTTPS** in production (reverse proxy)
3. **Restrict ports** with firewall
4. **Regular updates** of Docker images
5. **Monitor logs** for suspicious activity
6. **Backup regularly** (automated)
7. **Use secrets** for sensitive data (Docker secrets)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: docker-compose up -d && sleep 10 && curl http://localhost:3000
```

---

## Resources

- Docker Compose Docs: https://docs.docker.com/compose/
- PocketBase Docs: https://pocketbase.io/docs/
- Nginx Docs: https://nginx.org/en/docs/

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21
