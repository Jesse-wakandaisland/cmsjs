# CMS.js Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- npm (comes with Node.js)

## Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd cmsjs

# 2. Install dependencies
npm install

# 3. Install PocketBase (backend)
npm run install:pocketbase
```

## Running the Platform

### Option 1: Full Stack (Recommended)

Start both PocketBase backend and Vite dev server together:

```bash
npm run dev:full
```

This opens:
- **Frontend**: http://localhost:3000
- **PocketBase Admin**: http://127.0.0.1:8090/_/

### Option 2: Frontend Only

```bash
npm run dev
```

Opens: http://localhost:3000

### Option 3: Backend Only

```bash
npm run pocketbase
```

Opens: http://127.0.0.1:8090

## First-Time Setup

### 1. Create PocketBase Admin Account

Visit http://127.0.0.1:8090/_/ and create an admin account.

### 2. Test the Platform

Open http://localhost:3000 and check the browser console. You should see:

```
🚀 CMS.js Initializing...
📊 Initializing PGlite database...
PGlite: Database initialized
🔄 Initializing AevIP protocol...
👁️ Initializing Viewport Sync...
⚡ Initializing Electric-SQL sync...
🎨 Initializing ConvoAppGen...
⚙️ Initializing CR8ENGINE...
🎭 Initializing Infinite 3D Generator...
🎨 Initializing Design Variation Engine...
✅ CMS.js Ready!
```

### 3. Try the Demo Features

In the browser console:

```javascript
// Check platform status
window.cmsjs.getStats()

// Generate 5 templates
for await (const t of cmsjs.generateTemplates('Cr8Base', 5)) {
  console.log(t);
}

// Generate a 3D scene
const scene = await cmsjs.create3DScene('demo', 20);
console.log(scene);

// Generate design variations
for await (const d of cmsjs.generateDesigns('glassmorphism', 3)) {
  console.log(d);
}
```

## Project Structure

```
cmsjs/
├── src/                    # Frontend source code
│   ├── core/              # Core systems
│   │   ├── aevip/        # AevIP protocol
│   │   ├── data/         # PGlite & Electric-SQL
│   │   └── convoappgen/  # Reactive framework
│   ├── engines/           # Generation engines
│   │   ├── cr8engine/    # Template generator
│   │   ├── aframe3d/     # 3D generator
│   │   └── design-variation/  # Design variations
│   └── index.js          # Main entry point
├── pocketbase/            # Backend (PocketBase)
│   ├── pb_hooks/         # Server-side hooks
│   └── pb_data/          # Database & uploads
├── index.html            # Demo page
└── test-platform.html    # Test suite
```

## Available Commands

```bash
# Development
npm run dev              # Start Vite dev server only
npm run dev:full         # Start full stack (PocketBase + Vite)
npm run pocketbase       # Start PocketBase only

# Build
npm run build            # Build for production
npm run build:mobile     # Build for mobile (Capacitor)
npm run preview          # Preview production build

# PocketBase
npm run install:pocketbase  # Download & install PocketBase
```

## Key Features

### ✅ Infinite Generation (No AI)
- **CR8ENGINE**: 7 template generators (Cr8Base, Cr83D, Cr8Animation, etc.)
- **3D Generator**: 14 A-Frame primitives with infinite variations
- **Design Variations**: 8+ styles with infinite color/typography combinations

### ✅ Deep Observer Integration
- IntersectionObserver for viewport-aware updates
- MutationObserver for automatic binding discovery
- ResizeObserver for responsive updates
- PerformanceObserver for metrics

### ✅ Data Sync
- **PGlite**: PostgreSQL WASM database in browser
- **AevIP Protocol**: Resilient incremental publishing
- **Electric-SQL**: Real-time bidirectional sync

### ✅ Reactive Framework
- Pure vanilla JS using JavaScript Proxy
- Automatic change detection
- Bidirectional data binding
- Mustache-like templates

## Common Issues

### PocketBase Won't Start

```bash
# Make sure it's installed
npm run install:pocketbase

# Try running directly
cd pocketbase
chmod +x pocketbase
./pocketbase serve
```

### Port Already in Use

```bash
# Change Vite port
npm run dev -- --port 3001

# Or kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Build Errors

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- 📖 Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 📊 Read [PLATFORM_STATUS.md](PLATFORM_STATUS.md) for technical details
- 📚 Read [README.md](README.md) for full documentation

## Testing

```bash
# Open test page
open http://localhost:3000/test-platform.html

# Or manually test in console
window.cmsjs.getStats()
```

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [PLATFORM_STATUS.md](PLATFORM_STATUS.md) for architecture
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides

---

**Happy building!** 🚀
