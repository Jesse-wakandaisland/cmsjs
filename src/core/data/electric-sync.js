/**
 * Electric-SQL Sync Layer
 * Bridges PocketBase (backend) with PGlite (browser) via Electric-SQL
 * Implements real-time bidirectional sync
 */

export class ElectricSync {
  constructor(pgliteManager, aevipProtocol, config = {}) {
    this.pglit = pgliteManager;
    this.aevip = aevipProtocol;
    this.config = {
      electricUrl: config.electricUrl || 'ws://localhost:5133',
      pocketbaseUrl: config.pocketbaseUrl || 'http://localhost:8090',
      syncInterval: config.syncInterval || 5000,
      enableRealtime: config.enableRealtime !== false,
      collections: ['content', 'templates', 'variations', 'aframe_objects'],
      ...config
    };

    this.state = {
      connected: false,
      syncing: false,
      lastSync: null,
      shapes: new Map(), // Electric shapes for each collection
      subscriptions: new Map()
    };

    this.ws = null;
  }

  /**
   * Initialize Electric sync
   */
  async init() {
    try {
      // Connect to Electric (when available)
      if (this.config.enableRealtime) {
        await this.connectElectric();
      }

      // Setup periodic sync as fallback
      this.setupPeriodicSync();

      console.log('ElectricSync: Initialized');
    } catch (error) {
      console.error('ElectricSync: Initialization failed', error);
      // Fall back to periodic sync only
      this.setupPeriodicSync();
    }
  }

  /**
   * Connect to Electric-SQL
   */
  async connectElectric() {
    try {
      // Note: This is a simplified implementation
      // Full Electric-SQL integration requires additional setup

      this.ws = new WebSocket(this.config.electricUrl);

      this.ws.onopen = () => {
        console.log('ElectricSync: Connected to Electric');
        this.state.connected = true;
        this.subscribeToCollections();
      };

      this.ws.onmessage = (event) => {
        this.handleElectricMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('ElectricSync: WebSocket error', error);
      };

      this.ws.onclose = () => {
        console.log('ElectricSync: Disconnected from Electric');
        this.state.connected = false;

        // Attempt reconnect after delay
        setTimeout(() => this.connectElectric(), 5000);
      };
    } catch (error) {
      console.error('ElectricSync: Connection failed', error);
      throw error;
    }
  }

  /**
   * Subscribe to collections via Electric
   */
  async subscribeToCollections() {
    for (const collection of this.config.collections) {
      await this.subscribeToCollection(collection);
    }
  }

  /**
   * Subscribe to a specific collection
   */
  async subscribeToCollection(collection) {
    const message = {
      type: 'subscribe',
      collection,
      timestamp: Date.now()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log(`ElectricSync: Subscribed to ${collection}`);
    }
  }

  /**
   * Handle incoming Electric message
   */
  async handleElectricMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'change':
          await this.handleChange(message);
          break;
        case 'sync':
          await this.handleSync(message);
          break;
        case 'ack':
          this.handleAck(message);
          break;
        default:
          console.debug('ElectricSync: Unknown message type', message.type);
      }
    } catch (error) {
      console.error('ElectricSync: Message handling error', error);
    }
  }

  /**
   * Handle change notification from Electric
   */
  async handleChange(message) {
    const { collection, operation, record } = message;

    console.log(`ElectricSync: Change received for ${collection}:`, operation);

    // Create AevIP patch
    const patch = this.aevip.createPatch(
      operation === 'delete' ? record : null,
      operation === 'delete' ? null : record,
      {
        contentId: record.id,
        collection,
        operation,
        source: 'electric'
      }
    );

    // Apply to local database
    await this.applyToLocal(collection, operation, record);

    // Notify viewport sync if this affects visible content
    if (this.aevip.viewportSync) {
      this.aevip.viewportSync.handlePatch(patch);
    }
  }

  /**
   * Apply change to local PGlite database
   */
  async applyToLocal(collection, operation, record) {
    try {
      switch (operation) {
        case 'insert':
        case 'update':
          if (collection === 'content') {
            await this.pglite.createContent(record);
          } else if (collection === 'templates') {
            await this.pglite.saveTemplate(record);
          } else if (collection === 'variations') {
            await this.pglite.saveVariation(record);
          } else if (collection === 'aframe_objects') {
            await this.pglite.saveAFrameObject(record);
          }
          break;

        case 'delete':
          if (collection === 'content') {
            await this.pglite.deleteContent(record.id);
          }
          // Add other delete operations as needed
          break;
      }
    } catch (error) {
      console.error(`ElectricSync: Error applying ${operation} to ${collection}`, error);
    }
  }

  /**
   * Sync from PocketBase to local
   */
  async syncFromPocketBase() {
    if (this.state.syncing) {
      console.debug('ElectricSync: Sync already in progress');
      return;
    }

    this.state.syncing = true;

    try {
      for (const collection of this.config.collections) {
        await this.syncCollection(collection);
      }

      this.state.lastSync = Date.now();
      console.log('ElectricSync: Sync completed');
    } catch (error) {
      console.error('ElectricSync: Sync failed', error);
    } finally {
      this.state.syncing = false;
    }
  }

  /**
   * Sync a specific collection
   */
  async syncCollection(collection) {
    try {
      // Fetch from PocketBase
      const url = `${this.config.pocketbaseUrl}/api/collections/${collection}/records`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const records = data.items || data;

      // Sync to local database
      for (const record of records) {
        await this.applyToLocal(collection, 'insert', record);
      }

      console.log(`ElectricSync: Synced ${records.length} ${collection} records`);
    } catch (error) {
      console.error(`ElectricSync: Failed to sync ${collection}`, error);
    }
  }

  /**
   * Push local changes to PocketBase
   */
  async pushToPocketBase(collection, record) {
    try {
      const url = `${this.config.pocketbaseUrl}/api/collections/${collection}/records`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`ElectricSync: Pushed ${collection} record`, result.id);

      return result;
    } catch (error) {
      console.error(`ElectricSync: Failed to push to ${collection}`, error);
      throw error;
    }
  }

  /**
   * Setup periodic sync as fallback
   */
  setupPeriodicSync() {
    setInterval(() => {
      if (!this.state.connected || !this.config.enableRealtime) {
        this.syncFromPocketBase();
      }
    }, this.config.syncInterval);

    // Initial sync
    this.syncFromPocketBase();
  }

  /**
   * Handle sync message
   */
  async handleSync(message) {
    console.log('ElectricSync: Sync message received', message);
    // TODO: Implement full sync protocol
  }

  /**
   * Handle acknowledgment
   */
  handleAck(message) {
    console.debug('ElectricSync: Ack received', message);
  }

  /**
   * Send message via WebSocket
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('ElectricSync: WebSocket not connected');
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      connected: this.state.connected,
      syncing: this.state.syncing,
      lastSync: this.state.lastSync,
      collections: this.config.collections.length
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state.shapes.clear();
    this.state.subscriptions.clear();
  }
}
