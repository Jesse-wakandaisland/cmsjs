# CMS.js Deployment Guide

This guide covers deploying the complete CMS.js platform (Frontend + PocketBase Backend).

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [PocketBase Backend Setup](#pocketbase-backend-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Production Deployment](#production-deployment)
5. [Mobile Deployment](#mobile-deployment)

---

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- (Optional) Docker for containerized deployment

### Quick Start

```bash
# 1. Clone and install dependencies
git clone <your-repo-url>
cd cmsjs
npm install

# 2. Install PocketBase (backend)
npm run install:pocketbase

# 3. Start full stack (PocketBase + Vite dev server)
npm run dev:full
```

This will start:
- **PocketBase Backend**: http://127.0.0.1:8090
- **Vite Dev Server**: http://localhost:3000

### Individual Services

```bash
# Start only PocketBase
npm run pocketbase

# Start only Vite dev server
npm run dev

# Build for production
npm run build
```

---

## PocketBase Backend Setup

### Automatic Installation

```bash
npm run install:pocketbase
```

This downloads and configures PocketBase for your platform (Linux, macOS, Windows).

### Manual Installation

If automatic installation fails:

1. **Download PocketBase**
   ```bash
   # Linux/macOS
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.20.3/pocketbase_0.20.3_linux_amd64.zip
   unzip pocketbase_0.20.3_linux_amd64.zip -d pocketbase/
   chmod +x pocketbase/pocketbase

   # Or download from: https://pocketbase.io/docs/
   ```

2. **Start PocketBase**
   ```bash
   cd pocketbase
   ./pocketbase serve --http="127.0.0.1:8090"
   ```

### First-Time PocketBase Setup

1. **Access Admin UI**: http://127.0.0.1:8090/_/

2. **Create Admin Account**
   - Email: your-email@example.com
   - Password: (secure password)

3. **Create Collections**

   The platform expects these collections:

   #### `content` Collection
   ```javascript
   {
     id: "text",
     type: "text",
     title: "text",
     body: "text",
     html: "text",
     css: "text",
     js: "text",
     metadata: "json",
     tags: "text[]",
     status: "select", // options: draft, published, archived
     author: "text",
     created: "date",
     updated: "date",
     published_at: "date",
     version: "number"
   }
   ```

   #### `templates` Collection
   ```javascript
   {
     id: "text",
     template_type: "text",
     engine: "text", // Cr8Base, Cr83D, etc.
     config: "json",
     html: "text",
     css: "text",
     js: "text",
     preview_url: "text",
     metadata: "json",
     created: "date"
   }
   ```

   #### `variations` Collection
   ```javascript
   {
     id: "text",
     content_id: "relation(content)",
     style_name: "text",
     config: "json",
     fingerprint: "text",
     created: "date"
   }
   ```

   #### `aframe_objects` Collection
   ```javascript
   {
     id: "text",
     object_type: "text",
     geometry: "json",
     material: "json",
     position: "json",
     rotation: "json",
     scale: "json",
     animation: "json",
     components: "json",
     parent_id: "text",
     scene_id: "text",
     metadata: "json",
     created: "date"
   }
   ```

4. **Configure CORS** (Already done in `pb_hooks/main.pb.js`)
   - Allow Origin: `*` (dev) or your domain (prod)
   - Allow Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

5. **Enable Realtime** (Optional)
   - PocketBase has built-in realtime subscriptions
   - No additional configuration needed

---

## Frontend Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in `dist/` directory.

### Deploy to Hosting

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

**netlify.toml** (create this):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
npm run build
vercel --prod
```

**vercel.json** (create this):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Static Hosting (Apache/Nginx)

1. Build: `npm run build`
2. Upload `dist/` contents to web server
3. Configure server:

**Nginx** (`/etc/nginx/sites-available/cmsjs`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/cmsjs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

**Apache** (`.htaccess` in dist/):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Production Deployment

### Full Stack Deployment

#### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

```bash
# 1. Set up server (Ubuntu 22.04)
ssh root@your-server-ip

# 2. Install dependencies
apt update && apt upgrade -y
apt install -y nodejs npm nginx certbot python3-certbot-nginx

# 3. Clone and build
cd /var/www
git clone <your-repo>
cd cmsjs
npm install
npm run build

# 4. Install and configure PocketBase
npm run install:pocketbase
cd pocketbase
./pocketbase serve --http="127.0.0.1:8090" &

# 5. Configure Nginx (see below)
nano /etc/nginx/sites-available/cmsjs

# 6. Enable SSL
certbot --nginx -d your-domain.com
```

**Nginx Config** (`/etc/nginx/sites-available/cmsjs`):
```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/cmsjs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy PocketBase API
    location /api/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option 2: Docker Deployment

**Dockerfile** (create this):
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml** (create this):
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:80"
    depends_on:
      - pocketbase

  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    ports:
      - "8090:8090"
    volumes:
      - ./pocketbase/pb_data:/pb_data
      - ./pocketbase/pb_migrations:/pb_migrations
      - ./pocketbase/pb_hooks:/pb_hooks
    command: serve --http=0.0.0.0:8090
```

Deploy:
```bash
docker-compose up -d
```

#### Option 3: Serverless (Cloudflare Pages + PocketBase Cloud)

1. **Deploy Frontend to Cloudflare Pages**
   ```bash
   npm install -g wrangler
   wrangler pages deploy dist
   ```

2. **Deploy PocketBase**
   - Use PocketHost.io (managed PocketBase hosting)
   - Or deploy to Railway.app / Fly.io

3. **Update Frontend Config**
   ```javascript
   // src/index.js
   window.cmsjs = new CMSjs({
     pocketbaseUrl: 'https://your-pocketbase.pockethost.io',
     electricUrl: 'wss://your-electric-server.com'
   });
   ```

---

## Mobile Deployment

### iOS

```bash
# 1. Build web assets
npm run build:mobile

# 2. Open in Xcode
npx cap open ios

# 3. Configure signing in Xcode
# 4. Build and archive for App Store
```

### Android

```bash
# 1. Build web assets
npm run build:mobile

# 2. Open in Android Studio
npx cap open android

# 3. Generate signed APK
# Build > Generate Signed Bundle / APK
```

---

## Environment Configuration

### Development (`.env.development`)
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_ELECTRIC_URL=ws://localhost:5133
VITE_APP_NAME=CMS.js Dev
```

### Production (`.env.production`)
```env
VITE_POCKETBASE_URL=https://api.your-domain.com
VITE_ELECTRIC_URL=wss://sync.your-domain.com
VITE_APP_NAME=CMS.js
```

Update `src/index.js` to use env vars:
```javascript
const config = {
  pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090',
  electricUrl: import.meta.env.VITE_ELECTRIC_URL || 'ws://localhost:5133'
};

window.cmsjs = new CMSjs(config);
```

---

## Monitoring & Maintenance

### PocketBase Backups

PocketBase automatically backs up to `pb_data/backups/` daily.

Manual backup:
```bash
cd pocketbase
./pocketbase backup pb_data
```

### Logs

```bash
# PocketBase logs
tail -f pocketbase/pb_data/logs/

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Updates

```bash
# Update frontend
git pull
npm install
npm run build

# Update PocketBase
# Download new version and replace binary
# Restart service
```

---

## Troubleshooting

### PocketBase Won't Start

```bash
# Check if port 8090 is already in use
lsof -i :8090
# Kill process if needed
kill -9 <PID>

# Check permissions
chmod +x pocketbase/pocketbase

# Check logs
cat pocketbase/pb_data/logs/latest.log
```

### CORS Errors

1. Verify `pb_hooks/main.pb.js` has CORS headers
2. Restart PocketBase after changes
3. Check browser console for specific error

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Performance Optimization

### Frontend

- Enable PWA caching (already configured in `vite.config.js`)
- Use CDN for static assets
- Enable HTTP/2 on server
- Compress images and assets

### PocketBase

- Enable database indexing on frequently queried fields
- Use pagination for large datasets
- Implement caching layer (Redis) for hot data
- Scale horizontally with load balancer

---

## Security Checklist

- [ ] Change default PocketBase admin password
- [ ] Configure proper CORS origins (remove `*`)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Enable PocketBase auth rules
- [ ] Sanitize user inputs
- [ ] Implement CSP headers
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

---

## Support

- Documentation: `/README.md`
- Platform Status: `/PLATFORM_STATUS.md`
- Issues: GitHub Issues
- PocketBase Docs: https://pocketbase.io/docs/

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21
