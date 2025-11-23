/**
 * CMS Core Integration Script
 * Adds ConvoAppGen reactive framework and AEV Sync to cms-core.html
 *
 * This script enhances the existing cms-core.html without breaking existing functionality
 */

(function() {
  'use strict';

  // Import or inline AEV Sync
  class AEVSync {
    // ... (simplified inline version or load from protocol.js)
    constructor(config = {}) {
      this.config = {
        source: config.source || 'cmsBuilder',
        debug: config.debug || false,
        ...config
      };
      this.handlers = new Map();
      this.stats = { sent: 0, received: 0, errors: 0, startTime: Date.now() };
      this.init();
    }

    init() {
      window.addEventListener('message', (event) => this.handleMessage(event));
      console.log(`%c🔄 AEV Sync initialized (${this.config.source})`, 'color: #3b82f6; font-weight: bold');
    }

    handleMessage(event) {
      try {
        const message = event.data;
        if (!message || typeof message !== 'object') return;
        if (!message.type || !message.source || !message.data) return;
        if (message.source === this.config.source) return;

        this.stats.received++;
        const handlers = this.handlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message.data, message.source, message);
            } catch (error) {
              console.error('Handler error:', error);
              this.stats.errors++;
            }
          });
        }
      } catch (error) {
        console.error('Message error:', error);
        this.stats.errors++;
      }
    }

    send(type, data, target = '*') {
      try {
        const message = {
          type,
          source: this.config.source,
          data,
          timestamp: new Date().toISOString()
        };

        if (window.parent && window.parent !== window) {
          window.parent.postMessage(message, target);
          this.stats.sent++;
        }

        document.querySelectorAll('iframe').forEach(iframe => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(message, target);
            this.stats.sent++;
          }
        });

        return true;
      } catch (error) {
        console.error('Send error:', error);
        this.stats.errors++;
        return false;
      }
    }

    on(type, handler) {
      if (!this.handlers.has(type)) {
        this.handlers.set(type, new Set());
      }
      this.handlers.get(type).add(handler);
      return () => {
        const handlers = this.handlers.get(type);
        if (handlers) handlers.delete(handler);
      };
    }

    sendChat(sender, message) {
      return this.send('chatSync', { sender, message, timestamp: new Date().toISOString() });
    }

    sendDesign(variation) {
      return this.send('designSync', { type: 'variation', variation, timestamp: new Date().toISOString() });
    }

    sendTemplate(template) {
      return this.send('templateSync', { type: 'template', template, timestamp: new Date().toISOString() });
    }

    send3DObject(object) {
      return this.send('3dSync', { type: '3d-object', object, timestamp: new Date().toISOString() });
    }

    sendState(path, value) {
      return this.send('stateSync', { path, value, timestamp: new Date().toISOString() });
    }
  }

  // Simplified ConvoAppGen for CMS Core
  class ConvoAppGen {
    constructor(config = {}) {
      this.config = {
        appName: 'CMS Builder',
        enableRealtimeSync: true,
        ...config
      };

      this.state = {
        data: {},
        observers: new Map(),
        bindings: new Map()
      };

      this.reactiveData = this.createReactiveProxy(this.state.data);
      console.log('ConvoAppGen: Initialized in CMS Core');
    }

    createReactiveProxy(target, path = '') {
      const self = this;
      return new Proxy(target, {
        get(obj, prop) {
          const value = obj[prop];
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return self.createReactiveProxy(value, path ? `${path}.${prop}` : prop);
          }
          return value;
        },
        set(obj, prop, value) {
          const oldValue = obj[prop];
          obj[prop] = value;
          const fullPath = path ? `${path}.${prop}` : prop;
          self.notifyChange(fullPath, value, oldValue);
          return true;
        }
      });
    }

    notifyChange(path, newValue, oldValue) {
      const handlers = this.state.observers.get(path);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(newValue, oldValue, path);
          } catch (error) {
            console.error('Observer error:', error);
          }
        });
      }

      // Update bound elements
      this.updateBoundElements(path, newValue);

      // Emit custom event
      window.dispatchEvent(new CustomEvent('convoappgen:change', {
        detail: { path, value: newValue, oldValue }
      }));
    }

    updateBoundElements(path, value) {
      this.state.bindings.forEach((binding, element) => {
        if (binding.path === path || path.startsWith(binding.path + '.')) {
          this.updateElement(element, value);
        }
      });
    }

    updateElement(element, value) {
      if (!element) return;
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'input' || tagName === 'textarea') {
        if (element.type === 'checkbox') {
          element.checked = !!value;
        } else {
          element.value = value !== undefined && value !== null ? value : '';
        }
      } else {
        if (element.hasAttribute('data-bind-html')) {
          element.innerHTML = value !== undefined && value !== null ? value : '';
        } else {
          element.textContent = value !== undefined && value !== null ? value : '';
        }
      }
    }

    subscribe(path, callback) {
      if (!this.state.observers.has(path)) {
        this.state.observers.set(path, new Set());
      }
      this.state.observers.get(path).add(callback);
      return () => {
        const handlers = this.state.observers.get(path);
        if (handlers) handlers.delete(callback);
      };
    }

    get(path) {
      return path.split('.').reduce((current, prop) => current?.[prop], this.reactiveData);
    }

    set(path, value) {
      const parts = path.split('.');
      let current = this.state.data;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      const lastPart = parts[parts.length - 1];
      current[lastPart] = value;
      this.notifyChange(path, value, undefined);
    }

    bindToElement(element, path, bidirectional = false) {
      if (!element || !path) return;

      this.state.bindings.set(element, { path, bidirectional });
      const value = this.get(path);
      this.updateElement(element, value);

      if (bidirectional) {
        const updateData = (e) => {
          this.set(path, e.target.value);
        };
        element.addEventListener('input', updateData);
        element.addEventListener('change', updateData);
      }
    }

    discoverBindings(root = document.body) {
      const elements = root.querySelectorAll('[data-bind]');
      elements.forEach(element => {
        const path = element.getAttribute('data-bind');
        const bidirectional = element.hasAttribute('data-bind-two-way');
        this.bindToElement(element, path, bidirectional);
      });
    }
  }

  // Initialize systems
  const aevSync = new AEVSync({
    source: 'cmsBuilder',
    debug: true
  });

  const convoApp = new ConvoAppGen({
    appName: 'CMS Builder',
    enableRealtimeSync: true
  });

  // Integrate with existing chat sync from cms-core.html
  // This extends the existing displaySyncedMessage and syncToConvoBuilder functions

  // Listen for incoming sync messages
  aevSync.on('chatSync', (data, source) => {
    console.log('Chat sync received:', data);
    // If cms-core.html has displaySyncedMessage function, call it
    if (typeof window.displaySyncedMessage === 'function') {
      window.displaySyncedMessage(data.sender, data.message);
    }
  });

  aevSync.on('designSync', (data, source) => {
    console.log('Design variation received:', data);
    // Store in ConvoAppGen state
    convoApp.set(`designs.${data.variation.id}`, data.variation);

    // Apply variation if needed
    if (data.variation && typeof data.variation.css === 'string') {
      applyDesignVariation(data.variation);
    }
  });

  aevSync.on('templateSync', (data, source) => {
    console.log('Template received:', data);
    convoApp.set(`templates.${data.template.id}`, data.template);
  });

  aevSync.on('3dSync', (data, source) => {
    console.log('3D object received:', data);
    convoApp.set(`objects3d.${data.object.id}`, data.object);
  });

  // Helper to apply design variation
  function applyDesignVariation(variation) {
    let styleEl = document.getElementById(`design-var-${variation.id}`);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = `design-var-${variation.id}`;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = variation.css;
  }

  // Override existing syncToConvoBuilder if it exists
  if (typeof window.syncToConvoBuilder === 'function') {
    const originalSync = window.syncToConvoBuilder;
    window.syncToConvoBuilder = function(sender, message) {
      // Call original
      originalSync(sender, message);
      // Also send via AEV Sync
      aevSync.sendChat(sender, message);
    };
  }

  // Expose to window
  window.aevSync = aevSync;
  window.convoApp = convoApp;
  window.ConvoAppGen = ConvoAppGen;
  window.AEVSync = AEVSync;

  // Auto-discover data bindings
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      convoApp.discoverBindings();
    });
  } else {
    convoApp.discoverBindings();
  }

  // Setup MutationObserver for dynamic bindings
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-bind')) {
          const path = node.getAttribute('data-bind');
          const bidirectional = node.hasAttribute('data-bind-two-way');
          convoApp.bindToElement(node, path, bidirectional);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('%c✅ CMS Core Integration Complete!', 'color: #10b981; font-size: 16px; font-weight: bold');
  console.log('Available globally:', { aevSync, convoApp });

})();
