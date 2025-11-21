/**
 * AevIP Viewport-Aware Sync
 * Only updates content that's visible or about to become visible
 * Deep IntersectionObserver and MutationObserver integration
 */

export class ViewportSync {
  constructor(aevipProtocol, config = {}) {
    this.protocol = aevipProtocol;
    this.config = {
      rootMargin: '100px', // Preload content 100px before visible
      threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds
      debounceDelay: 150,
      mutationBufferTime: 100,
      priorityZones: {
        visible: 1,
        nearVisible: 2,
        offscreen: 3
      },
      ...config
    };

    this.state = {
      observedElements: new Map(), // element -> metadata
      visibleElements: new Set(),
      pendingUpdates: new Map(), // contentId -> patch
      mutationBuffer: [],
      stats: {
        totalObserved: 0,
        currentlyVisible: 0,
        updatesApplied: 0,
        updatesDeferred: 0
      }
    };

    this.observers = {
      intersection: null,
      mutation: null,
      resize: null,
      performance: null
    };

    this.init();
  }

  /**
   * Initialize observers
   */
  init() {
    this.setupIntersectionObserver();
    this.setupMutationObserver();
    this.setupResizeObserver();
    this.setupPerformanceObserver();
    this.discoverElements();
  }

  /**
   * Setup IntersectionObserver with multiple thresholds
   */
  setupIntersectionObserver() {
    this.observers.intersection = new IntersectionObserver(
      this.debounce((entries) => {
        entries.forEach(entry => this.handleIntersection(entry));
      }, this.config.debounceDelay),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );

    console.log('ViewportSync: IntersectionObserver initialized');
  }

  /**
   * Setup MutationObserver to detect new content
   */
  setupMutationObserver() {
    this.observers.mutation = new MutationObserver(
      this.debounce((mutations) => {
        mutations.forEach(mutation => this.handleMutation(mutation));
        this.flushMutationBuffer();
      }, this.config.mutationBufferTime)
    );

    this.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-aevip-id', 'data-aevip-priority']
    });

    console.log('ViewportSync: MutationObserver initialized');
  }

  /**
   * Setup ResizeObserver for adaptive loading
   */
  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.observers.resize = new ResizeObserver(
        this.debounce((entries) => {
          entries.forEach(entry => this.handleResize(entry));
        }, this.config.debounceDelay)
      );
      console.log('ViewportSync: ResizeObserver initialized');
    }
  }

  /**
   * Setup PerformanceObserver for metrics
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.observers.performance = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure' && entry.name.startsWith('aevip-')) {
              this.logPerformance(entry);
            }
          }
        });
        this.observers.performance.observe({ entryTypes: ['measure'] });
        console.log('ViewportSync: PerformanceObserver initialized');
      } catch (e) {
        console.debug('PerformanceObserver not available');
      }
    }
  }

  /**
   * Handle intersection changes
   */
  handleIntersection(entry) {
    const element = entry.target;
    const contentId = element.getAttribute('data-aevip-id');

    if (!contentId) return;

    const metadata = this.state.observedElements.get(element) || {};
    metadata.intersectionRatio = entry.intersectionRatio;
    metadata.isVisible = entry.isIntersecting;
    metadata.boundingRect = entry.boundingClientRect;

    this.state.observedElements.set(element, metadata);

    if (entry.isIntersecting) {
      // Element became visible
      this.state.visibleElements.add(element);
      this.state.stats.currentlyVisible = this.state.visibleElements.size;

      // Apply any pending updates immediately
      if (this.state.pendingUpdates.has(contentId)) {
        this.applyPendingUpdate(element, contentId);
      }

      // Trigger loaded event
      element.dispatchEvent(new CustomEvent('aevip:visible', {
        detail: { contentId, metadata }
      }));
    } else {
      // Element became invisible
      this.state.visibleElements.delete(element);
      this.state.stats.currentlyVisible = this.state.visibleElements.size;

      element.dispatchEvent(new CustomEvent('aevip:hidden', {
        detail: { contentId, metadata }
      }));
    }
  }

  /**
   * Handle DOM mutations
   */
  handleMutation(mutation) {
    this.state.mutationBuffer.push(mutation);

    // Check for new elements with data-aevip-id
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.hasAttribute('data-aevip-id')) {
        this.observeElement(node);
      }

      // Check children too
      if (node.querySelectorAll) {
        node.querySelectorAll('[data-aevip-id]').forEach(el => {
          this.observeElement(el);
        });
      }
    });

    // Handle removed elements
    mutation.removedNodes.forEach(node => {
      if (node.nodeType === 1 && this.state.observedElements.has(node)) {
        this.unobserveElement(node);
      }
    });
  }

  /**
   * Handle resize events
   */
  handleResize(entry) {
    const element = entry.target;
    const metadata = this.state.observedElements.get(element);

    if (metadata) {
      metadata.size = entry.contentRect;
      this.state.observedElements.set(element, metadata);
    }
  }

  /**
   * Flush mutation buffer
   */
  flushMutationBuffer() {
    const mutations = this.state.mutationBuffer.splice(0);

    if (mutations.length > 0) {
      console.debug(`ViewportSync: Processed ${mutations.length} mutations`);
    }
  }

  /**
   * Discover existing elements with data-aevip-id
   */
  discoverElements() {
    const elements = document.querySelectorAll('[data-aevip-id]');
    elements.forEach(el => this.observeElement(el));

    console.log(`ViewportSync: Discovered ${elements.length} elements`);
  }

  /**
   * Start observing an element
   */
  observeElement(element) {
    if (this.state.observedElements.has(element)) {
      return; // Already observing
    }

    const contentId = element.getAttribute('data-aevip-id');
    const priority = element.getAttribute('data-aevip-priority') || 'normal';

    const metadata = {
      contentId,
      priority,
      observedAt: Date.now(),
      isVisible: false,
      intersectionRatio: 0
    };

    this.state.observedElements.set(element, metadata);
    this.state.stats.totalObserved++;

    // Start observing
    this.observers.intersection.observe(element);

    if (this.observers.resize) {
      this.observers.resize.observe(element);
    }

    element.dispatchEvent(new CustomEvent('aevip:observed', {
      detail: { contentId, metadata }
    }));
  }

  /**
   * Stop observing an element
   */
  unobserveElement(element) {
    if (!this.state.observedElements.has(element)) {
      return;
    }

    this.observers.intersection.unobserve(element);

    if (this.observers.resize) {
      this.observers.resize.unobserve(element);
    }

    this.state.observedElements.delete(element);
    this.state.visibleElements.delete(element);
  }

  /**
   * Handle incoming patch from AevIP
   */
  handlePatch(patch) {
    const contentId = patch.metadata?.contentId;

    if (!contentId) {
      console.warn('Patch missing contentId', patch);
      return;
    }

    // Find all elements with this content ID
    const elements = Array.from(this.state.observedElements.entries())
      .filter(([_, meta]) => meta.contentId === contentId)
      .map(([el]) => el);

    if (elements.length === 0) {
      console.debug(`No elements for contentId: ${contentId}, queueing`);
      this.state.pendingUpdates.set(contentId, patch);
      this.state.stats.updatesDeferred++;
      return;
    }

    // Separate visible and invisible elements
    const visibleEls = elements.filter(el => this.state.visibleElements.has(el));
    const invisibleEls = elements.filter(el => !this.state.visibleElements.has(el));

    // Update visible elements immediately
    visibleEls.forEach(el => {
      this.applyPatchToElement(el, patch);
      this.state.stats.updatesApplied++;
    });

    // Queue updates for invisible elements
    if (invisibleEls.length > 0) {
      this.state.pendingUpdates.set(contentId, patch);
      this.state.stats.updatesDeferred += invisibleEls.length;
    }
  }

  /**
   * Apply pending update when element becomes visible
   */
  applyPendingUpdate(element, contentId) {
    const patch = this.state.pendingUpdates.get(contentId);

    if (!patch) return;

    this.applyPatchToElement(element, patch);

    // Check if any other elements still need this patch
    const otherElements = Array.from(this.state.observedElements.entries())
      .filter(([el, meta]) => meta.contentId === contentId && el !== element)
      .map(([el]) => el);

    const stillHasInvisible = otherElements.some(el => !this.state.visibleElements.has(el));

    if (!stillHasInvisible) {
      this.state.pendingUpdates.delete(contentId);
    }

    this.state.stats.updatesApplied++;
  }

  /**
   * Apply patch to element
   */
  applyPatchToElement(element, patch) {
    performance.mark(`aevip-${patch.id}-start`);

    try {
      // Get current content
      const contentType = element.getAttribute('data-aevip-type') || 'html';
      let currentContent = this.getElementContent(element, contentType);

      // Apply patch
      const newContent = this.protocol.applyPatch(currentContent, patch);

      // Update element
      this.setElementContent(element, newContent, contentType);

      // Mark as updated
      element.setAttribute('data-aevip-updated', Date.now());
      element.classList.add('aevip-updated');

      // Dispatch event
      element.dispatchEvent(new CustomEvent('aevip:updated', {
        detail: { patch, content: newContent }
      }));

      performance.mark(`aevip-${patch.id}-end`);
      performance.measure(`aevip-${patch.id}`, `aevip-${patch.id}-start`, `aevip-${patch.id}-end`);

    } catch (error) {
      console.error('Error applying patch', error, patch);
      element.classList.add('aevip-error');

      element.dispatchEvent(new CustomEvent('aevip:error', {
        detail: { error, patch }
      }));
    }
  }

  /**
   * Get element content based on type
   */
  getElementContent(element, type) {
    switch (type) {
      case 'html':
        return { html: element.innerHTML };
      case 'text':
        return { text: element.textContent };
      case 'json':
        try {
          return JSON.parse(element.textContent || '{}');
        } catch {
          return {};
        }
      default:
        return { content: element.innerHTML };
    }
  }

  /**
   * Set element content based on type
   */
  setElementContent(element, content, type) {
    switch (type) {
      case 'html':
        element.innerHTML = content.html || content.content || '';
        this.executeScripts(element);
        break;
      case 'text':
        element.textContent = content.text || content.content || '';
        break;
      case 'json':
        element.textContent = JSON.stringify(content, null, 2);
        break;
      default:
        element.innerHTML = content.content || content.html || '';
    }
  }

  /**
   * Execute scripts in updated content
   */
  executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Log performance metrics
   */
  logPerformance(entry) {
    console.debug(`AevIP Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.state.stats,
      pendingUpdates: this.state.pendingUpdates.size,
      observedElements: this.state.observedElements.size
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    Object.values(this.observers).forEach(observer => {
      if (observer) observer.disconnect();
    });

    this.state.observedElements.clear();
    this.state.visibleElements.clear();
    this.state.pendingUpdates.clear();
  }
}
