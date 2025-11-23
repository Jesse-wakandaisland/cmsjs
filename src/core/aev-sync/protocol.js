/**
 * AEV Sync Protocol - Bidirectional Synchronization System
 *
 * Connects three systems:
 * 1. cms-core.html (CMS Builder)
 * 2. main_convo-design-set-prod.html (ConvoBuilder with plugins)
 * 3. infinite-glass-ui-full.html (JSON standalone version)
 *
 * Based on existing chat sync in cms-core.html but extended for:
 * - Design variations
 * - Template generations
 * - 3D objects
 * - Component state
 * - API data
 */

export class AEVSync {
  constructor(config = {}) {
    this.config = {
      source: config.source || 'unknown', // 'cmsBuilder', 'convobuilder', 'jsonStandalone'
      enableChat: config.enableChat !== false,
      enableDesign: config.enableDesign !== false,
      enableTemplates: config.enableTemplates !== false,
      enable3D: config.enable3D !== false,
      enableState: config.enableState !== false,
      enableAPI: config.enableAPI !== false,
      debug: config.debug || false,
      ...config
    };

    this.handlers = new Map();
    this.messageQueue = [];
    this.connected = new Set(); // Track connected windows/iframes
    this.stats = {
      sent: 0,
      received: 0,
      errors: 0,
      startTime: Date.now()
    };

    this.init();
  }

  /**
   * Initialize AEV Sync
   */
  init() {
    // Listen for messages from other windows/iframes
    window.addEventListener('message', (event) => this.handleMessage(event));

    // Register default handlers
    this.registerDefaultHandlers();

    console.log(`%c🔄 AEV Sync initialized (source: ${this.config.source})`,
                'color: #3b82f6; font-weight: bold');
  }

  /**
   * Register default message handlers
   */
  registerDefaultHandlers() {
    // Chat sync (extends existing functionality from cms-core.html)
    if (this.config.enableChat) {
      this.on('chatSync', (data, source) => {
        this.log('Chat message received:', data);
        // Emit event for UI to handle
        this.emit('chat:message', { ...data, fromSource: source });
      });
    }

    // Design variation sync
    if (this.config.enableDesign) {
      this.on('designSync', (data, source) => {
        this.log('Design variation received:', data);
        this.emit('design:variation', { ...data, fromSource: source });
      });
    }

    // Template generation sync
    if (this.config.enableTemplates) {
      this.on('templateSync', (data, source) => {
        this.log('Template received:', data);
        this.emit('template:generated', { ...data, fromSource: source });
      });
    }

    // 3D object sync
    if (this.config.enable3D) {
      this.on('3dSync', (data, source) => {
        this.log('3D object received:', data);
        this.emit('3d:object', { ...data, fromSource: source });
      });
    }

    // State sync
    if (this.config.enableState) {
      this.on('stateSync', (data, source) => {
        this.log('State update received:', data);
        this.emit('state:update', { ...data, fromSource: source });
      });
    }

    // API data sync
    if (this.config.enableAPI) {
      this.on('apiSync', (data, source) => {
        this.log('API data received:', data);
        this.emit('api:data', { ...data, fromSource: source });
      });
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const message = event.data;

      // Validate message format
      if (!message || typeof message !== 'object') return;
      if (!message.type || !message.source || !message.data) return;

      // Ignore messages from self
      if (message.source === this.config.source) return;

      this.stats.received++;
      this.log(`Received ${message.type} from ${message.source}`);

      // Call registered handlers
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data, message.source, message);
          } catch (error) {
            console.error('AEV Sync handler error:', error);
            this.stats.errors++;
          }
        });
      }
    } catch (error) {
      console.error('AEV Sync message error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Send message to other windows/iframes
   */
  send(type, data, target = '*') {
    try {
      const message = {
        type,
        source: this.config.source,
        data,
        timestamp: new Date().toISOString()
      };

      // Send to parent if in iframe
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, target);
        this.stats.sent++;
      }

      // Send to all iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(message, target);
          this.stats.sent++;
        }
      });

      this.log(`Sent ${type} to ${target}`);
      return true;
    } catch (error) {
      console.error('AEV Sync send error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Register message handler
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Emit custom event for UI integration
   */
  emit(eventName, detail) {
    const event = new CustomEvent(`aevsync:${eventName}`, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Send chat message (compatible with existing cms-core.html sync)
   */
  sendChat(sender, message) {
    return this.send('chatSync', {
      sender,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send design variation
   */
  sendDesign(variation) {
    return this.send('designSync', {
      type: 'variation',
      variation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send template
   */
  sendTemplate(template) {
    return this.send('templateSync', {
      type: 'template',
      template,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send 3D object
   */
  send3DObject(object) {
    return this.send('3dSync', {
      type: '3d-object',
      object,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send state update
   */
  sendState(path, value) {
    return this.send('stateSync', {
      path,
      value,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send API data
   */
  sendAPIData(endpoint, data) {
    return this.send('apiSync', {
      endpoint,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Subscribe to chat messages
   */
  onChat(callback) {
    return this.on('chatSync', callback);
  }

  /**
   * Subscribe to design variations
   */
  onDesign(callback) {
    return this.on('designSync', callback);
  }

  /**
   * Subscribe to templates
   */
  onTemplate(callback) {
    return this.on('templateSync', callback);
  }

  /**
   * Subscribe to 3D objects
   */
  on3D(callback) {
    return this.on('3dSync', callback);
  }

  /**
   * Subscribe to state updates
   */
  onState(callback) {
    return this.on('stateSync', callback);
  }

  /**
   * Subscribe to API data
   */
  onAPI(callback) {
    return this.on('apiSync', callback);
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      errorRate: this.stats.errors / (this.stats.sent + this.stats.received || 1)
    };
  }

  /**
   * Log helper
   */
  log(...args) {
    if (this.config.debug) {
      console.log(`[AEVSync:${this.config.source}]`, ...args);
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.handlers.clear();
    this.connected.clear();
    this.messageQueue = [];
  }
}

// Export for both ES6 and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AEVSync };
}
if (typeof window !== 'undefined') {
  window.AEVSync = AEVSync;
}
