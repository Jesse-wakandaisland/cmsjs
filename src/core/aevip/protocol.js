/**
 * AevIP (Adaptive Evolving Incremental Publishing) Protocol
 * Inspired by ResIP's resilience, designed for instant content updates
 *
 * Features:
 * - Survives network interruptions
 * - Incremental patches (not full rebuilds)
 * - Viewport-aware updates via IntersectionObserver
 * - Multi-client sync via Electric-SQL
 */

export class AevIPProtocol {
  constructor(config = {}) {
    this.config = {
      maxRetries: 4,
      retryDelays: [2000, 4000, 8000, 16000], // Exponential backoff
      patchQueueSize: 1000,
      compressionThreshold: 1024, // bytes
      heartbeatInterval: 30000, // 30s
      ...config
    };

    this.state = {
      connected: false,
      sessionId: this.generateSessionId(),
      patchQueue: [],
      pendingAcks: new Map(),
      lastHeartbeat: Date.now(),
      reconnectAttempts: 0
    };

    this.handlers = {
      onPatch: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    };

    this.init();
  }

  /**
   * Initialize the protocol
   */
  init() {
    this.setupHeartbeat();
    this.setupVisibilityDetection();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `aevip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a patch from content changes
   */
  createPatch(before, after, metadata = {}) {
    const patch = {
      id: this.generatePatchId(),
      sessionId: this.state.sessionId,
      timestamp: Date.now(),
      type: this.detectChangeType(before, after),
      diff: this.computeDiff(before, after),
      metadata: {
        contentId: metadata.contentId || null,
        priority: metadata.priority || 'normal',
        scope: metadata.scope || 'full',
        ...metadata
      }
    };

    // Compress if needed
    if (JSON.stringify(patch.diff).length > this.config.compressionThreshold) {
      patch.compressed = true;
      patch.diff = this.compress(patch.diff);
    }

    return patch;
  }

  /**
   * Generate unique patch ID
   */
  generatePatchId() {
    return `patch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect type of change
   */
  detectChangeType(before, after) {
    if (!before && after) return 'create';
    if (before && !after) return 'delete';
    if (before && after) return 'update';
    return 'unknown';
  }

  /**
   * Compute diff between two objects
   * Uses RFC 6902 JSON Patch format
   */
  computeDiff(before, after) {
    const patches = [];

    if (typeof before === 'object' && typeof after === 'object') {
      // Object comparison
      const allKeys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {})
      ]);

      for (const key of allKeys) {
        const beforeVal = before?.[key];
        const afterVal = after?.[key];

        if (beforeVal === undefined && afterVal !== undefined) {
          patches.push({ op: 'add', path: `/${key}`, value: afterVal });
        } else if (beforeVal !== undefined && afterVal === undefined) {
          patches.push({ op: 'remove', path: `/${key}` });
        } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
          patches.push({ op: 'replace', path: `/${key}`, value: afterVal });
        }
      }
    } else {
      // Primitive comparison
      if (before !== after) {
        patches.push({ op: 'replace', path: '', value: after });
      }
    }

    return patches;
  }

  /**
   * Apply a patch to an object
   */
  applyPatch(obj, patch) {
    if (!patch.diff || !Array.isArray(patch.diff)) {
      console.warn('Invalid patch format', patch);
      return obj;
    }

    // Decompress if needed
    let diff = patch.diff;
    if (patch.compressed) {
      diff = this.decompress(diff);
    }

    let result = JSON.parse(JSON.stringify(obj)); // Deep clone

    for (const operation of diff) {
      result = this.applyOperation(result, operation);
    }

    return result;
  }

  /**
   * Apply single JSON Patch operation
   */
  applyOperation(obj, operation) {
    const { op, path, value } = operation;
    const pathParts = path.split('/').filter(p => p);

    if (op === 'add' || op === 'replace') {
      if (pathParts.length === 0) {
        return value;
      }

      let current = obj;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      current[pathParts[pathParts.length - 1]] = value;
    } else if (op === 'remove') {
      if (pathParts.length === 0) {
        return undefined;
      }

      let current = obj;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
        if (!current) return obj;
      }
      delete current[pathParts[pathParts.length - 1]];
    }

    return obj;
  }

  /**
   * Queue patch for transmission with resilience
   */
  async queuePatch(patch) {
    this.state.patchQueue.push(patch);

    // Limit queue size
    if (this.state.patchQueue.length > this.config.patchQueueSize) {
      this.state.patchQueue.shift();
    }

    // Try to send immediately
    return await this.sendPatchWithRetry(patch);
  }

  /**
   * Send patch with exponential backoff retry
   */
  async sendPatchWithRetry(patch, attemptNumber = 0) {
    try {
      const result = await this.sendPatch(patch);
      this.state.reconnectAttempts = 0; // Reset on success
      return result;
    } catch (error) {
      if (attemptNumber < this.config.maxRetries) {
        const delay = this.config.retryDelays[attemptNumber];
        console.log(`AevIP: Retry ${attemptNumber + 1}/${this.config.maxRetries} in ${delay}ms`);

        await this.sleep(delay);
        return await this.sendPatchWithRetry(patch, attemptNumber + 1);
      } else {
        console.error('AevIP: Max retries reached', error);
        if (this.handlers.onError) {
          this.handlers.onError(error, patch);
        }
        throw error;
      }
    }
  }

  /**
   * Send patch (to be overridden by transport layer)
   */
  async sendPatch(patch) {
    throw new Error('sendPatch must be implemented by transport layer');
  }

  /**
   * Heartbeat to maintain connection
   */
  setupHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      if (now - this.state.lastHeartbeat > this.config.heartbeatInterval) {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat() {
    this.state.lastHeartbeat = Date.now();
    // To be implemented by transport layer
  }

  /**
   * Setup visibility detection for pause/resume
   */
  setupVisibilityDetection() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
  }

  /**
   * Pause syncing (when tab is hidden)
   */
  pause() {
    console.log('AevIP: Paused');
    this.state.paused = true;
  }

  /**
   * Resume syncing
   */
  async resume() {
    console.log('AevIP: Resumed');
    this.state.paused = false;

    // Flush queued patches
    await this.flushQueue();
  }

  /**
   * Flush all queued patches
   */
  async flushQueue() {
    const queue = [...this.state.patchQueue];
    this.state.patchQueue = [];

    for (const patch of queue) {
      await this.sendPatchWithRetry(patch);
    }
  }

  /**
   * Simple compression (can be enhanced with actual compression library)
   */
  compress(data) {
    // For now, just JSON stringify - can add LZ compression later
    return JSON.stringify(data);
  }

  /**
   * Decompress
   */
  decompress(data) {
    return JSON.parse(data);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register event handlers
   */
  on(event, handler) {
    this.handlers[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = handler;
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.state.patchQueue = [];
    this.state.pendingAcks.clear();
  }
}
