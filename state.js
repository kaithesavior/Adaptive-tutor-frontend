/**
 * State Manager - Centralized application state management
 * Provides reactive state updates and middleware support
 */

class StateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Map();
    this.middlewares = [];
    this.batchQueue = [];
    this.isBatching = false;
    
    // Initialize default state
    this.initDefaultState();
  }

  initDefaultState() {
    this.state = {
      // Guide system state
      guide: {
        activeKey: null,
        stepIndex: 0,
        unlocked: false,
        states: [],
        pickMode: false,
        selectedInputId: null,
        uiVariant: 'inline',
        topicStats: {},
        dynamicLevel: 0
      },
      
      // Canvas state
      canvas: {
        tool: 'pen',
        color: '#1e1b16',
        size: 2,
        zoom: 1.0,
        drawing: false,
        history: [],
        redoStack: [],
        snap: null,
        askActive: false,
        selX: 0,
        selY: 0,
        selW: 0,
        selH: 0,
        draggingSel: false
      },
      
      // Chat state
      chat: {
        open: false,
        adhdMode: false,
        responseStyle: 'detailed',
        contextLen: 'medium',
        stressLevel: 4,
        fontLarge: false,
        recognizing: false
      },
      
      // UI state
      ui: {
        progress: 0,
        currentProblem: 0,
        problems: [],
        settingsOpen: false,
        activeTab: 'guide'
      }
    };
  }

  /**
   * Get state value
   */
  get(path) {
    return this.getNestedValue(this.state, path);
  }

  /**
   * Set state value
   */
  set(path, value, silent = false) {
    const oldValue = this.get(path);
    
    // Apply middleware
    let newValue = value;
    for (const middleware of this.middlewares) {
      newValue = middleware(path, newValue, oldValue, this.state);
      if (newValue === undefined) return; // Middleware blocked update
    }
    
    if (this.isBatching) {
      this.batchQueue.push({ path, value: newValue, oldValue });
      return;
    }
    
    this.setNestedValue(this.state, path, newValue);
    
    if (!silent) {
      this.notify(path, newValue, oldValue);
    }
  }

  /**
   * Batch update state
   */
  batch(updates) {
    this.isBatching = true;
    
    try {
      updates.forEach(({ path, value }) => {
        this.set(path, value, true); // Silent update
      });
      
      // Notify after applying all updates
      this.batchQueue.forEach(({ path, value, oldValue }) => {
        this.notify(path, value, oldValue);
      });
    } finally {
      this.isBatching = false;
      this.batchQueue = [];
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Add middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * Notify listeners
   */
  notify(path, newValue, oldValue) {
    // Notify specific path listeners
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error(`Error in state listener for ${path}:`, error);
        }
      });
    }
    
    // Notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error(`Error in wildcard state listener:`, error);
        }
      });
    }
  }

  /**
   * Get nested value
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  }

  /**
   * Set nested value
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Reset state
   */
  reset(path = null) {
    if (path) {
      const defaultState = {};
      this.initDefaultState();
      const defaultValue = this.getNestedValue(this.state, path);
      this.set(path, defaultValue);
    } else {
      this.initDefaultState();
      this.notify('*', this.state, null);
    }
  }

  /**
   * Get state snapshot
   */
  snapshot() {
    return Utils.deepClone(this.state);
  }

  /**
   * Restore state from snapshot
   */
  restore(snapshot) {
    this.state = Utils.deepClone(snapshot);
    this.notify('*', this.state, null);
  }
}

/**
 * Logger middleware
 */
const loggerMiddleware = (path, newValue, oldValue, state) => {
  console.log(`[State] ${path}:`, oldValue, '→', newValue);
  return newValue;
};

/**
 * Validation middleware
 */
const validationMiddleware = (path, newValue, oldValue, state) => {
  // Validate guide step index
  if (path === 'guide.stepIndex') {
    if (newValue < 0) return 0;
    
    const maxSteps = state.guide.activeKey ? 
      (window.GUIDE_TOPICS && window.GUIDE_TOPICS[state.guide.activeKey] ? 
        window.GUIDE_TOPICS[state.guide.activeKey].steps.length : 0) : 0;
    
    if (newValue >= maxSteps) return maxSteps - 1;
  }
  
  // Validate canvas zoom
  if (path === 'canvas.zoom') {
    return Math.max(CONFIG.canvas.minZoom, Math.min(CONFIG.canvas.maxZoom, newValue));
  }
  
  // Validate current problem index
  if (path === 'ui.currentProblem') {
    const maxProblems = state.ui.problems ? state.ui.problems.length : 0;
    if (newValue < 0) return 0;
    if (newValue >= maxProblems) return maxProblems - 1;
  }
  
  return newValue;
};

// Create global state manager instance
const state = new StateManager();

// Add default middleware
state.use(validationMiddleware);

// Add logger middleware in development environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  state.use(loggerMiddleware);
}

// Export state manager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StateManager, state, loggerMiddleware, validationMiddleware };
} else if (typeof window !== 'undefined') {
  window.StateManager = StateManager;
  window.state = state;
  window.loggerMiddleware = loggerMiddleware;
  window.validationMiddleware = validationMiddleware;
}
