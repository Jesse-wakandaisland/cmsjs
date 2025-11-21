/**
 * Design Variation Engine
 * Integrates with main_convo-design-set-prod.html functionality
 * Generates infinite design variations without AI
 *
 * Features:
 * - Infinite style combinations
 * - Color palette generation
 * - Layout variations
 * - Typography combinations
 * - Animation variations
 */

export class DesignVariationEngine {
  constructor(config = {}) {
    this.config = {
      maxCachedVariations: 10000,
      enableAnimations: true,
      enableGradients: true,
      ...config
    };

    this.state = {
      generatedCount: 0,
      cache: new Map(),
      fingerprints: new Set()
    };

    this.styles = {
      modern: this.defineModernStyle(),
      glassmorphism: this.defineGlassmorphismStyle(),
      neumorphism: this.defineNeumorphismStyle(),
      skeuomorphic: this.defineSkeuomorphicStyle(),
      brutalist: this.defineBrutalistStyle(),
      minimal: this.defineMinimalStyle(),
      gradient: this.defineGradientStyle(),
      neon: this.defineNeonStyle()
    };

    this.init();
  }

  /**
   * Initialize engine
   */
  init() {
    console.log('DesignVariationEngine: Initialized with', Object.keys(this.styles).length, 'base styles');
  }

  /**
   * Generate infinite design variations
   */
  *generateInfinite(styleName = null) {
    let index = 0;

    while (true) {
      // Select style
      const style = styleName || this.selectStyle(index);
      const variation = this.generateVariation(style, index);

      variation.id = `var-${style}-${index}`;
      variation.index = index;
      variation.fingerprint = this.createFingerprint(variation);

      // Only yield if unique
      if (!this.state.fingerprints.has(variation.fingerprint)) {
        this.state.fingerprints.add(variation.fingerprint);

        // Cache if under limit
        if (this.state.cache.size < this.config.maxCachedVariations) {
          this.state.cache.set(variation.id, variation);
        }

        this.state.generatedCount++;

        yield variation;
      }

      index++;
    }
  }

  /**
   * Select style based on index
   */
  selectStyle(index) {
    const styleNames = Object.keys(this.styles);
    return styleNames[index % styleNames.length];
  }

  /**
   * Generate a variation of a style
   */
  generateVariation(styleName, index) {
    const baseStyle = this.styles[styleName];

    if (!baseStyle) {
      throw new Error(`Style not found: ${styleName}`);
    }

    const palette = this.generateColorPalette(index);
    const typography = this.generateTypography(index);
    const spacing = this.generateSpacing(index);
    const borderRadius = this.generateBorderRadius(index);
    const shadows = this.generateShadows(styleName, index);
    const animations = this.config.enableAnimations ? this.generateAnimations(index) : {};

    const css = this.compileCSS({
      ...baseStyle,
      palette,
      typography,
      spacing,
      borderRadius,
      shadows,
      animations
    }, index);

    return {
      style_name: styleName,
      variation_index: index,
      css,
      config: {
        palette,
        typography,
        spacing,
        borderRadius,
        shadows,
        animations
      }
    };
  }

  /**
   * Generate color palette
   */
  generateColorPalette(seed) {
    const hue = seed % 360;
    const saturation = 60 + (seed % 30);
    const lightness = 50 + (seed % 20);

    return {
      primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      secondary: `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness}%)`,
      accent: `hsl(${(hue + 240) % 360}, ${saturation + 10}%, ${lightness - 10}%)`,
      background: `hsl(${hue}, ${saturation - 50}%, ${95 + (seed % 5)}%)`,
      surface: `hsl(${hue}, ${saturation - 40}%, ${90 + (seed % 10)}%)`,
      text: `hsl(${hue}, ${saturation - 50}%, ${15 + (seed % 10)}%)`,
      textSecondary: `hsl(${hue}, ${saturation - 40}%, ${40 + (seed % 20)}%)`,
      border: `hsl(${hue}, ${saturation - 30}%, ${70 + (seed % 20)}%)`
    };
  }

  /**
   * Generate typography settings
   */
  generateTypography(seed) {
    const fontPairs = [
      { heading: 'Inter', body: 'System-ui' },
      { heading: 'Playfair Display', body: 'Lato' },
      { heading: 'Montserrat', body: 'Open Sans' },
      { heading: 'Raleway', body: 'Roboto' },
      { heading: 'Poppins', body: 'Nunito' },
      { heading: 'Space Grotesk', body: 'Work Sans' }
    ];

    const pair = fontPairs[seed % fontPairs.length];

    return {
      headingFont: pair.heading,
      bodyFont: pair.body,
      baseSize: 14 + (seed % 4),
      scale: 1.15 + (seed % 5) * 0.05,
      lineHeight: 1.5 + (seed % 3) * 0.1,
      headingWeight: 600 + ((seed % 3) * 100),
      bodyWeight: 300 + ((seed % 3) * 100)
    };
  }

  /**
   * Generate spacing system
   */
  generateSpacing(seed) {
    const baseUnit = 4 + (seed % 4);

    return {
      xs: baseUnit * 1,
      sm: baseUnit * 2,
      md: baseUnit * 4,
      lg: baseUnit * 6,
      xl: baseUnit * 8,
      xxl: baseUnit * 12
    };
  }

  /**
   * Generate border radius values
   */
  generateBorderRadius(seed) {
    const base = seed % 20;

    return {
      sm: base,
      md: base * 2,
      lg: base * 3,
      xl: base * 4,
      full: 9999
    };
  }

  /**
   * Generate shadows
   */
  generateShadows(styleName, seed) {
    const color = `rgba(0, 0, 0, ${0.1 + (seed % 3) * 0.05})`;

    // Style-specific shadow patterns
    const shadowPatterns = {
      modern: {
        sm: `0 1px 2px 0 ${color}`,
        md: `0 4px 6px -1px ${color}, 0 2px 4px -1px ${color}`,
        lg: `0 10px 15px -3px ${color}, 0 4px 6px -2px ${color}`,
        xl: `0 20px 25px -5px ${color}, 0 10px 10px -5px ${color}`
      },
      glassmorphism: {
        sm: `0 4px 6px ${color}`,
        md: `0 8px 32px ${color}`,
        lg: `0 16px 48px ${color}`,
        xl: `0 24px 64px ${color}`
      },
      neumorphism: {
        raised: `8px 8px 16px ${color}, -8px -8px 16px rgba(255, 255, 255, 0.7)`,
        inset: `inset 4px 4px 8px ${color}, inset -4px -4px 8px rgba(255, 255, 255, 0.7)`,
        flat: `2px 2px 4px ${color}, -2px -2px 4px rgba(255, 255, 255, 0.7)`
      },
      neon: {
        sm: `0 0 5px currentColor, 0 0 10px currentColor`,
        md: `0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor`,
        lg: `0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor`
      }
    };

    return shadowPatterns[styleName] || shadowPatterns.modern;
  }

  /**
   * Generate animations
   */
  generateAnimations(seed) {
    const durations = [200, 300, 500, 700, 1000];
    const easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier(0.4, 0, 0.2, 1)'];

    return {
      duration: durations[seed % durations.length],
      easing: easings[Math.floor(seed / durations.length) % easings.length],
      hoverScale: 1 + (seed % 3) * 0.05,
      hoverBrightness: 1.05 + (seed % 2) * 0.05
    };
  }

  /**
   * Compile CSS from configuration
   */
  compileCSS(config, seed) {
    return `
      /* Design Variation ${seed} - ${config.style_name} */

      :root {
        /* Colors */
        --color-primary: ${config.palette.primary};
        --color-secondary: ${config.palette.secondary};
        --color-accent: ${config.palette.accent};
        --color-background: ${config.palette.background};
        --color-surface: ${config.palette.surface};
        --color-text: ${config.palette.text};
        --color-text-secondary: ${config.palette.textSecondary};
        --color-border: ${config.palette.border};

        /* Typography */
        --font-heading: '${config.typography.headingFont}', sans-serif;
        --font-body: '${config.typography.bodyFont}', sans-serif;
        --font-size-base: ${config.typography.baseSize}px;
        --line-height: ${config.typography.lineHeight};

        /* Spacing */
        --space-xs: ${config.spacing.xs}px;
        --space-sm: ${config.spacing.sm}px;
        --space-md: ${config.spacing.md}px;
        --space-lg: ${config.spacing.lg}px;
        --space-xl: ${config.spacing.xl}px;
        --space-xxl: ${config.spacing.xxl}px;

        /* Border Radius */
        --radius-sm: ${config.borderRadius.sm}px;
        --radius-md: ${config.borderRadius.md}px;
        --radius-lg: ${config.borderRadius.lg}px;
        --radius-xl: ${config.borderRadius.xl}px;
        --radius-full: ${config.borderRadius.full}px;

        /* Shadows */
        ${Object.entries(config.shadows).map(([key, value]) =>
          `--shadow-${key}: ${value};`
        ).join('\n        ')}

        /* Animations */
        ${config.animations ? `
        --transition-duration: ${config.animations.duration}ms;
        --transition-easing: ${config.animations.easing};
        ` : ''}
      }

      ${this.getStyleSpecificCSS(config)}
    `;
  }

  /**
   * Get style-specific CSS
   */
  getStyleSpecificCSS(config) {
    switch (config.style_name) {
      case 'glassmorphism':
        return this.getGlassmorphismCSS(config);
      case 'neumorphism':
        return this.getNeumorphismCSS(config);
      case 'modern':
        return this.getModernCSS(config);
      case 'neon':
        return this.getNeonCSS(config);
      default:
        return this.getDefaultCSS(config);
    }
  }

  /**
   * Get glassmorphism-specific CSS
   */
  getGlassmorphismCSS(config) {
    return `
      body {
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        backdrop-filter: blur(10px);
      }

      .page-container,
      .card,
      .surface {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: var(--shadow-lg);
        border-radius: var(--radius-lg);
      }
    `;
  }

  /**
   * Get neumorphism-specific CSS
   */
  getNeumorphismCSS(config) {
    return `
      body {
        background: var(--color-background);
      }

      .card,
      .button,
      .surface {
        background: var(--color-surface);
        box-shadow: var(--shadow-raised);
        border-radius: var(--radius-lg);
        border: none;
      }

      .card:active,
      .button:active {
        box-shadow: var(--shadow-inset);
      }
    `;
  }

  /**
   * Get modern style CSS
   */
  getModernCSS(config) {
    return `
      body {
        background: var(--color-background);
        font-family: var(--font-body);
        line-height: var(--line-height);
      }

      .card {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        padding: var(--space-lg);
        transition: all var(--transition-duration) var(--transition-easing);
      }

      .card:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }
    `;
  }

  /**
   * Get neon style CSS
   */
  getNeonCSS(config) {
    return `
      body {
        background: #0a0a0a;
        color: var(--color-primary);
      }

      .card,
      .button {
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid var(--color-primary);
        box-shadow: var(--shadow-md);
        border-radius: var(--radius-sm);
        color: var(--color-primary);
      }

      .button:hover {
        box-shadow: var(--shadow-lg);
        background: var(--color-primary);
        color: #0a0a0a;
      }
    `;
  }

  /**
   * Get default CSS
   */
  getDefaultCSS(config) {
    return `
      body {
        background: var(--color-background);
        color: var(--color-text);
        font-family: var(--font-body);
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }

      .card {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        padding: var(--space-md);
      }
    `;
  }

  /**
   * Define style presets
   */
  defineModernStyle() {
    return { style_name: 'modern' };
  }

  defineGlassmorphismStyle() {
    return { style_name: 'glassmorphism' };
  }

  defineNeumorphismStyle() {
    return { style_name: 'neumorphism' };
  }

  defineSkeuomorphicStyle() {
    return { style_name: 'skeuomorphic' };
  }

  defineBrutalistStyle() {
    return { style_name: 'brutalist' };
  }

  defineMinimalStyle() {
    return { style_name: 'minimal' };
  }

  defineGradientStyle() {
    return { style_name: 'gradient' };
  }

  defineNeonStyle() {
    return { style_name: 'neon' };
  }

  /**
   * Create fingerprint for uniqueness check
   */
  createFingerprint(variation) {
    const config = JSON.stringify(variation.config);
    let hash = 0;

    for (let i = 0; i < config.length; i++) {
      const char = config.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  /**
   * Apply variation to element
   */
  applyVariation(element, variation) {
    // Inject CSS
    let styleEl = document.getElementById(`design-var-${variation.id}`);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = `design-var-${variation.id}`;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = variation.css;

    // Add variation class
    element.classList.add(`variation-${variation.id}`);
    element.setAttribute('data-variation', variation.id);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      generatedCount: this.state.generatedCount,
      cachedVariations: this.state.cache.size,
      uniqueFingerprints: this.state.fingerprints.size,
      styles: Object.keys(this.styles).length
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.state.cache.clear();
    // Keep fingerprints to maintain uniqueness
  }
}
