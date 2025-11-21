(function(window, document) {
  'use strict';

  const CMSClient = {
    config: {
      apiEndpoint: window.CMS_API_ENDPOINT || 'http://localhost:8080',
      storageKey: 'cms_cache',
      cacheDuration: 300000,
      observerThreshold: 0.1,
      debounceDelay: 150
    },

    cache: new Map(),
    observers: new Map(),
    loadedComponents: new Set(),

    init(config = {}) {
      Object.assign(this.config, config);
      this.loadCache();
      this.setupObservers();
      this.discoverComponents();
      return this;
    },

    loadCache() {
      try {
        const cached = localStorage.getItem(this.config.storageKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < this.config.cacheDuration) {
            this.cache = new Map(Object.entries(data.content));
          }
        }
      } catch (e) {
        console.warn('CMS: Cache load failed', e);
      }
    },

    saveCache() {
      try {
        const data = {
          timestamp: Date.now(),
          content: Object.fromEntries(this.cache)
        };
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('CMS: Cache save failed', e);
      }
    },

    setupObservers() {
      const intersectionObserver = new IntersectionObserver(
        this.debounce((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadComponent(entry.target);
            }
          });
        }, this.config.debounceDelay),
        { threshold: this.config.observerThreshold }
      );

      this.observers.set('intersection', intersectionObserver);

      if ('MutationObserver' in window) {
        const mutationObserver = new MutationObserver(
          this.debounce((mutations) => {
            mutations.forEach(mutation => {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.hasAttribute('data-cms-content')) {
                  this.observers.get('intersection').observe(node);
                }
              });
            });
          }, this.config.debounceDelay)
        );

        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });

        this.observers.set('mutation', mutationObserver);
      }

      if ('PerformanceObserver' in window) {
        try {
          const perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'measure' && entry.name.startsWith('cms-')) {
                console.debug(`CMS Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
              }
            }
          });
          perfObserver.observe({ entryTypes: ['measure'] });
          this.observers.set('performance', perfObserver);
        } catch (e) {
          console.debug('Performance observer not available');
        }
      }
    },

    discoverComponents() {
      const components = document.querySelectorAll('[data-cms-content]');
      components.forEach(el => {
        this.observers.get('intersection').observe(el);
      });
    },

    async loadComponent(element) {
      const contentId = element.getAttribute('data-cms-content');
      const contentType = element.getAttribute('data-cms-type') || 'html';

      if (this.loadedComponents.has(contentId)) return;

      performance.mark(`cms-${contentId}-start`);

      try {
        const content = await this.fetchContent(contentId);
        
        if (content) {
          this.renderContent(element, content, contentType);
          this.loadedComponents.add(contentId);
          element.classList.add('cms-loaded');
          element.dispatchEvent(new CustomEvent('cms:loaded', { 
            detail: { contentId, content } 
          }));
        }
      } catch (error) {
        console.error(`CMS: Failed to load ${contentId}`, error);
        element.classList.add('cms-error');
        this.renderError(element, error);
      } finally {
        performance.mark(`cms-${contentId}-end`);
        performance.measure(`cms-${contentId}`, `cms-${contentId}-start`, `cms-${contentId}-end`);
      }
    },

    async fetchContent(contentId) {
      if (this.cache.has(contentId)) {
        return this.cache.get(contentId);
      }

      const response = await fetch(`${this.config.apiEndpoint}/content/${contentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CMS-Client': 'embeddable'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.json();
      this.cache.set(contentId, content);
      this.saveCache();

      return content;
    },

    renderContent(element, content, type) {
      switch(type) {
        case 'html':
          element.innerHTML = content.html || content.body || '';
          this.executeScripts(element);
          break;
        case 'text':
          element.textContent = content.text || content.body || '';
          break;
        case 'json':
          this.renderJSON(element, content);
          break;
        case 'markdown':
          element.innerHTML = this.parseMarkdown(content.markdown || content.body || '');
          break;
        default:
          element.innerHTML = content.body || '';
      }

      if (content.css) {
        this.injectStyles(content.css, contentId);
      }
    },

    executeScripts(container) {
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    },

    injectStyles(css, id) {
      if (!document.getElementById(`cms-style-${id}`)) {
        const style = document.createElement('style');
        style.id = `cms-style-${id}`;
        style.textContent = css;
        document.head.appendChild(style);
      }
    },

    parseMarkdown(md) {
      return md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n/gim, '<br>');
    },

    renderJSON(element, data) {
      const template = element.getAttribute('data-cms-template');
      if (template && window[template]) {
        element.innerHTML = window[template](data);
      } else {
        element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      }
    },

    renderError(element, error) {
      const showErrors = element.getAttribute('data-cms-show-errors') !== 'false';
      if (showErrors) {
        element.innerHTML = `<div class="cms-error-message">Failed to load content: ${error.message}</div>`;
      }
    },

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
    },

    refresh(contentId = null) {
      if (contentId) {
        this.cache.delete(contentId);
        this.loadedComponents.delete(contentId);
        const elements = document.querySelectorAll(`[data-cms-content="${contentId}"]`);
        elements.forEach(el => {
          el.classList.remove('cms-loaded', 'cms-error');
          this.loadComponent(el);
        });
      } else {
        this.cache.clear();
        this.loadedComponents.clear();
        this.saveCache();
        this.discoverComponents();
      }
    },

    destroy() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
      this.cache.clear();
      this.loadedComponents.clear();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMSClient;
  } else {
    window.CMSClient = CMSClient;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CMSClient.init());
    } else {
      CMSClient.init();
    }
  }

})(window, document);