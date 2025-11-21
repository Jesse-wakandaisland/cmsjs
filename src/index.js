/**
 * CMS.js - Main Entry Point
 * Local-First Infinite Generative CMS Platform
 *
 * Core Systems:
 * - PGlite Database (Local PostgreSQL in Browser)
 * - ConvoAppGen (Reactive Framework)
 * - CR8ENGINE (7 Infinite Template Generators)
 * - Infinite 3D Generator (14 A-Frame Primitives)
 * - Design Variation Engine (8+ Styles)
 * - AevIP Protocol (Local Change Tracking)
 * - Viewport Sync (Deep Observer Integration)
 */

import { AevIPProtocol } from './core/aevip/protocol.js';
import { ViewportSync } from './core/aevip/viewport-sync.js';
import { PGliteManager } from './core/data/pglite-manager.js';
import { ConvoAppGen } from './core/convoappgen/index.js';
import { CR8Engine } from './engines/cr8engine/index.js';
import { Infinite3DGenerator } from './engines/aframe3d/infinite-generator.js';
import { DesignVariationEngine } from './engines/design-variation/index.js';

class CMSjs {
  constructor(config = {}) {
    this.config = {
      enable3D: config.enable3D !== false,
      enableInfiniteGeneration: config.enableInfiniteGeneration !== false,
      enableObservers: config.enableObservers !== false,
      debug: config.debug || false,
      ...config
    };

    this.systems = {
      aevip: null,
      viewport: null,
      pglite: null,
      convoapp: null,
      cr8engine: null,
      generator3d: null,
      designVariation: null
    };

    this.ready = false;
    this.init();
  }

  /**
   * Initialize all systems
   */
  async init() {
    console.log('%c🚀 CMS.js Initializing (Local-First Mode)...', 'color: #3b82f6; font-size: 16px; font-weight: bold');

    try {
      // 1. Initialize PGlite database (Local PostgreSQL in Browser)
      console.log('📊 Initializing PGlite database...');
      this.systems.pglite = new PGliteManager({
        dataDir: 'idb://cmsjs-db',
        debug: this.config.debug
      });
      await this.systems.pglite.init();

      // 2. Initialize AevIP protocol (Local change tracking)
      console.log('🔄 Initializing AevIP protocol (local mode)...');
      this.systems.aevip = new AevIPProtocol({
        localMode: true
      });

      // 3. Initialize Viewport Sync (Observer APIs)
      if (this.config.enableObservers) {
        console.log('👁️ Initializing Viewport Sync...');
        this.systems.viewport = new ViewportSync(this.systems.aevip, {
          rootMargin: '100px',
          threshold: [0, 0.25, 0.5, 0.75, 1.0]
        });

        // Link viewport sync to AevIP
        this.systems.aevip.viewportSync = this.systems.viewport;
      }

      // 4. Initialize ConvoAppGen (Vanilla JS Reactive Framework)
      console.log('🎨 Initializing ConvoAppGen...');
      this.systems.convoapp = new ConvoAppGen(this.systems.pglite, {
        appName: 'CMS.js',
        enableRealtimeSync: false
      });

      // 5. Initialize CR8ENGINE
      if (this.config.enableInfiniteGeneration) {
        console.log('⚙️ Initializing CR8ENGINE...');
        this.systems.cr8engine = new CR8Engine(this.systems.convoapp, {
          engines: [
            'Cr8Base',
            'Cr83D',
            'Cr8Animation',
            'Cr8Story',
            'Cr8Multi',
            'Cr8Form',
            'Cr8Urweb'
          ]
        });
      }

      // 6. Initialize Infinite 3D Generator
      if (this.config.enable3D) {
        console.log('🎭 Initializing Infinite 3D Generator...');
        this.systems.generator3d = new Infinite3DGenerator(this.systems.pglite, {
          enablePhysics: true,
          enableShaders: true,
          enableParticles: true
        });
      }

      // 7. Initialize Design Variation Engine
      if (this.config.enableInfiniteGeneration) {
        console.log('🎨 Initializing Design Variation Engine...');
        this.systems.designVariation = new DesignVariationEngine({
          maxCachedVariations: 10000,
          enableAnimations: true,
          enableGradients: true
        });
      }

      this.ready = true;

      console.log('%c✅ CMS.js Ready!', 'color: #10b981; font-size: 16px; font-weight: bold');
      console.log('Systems:', this.getSystemsStatus());

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('cmsjs:ready', {
        detail: { cmsjs: this }
      }));

      // Expose to window for debugging
      window.cmsjs = this;

    } catch (error) {
      console.error('❌ CMS.js initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate infinite templates
   */
  async *generateTemplates(engineName = 'Cr8Base', count = null) {
    if (!this.systems.cr8engine) {
      throw new Error('CR8ENGINE not initialized');
    }

    const generator = this.systems.cr8engine.generateInfinite(engineName);

    let index = 0;
    while (count === null || index < count) {
      yield generator.next().value;
      index++;
    }
  }

  /**
   * Generate infinite 3D objects
   */
  async *generate3DObjects(count = null) {
    if (!this.systems.generator3d) {
      throw new Error('3D Generator not initialized');
    }

    const generator = this.systems.generator3d.generateInfinite();

    let index = 0;
    while (count === null || index < count) {
      yield generator.next().value;
      index++;
    }
  }

  /**
   * Generate infinite design variations
   */
  async *generateDesigns(styleName = null, count = null) {
    if (!this.systems.designVariation) {
      throw new Error('Design Variation Engine not initialized');
    }

    const generator = this.systems.designVariation.generateInfinite(styleName);

    let index = 0;
    while (count === null || index < count) {
      yield generator.next().value;
      index++;
    }
  }

  /**
   * Create a complete 3D scene
   */
  async create3DScene(sceneId, objectCount = 100) {
    if (!this.systems.generator3d) {
      throw new Error('3D Generator not initialized');
    }

    return await this.systems.generator3d.generateScene(sceneId, objectCount);
  }

  /**
   * Render 3D scene to HTML
   */
  render3DScene(scene) {
    if (!this.systems.generator3d) {
      throw new Error('3D Generator not initialized');
    }

    return this.systems.generator3d.renderScene(scene);
  }

  /**
   * Create content with variations
   */
  async createContentWithVariations(content, variationCount = 5) {
    // Save base content
    const savedContent = await this.systems.pglite.createContent(content);

    // Generate variations
    const variations = [];
    const varGenerator = this.generateDesigns(null, variationCount);

    for await (const variation of varGenerator) {
      variation.content_id = savedContent.id;
      const savedVariation = await this.systems.pglite.saveVariation(variation);
      variations.push(savedVariation);
    }

    return {
      content: savedContent,
      variations
    };
  }

  /**
   * Get all systems status
   */
  getSystemsStatus() {
    return Object.entries(this.systems).reduce((acc, [name, system]) => {
      acc[name] = system ? 'initialized' : 'not initialized';
      return acc;
    }, {});
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ready: this.ready,
      mode: 'local-first',
      database: 'PGlite (IndexedDB)',
      systems: this.getSystemsStatus(),
      cr8engine: this.systems.cr8engine?.getStats(),
      generator3d: this.systems.generator3d?.getStats(),
      designVariation: this.systems.designVariation?.getStats(),
      viewport: this.systems.viewport?.getStats()
    };
  }

  /**
   * Destroy all systems
   */
  async destroy() {
    console.log('🛑 Shutting down CMS.js...');

    Object.values(this.systems).forEach(system => {
      if (system && system.destroy) {
        system.destroy();
      }
    });

    if (this.systems.pglite) {
      await this.systems.pglite.close();
    }

    this.ready = false;
    console.log('✅ CMS.js shutdown complete');
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cmsjs = new CMSjs();
  });
} else {
  window.cmsjs = new CMSjs();
}

export default CMSjs;
