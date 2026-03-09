/**
 * Adaptive Tutoring Application Configuration Center
 * Centralized management of all configuration items and utility functions
 */

const CONFIG = {
  // UI Configuration
  ui: {
    colors: {
      bg: '#f3f5f8',
      surface: '#ffffff',
      surface2: '#f8f9fc',
      border: '#e2e8f0',
      border2: '#dbe0ea',
      text: '#1e293b',
      text2: '#475569',
      textMuted: '#94a3b8',
      blue: '#3d6ce8',
      blueDark: '#3056bf',
      blueLight: '#eff4ff',
      red: '#ef4444',
      redLight: '#fef2f2',
      green: '#10b981',
      greenLight: '#ecfdf5',
      orange: '#f97316'
    },
    fonts: {
      primary: "'Inter', system-ui, -apple-system, sans-serif",
      mono: "'IBM Plex Mono', monospace"
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    }
  },

  // Circuit Calculation Configuration
  circuit: {
    tolerance: 0.05, // 5% relative tolerance
    absoluteTolerance: 0.005, // Absolute tolerance
    defaultValues: {
      R1: 20,
      R2: 30,
      R3: 50,
      R4: 20,
      V: 10
    }
  },

  // Guide System Configuration
  guide: {
    dynamicLevels: 4, // 0-3 dynamic difficulty levels
    variants: ['inline', 'popup'],
    defaultVariant: 'inline'
  },

  // Canvas Configuration
  canvas: {
    minZoom: 0.5,
    maxZoom: 3.0,
    zoomStep: 0.1,
    defaultZoom: 1.0,
    tools: ['pen', 'rect', 'circle', 'line', 'text', 'eraser', 'select', 'ask'],
    defaultTool: 'pen',
    colors: ['#1e1b16', '#ef4444', '#10b981', '#3d6ce8', '#f97316', '#8b5cf6'],
    defaultColor: '#1e1b16',
    defaultSize: 2
  },

  // Chat Configuration
  chat: {
    responseStyles: ['concise', 'detailed', 'socratic'],
    defaultStyle: 'detailed',
    contextLengths: ['short', 'medium', 'long'],
    defaultContext: 'medium',
    interactionModes: ['reactive', 'balanced', 'proactive'],
    defaultMode: 'balanced'
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    maxHistoryLength: 50,
    batchUpdateDelay: 16 // ~60fps
  }
};

/**
 * Utility Functions Collection
 */
const Utils = {
  // Debounce function
  debounce(func, wait = CONFIG.performance.debounceDelay) {
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

  // Throttle function
  throttle(func, limit = CONFIG.performance.throttleDelay) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Value validation (with tolerance)
  withinTolerance(value, target, tolerance = CONFIG.circuit.tolerance) {
    if (typeof value !== 'number' || typeof target !== 'number') return false;
    const relativeError = Math.abs(value - target) / Math.abs(target);
    const absoluteError = Math.abs(value - target);
    return relativeError <= tolerance || absoluteError <= CONFIG.circuit.absoluteTolerance;
  },

  // Deep clone
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = Utils.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  },

  // Safe JSON parse
  safeJSONParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return defaultValue;
    }
  },

  // Format number
  formatNumber(num, decimals = 3) {
    if (typeof num !== 'number') return num;
    return parseFloat(num.toFixed(decimals));
  },

  // Generate unique ID
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // DOM cache selector
  createSelector(cache = new WeakMap()) {
    return function(selector, context = document) {
      if (cache.has(context) && cache.get(context).has(selector)) {
        return cache.get(context).get(selector);
      }
      
      const element = context.querySelector(selector);
      if (element) {
        if (!cache.has(context)) {
          cache.set(context, new Map());
        }
        cache.get(context).set(selector, element);
      }
      return element;
    };
  },

  // Batch DOM operations
  batchDOM(operations) {
    requestAnimationFrame(() => {
      operations.forEach(op => op());
    });
  },

  // Performance monitoring
  measurePerformance(name, fn) {
    return function(...args) {
      const start = performance.now();
      const result = fn.apply(this, args);
      const end = performance.now();
      console.log(`${name} took ${Utils.formatNumber(end - start)}ms`);
      return result;
    };
  },

  // Event delegation
  delegateEvent(element, eventType, selector, handler) {
    element.addEventListener(eventType, (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e);
      }
    });
  },

  // Memory cleanup
  cleanup(element) {
    if (!element) return;
    
    // Clean up event listeners
    element.replaceWith(element.cloneNode(true));
    
    // Clean up cache
    if (element._cache) {
      element._cache.clear();
      delete element._cache;
    }
  }
};

// Export configuration and utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, Utils };
} else if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.Utils = Utils;
}
