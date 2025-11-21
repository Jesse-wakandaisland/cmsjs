/**
 * ConvoAppGen - Derby.js Integration
 * Renamed and extended Derby.js for infinite app generation
 *
 * Features:
 * - Reactive templates from Derby/Racer
 * - Integrates with CR8ENGINE for template generation
 * - Works with Design Variation Engine for infinite styles
 * - Real-time data binding with PGlite
 */

import derby from 'derby';
import { Racer } from 'racer';

export class ConvoAppGen {
  constructor(pgliteManager, config = {}) {
    this.pglite = pgliteManager;
    this.config = {
      appName: 'ConvoAppGen',
      enableRealtimeSync: true,
      templateEngine: 'cr8engine',
      ...config
    };

    this.app = null;
    this.model = null;
    this.templates = new Map();
    this.components = new Map();

    this.init();
  }

  /**
   * Initialize ConvoAppGen
   */
  init() {
    // Create Derby app
    this.app = derby.createApp(this.config.appName, __filename);

    // Setup model (Racer)
    this.setupModel();

    // Register core components
    this.registerCoreComponents();

    console.log('ConvoAppGen: Initialized');
  }

  /**
   * Setup Racer model for reactive data
   */
  setupModel() {
    // Create Racer model
    this.model = new Racer.Model();

    // Bind to PGlite
    this.bindToPGlite();

    console.log('ConvoAppGen: Model initialized');
  }

  /**
   * Bind model to PGlite database
   */
  async bindToPGlite() {
    // Listen to model changes and sync to PGlite
    this.model.on('change', '**', async (path, value, previous) => {
      await this.handleModelChange(path, value, previous);
    });

    // Load initial data from PGlite
    await this.loadFromPGlite();
  }

  /**
   * Handle model changes
   */
  async handleModelChange(path, value, previous) {
    console.debug('ConvoAppGen: Model changed', path, value);

    // Determine which collection this affects
    const [collection] = path.split('.');

    if (collection === 'content' && this.pglite) {
      // Sync to PGlite
      try {
        const contentId = path.split('.')[1];
        if (contentId && value) {
          await this.pglite.updateContent(contentId, value);
        }
      } catch (error) {
        console.error('ConvoAppGen: Failed to sync to PGlite', error);
      }
    }
  }

  /**
   * Load data from PGlite into model
   */
  async loadFromPGlite() {
    try {
      // Load content
      const content = await this.pglite.listContent();
      content.forEach(item => {
        this.model.set(`content.${item.id}`, item);
      });

      // Load templates
      const templates = await this.pglite.getTemplates();
      templates.forEach(template => {
        this.model.set(`templates.${template.id}`, template);
        this.registerTemplate(template);
      });

      console.log('ConvoAppGen: Data loaded from PGlite');
    } catch (error) {
      console.error('ConvoAppGen: Failed to load from PGlite', error);
    }
  }

  /**
   * Register a template
   */
  registerTemplate(template) {
    this.templates.set(template.id, template);

    // Register with Derby
    try {
      this.app.component(template.name, {
        view: template.template_data.view || '',
        init: function() {
          // Template initialization logic
        }
      });

      console.log(`ConvoAppGen: Registered template ${template.name}`);
    } catch (error) {
      console.error(`ConvoAppGen: Failed to register template ${template.name}`, error);
    }
  }

  /**
   * Register core components
   */
  registerCoreComponents() {
    // Content Component
    this.registerComponent('Content', {
      view: `
        <div class="convo-content" data-aevip-id="{{id}}">
          {{#if html}}
            {{{html}}}
          {{else}}
            {{body}}
          {{/if}}
        </div>
      `,
      init: function() {
        this.model.on('change', 'html', () => {
          this.model.emit('contentUpdated', this.model.get('id'));
        });
      }
    });

    // Template Component
    this.registerComponent('Template', {
      view: `
        <div class="convo-template" data-template-id="{{id}}">
          <view is="{{templateType}}" />
        </div>
      `
    });

    // Variation Component
    this.registerComponent('Variation', {
      view: `
        <div class="convo-variation" data-variation-id="{{id}}" style="{{css}}">
          <view is="Content" id="{{contentId}}" />
        </div>
      `
    });
  }

  /**
   * Register a component
   */
  registerComponent(name, component) {
    this.components.set(name, component);

    try {
      this.app.component(name, component);
      console.log(`ConvoAppGen: Registered component ${name}`);
    } catch (error) {
      console.error(`ConvoAppGen: Failed to register component ${name}`, error);
    }
  }

  /**
   * Create a page from template
   */
  async createPage(templateId, data = {}) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Create a new page model
    const pageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.model.set(`pages.${pageId}`, {
      id: pageId,
      templateId,
      data,
      createdAt: Date.now()
    });

    return pageId;
  }

  /**
   * Render a component
   */
  async renderComponent(name, data = {}) {
    const component = this.components.get(name);

    if (!component) {
      throw new Error(`Component not found: ${name}`);
    }

    // Create temporary model for rendering
    const tempModel = this.model.child('_temp.' + Date.now());
    Object.entries(data).forEach(([key, value]) => {
      tempModel.set(key, value);
    });

    try {
      // Render using Derby's rendering engine
      const rendered = this.app.render(component.view, tempModel);
      return rendered;
    } catch (error) {
      console.error(`ConvoAppGen: Failed to render ${name}`, error);
      throw error;
    }
  }

  /**
   * Bind data to element
   */
  bindToElement(element, path, bidirectional = false) {
    if (!element || !path) return;

    // Get initial value
    const value = this.model.get(path);
    this.updateElement(element, value);

    // Listen to model changes
    this.model.on('change', path, (newValue) => {
      this.updateElement(element, newValue);
    });

    // Bidirectional binding
    if (bidirectional) {
      element.addEventListener('input', (e) => {
        this.model.set(path, e.target.value);
      });
    }
  }

  /**
   * Update element with value
   */
  updateElement(element, value) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = value || '';
    } else {
      element.textContent = value || '';
    }
  }

  /**
   * Subscribe to path changes
   */
  subscribe(path, callback) {
    this.model.on('change', path, callback);
  }

  /**
   * Get value from model
   */
  get(path) {
    return this.model.get(path);
  }

  /**
   * Set value in model
   */
  set(path, value) {
    this.model.set(path, value);
  }

  /**
   * Get all templates
   */
  getTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get all components
   */
  getComponents() {
    return Array.from(this.components.keys());
  }

  /**
   * Export app state
   */
  exportState() {
    return {
      model: this.model.get(),
      templates: Array.from(this.templates.entries()),
      components: Array.from(this.components.keys())
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.model) {
      this.model.destroy();
    }

    this.templates.clear();
    this.components.clear();
  }
}
