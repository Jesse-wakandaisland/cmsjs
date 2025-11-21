# CMS.js - Infinite Generative CMS Platform

> **The Complete Integrated Platform**: PocketBase (rebranded) + Electric-SQL + Derby.js (ConvoAppGen) + Infinite Generation Engines

## 🚀 Features

### Core Architecture

- **AevIP Protocol** - Adaptive Evolving Incremental Publishing inspired by ResIP
  - Resilient sync with exponential backoff retry
  - Viewport-aware updates via IntersectionObserver
  - Incremental patches (not full rebuilds)
  - Survives network interruptions

- **PGlite Database** - PostgreSQL in your browser (WASM)
  - Full SQL database running client-side
  - IndexedDB persistence
  - Real-time sync with backend

- **Electric-SQL Integration** - Real-time data synchronization
  - Bidirectional sync PocketBase ↔ PGlite
  - Conflict-free replicated data types
  - Offline-first architecture

- **ConvoAppGen** - Derby.js renamed and extended
  - Reactive templates with Racer
  - Real-time data binding
  - Isomorphic rendering (SSR + CSR)

### Infinite Generation Engines

#### 1. **CR8ENGINE** - Template Generation
7 specialized generators with infinite variations:
- **Cr8Base** - Base components (layouts, containers)
- **Cr83D** - 3D/VR/AR components (A-Frame)
- **Cr8Animation** - Animation templates
- **Cr8Story** - Story/narrative layouts
- **Cr8Multi** - Multi-column layouts
- **Cr8Form** - Form generators
- **Cr8Urweb** - Custom web templates

#### 2. **Infinite 3D Generator** - Massively Improved A-Frame
- Procedural 3D object generation
- 14 primitive types with infinite parameter variations
- Material system (basic, standard, PBR, shaders)
- Animation variations
- Physics integration
- Particle systems
- Environment generation
- Lighting configurations
- **Truly infinite** - never repeats!

#### 3. **Design Variation Engine**
- 8+ base styles (modern, glassmorphism, neumorphism, neon, etc.)
- Infinite color palette generation
- Typography combinations
- Spacing systems
- Shadow variations
- Animation variations
- **No AI needed** - pure algorithmic generation!

### Deep Observer Integration

- **IntersectionObserver** - Viewport-aware content loading
- **MutationObserver** - Dynamic content detection
- **ResizeObserver** - Adaptive responsive updates
- **PerformanceObserver** - Metrics tracking

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Jesse-wakandaisland/cmsjs.git
cd cmsjs

# Install dependencies
npm install

# PocketBase will be automatically downloaded during installation
# Or manually install:
npm run install:pocketbase
```

## 🎯 Quick Start

```bash
# Start development servers (PocketBase + Vite)
npm run dev

# Or start services separately:
npm run dev:pocketbase  # Start PocketBase on port 8090
npm run dev:frontend    # Start Vite dev server on port 3000
```

Visit:
- **Frontend**: http://localhost:3000
- **PocketBase Admin**: http://localhost:8090/_/

## 💻 Usage

### Initialize CMS.js

```javascript
import CMSjs from './src/index.js';

// CMS.js auto-initializes on page load
window.addEventListener('cmsjs:ready', (event) => {
  const cmsjs = event.detail.cmsjs;
  console.log('CMS.js ready!', cmsjs.getStats());
});
```

### Generate Infinite Templates

```javascript
// Generate 100 base templates
const generator = cmsjs.generateTemplates('Cr8Base', 100);

for await (const template of generator) {
  console.log('Template:', template);
  // Use template...
}

// Generate infinite 3D templates
for await (const template of cmsjs.generateTemplates('Cr83D')) {
  // Truly infinite - will never stop!
  if (someCondition) break;
}
```

### Generate Infinite 3D Objects

```javascript
// Create a scene with 200 objects
const scene = await cmsjs.create3DScene('my-scene', 200);

// Render to HTML
const html = cmsjs.render3DScene(scene);
document.getElementById('container').innerHTML = html;

// Or generate objects one by one
const generator = cmsjs.generate3DObjects();

for await (const object of generator) {
  console.log('3D Object:', object);
  if (count >= 1000) break; // Generate 1000 objects
}
```

### Generate Infinite Design Variations

```javascript
// Generate 50 glassmorphism variations
const generator = cmsjs.generateDesigns('glassmorphism', 50);

for await (const variation of generator) {
  console.log('Variation:', variation);

  // Apply to element
  cmsjs.systems.designVariation.applyVariation(element, variation);
}

// Generate infinite random style variations
for await (const variation of cmsjs.generateDesigns()) {
  // Will generate all styles infinitely
  if (condition) break;
}
```

### Use AevIP for Incremental Updates

```html
<!-- Mark content for AevIP sync -->
<div data-aevip-id="content-123" data-aevip-type="html">
  <!-- Content will update automatically when changed -->
</div>

<div data-aevip-id="stats" data-aevip-type="json" data-aevip-priority="high">
  <!-- High priority content updates first -->
</div>
```

```javascript
// Content updates automatically when visible!
// No manual refresh needed
```

## 🏗️ Project Structure

```
cmsjs/
├── src/
│   ├── core/
│   │   ├── aevip/
│   │   │   ├── protocol.js          # AevIP sync protocol
│   │   │   └── viewport-sync.js     # Viewport-aware syncing
│   │   ├── data/
│   │   │   ├── pglite-manager.js    # PGlite database manager
│   │   │   └── electric-sync.js     # Electric-SQL integration
│   │   └── convoappgen/
│   │       └── index.js             # Derby.js (ConvoAppGen)
│   ├── engines/
│   │   ├── cr8engine/
│   │   │   └── index.js             # CR8ENGINE template generator
│   │   ├── aframe3d/
│   │   │   └── infinite-generator.js # Infinite 3D generator
│   │   └── design-variation/
│   │       └── index.js             # Design variation engine
│   └── index.js                     # Main entry point
├── scripts/
│   └── install-pocketbase.js        # PocketBase installer
├── index.html                       # Demo/test page
├── package.json
├── vite.config.js
├── capacitor.config.json            # Mobile build config
├── cms-core.html                    # Original CR8ENGINE
├── main_convo-design-set-prod.html  # Original design variation
└── README.md
```

## 🎨 Infinite Generation Examples

### Example 1: Generate 1000 Unique 3D Scenes

```javascript
for (let i = 0; i < 1000; i++) {
  const scene = await cmsjs.create3DScene(`scene-${i}`, 50);
  console.log(`Scene ${i} with ${scene.objects.length} unique objects`);
  // Each scene is completely unique!
}
```

### Example 2: Generate Infinite Design Variations

```javascript
const generator = cmsjs.generateDesigns();
const variations = [];

for await (const variation of generator) {
  variations.push(variation);
  if (variations.length >= 10000) break;
}

console.log(`Generated ${variations.length} unique designs`);
// All 10,000 are unique!
```

### Example 3: Combine Everything

```javascript
// Create content with 3D scene and design variations
const content = await cmsjs.createContentWithVariations({
  id: 'my-content',
  type: 'page',
  title: 'Generated Page',
  body: 'Amazing generated content'
}, 10); // 10 design variations

// Generate 3D scene for this content
const scene = await cmsjs.create3DScene(`scene-${content.content.id}`, 100);

// Render everything
const html = `
  ${content.variations.map(v => `
    <div style="${v.css}">
      ${cmsjs.render3DScene(scene)}
    </div>
  `).join('')}
`;
```

## 📱 Mobile Build

```bash
# Build for mobile (Capacitor)
npm run build:mobile

# This will:
# 1. Build the web app
# 2. Copy to Capacitor
# 3. Sync iOS and Android projects
```

## 🌐 PWA Support

The platform is automatically configured as a PWA with:
- Service Worker for offline support
- Manifest for installability
- WASM caching
- Incremental updates via AevIP

## 🧪 Testing

```bash
# Run dev mode with all features enabled
npm run dev

# Test infinite generation
# Open browser console and try:
for await (const t of window.cmsjs.generateTemplates('Cr8Base', 10)) {
  console.log(t);
}
```

## 🔧 Configuration

Edit `src/index.js` to configure:

```javascript
const cmsjs = new CMSjs({
  pocketbaseUrl: 'http://localhost:8090',
  electricUrl: 'ws://localhost:5133',
  enableRealtime: true,
  enable3D: true,
  enableInfiniteGeneration: true
});
```

## 📊 Statistics

Get real-time statistics:

```javascript
const stats = cmsjs.getStats();

console.log('Templates generated:', stats.cr8engine.generatedCount);
console.log('3D objects generated:', stats.generator3d.generatedCount);
console.log('Design variations:', stats.designVariation.generatedCount);
console.log('Viewport stats:', stats.viewport);
```

## 🤝 Contributing

This is a complete integrated platform combining multiple technologies. Contributions welcome!

## 📄 License

Apache 2.0

## 🎯 Architecture Highlights

### What Makes This Special:

1. **True Infinite Generation** - Not just "many" variations, but mathematically infinite combinations
2. **No AI Required** - Pure algorithmic generation using combinatorics
3. **Viewport-Aware** - Only updates what's visible (IntersectionObserver deep integration)
4. **Resilient Sync** - AevIP protocol survives network failures
5. **Offline-First** - PGlite + Service Worker = full offline functionality
6. **Real-time** - Electric-SQL bidirectional sync
7. **Mobile-Ready** - Capacitor integration for iOS/Android
8. **Performance** - WASM PostgreSQL, viewport-aware loading, incremental updates

### Technology Stack:

- **Backend**: PocketBase (SQLite) - Rebranded as CMS.js
- **Sync**: Electric-SQL + Custom AevIP protocol
- **Client DB**: PGlite (PostgreSQL WASM)
- **Frontend**: Derby.js (ConvoAppGen) + Vanilla JS
- **3D**: A-Frame with massive enhancements
- **Build**: Vite
- **Mobile**: Capacitor
- **PWA**: Workbox via Vite-Plugin-PWA

---

Built with ❤️ for infinite possibilities!
