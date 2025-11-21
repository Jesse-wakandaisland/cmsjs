/**
 * CR8ENGINE - Infinite Template Generation System
 * Integrates the existing cms-core.html cr8engine functionality
 * Generates infinite component variations algorithmically
 */

export class CR8Engine {
  constructor(convoAppGen, config = {}) {
    this.convoApp = convoAppGen;
    this.config = {
      engines: [
        'Cr8Base',
        'Cr83D',
        'Cr8Animation',
        'Cr8Story',
        'Cr8Multi',
        'Cr8Form',
        'Cr8Urweb'
      ],
      maxCachedTemplates: 1000,
      generationBatchSize: 10,
      ...config
    };

    this.state = {
      generatedCount: 0,
      cache: new Map(),
      generators: new Map()
    };

    this.init();
  }

  /**
   * Initialize CR8ENGINE
   */
  init() {
    this.registerGenerators();
    console.log('CR8ENGINE: Initialized with', this.config.engines.length, 'engines');
  }

  /**
   * Register all template generators
   */
  registerGenerators() {
    this.config.engines.forEach(engineName => {
      const generator = this.createGenerator(engineName);
      this.state.generators.set(engineName, generator);
    });
  }

  /**
   * Create a generator for an engine type
   */
  createGenerator(engineName) {
    const generators = {
      Cr8Base: () => this.generateBase(),
      Cr83D: () => this.generate3D(),
      Cr8Animation: () => this.generateAnimation(),
      Cr8Story: () => this.generateStory(),
      Cr8Multi: () => this.generateMulti(),
      Cr8Form: () => this.generateForm(),
      Cr8Urweb: () => this.generateUrweb()
    };

    return generators[engineName] || (() => this.generateBase());
  }

  /**
   * Generate infinite variations
   * This is the core infinite generation function
   */
  *generateInfinite(engineName = 'Cr8Base') {
    const generator = this.state.generators.get(engineName);

    if (!generator) {
      throw new Error(`Generator not found: ${engineName}`);
    }

    let index = 0;

    while (true) {
      const template = generator(index);
      template.id = `${engineName.toLowerCase()}-${index}`;
      template.index = index;
      template.engine = engineName;

      // Cache if under limit
      if (this.state.cache.size < this.config.maxCachedTemplates) {
        this.state.cache.set(template.id, template);
      }

      this.state.generatedCount++;

      yield template;
      index++;
    }
  }

  /**
   * Generate Base components
   */
  generateBase(index = 0) {
    const components = ['div', 'section', 'article', 'header', 'footer', 'nav', 'aside'];
    const layouts = ['flex', 'grid', 'block', 'inline-flex'];
    const alignments = ['start', 'center', 'end', 'stretch'];

    // Use index to create deterministic but varied combinations
    const componentType = components[index % components.length];
    const layout = layouts[Math.floor(index / components.length) % layouts.length];
    const alignment = alignments[Math.floor(index / (components.length * layouts.length)) % alignments.length];

    return {
      name: `Base-${index}`,
      category: 'base',
      engine_type: 'Cr8Base',
      template_data: {
        view: `
          <${componentType} class="cr8-base-${index}" data-layout="${layout}">
            <div class="cr8-content">
              {{#each items}}
                <div class="cr8-item">{{this}}</div>
              {{/each}}
            </div>
          </${componentType}>
        `,
        css: `
          .cr8-base-${index} {
            display: ${layout};
            align-items: ${alignment};
            gap: ${(index % 5) + 1}rem;
            padding: ${(index % 3) + 1}rem;
          }

          .cr8-item {
            flex: ${index % 2 === 0 ? '1' : 'auto'};
            min-width: ${100 + (index * 10)}px;
          }
        `
      },
      config: {
        componentType,
        layout,
        alignment,
        variation: index
      }
    };
  }

  /**
   * Generate 3D components (A-Frame)
   */
  generate3D(index = 0) {
    const primitives = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane', 'ring'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const animations = ['property: rotation; to: 0 360 0; loop: true; dur: 3000',
                       'property: position; to: 0 2 0; dir: alternate; loop: true; dur: 2000',
                       'property: scale; to: 1.5 1.5 1.5; dir: alternate; loop: true; dur: 1000'];

    const primitive = primitives[index % primitives.length];
    const color = colors[index % colors.length];
    const animation = animations[Math.floor(index / primitives.length) % animations.length];

    const x = ((index * 3) % 20) - 10;
    const y = ((index * 2) % 10);
    const z = -((index % 5) + 5);

    return {
      name: `3D-${primitive}-${index}`,
      category: '3d',
      engine_type: 'Cr83D',
      template_data: {
        view: `
          <a-entity id="cr8-3d-${index}" position="${x} ${y} ${z}">
            <a-${primitive}
              color="${color}"
              radius="${0.5 + (index % 3) * 0.3}"
              animation="${animation}"
              shadow="cast: true; receive: true">
            </a-${primitive}>
          </a-entity>
        `
      },
      config: {
        primitive,
        color,
        animation,
        position: { x, y, z },
        variation: index
      }
    };
  }

  /**
   * Generate Animation components
   */
  generateAnimation(index = 0) {
    const animationTypes = ['fadeIn', 'slideIn', 'bounce', 'rotate', 'scale', 'pulse'];
    const durations = [300, 500, 800, 1000, 1500];
    const easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'];

    const type = animationTypes[index % animationTypes.length];
    const duration = durations[Math.floor(index / animationTypes.length) % durations.length];
    const easing = easings[Math.floor(index / (animationTypes.length * durations.length)) % easings.length];

    return {
      name: `Animation-${type}-${index}`,
      category: 'animation',
      engine_type: 'Cr8Animation',
      template_data: {
        view: `
          <div class="cr8-animate cr8-animate-${type}-${index}">
            {{content}}
          </div>
        `,
        css: `
          @keyframes cr8-${type}-${index} {
            ${this.getAnimationKeyframes(type, index)}
          }

          .cr8-animate-${type}-${index} {
            animation: cr8-${type}-${index} ${duration}ms ${easing};
          }
        `
      },
      config: {
        type,
        duration,
        easing,
        variation: index
      }
    };
  }

  /**
   * Get animation keyframes
   */
  getAnimationKeyframes(type, index) {
    const keyframes = {
      fadeIn: `
        from { opacity: 0; }
        to { opacity: 1; }
      `,
      slideIn: `
        from { transform: translateX(-${100 + index * 10}px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      `,
      bounce: `
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-${20 + index * 5}px); }
      `,
      rotate: `
        from { transform: rotate(0deg); }
        to { transform: rotate(${360 + index * 90}deg); }
      `,
      scale: `
        0%, 100% { transform: scale(1); }
        50% { transform: scale(${1 + (index % 5) * 0.1}); }
      `,
      pulse: `
        0%, 100% { opacity: 1; }
        50% { opacity: ${0.5 + (index % 5) * 0.1}; }
      `
    };

    return keyframes[type] || keyframes.fadeIn;
  }

  /**
   * Generate Story components
   */
  generateStory(index = 0) {
    const layouts = ['vertical-scroll', 'horizontal-cards', 'timeline', 'masonry'];
    const themes = ['minimal', 'bold', 'elegant', 'playful'];

    const layout = layouts[index % layouts.length];
    const theme = themes[Math.floor(index / layouts.length) % themes.length];

    return {
      name: `Story-${layout}-${index}`,
      category: 'story',
      engine_type: 'Cr8Story',
      template_data: {
        view: `
          <div class="cr8-story cr8-story-${layout}-${theme}-${index}">
            {{#each chapters}}
              <section class="story-chapter">
                <h2>{{title}}</h2>
                <div class="story-content">{{content}}</div>
              </section>
            {{/each}}
          </div>
        `,
        css: this.getStoryCSS(layout, theme, index)
      },
      config: {
        layout,
        theme,
        variation: index
      }
    };
  }

  /**
   * Get story-specific CSS
   */
  getStoryCSS(layout, theme, index) {
    return `
      .cr8-story-${layout}-${theme}-${index} {
        display: ${layout === 'horizontal-cards' ? 'flex' : 'block'};
        gap: ${(index % 5) + 2}rem;
        padding: ${(index % 3) + 2}rem;
      }

      .story-chapter {
        ${layout === 'masonry' ? 'break-inside: avoid;' : ''}
        margin-bottom: ${(index % 4) + 1}rem;
      }
    `;
  }

  /**
   * Generate Multi-layout components
   */
  generateMulti(index = 0) {
    const gridTemplates = [
      'auto',
      'repeat(2, 1fr)',
      'repeat(3, 1fr)',
      '1fr 2fr',
      '2fr 1fr',
      'repeat(auto-fit, minmax(200px, 1fr))'
    ];

    const template = gridTemplates[index % gridTemplates.length];

    return {
      name: `Multi-${index}`,
      category: 'multi',
      engine_type: 'Cr8Multi',
      template_data: {
        view: `
          <div class="cr8-multi-${index}">
            {{#each sections}}
              <div class="multi-section">{{this}}</div>
            {{/each}}
          </div>
        `,
        css: `
          .cr8-multi-${index} {
            display: grid;
            grid-template-columns: ${template};
            gap: ${(index % 5) + 1}rem;
          }
        `
      },
      config: {
        gridTemplate: template,
        variation: index
      }
    };
  }

  /**
   * Generate Form components
   */
  generateForm(index = 0) {
    const formTypes = ['contact', 'survey', 'registration', 'checkout', 'feedback'];
    const layouts = ['stacked', 'inline', 'two-column'];

    const formType = formTypes[index % formTypes.length];
    const layout = layouts[Math.floor(index / formTypes.length) % layouts.length];

    return {
      name: `Form-${formType}-${index}`,
      category: 'form',
      engine_type: 'Cr8Form',
      template_data: {
        view: `
          <form class="cr8-form cr8-form-${formType}-${layout}-${index}">
            {{#each fields}}
              <div class="form-field">
                <label>{{label}}</label>
                <input type="{{type}}" name="{{name}}" />
              </div>
            {{/each}}
            <button type="submit">Submit</button>
          </form>
        `,
        css: `
          .cr8-form-${formType}-${layout}-${index} {
            display: ${layout === 'two-column' ? 'grid' : 'flex'};
            ${layout === 'two-column' ? 'grid-template-columns: 1fr 1fr;' : 'flex-direction: column;'}
            gap: ${(index % 3) + 1}rem;
          }
        `
      },
      config: {
        formType,
        layout,
        variation: index
      }
    };
  }

  /**
   * Generate Urweb (custom web) components
   */
  generateUrweb(index = 0) {
    return {
      name: `Urweb-${index}`,
      category: 'custom',
      engine_type: 'Cr8Urweb',
      template_data: {
        view: `
          <div class="cr8-urweb-${index}">
            <!-- Custom generated content ${index} -->
            {{content}}
          </div>
        `,
        css: `
          .cr8-urweb-${index} {
            /* Custom styles for variation ${index} */
          }
        `
      },
      config: {
        variation: index
      }
    };
  }

  /**
   * Generate N templates
   */
  async generateBatch(engineName, count) {
    const generator = this.generateInfinite(engineName);
    const batch = [];

    for (let i = 0; i < count; i++) {
      const template = generator.next().value;
      batch.push(template);

      // Register with ConvoAppGen
      if (this.convoApp) {
        await this.convoApp.pglite.saveTemplate(template);
        this.convoApp.registerTemplate(template);
      }
    }

    return batch;
  }

  /**
   * Get template by ID
   */
  getTemplate(id) {
    return this.state.cache.get(id);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      generatedCount: this.state.generatedCount,
      cachedTemplates: this.state.cache.size,
      engines: this.config.engines.length
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.state.cache.clear();
  }
}
