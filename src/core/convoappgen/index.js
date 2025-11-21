/**
 * ConvoAppGen - Pure Vanilla JS Reactive Framework
 * Replaces Derby.js with a lightweight reactive system using Proxy
 *
 * Features:
 * - Reactive data model using JavaScript Proxy
 * - Template system with mustache-like syntax
 * - Component registration
 * - Real-time data binding
 * - Integration with PGlite
 * - Deep observer integration
 */

export class ConvoAppGen {
  constructor(pgliteManager, config = {}) {
    this.pglite = pgliteManager;
    this.config = {
      appName: 'ConvoAppGen',
      enableRealtimeSync: true,
      templateEngine: 'cr8engine',
      ...config
    };

    this.state = {
      data: {},
      templates: new Map(),
      components: new Map(),
      bindings: new Map(), // element -> { path, handler }
      observers: new Map()
    };

    this.reactiveData = this.createReactiveProxy(this.state.data);

    this.init();
  }

  /**
   * Initialize ConvoAppGen
   */
  init() {
    this.registerCoreComponents();
    this.setupObservers();
    console.log('ConvoAppGen: Initialized (Vanilla JS)');
  }

  /**
   * Create reactive proxy for data
   */
  createReactiveProxy(target, path = '') {
    const self = this;

    return new Proxy(target, {
      get(obj, prop) {
        const value = obj[prop];

        // Return reactive proxy for nested objects
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return self.createReactiveProxy(value, path ? `${path}.${prop}` : prop);
        }

        return value;
      },

      set(obj, prop, value) {
        const oldValue = obj[prop];
        obj[prop] = value;

        const fullPath = path ? `${path}.${prop}` : prop;

        // Notify observers
        self.notifyChange(fullPath, value, oldValue);

        // Sync to PGlite if needed
        if (self.config.enableRealtimeSync) {
          self.syncToPGlite(fullPath, value);
        }

        return true;
      },

      deleteProperty(obj, prop) {
        const oldValue = obj[prop];
        delete obj[prop];

        const fullPath = path ? `${path}.${prop}` : prop;
        self.notifyChange(fullPath, undefined, oldValue);

        return true;
      }
    });
  }

  /**
   * Notify observers of data changes
   */
  notifyChange(path, newValue, oldValue) {
    // Notify specific path observers
    const handlers = this.state.observers.get(path);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(newValue, oldValue, path);
        } catch (error) {
          console.error('ConvoAppGen: Observer error', error);
        }
      });
    }

    // Notify wildcard observers (path.**)
    this.state.observers.forEach((handlers, observedPath) => {
      if (observedPath.endsWith('**') && path.startsWith(observedPath.slice(0, -2))) {
        handlers.forEach(handler => {
          try {
            handler(newValue, oldValue, path);
          } catch (error) {
            console.error('ConvoAppGen: Observer error', error);
          }
        });
      }
    });

    // Update bound elements
    this.updateBoundElements(path, newValue);
  }

  /**
   * Update elements bound to this path
   */
  updateBoundElements(path, value) {
    this.state.bindings.forEach((binding, element) => {
      if (binding.path === path || path.startsWith(binding.path + '.')) {
        this.updateElement(element, value);
      }
    });
  }

  /**
   * Sync data to PGlite
   */
  async syncToPGlite(path, value) {
    const [collection, id] = path.split('.');

    if (collection === 'content' && id && this.pglite) {
      try {
        await this.pglite.updateContent(id, { [path.split('.').pop()]: value });
      } catch (error) {
        console.debug('ConvoAppGen: PGlite sync skipped', error.message);
      }
    }
  }

  /**
   * Load data from PGlite
   */
  async loadFromPGlite() {
    if (!this.pglite) return;

    try {
      // Load content
      const content = await this.pglite.listContent();
      content.forEach(item => {
        this.set(`content.${item.id}`, item);
      });

      // Load templates
      const templates = await this.pglite.getTemplates();
      templates.forEach(template => {
        this.set(`templates.${template.id}`, template);
        this.registerTemplate(template);
      });

      console.log('ConvoAppGen: Data loaded from PGlite');
    } catch (error) {
      console.error('ConvoAppGen: Failed to load from PGlite', error);
    }
  }

  /**
   * Setup observers for DOM changes
   */
  setupObservers() {
    // Observe DOM for elements with data-bind attribute
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              this.discoverBindings(node);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Discover data bindings in DOM
   */
  discoverBindings(root = document.body) {
    // Find elements with data-bind attribute
    const elements = root.querySelectorAll('[data-bind]');

    elements.forEach(element => {
      const path = element.getAttribute('data-bind');
      const bidirectional = element.hasAttribute('data-bind-two-way');

      this.bindToElement(element, path, bidirectional);
    });
  }

  /**
   * Bind data to element
   */
  bindToElement(element, path, bidirectional = false) {
    if (!element || !path) return;

    // Store binding
    this.state.bindings.set(element, { path, bidirectional });

    // Get initial value and update element
    const value = this.get(path);
    this.updateElement(element, value);

    // Setup bidirectional binding if needed
    if (bidirectional) {
      const updateData = (e) => {
        const newValue = e.target.value;
        this.set(path, newValue);
      };

      element.addEventListener('input', updateData);
      element.addEventListener('change', updateData);
    }
  }

  /**
   * Update element with value
   */
  updateElement(element, value) {
    if (!element) return;

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea') {
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else if (element.type === 'radio') {
        element.checked = element.value === value;
      } else {
        element.value = value !== undefined && value !== null ? value : '';
      }
    } else if (tagName === 'select') {
      element.value = value !== undefined && value !== null ? value : '';
    } else {
      // For other elements, set textContent or innerHTML based on data-bind-html attribute
      if (element.hasAttribute('data-bind-html')) {
        element.innerHTML = value !== undefined && value !== null ? value : '';
      } else {
        element.textContent = value !== undefined && value !== null ? value : '';
      }
    }
  }

  /**
   * Register a template
   */
  registerTemplate(template) {
    this.state.templates.set(template.id, template);

    // Register as component if it has a name
    if (template.name) {
      this.registerComponent(template.name, {
        template: template.template_data?.view || '',
        data: template.template_data || {}
      });
    }

    console.log(`ConvoAppGen: Registered template ${template.id}`);
  }

  /**
   * Register core components
   */
  registerCoreComponents() {
    // Content Component
    this.registerComponent('Content', {
      template: `
        <div class="convo-content" data-aevip-id="{{id}}">
          <div data-bind="content.{{id}}.html" data-bind-html></div>
        </div>
      `
    });

    // Template Component
    this.registerComponent('Template', {
      template: `
        <div class="convo-template" data-template-id="{{id}}">
          <!-- Template content -->
        </div>
      `
    });

    // Variation Component
    this.registerComponent('Variation', {
      template: `
        <div class="convo-variation" data-variation-id="{{id}}" style="{{css}}">
          <div data-bind="content.{{contentId}}"></div>
        </div>
      `
    });
  }

  /**
   * Register a component
   */
  registerComponent(name, component) {
    this.state.components.set(name, component);
    console.log(`ConvoAppGen: Registered component ${name}`);
  }

  /**
   * Render a template with data
   */
  renderTemplate(template, data = {}) {
    let html = template;

    // Simple mustache-like template parsing
    html = html.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(data, path.trim());
      return value !== undefined && value !== null ? value : '';
    });

    // Handle loops: {{#each items}}...{{/each}}
    html = html.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, itemTemplate) => {
      const array = this.getValueByPath(data, arrayPath.trim());

      if (!Array.isArray(array)) return '';

      return array.map(item => {
        return this.renderTemplate(itemTemplate, item);
      }).join('');
    });

    // Handle conditionals: {{#if condition}}...{{/if}}
    html = html.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = this.getValueByPath(data, condition.trim());
      return value ? content : '';
    });

    return html;
  }

  /**
   * Get value by path (supports nested paths like "user.name.first")
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }

  /**
   * Render a component
   */
  renderComponent(name, data = {}) {
    const component = this.state.components.get(name);

    if (!component) {
      throw new Error(`Component not found: ${name}`);
    }

    return this.renderTemplate(component.template, data);
  }

  /**
   * Subscribe to data changes
   */
  subscribe(path, callback) {
    if (!this.state.observers.has(path)) {
      this.state.observers.set(path, new Set());
    }

    this.state.observers.get(path).add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.state.observers.get(path);
      if (handlers) {
        handlers.delete(callback);
      }
    };
  }

  /**
   * Get value from reactive data
   */
  get(path) {
    return this.getValueByPath(this.reactiveData, path);
  }

  /**
   * Set value in reactive data
   */
  set(path, value) {
    const parts = path.split('.');
    let current = this.state.data;

    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!(part in current)) {
        current[part] = {};
      }

      current = current[part];
    }

    // Set value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    // Notify change
    this.notifyChange(path, value, undefined);
  }

  /**
   * Delete value from reactive data
   */
  delete(path) {
    const parts = path.split('.');
    let current = this.state.data;

    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
      if (!current) return;
    }

    // Delete value
    const lastPart = parts[parts.length - 1];
    const oldValue = current[lastPart];
    delete current[lastPart];

    // Notify change
    this.notifyChange(path, undefined, oldValue);
  }

  /**
   * Get all templates
   */
  getTemplates() {
    return Array.from(this.state.templates.values());
  }

  /**
   * Get all components
   */
  getComponents() {
    return Array.from(this.state.components.keys());
  }

  /**
   * Export state
   */
  exportState() {
    return {
      data: this.state.data,
      templates: Array.from(this.state.templates.entries()),
      components: Array.from(this.state.components.keys())
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.state.observers.clear();
    this.state.bindings.clear();
    this.state.templates.clear();
    this.state.components.clear();
  }
}
