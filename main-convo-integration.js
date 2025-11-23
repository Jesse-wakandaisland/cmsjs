/**
 * main_convo-design-set-prod.html Integration Script
 * Adds AEV Sync to the existing ConvoBuilder with plugins
 *
 * This script extends the remarkable abilities of main_convo-design-set-prod.html:
 * - StyleGenerator Plugin
 * - API Manager Plugin
 * - Advanced A-Frame Integration
 *
 * By adding bidirectional sync with:
 * - cms-core.html (CMS Builder)
 * - infinite-glass-ui-full.html (JSON standalone)
 */

(function() {
  'use strict';

  // AEV Sync for ConvoBuilder
  class AEVSync {
    constructor(config = {}) {
      this.config = {
        source: config.source || 'convobuilder',
        debug: config.debug || false,
        ...config
      };
      this.handlers = new Map();
      this.stats = { sent: 0, received: 0, errors: 0, startTime: Date.now() };
      this.init();
    }

    init() {
      window.addEventListener('message', (event) => this.handleMessage(event));
      console.log(`%c🔄 AEV Sync initialized (${this.config.source})`, 'color: #667eea; font-weight: bold');
    }

    handleMessage(event) {
      try {
        const message = event.data;
        if (!message || typeof message !== 'object') return;
        if (!message.type || !message.source || !message.data) return;
        if (message.source === this.config.source) return;

        this.stats.received++;
        this.log(`Received ${message.type} from ${message.source}`, message.data);

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

        this.log(`Sent ${message.type}`);
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

    sendAPIData(endpoint, data) {
      return this.send('apiSync', { endpoint, data, timestamp: new Date().toISOString() });
    }

    log(...args) {
      if (this.config.debug) {
        console.log(`[AEVSync:${this.config.source}]`, ...args);
      }
    }

    getStats() {
      return {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        errorRate: this.stats.errors / (this.stats.sent + this.stats.received || 1)
      };
    }
  }

  // Initialize AEV Sync
  const aevSync = new AEVSync({
    source: 'convobuilder',
    debug: true
  });

  // Integrate with existing StyleGenerator plugin
  if (window.cbPlugins && window.cbPlugins.styleGenerator) {
    console.log('🎨 Integrating StyleGenerator with AEV Sync');

    const originalGenerateStyle = window.cbPlugins.styleGenerator.generateStyle;
    if (originalGenerateStyle) {
      window.cbPlugins.styleGenerator.generateStyle = function(...args) {
        const result = originalGenerateStyle.apply(this, args);

        // Sync generated styles to other systems
        if (result && result.then) {
          result.then(style => {
            if (style) {
              aevSync.sendDesign({
                id: `style-${Date.now()}`,
                style_name: style.name || 'generated',
                variation_index: 0,
                css: style.css || '',
                config: style.config || {}
              });
            }
          });
        }

        return result;
      };
    }
  }

  // Integrate with existing API Manager plugin
  if (window.cbPlugins && window.cbPlugins.apiManager) {
    console.log('🔌 Integrating API Manager with AEV Sync');

    // Intercept API responses and sync them
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        const clonedResponse = response.clone();

        // Try to sync the data if it's JSON
        clonedResponse.json().then(data => {
          aevSync.sendAPIData(args[0], {
            url: args[0],
            data,
            timestamp: new Date().toISOString()
          });
        }).catch(() => {
          // Not JSON, ignore
        });

        return response;
      });
    };
  }

  // Listen for incoming messages from other systems
  aevSync.on('chatSync', (data, source) => {
    console.log('💬 Chat message from', source, ':', data);
    // Could display in ConvoBuilder UI
    showNotification(`${source}: ${data.message}`);
  });

  aevSync.on('designSync', (data, source) => {
    console.log('🎨 Design variation from', source, ':', data);
    // Apply design if applicable
    if (data.variation && data.variation.css) {
      applyDesignVariation(data.variation);
    }
  });

  aevSync.on('templateSync', (data, source) => {
    console.log('📄 Template from', source, ':', data);
    // Could add to library or display
  });

  aevSync.on('3dSync', (data, source) => {
    console.log('🎭 3D object from', source, ':', data);
    // Could add to A-Frame scene if applicable
    if (data.object) {
      addToAFrameScene(data.object);
    }
  });

  // Helper functions
  function applyDesignVariation(variation) {
    let styleEl = document.getElementById(`sync-design-${variation.id}`);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = `sync-design-${variation.id}`;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = variation.css;
    console.log('Applied design variation:', variation.id);
  }

  function showNotification(message) {
    // Use simple-notify if available
    if (typeof Notify !== 'undefined') {
      Notify({
        title: 'Sync Message',
        text: message,
        type: 'info',
        position: 'right-bottom'
      });
    } else {
      console.log('Notification:', message);
    }
  }

  function addToAFrameScene(object) {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.log('No A-Frame scene found');
      return;
    }

    const entity = document.createElement('a-entity');

    // Set primitive/geometry
    if (object.primitive) {
      entity.setAttribute('geometry', {
        primitive: object.primitive,
        ...object.geometry
      });
    }

    // Set position
    if (object.position) {
      entity.setAttribute('position', object.position);
    }

    // Set rotation
    if (object.rotation) {
      entity.setAttribute('rotation', object.rotation);
    }

    // Set scale
    if (object.scale) {
      entity.setAttribute('scale', object.scale);
    }

    // Set material
    if (object.material) {
      entity.setAttribute('material', object.material);
    }

    scene.appendChild(entity);
    console.log('Added 3D object to scene:', object);
  }

  // Expose to window
  window.aevSync = aevSync;

  // Register as plugin if cbPlugins exists
  if (window.cbPlugins && window.cbPlugins.register) {
    window.cbPlugins.register('aevSync', aevSync);
  }

  console.log('%c✅ ConvoBuilder AEV Sync Integration Complete!', 'color: #667eea; font-size: 16px; font-weight: bold');
  console.log('AEV Sync Stats:', aevSync.getStats());

})();
