/**
 * DOM Manipulation Optimization Module
 * Provides efficient DOM querying, batch operations, and memory management
 */

class DOMManager {
  constructor() {
    this.elementCache = new WeakMap();
    this.observers = new Map();
    this.eventListeners = new Map();
    this.batchQueue = [];
    this.isBatching = false;
    this.selector = Utils.createSelector(this.elementCache);
  }

  /**
   * Get element (with caching)
   */
  get(selector, context = document) {
    return this.selector(selector, context);
  }

  /**
   * Get multiple elements
   */
  getAll(selector, context = document) {
    const elements = context.querySelectorAll(selector);
    return Array.from(elements);
  }

  /**
   * Batch get elements
   */
  getBatch(selectors, context = document) {
    const result = {};
    selectors.forEach(selector => {
      result[selector] = this.get(selector, context);
    });
    return result;
  }

  /**
   * Create element (optimized)
   */
  create(tagName, attributes = {}, children = []) {
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key.startsWith('data-')) {
        element.dataset[key.slice(5)] = value;
      } else if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        this.on(element, eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add child elements
    children.forEach(child => {
      if (typeof child === 'string') {
        element.insertAdjacentHTML('beforeend', child);
      } else if (child instanceof Element) {
        element.appendChild(child);
      }
    });
    
    return element;
  }

  /**
   * Batch DOM operations
   */
  batch(operations) {
    this.batchQueue.push(...operations);
    
    if (!this.isBatching) {
      this.isBatching = true;
      requestAnimationFrame(() => {
        this.processBatch();
      });
    }
  }

  /**
   * Process batch operations
   */
  processBatch() {
    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.isBatching = false;
    
    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    const operationsToExecute = [];
    
    operations.forEach(operation => {
      if (typeof operation === 'function') {
        if (operation.type === 'append') {
          fragment.appendChild(operation.element);
        } else {
          operationsToExecute.push(operation);
        }
      }
    });
    
    // Execute non-DOM operations
    operationsToExecute.forEach(operation => {
      try {
        operation();
      } catch (error) {
        console.error('Batch operation error:', error);
      }
    });
    
    // Batch insert into DOM
    if (fragment.childNodes.length > 0) {
      const firstChild = fragment.firstChild;
      if (firstChild.parentNode) {
        firstChild.parentNode.appendChild(fragment);
      }
    }
  }

  /**
   * Show element (with transition)
   */
  show(element, options = {}) {
    const { duration = 300, easing = 'ease-out' } = options;
    
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    element.style.display = '';
    element.style.transition = `opacity ${duration}ms ${easing}`;
    element.style.opacity = '0';
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      setTimeout(() => {
        element.style.transition = '';
      }, duration);
    });
  }

  /**
   * Hide element (with transition)
   */
  hide(element, options = {}) {
    const { duration = 300, easing = 'ease-out', remove = false } = options;
    
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    element.style.transition = `opacity ${duration}ms ${easing}`;
    element.style.opacity = '1';
    
    requestAnimationFrame(() => {
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (remove) {
          element.remove();
        } else {
          element.style.display = 'none';
          element.style.transition = '';
        }
      }, duration);
    });
  }

  /**
   * Toggle class (optimized)
   */
  toggleClass(element, className, force) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    if (force !== undefined) {
      element.classList.toggle(className, force);
    } else {
      element.classList.toggle(className);
    }
  }

  /**
   * Add class name
   */
  addClass(element, className) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    if (typeof className === 'string') {
      element.classList.add(className);
    } else if (Array.isArray(className)) {
      element.classList.add(...className);
    }
  }

  /**
   * Remove class name
   */
  removeClass(element, className) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    if (typeof className === 'string') {
      element.classList.remove(className);
    } else if (Array.isArray(className)) {
      element.classList.remove(...className);
    }
  }

  /**
   * Event listening (with memory management)
   */
  on(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    const { capture = false, once = false, passive = false } = options;
    
    // Create event key
    const eventKey = `${event}_${element.tagName}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store event listener
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    this.eventListeners.get(element).set(eventKey, { event, handler, options });
    
    // Add event listener
    element.addEventListener(event, handler, { capture, once, passive });
    
    return eventKey; // Return key for removal
  }

  /**
   * Remove event listener
   */
  off(element, eventKey) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element || !this.eventListeners.has(element)) return;
    
    const elementListeners = this.eventListeners.get(element);
    const listener = elementListeners.get(eventKey);
    
    if (listener) {
      element.removeEventListener(listener.event, listener.handler, listener.options);
      elementListeners.delete(eventKey);
    }
  }

  /**
   * Delegate event
   */
  delegate(element, event, selector, handler) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    const wrappedHandler = (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e);
      }
    };
    
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
  }
  off(event, handler) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(handler);
  }
  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    for (const h of this.listeners.get(event)) {
      try { h(payload); } catch(e) {}
    }
  }
}

if (typeof window !== 'undefined') {
  window.DOMManager = DOMManager;
  window.EventBus = EventBus;
}
    return this.on(element, event, wrappedHandler);
  }

  /**
   * One-time event
   */
  once(element, event, handler, options = {}) {
    return this.on(element, event, handler, { ...options, once: true });
  }

  /**
   * Trigger event
   */
  trigger(element, event, detail = null) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    const customEvent = new CustomEvent(event, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    element.dispatchEvent(customEvent);
  }

  /**
   * Observe element changes
   */
  observe(element, callback, options = {}) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    const { childList = true, attributes = true, subtree = false } = options;
    
    const observer = new MutationObserver(callback);
    observer.observe(element, { childList, attributes, subtree });
    
    const observerId = Utils.generateId('observer');
    this.observers.set(observerId, observer);
    
    return observerId;
  }

  /**
   * Stop observation
   */
  unobserve(observerId) {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(observerId);
    }
  }

  /**
   * Get element position info
   */
  getRect(element) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return null;
    
    return element.getBoundingClientRect();
  }

  /**
   * Check if element is in viewport
   */
  isInViewport(element, threshold = 0) {
    const rect = this.getRect(element);
    if (!rect) return false;
    
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
    );
  }

  /**
   * Scroll to element
   */
  scrollTo(element, options = {}) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    const { behavior = 'smooth', block = 'start', inline = 'nearest' } = options;
    
    element.scrollIntoView({ behavior, block, inline });
  }

  /**
   * Set element attributes
   */
  setAttributes(element, attributes) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    });
  }

  /**
   * Get element attributes
   */
  getAttributes(element, attributes) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return {};
    
    const result = {};
    attributes.forEach(attr => {
      result[attr] = element.getAttribute(attr);
    });
    
    return result;
  }

  /**
   * Cleanup memory
   */
  cleanup(element) {
    if (typeof element === 'string') {
      element = this.get(element);
    }
    
    if (!element) return;
    
    // Remove event listeners
    if (this.eventListeners.has(element)) {
      const listeners = this.eventListeners.get(element);
      listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this.eventListeners.delete(element);
    }
    
    // Stop observers
    this.observers.forEach((observer, id) => {
      if (observer.target === element) {
        observer.disconnect();
        this.observers.delete(id);
      }
    });
    
    // Clear cache
    if (this.elementCache.has(element)) {
      this.elementCache.delete(element);
    }
    
    // Recursively cleanup child elements
    const children = Array.from(element.children);
    children.forEach(child => this.cleanup(child));
  }

  /**
   * Destroy manager
   */
  destroy() {
    // Clear all event listeners
    this.eventListeners.forEach((listeners, element) => {
      this.cleanup(element);
    });
    
    // Stop all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear cache
    this.elementCache = new WeakMap();
    this.eventListeners.clear();
  }
}

// Create global DOM manager instance
const dom = new DOMManager();

// Export DOM manager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMManager, dom };
} else if (typeof window !== 'undefined') {
  window.DOMManager = DOMManager;
  window.dom = dom;
}
