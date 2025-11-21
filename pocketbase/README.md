# PocketBase Backend for CMS.js

This directory contains the PocketBase backend configuration for CMS.js.

## Quick Start

### 1. Install PocketBase

From the project root:

```bash
npm run install:pocketbase
```

This will download the PocketBase executable for your platform.

### 2. Start PocketBase

**Option A - Using npm script (recommended):**
```bash
npm run pocketbase
```

**Option B - Direct command:**
```bash
cd pocketbase
./pocketbase serve --http="127.0.0.1:8090"
```

### 3. Access Admin UI

Open: http://127.0.0.1:8090/_/

Create your admin account on first visit.

## Directory Structure

```
pocketbase/
├── pocketbase          # Executable (not in git)
├── pocketbase.exe      # Windows executable (not in git)
├── config.json         # PocketBase configuration
├── pb_hooks/           # Server-side hooks (JavaScript)
│   └── main.pb.js      # CORS & AevIP sync hooks
├── pb_data/            # Runtime data (not in git)
│   ├── data.db         # SQLite database
│   ├── logs/           # Server logs
│   ├── backups/        # Automatic backups
│   └── storage/        # File uploads
└── pb_migrations/      # Database migrations
```

## Configuration

### CORS (pb_hooks/main.pb.js)

Already configured to allow:
- All origins in development (`*`)
- All methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- All headers

**For production**, update to specific domain:

```javascript
c.response.header().set('Access-Control-Allow-Origin', 'https://your-domain.com')
```

### AevIP Sync Hooks

The `pb_hooks/main.pb.js` file logs all record changes for AevIP protocol integration:

- `onRecordAfterCreateRequest` - Log new records
- `onRecordAfterUpdateRequest` - Log updates
- `onRecordAfterDeleteRequest` - Log deletions

## Database Schema

Required collections for CMS.js:

### 1. content
```javascript
{
  id: "text",
  type: "select", // page, post, component
  title: "text",
  body: "text",
  html: "text",
  css: "text",
  js: "text",
  metadata: "json",
  tags: "text[]",
  status: "select", // draft, published, archived
  author: "relation(users)",
  created: "date (auto)",
  updated: "date (auto)",
  published_at: "date"
}
```

### 2. templates
```javascript
{
  id: "text",
  template_type: "text",
  engine: "select", // Cr8Base, Cr83D, Cr8Animation, etc.
  config: "json",
  html: "text",
  css: "text",
  js: "text",
  preview_url: "url",
  metadata: "json",
  created: "date (auto)"
}
```

### 3. variations
```javascript
{
  id: "text",
  content_id: "relation(content)",
  style_name: "text",
  config: "json",
  fingerprint: "text",
  created: "date (auto)"
}
```

### 4. aframe_objects
```javascript
{
  id: "text",
  object_type: "select", // box, sphere, cylinder, etc.
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
  created: "date (auto)"
}
```

### 5. scenes
```javascript
{
  id: "text",
  name: "text",
  environment: "json",
  lighting: "json",
  camera: "json",
  metadata: "json",
  created: "date (auto)"
}
```

## Creating Collections

### Via Admin UI

1. Go to http://127.0.0.1:8090/_/
2. Click "Collections" → "New Collection"
3. Choose "Base Collection"
4. Add fields as shown above

### Via API

```javascript
// Example: Create content collection
const response = await fetch('http://127.0.0.1:8090/api/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Admin YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: 'content',
    type: 'base',
    schema: [
      { name: 'type', type: 'text', required: true },
      { name: 'title', type: 'text' },
      { name: 'body', type: 'text', required: true },
      // ... more fields
    ]
  })
});
```

## API Usage

### Authentication

```javascript
// Login as admin
const authData = await fetch('http://127.0.0.1:8090/api/admins/auth-with-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: 'your-email@example.com',
    password: 'your-password'
  })
}).then(res => res.json());

const token = authData.token;
```

### CRUD Operations

```javascript
// Create content
const content = await fetch('http://127.0.0.1:8090/api/collections/content/records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
  body: JSON.stringify({
    type: 'page',
    title: 'My Page',
    body: 'Content here...',
    status: 'published'
  })
}).then(res => res.json());

// Get content
const records = await fetch('http://127.0.0.1:8090/api/collections/content/records')
  .then(res => res.json());

// Update content
await fetch(`http://127.0.0.1:8090/api/collections/content/records/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
  body: JSON.stringify({ title: 'Updated Title' })
});

// Delete content
await fetch(`http://127.0.0.1:8090/api/collections/content/records/${id}`, {
  method: 'DELETE',
  headers: { 'Authorization': token }
});
```

### Realtime Subscriptions

```javascript
const eventSource = new EventSource(
  'http://127.0.0.1:8090/api/realtime?subscribe=content'
);

eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  console.log('Record changed:', data);
});
```

## Backup & Restore

### Automatic Backups

PocketBase creates daily backups in `pb_data/backups/`

Configure in Admin UI → Settings → Backups

### Manual Backup

```bash
cd pocketbase
./pocketbase backup pb_data
```

### Restore from Backup

```bash
cd pocketbase
./pocketbase restore pb_data/backups/BACKUP_NAME.zip
```

## Production Deployment

### Systemd Service (Linux)

Create `/etc/systemd/system/pocketbase.service`:

```ini
[Unit]
Description=PocketBase (CMS.js Backend)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cmsjs/pocketbase
ExecStart=/var/www/cmsjs/pocketbase/pocketbase serve --http="127.0.0.1:8090"
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo systemctl status pocketbase
```

### Docker

```dockerfile
FROM alpine:latest
ARG PB_VERSION=0.20.3

RUN apk add --no-cache \
    ca-certificates \
    wget \
    unzip

RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x pocketbase

COPY pb_hooks /pb_hooks
COPY pb_migrations /pb_migrations

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8090
lsof -i :8090
# Or on Windows
netstat -ano | findstr :8090

# Kill process
kill -9 <PID>
```

### Permission Denied

```bash
chmod +x pocketbase
```

### Database Locked

```bash
# Stop all PocketBase instances
pkill pocketbase

# Remove lock files
rm pb_data/*.db-shm
rm pb_data/*.db-wal
```

## Environment Variables

```bash
# Custom port
./pocketbase serve --http="0.0.0.0:9000"

# Custom data directory
./pocketbase serve --dir="/custom/path/pb_data"

# Development mode (more verbose logging)
./pocketbase serve --dev
```

## Security

### Production Checklist

- [ ] Change default admin password
- [ ] Configure specific CORS origins (not `*`)
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Configure auth rules per collection
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Keep PocketBase updated

### Auth Rules Example

For `content` collection, in Admin UI → Collections → content → API Rules:

```javascript
// List/Search Rule
@request.auth.id != ""

// View Rule
@request.auth.id != "" || status = "published"

// Create Rule
@request.auth.id != ""

// Update Rule
@request.auth.id = author.id

// Delete Rule
@request.auth.id = author.id
```

## Resources

- PocketBase Docs: https://pocketbase.io/docs/
- API Reference: https://pocketbase.io/docs/api-records/
- JavaScript SDK: https://github.com/pocketbase/js-sdk

## Support

See main project documentation:
- [QUICKSTART.md](../QUICKSTART.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [README.md](../README.md)

---

**Version**: 0.20.3
**Last Updated**: 2025-11-21
