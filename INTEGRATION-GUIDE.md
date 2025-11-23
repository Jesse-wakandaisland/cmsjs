# Integration Guide - AEV Sync Setup

## Quick Start (3 Steps)

### Step 1: Add to cms-core.html

At the end of cms-core.html, before `</body>`:

```html
<script src="cms-core-integration.js"></script>
```

### Step 2: Add to main_convo-design-set-prod.html

At the end of main_convo-design-set-prod.html, before `</body>`:

```html
<script src="main-convo-integration.js"></script>
```

### Step 3: Open infinite-glass-ui-full.html

AEV Sync is already integrated! Just open the file.

## Verification

Open browser console and check:

```javascript
// In cms-core.html
console.log(window.aevSync);    // Should show AEVSync instance
console.log(window.convoApp);   // Should show ConvoAppGen instance

// In main_convo-design-set-prod.html
console.log(window.aevSync);    // Should show AEVSync instance
console.log(window.cbPlugins);  // Should show plugins including aevSync

// In infinite-glass-ui-full.html
console.log(window.aevSync);    // Should show AEVSync instance
console.log(window.app);        // Should show CMSPlatform instance
```

## Test the Integration

### Test 1: Send Message from Standalone to CMS Core

1. Open `cms-core.html` in browser window A
2. Open `infinite-glass-ui-full.html` in browser window B (or iframe in A)
3. In window B console:
   ```javascript
   window.aevSync.sendChat('TestUser', 'Hello CMS Core!');
   ```
4. Check window A - message should appear in chat

### Test 2: Generate Design in Standalone, See in All Systems

1. Open all three HTML files
2. In `infinite-glass-ui-full.html`:
   ```javascript
   window.app.generateDesigns('glassmorphism', 1);
   ```
3. Check console in all three systems - should see design sync messages
4. Design CSS should be applied to all systems

### Test 3: Use ConvoAppGen Reactive Data in CMS Core

In cms-core.html console:

```javascript
// Set data
window.convoApp.set('test.message', 'Hello World');

// Subscribe to changes
window.convoApp.subscribe('test.message', (newVal) => {
  console.log('Message changed to:', newVal);
});

// Change it
window.convoApp.set('test.message', 'Updated!');
// Should see console log: "Message changed to: Updated!"
```

### Test 4: Bind Data to DOM Elements

In cms-core.html, add this HTML:

```html
<div>
  <input id="test-input" data-bind="test.name" data-bind-two-way />
  <p>Name: <span data-bind="test.name"></span></p>
</div>
```

In console:

```javascript
// Discover bindings
window.convoApp.discoverBindings();

// Set value
window.convoApp.set('test.name', 'John');
// Input should show "John" and paragraph should show "Name: John"

// Type in input - paragraph should update automatically
```

## iframe Integration (Recommended)

To run all three systems together, create a container HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>CMS.js - All Systems</title>
    <style>
        body {
            margin: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            height: 100vh;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: 1px solid #333;
        }
    </style>
</head>
<body>
    <iframe src="cms-core.html"></iframe>
    <iframe src="main_convo-design-set-prod.html"></iframe>
    <iframe src="infinite-glass-ui-full.html"></iframe>
    <div style="padding:20px; background:#1a1a1a; color:white;">
        <h2>AEV Sync Control Panel</h2>
        <button onclick="testSync()">Test Sync</button>
        <button onclick="showStats()">Show Stats</button>
        <pre id="output"></pre>
    </div>

    <script>
        function testSync() {
            // Send to all iframes
            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.contentWindow.postMessage({
                    type: 'chatSync',
                    source: 'controlPanel',
                    data: {
                        sender: 'Control Panel',
                        message: 'Test message from container',
                        timestamp: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                }, '*');
            });
            document.getElementById('output').textContent = 'Sent test message to all systems';
        }

        function showStats() {
            const stats = [];
            document.querySelectorAll('iframe').forEach((iframe, i) => {
                try {
                    const sync = iframe.contentWindow.aevSync;
                    if (sync) {
                        stats.push(`System ${i+1}: ${JSON.stringify(sync.getStats(), null, 2)}`);
                    }
                } catch (e) {
                    stats.push(`System ${i+1}: Cannot access (different origin)`);
                }
            });
            document.getElementById('output').textContent = stats.join('\n\n');
        }
    </script>
</body>
</html>
```

Save as `all-systems.html` and open it to see all three systems communicating.

## Troubleshooting

### Messages Not Syncing

1. **Check Console** - Look for AEV Sync initialization messages
2. **Verify Sources** - Make sure each system has unique source name
3. **Check Handlers** - Verify handlers are registered: `window.aevSync.handlers`
4. **Test postMessage** - Send manual postMessage to verify browser support

### ConvoAppGen Not Working

1. **Check Initialization** - `window.convoApp` should exist
2. **Check Bindings** - Run `window.convoApp.state.bindings` to see bound elements
3. **Manual Binding** - Try manual binding: `window.convoApp.bindToElement(element, 'path.to.data')`

### Styles Not Applying

1. **Check CSS Injection** - Look for `<style id="design-var-*">` in `<head>`
2. **Verify CSS Content** - Check `styleElement.textContent`
3. **Check Variation Data** - Ensure `variation.css` exists and is string

### Performance Issues

1. **Limit Sync Frequency** - Debounce rapid updates
2. **Check Stats** - High error rate? `window.aevSync.getStats()`
3. **Reduce Payload Size** - Send only necessary data
4. **Use Observers Wisely** - Don't observe too many elements

## Production Considerations

### Security

Change `target = '*'` to specific origins:

```javascript
// In AEVSync.send() method
const targetOrigin = 'https://yourdomain.com';
window.parent.postMessage(message, targetOrigin);
```

### Performance

1. **Debounce Rapid Updates**
   ```javascript
   let timeout;
   function debouncedSync(data) {
       clearTimeout(timeout);
       timeout = setTimeout(() => {
           window.aevSync.sendDesign(data);
       }, 300);
   }
   ```

2. **Batch Messages**
   ```javascript
   const batch = [];
   // Collect messages
   batch.push(data1, data2, data3);
   // Send once
   window.aevSync.send('batchSync', { items: batch });
   ```

3. **Limit Payload Size**
   - Don't send large images/videos
   - Compress data if needed
   - Use references instead of full objects

### Error Handling

Add global error handler:

```javascript
window.addEventListener('error', (event) => {
    if (event.message.includes('AEVSync')) {
        // Log to monitoring service
        console.error('AEV Sync Error:', event);
    }
});
```

## Advanced Usage

### Custom Message Types

```javascript
// Define custom handler
window.aevSync.on('customType', (data, source) => {
    console.log('Custom message:', data);
});

// Send custom message
window.aevSync.send('customType', {
    myData: 'something',
    timestamp: new Date().toISOString()
});
```

### Middleware Pattern

```javascript
// Add middleware
const originalSend = window.aevSync.send.bind(window.aevSync);
window.aevSync.send = function(type, data, target) {
    // Transform data
    data = transformData(data);

    // Log
    console.log('Sending:', type, data);

    // Validate
    if (!validateData(data)) {
        console.error('Invalid data');
        return false;
    }

    // Call original
    return originalSend(type, data, target);
};
```

### State Persistence

```javascript
// Save state to localStorage
window.convoApp.subscribe('**', (value, oldValue, path) => {
    const state = window.convoApp.exportState();
    localStorage.setItem('app-state', JSON.stringify(state));
});

// Restore state on load
const savedState = localStorage.getItem('app-state');
if (savedState) {
    const state = JSON.parse(savedState);
    Object.entries(state.data).forEach(([key, value]) => {
        window.convoApp.set(key, value);
    });
}
```

## Summary

✅ **Minimal Integration** - Just add one `<script>` tag per system
✅ **No Breaking Changes** - All existing functionality preserved
✅ **Bidirectional Sync** - Real-time communication between all systems
✅ **NO Frameworks** - Pure vanilla JavaScript
✅ **Observable Performance** - Built-in stats and monitoring
✅ **Extensible** - Easy to add custom message types

Questions? Check README-AEV-SYNC.md for detailed documentation.
