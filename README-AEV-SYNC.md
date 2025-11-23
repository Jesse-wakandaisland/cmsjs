# AEV Sync - Bidirectional Synchronization System

## Overview

**AEV Sync** is a bidirectional synchronization protocol that connects three powerful CMS.js systems, enabling real-time data flow between them without using frameworks or external services.

### The Three Systems

1. **cms-core.html** - CMS Builder
   - Primary CMS interface
   - Now includes ConvoAppGen reactive framework
   - Original bidirectional chat sync (extended by AEV Sync)

2. **main_convo-design-set-prod.html** - ConvoBuilder (with remarkable abilities)
   - **StyleGenerator Plugin** - Generates neumorphic, glassmorphic, skeuomorphic, flat, material designs (+ 5 more coming)
   - **API Manager Plugin** - Full enterprise API integration with caching, auth, interceptors, diagnostics
   - **Advanced A-Frame Integration** - Multiple 3D components, post-processing, particles
   - **Plugin System** (window.cbPlugins) - Extensible architecture

3. **infinite-glass-ui-full.html** - JSON Standalone Version
   - Complete standalone platform with NO frameworks
   - All infinite generation engines (CR8ENGINE, 3D, Design Variations)
   - Nara UI theme engine with glass effects
   - Local PGlite database

## Architecture

### Message Format

All three systems communicate using `window.postMessage` with this standard format:

```javascript
{
  type: 'chatSync' | 'designSync' | 'templateSync' | '3dSync' | 'stateSync' | 'apiSync',
  source: 'cmsBuilder' | 'convobuilder' | 'jsonStandalone',
  data: {
    // Type-specific data
    sender?: string,
    message?: string,
    variation?: object,
    template?: object,
    object?: object,
    endpoint?: string,
    timestamp: string
  },
  timestamp: string
}
```

### Sync Types

1. **chatSync** - Chat messages (extends existing cms-core.html chat sync)
2. **designSync** - Design variations from any style generator
3. **templateSync** - Generated templates from CR8ENGINE or other generators
4. **3dSync** - 3D objects from infinite 3D generator or A-Frame scenes
5. **stateSync** - State updates from ConvoAppGen reactive data
6. **apiSync** - API data from the API Manager plugin

## Installation

### 1. For cms-core.html

Add this script tag before the closing `</body>` tag:

```html
<script src="cms-core-integration.js"></script>
```

This adds:
- `window.aevSync` - AEV Sync instance
- `window.convoApp` - ConvoAppGen reactive framework
- Auto-discovery of `[data-bind]` elements
- Integration with existing `syncToConvoBuilder` function

### 2. For main_convo-design-set-prod.html

Add this script tag before the closing `</body>` tag:

```html
<script src="main-convo-integration.js"></script>
```

This adds:
- `window.aevSync` - AEV Sync instance
- Integration with StyleGenerator plugin
- Integration with API Manager plugin
- Auto-sync of generated styles and API responses
- A-Frame scene integration for incoming 3D objects

### 3. For infinite-glass-ui-full.html

Already integrated! AEV Sync is built-in.

Access via:
- `window.aevSync` - AEV Sync instance
- `window.app` - Platform instance

## Usage Examples

### Sending Messages

```javascript
// From any system
window.aevSync.sendChat('User', 'Hello from system!');

// Send design variation
window.aevSync.sendDesign({
  id: 'var-modern-42',
  style_name: 'modern',
  variation_index: 42,
  css: '...',
  config: { palette: {...}, typography: {...} }
});

// Send template
window.aevSync.sendTemplate({
  id: 'cr8base-100',
  engine_name: 'Cr8Base',
  variation_index: 100,
  html: '<div>...</div>'
});

// Send 3D object
window.aevSync.send3DObject({
  id: '3d-sphere-10',
  primitive: 'sphere',
  position: {x: 0, y: 1.5, z: -3},
  material: {color: '#4CC3D9'}
});
```

### Receiving Messages

```javascript
// Listen for incoming designs
window.aevSync.on('designSync', (data, source) => {
  console.log('Received design from', source);
  console.log('Style:', data.variation.style_name);
  console.log('CSS:', data.variation.css);

  // Apply it
  const styleEl = document.createElement('style');
  styleEl.textContent = data.variation.css;
  document.head.appendChild(styleEl);
});

// Listen for templates
window.aevSync.on('templateSync', (data, source) => {
  console.log('Received template from', source);
  console.log('HTML:', data.template.html);
});

// Listen for 3D objects
window.aevSync.on('3dSync', (data, source) => {
  console.log('Received 3D object from', source);
  // Add to your scene
});
```

### Using ConvoAppGen (in cms-core.html)

```javascript
// Set reactive data
window.convoApp.set('user.name', 'John');
window.convoApp.set('content.title', 'Hello World');

// Get reactive data
const name = window.convoApp.get('user.name');

// Subscribe to changes
const unsubscribe = window.convoApp.subscribe('user.name', (newValue, oldValue) => {
  console.log('Name changed from', oldValue, 'to', newValue);
});

// Bind to DOM elements
const input = document.querySelector('#name-input');
window.convoApp.bindToElement(input, 'user.name', true); // bidirectional

// Or use data attributes
<input data-bind="user.name" data-bind-two-way />
```

## How Systems Connect

### Scenario 1: User generates design in infinite-glass-ui-full.html

1. User clicks "Generate Designs (5)"
2. infinite-glass-ui-full.html generates 5 design variations
3. Each variation is sent via `aevSync.sendDesign(variation)`
4. **cms-core.html** receives it, applies CSS, shows in window
5. **main_convo-design-set-prod.html** receives it, adds to style library

### Scenario 2: StyleGenerator creates design in main_convo

1. User uses StyleGenerator plugin to create glassmorphic design
2. main_convo-integration.js intercepts the generation
3. Design is sent via `aevSync.sendDesign(design)`
4. **cms-core.html** receives it, stores in ConvoAppGen state
5. **infinite-glass-ui-full.html** receives it, shows in new window

### Scenario 3: Chat message in cms-core.html

1. User types message in CMS Builder chat
2. Existing `syncToConvoBuilder` function is called
3. AEV Sync extension also sends via `aevSync.sendChat`
4. **main_convo-design-set-prod.html** shows notification
5. **infinite-glass-ui-full.html** creates window with message

### Scenario 4: 3D object in main_convo A-Frame scene

1. User creates 3D object in ConvoBuilder A-Frame scene
2. Object data is sent via `aevSync.send3DObject(object)`
3. **infinite-glass-ui-full.html** receives it, displays info window
4. **cms-core.html** receives it, stores in database

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AEV Sync Protocol                          │
│                   (window.postMessage)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  cms-core.html   │ │main_convo-design │ │infinite-glass-ui │
│  (CMS Builder)   │ │   -set-prod.html │ │   -full.html     │
│                  │ │  (ConvoBuilder)  │ │ (JSON Standalone)│
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ • ConvoAppGen    │ │ • StyleGenerator │ │ • CR8ENGINE (7)  │
│ • AEV Sync       │ │ • API Manager    │ │ • 3D Generator   │
│ • Data Bindings  │ │ • A-Frame 3D     │ │ • Design Engine  │
│ • Chat (existing)│ │ • Plugins        │ │ • PGlite DB      │
│ • Observers      │ │ • AEV Sync       │ │ • Nara UI        │
│                  │ │                  │ │ • AEV Sync       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Features Preserved

### From cms-core.html
✅ Existing bidirectional chat sync (enhanced)
✅ All existing functionality
✅ Preset management
✅ Form handling

### From main_convo-design-set-prod.html (Remarkable Abilities)
✅ StyleGenerator Plugin - 8+ design paradigms
✅ API Manager Plugin - Enterprise-grade API integration
✅ Advanced A-Frame components - Full 3D capabilities
✅ Plugin system (window.cbPlugins) - Extensible architecture
✅ All external CDN resources and scripts

### From infinite-glass-ui-full.html
✅ NO frameworks - Pure vanilla JavaScript
✅ CR8ENGINE - All 7 infinite template generators
✅ Infinite 3D Generator - 14 A-Frame primitives
✅ Design Variation Engine - 8+ style systems
✅ PGlite Database - Local PostgreSQL in browser
✅ Nara UI - Dynamic glass theme engine
✅ Observer optimizations - IntersectionObserver, MutationObserver

## Statistics & Monitoring

Each system exposes stats:

```javascript
// Get sync statistics
const stats = window.aevSync.getStats();
console.log(stats);
// {
//   sent: 42,
//   received: 37,
//   errors: 0,
//   startTime: 1234567890,
//   uptime: 12345,
//   errorRate: 0
// }
```

## Observers for Performance

The system uses browser Observer APIs for optimization:

1. **MutationObserver** - Auto-discovers `[data-bind]` elements
2. **IntersectionObserver** - Lazy-loads content in infinite scroll
3. **PerformanceObserver** - Tracks sync performance metrics

## Testing

### Test Sync Between Systems

1. Open `cms-core.html` in one browser window
2. Open `infinite-glass-ui-full.html` in another window (or as iframe)
3. Open `main_convo-design-set-prod.html` in third window (or as iframe)

In infinite-glass-ui-full.html console:
```javascript
window.aevSync.sendChat('TestUser', 'Hello from JSON Standalone!');
```

You should see:
- Message appears in cms-core.html chat
- Notification appears in main_convo (if Notify available)

### Test Design Sync

In infinite-glass-ui-full.html:
```javascript
window.app.generateDesigns('glassmorphism', 1);
```

You should see:
- Design applied to all three systems
- CSS injected into each document
- Stats updated

## Files

- `src/core/aev-sync/protocol.js` - Core AEV Sync protocol (ES6 module)
- `cms-core-integration.js` - Integration for cms-core.html
- `main-convo-integration.js` - Integration for main_convo-design-set-prod.html
- `infinite-glass-ui-full.html` - Standalone version (AEV Sync built-in)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires:
- ES6 Proxy support
- postMessage API
- MutationObserver API

## Security Notes

- Uses `target = '*'` for postMessage (local development)
- For production, specify exact origins
- Validate incoming messages before processing
- Messages are not encrypted (local only)

## Future Enhancements

- [ ] Add message encryption for sensitive data
- [ ] Implement message queuing for offline support
- [ ] Add conflict resolution for concurrent updates
- [ ] Create sync middleware system
- [ ] Add time-travel debugging for state changes
- [ ] Implement selective sync filters

## License

Same as CMS.js project

## Credits

Built with ❤️ using:
- Vanilla JavaScript (NO frameworks!)
- window.postMessage API
- Proxy API for reactivity
- Observer APIs for performance
- Nara UI for glass effects
- A-Frame for 3D
- PGlite for database
