/**
 * ============================================================================
 * CAPTCHA Shield v3.0 — Embeddable Widget
 * ============================================================================
 *
 * A self-contained, production-ready CAPTCHA widget that any website can embed
 * with a single <script> tag. Uses an iframe for full React app isolation and
 * communicates with the host page via postMessage.
 *
 * Usage:
 *   <div id="captcha-shield"></div>
 *   <script src="https://smouj.github.io/captcha-shield/widget.js"></script>
 *
 * Configuration (place BEFORE the script tag):
 *   <script>
 *     window.CaptchaShieldConfig = {
 *       theme: 'dark',           // 'dark' | 'light'
 *       primaryColor: '#10b981', // Any valid CSS color
 *       language: 'es',          // 'es' | 'en' | 'pt' | ...
 *       size: 'normal',          // 'compact' | 'normal' | 'large'
 *       borderRadius: '16px',    // Any valid CSS border-radius
 *       siteKey: '',             // Optional site key for analytics
 *       onError: function(err) {},
 *       onLoad: function() {},
 *     };
 *   </script>
 *
 * Callback:
 *   window.onCaptchaVerified = function(response) {
 *     // response = { success, riskScore, riskLevel, token }
 *   };
 *
 * Events:
 *   window.CaptchaShield.on('ready')       — Widget iframe loaded
 *   window.CaptchaShield.on('verified')    — User passed verification
 *   window.CaptchaShield.on('failed')      — Verification failed
 *   window.CaptchaShield.on('expired')     — Session expired
 *   window.CaptchaShield.on('resize')      — Widget resized
 *
 * ============================================================================
 * © 2025 CAPTCHA Shield. MIT License.
 * ============================================================================
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONSTANTS & VERSION
  // ---------------------------------------------------------------------------

  var VERSION = '3.1.0';
  var WIDGET_BASE_URL = 'https://smouj.github.io/captcha-shield';
  var ALLOWED_ORIGIN = 'https://smouj.github.io';
  var DEFAULT_IFRAME_HEIGHT = 420; // px — initial height before auto-resize
  var RETRY_MAX_ATTEMPTS = 3;
  var RETRY_BASE_DELAY = 1500; // ms
  var LOAD_TIMEOUT = 15000;    // ms — max wait for iframe to signal ready
  var RESIZE_DEBOUNCE = 100;   // ms — debounce resize events
  var NAMESPACE = 'captcha-shield';

  // Size presets mapping
  var SIZE_PRESETS = {
    compact:  { width: '320px', minHeight: 340, scale: 0.85 },
    normal:   { width: '400px', minHeight: 420, scale: 1.0  },
    large:    { width: '480px', minHeight: 500, scale: 1.1  },
  };

  // ---------------------------------------------------------------------------
  // 2. UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * Generate a UUID v4-like identifier (client-side, no crypto dependency).
   * Falls back to Math.random if crypto.randomUUID is unavailable.
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // RFC-4122 v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Simple deep merge for plain objects. Only merges own enumerable properties.
   */
  function mergeDefaults(target, source) {
    for (var key in source) {
      if (!source.hasOwnProperty(key)) continue;
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        mergeDefaults(target[key], source[key]);
      } else if (target[key] === undefined) {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Console logger scoped to CAPTCHA Shield.
   * Prefixes all messages for easy identification and filtering.
   */
  var Logger = {
    _enabled: true,

    _format: function (level, args) {
      var prefix = '%c[CAPTCHA Shield]%c';
      var styles = [
        'color:#10b981;font-weight:bold;font-size:11px;',
        'color:inherit;',
      ];
      return { prefix: prefix, styles: styles, level: level };
    },

    info: function () {
      if (!this._enabled) return;
      var f = this._format('info', arguments);
      var args = Array.prototype.slice.call(arguments);
      console.log.apply(console, [f.prefix].concat(f.styles, args));
    },

    warn: function () {
      if (!this._enabled) return;
      var f = this._format('warn', arguments);
      var args = Array.prototype.slice.call(arguments);
      console.warn.apply(console, [f.prefix].concat(f.styles, args));
    },

    error: function () {
      var f = this._format('error', arguments);
      var args = Array.prototype.slice.call(arguments);
      console.error.apply(console, [f.prefix].concat(f.styles, args));
    },

    debug: function () {
      if (!this._enabled) return;
      var f = this._format('debug', arguments);
      var args = Array.prototype.slice.call(arguments);
      // debug only in dev
      if (window.location && window.location.hostname === 'localhost') {
        console.log.apply(console, [f.prefix].concat(f.styles, args));
      }
    },
  };

  // ---------------------------------------------------------------------------
  // 3. CONFIGURATION
  // ---------------------------------------------------------------------------

  /**
   * Default configuration. Merged with user-provided `window.CaptchaShieldConfig`.
   */
  var CONFIG = {
    theme: 'dark',
    primaryColor: '#10b981',
    language: 'es',
    size: 'normal',
    borderRadius: '16px',
    containerId: 'captcha-shield',
    siteKey: '',
    onLoad: null,
    onError: null,
    // Advanced / internal
    _debug: false,
    _retryAttempts: RETRY_MAX_ATTEMPTS,
    _loadTimeout: LOAD_TIMEOUT,
  };

  // Merge user config
  if (window.CaptchaShieldConfig && typeof window.CaptchaShieldConfig === 'object') {
    mergeDefaults(CONFIG, window.CaptchaShieldConfig);
  }

  // Freeze config after merge
  var _config = {};
  for (var k in CONFIG) {
    if (CONFIG.hasOwnProperty(k)) _config[k] = CONFIG[k];
  }
  CONFIG = _config;

  // ---------------------------------------------------------------------------
  // 4. EVENT EMITTER (lightweight, for widget lifecycle events)
  // ---------------------------------------------------------------------------

  function createEventEmitter() {
    var listeners = {};

    return {
      on: function (event, fn) {
        if (typeof fn !== 'function') {
          Logger.warn('on() listener must be a function for event "' + event + '"');
          return this;
        }
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
        return this;
      },

      off: function (event, fn) {
        if (!listeners[event]) return this;
        if (!fn) {
          delete listeners[event];
        } else {
          listeners[event] = listeners[event].filter(function (l) { return l !== fn; });
        }
        return this;
      },

      emit: function (event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var fns = listeners[event];
        if (!fns || fns.length === 0) return;
        for (var i = 0; i < fns.length; i++) {
          try {
            fns[i].apply(null, args);
          } catch (err) {
            Logger.error('Error in event listener for "' + event + '":', err);
          }
        }
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 5. WIDGET CLASS
  // ---------------------------------------------------------------------------

  /**
   * CaptchaShield — encapsulates all widget logic.
   * Creates an iframe inside a Shadow DOM host, manages lifecycle, and
   * handles postMessage communication with the embedded CAPTCHA application.
   */
  function CaptchaShield(config) {
    this.config = config;
    this.events = createEventEmitter();
    this.sessionId = generateId();
    this.instanceId = generateId();
    this.iframe = null;
    this.container = null;
    this.shadowRoot = null;
    this.ready = false;
    this.loadTimeoutId = null;
    this.resizeTimeoutId = null;
    this.retryCount = 0;
    this.destroyed = false;

    Logger.info('v' + VERSION + ' initializing... (session: ' + this.sessionId.substring(0, 8) + ')');
  }

  // ---- Lifecycle ----

  /**
   * Mount the widget into the DOM. Finds or creates the container, sets up
   * the Shadow DOM, creates the iframe, and begins listening for messages.
   */
  CaptchaShield.prototype.mount = function () {
    if (this.destroyed) {
      Logger.error('Cannot mount: widget instance has been destroyed.');
      return;
    }

    // 1. Locate or create container
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      Logger.error(
        'Container element #' + this.config.containerId + ' not found. ' +
        'Please add <div id="' + this.config.containerId + '"></div> to your page.'
      );
      this._handleError('CONTAINER_NOT_FOUND', 'Container element not found');
      return;
    }

    // 2. Create Shadow DOM for style isolation
    try {
      this.shadowRoot = this.container.attachShadow
        ? this.container.attachShadow({ mode: 'open' })
        : this.container; // Fallback: no Shadow DOM
    } catch (e) {
      Logger.warn('Shadow DOM not supported, falling back to direct DOM insertion.');
      this.shadowRoot = this.container;
    }

    // 3. Build and insert iframe
    this._createIframe();

    // 4. Start listening for postMessage
    this._bindMessageListener();

    // 5. Start load timeout
    this._startLoadTimeout();

    Logger.info('Widget mounted in #' + this.config.containerId);
  };

  /**
   * Create the iframe element, apply styles, and append it to the Shadow DOM.
   */
  CaptchaShield.prototype._createIframe = function () {
    var self = this;
    var preset = SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal;

    // Build query string
    var params = {
      theme: this.config.theme,
      color: this.config.primaryColor,
      lang: this.config.language,
      size: this.config.size,
      radius: this.config.borderRadius,
      sessionId: this.sessionId,
      instanceId: this.instanceId,
      v: VERSION,
    };

    if (this.config.siteKey) {
      params.siteKey = this.config.siteKey;
    }

    var queryString = Object.keys(params)
      .map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&');

    var iframeSrc = WIDGET_BASE_URL + '/widget-embed?' + queryString;

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', iframeSrc);
    iframe.setAttribute('id', NAMESPACE + '-iframe-' + this.instanceId.substring(0, 8));
    iframe.setAttribute('title', 'CAPTCHA Shield Verification');
    iframe.setAttribute('role', 'presentation');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; autoplay');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('loading', 'eager');

    // Style iframe for seamless integration
    iframe.style.cssText = [
      'border: none',
      'width: 100%',
      'max-width: ' + preset.width,
      'min-height: ' + preset.minHeight + 'px',
      'height: ' + DEFAULT_IFRAME_HEIGHT + 'px',
      'border-radius: ' + this.config.borderRadius,
      'overflow: hidden',
      'display: block',
      'background: transparent',
      'transition: height 0.3s ease',
      'box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)',
    ].join('; ');

    // Set ARIA attributes
    iframe.setAttribute('aria-label', 'CAPTCHA verification widget');
    iframe.setAttribute('aria-live', 'polite');

    this.iframe = iframe;

    // Insert into Shadow DOM
    this.shadowRoot.appendChild(iframe);

    // Handle iframe load/error events
    iframe.addEventListener('load', function () {
      Logger.info('Iframe loaded successfully');
    });

    iframe.addEventListener('error', function () {
      Logger.error('Iframe failed to load');
      self._handleError('IFRAME_LOAD_FAILED', 'Failed to load CAPTCHA widget iframe');
      self._retryLoad();
    });
  };

  /**
   * Bind the global message event listener to receive postMessage from the
   * embedded widget iframe.
   */
  CaptchaShield.prototype._bindMessageListener = function () {
    var self = this;
    this._messageHandler = function (event) {
      // Strict origin check — only accept messages from our widget origin
      if (event.origin !== ALLOWED_ORIGIN) {
        return;
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      var data = event.data;

      // Verify the message is intended for this widget instance
      if (data.instanceId && data.instanceId !== self.instanceId) {
        return; // Message for a different widget instance
      }

      switch (data.type) {
        case 'captcha-shield-ready':
          self._onReady(data);
          break;

        case 'captcha-shield-verified':
          self._onVerified(data);
          break;

        case 'captcha-shield-failed':
          self._onFailed(data);
          break;

        case 'captcha-shield-resize':
          self._onResize(data);
          break;

        case 'captcha-shield-expired':
          self._onExpired(data);
          break;

        case 'captcha-shield-error':
          self._handleError(data.code || 'WIDGET_ERROR', data.message || 'Unknown widget error');
          break;

        default:
          // Ignore unknown message types
          break;
      }
    };

    window.addEventListener('message', this._messageHandler);
    Logger.debug('Message listener bound');
  };

  // ---- Message Handlers ----

  /**
   * Called when the embedded widget signals it is ready.
   */
  CaptchaShield.prototype._onReady = function (data) {
    if (this.ready) return; // Already ready

    this.ready = true;
    this._clearLoadTimeout();

    Logger.info('Widget ready');

    // Apply initial resize if height provided
    if (data && typeof data.height === 'number') {
      this._resizeIframe(data.height);
    }

    // Fire onLoad callback
    if (typeof this.config.onLoad === 'function') {
      try {
        this.config.onLoad();
      } catch (e) {
        Logger.error('onLoad callback error:', e);
      }
    }

    // Emit ready event
    this.events.emit('ready');
  };

  /**
   * Called when the user successfully passes the CAPTCHA verification.
   * Fires the global callback and emits the verified event.
   */
  CaptchaShield.prototype._onVerified = function (data) {
    var payload = data.payload || {};
    var response = {
      success: true,
      riskScore: typeof payload.riskScore === 'number' ? payload.riskScore : 0,
      riskLevel: payload.riskLevel || 'low',
      token: payload.token || generateId(),
      challengeType: payload.challengeType || null,
      timeTaken: payload.timeTaken || null,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    Logger.info('Verification passed — risk: ' + (response.riskScore * 100).toFixed(1) + '% (' + response.riskLevel + ')');

    // Fire global callback
    if (typeof window.onCaptchaVerified === 'function') {
      try {
        window.onCaptchaVerified(response);
      } catch (e) {
        Logger.error('onCaptchaVerified callback error:', e);
      }
    }

    // Emit verified event
    this.events.emit('verified', response);
  };

  /**
   * Called when the user fails verification.
   */
  CaptchaShield.prototype._onFailed = function (data) {
    var payload = data.payload || {};
    Logger.warn('Verification failed' + (payload.message ? ': ' + payload.message : ''));

    this.events.emit('failed', {
      success: false,
      message: payload.message || 'Verification failed',
      riskScore: payload.riskScore || 1,
      riskLevel: payload.riskLevel || 'high',
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  };

  /**
   * Called when the widget requests a resize. Applies the new height to
   * the iframe with debouncing for smooth transitions.
   */
  CaptchaShield.prototype._onResize = function (data) {
    if (typeof data.height !== 'number' || data.height <= 0) return;

    var self = this;
    var newHeight = Math.max(100, Math.round(data.height)); // Clamp minimum height

    // Debounce rapid resize requests
    clearTimeout(this.resizeTimeoutId);
    this.resizeTimeoutId = setTimeout(function () {
      self._resizeIframe(newHeight);
      self.events.emit('resize', { height: newHeight });
    }, RESIZE_DEBOUNCE);
  };

  /**
   * Called when the CAPTCHA session expires.
   */
  CaptchaShield.prototype._onExpired = function () {
    Logger.warn('CAPTCHA session expired');
    this.events.emit('expired', { sessionId: this.sessionId });
  };

  // ---- Iframe Management ----

  /**
   * Apply a new height to the iframe with smooth transition.
   */
  CaptchaShield.prototype._resizeIframe = function (height) {
    if (!this.iframe) return;

    var minHeight = (SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal).minHeight;
    var finalHeight = Math.max(minHeight, height);

    this.iframe.style.height = finalHeight + 'px';
    Logger.debug('Resized to ' + finalHeight + 'px');
  };

  /**
   * Start the load timeout. If the iframe doesn't signal readiness within
   * the configured timeout, an error is raised and retry is attempted.
   */
  CaptchaShield.prototype._startLoadTimeout = function () {
    var self = this;

    if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);

    this.loadTimeoutId = setTimeout(function () {
      if (self.ready || self.destroyed) return;

      Logger.warn('Widget load timed out after ' + self.config._loadTimeout + 'ms');
      self._handleError('LOAD_TIMEOUT', 'CAPTCHA widget failed to load within ' + self.config._loadTimeout + 'ms');
      self._retryLoad();
    }, this.config._loadTimeout);
  };

  /**
   * Clear the load timeout.
   */
  CaptchaShield.prototype._clearLoadTimeout = function () {
    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = null;
    }
  };

  /**
   * Retry loading the iframe with exponential backoff.
   */
  CaptchaShield.prototype._retryLoad = function () {
    if (this.destroyed) return;

    this.retryCount++;

    if (this.retryCount > this.config._retryAttempts) {
      Logger.error('Max retry attempts (' + this.config._retryAttempts + ') exceeded');
      this._handleError('MAX_RETRIES', 'CAPTCHA widget failed to load after ' + this.config._retryAttempts + ' retry attempts');
      this._showFallback();
      return;
    }

    var delay = RETRY_BASE_DELAY * Math.pow(2, this.retryCount - 1);
    var self = this;

    Logger.info('Retrying load (attempt ' + this.retryCount + '/' + this.config._retryAttempts + ') in ' + delay + 'ms...');

    setTimeout(function () {
      if (self.destroyed) return;

      // Remove old iframe
      if (self.iframe && self.iframe.parentNode) {
        self.iframe.parentNode.removeChild(self.iframe);
      }

      // Reset state
      self.ready = false;

      // Create fresh iframe
      self._createIframe();
      self._startLoadTimeout();
    }, delay);
  };

  /**
   * Show a fallback UI when the widget fails to load after all retries.
   * This ensures the page remains functional even if the widget CDN is down.
   */
  CaptchaShield.prototype._showFallback = function () {
    if (!this.shadowRoot) return;

    var theme = this.config.theme;
    var isDark = theme === 'dark';

    // Create fallback container
    var fallback = document.createElement('div');
    fallback.setAttribute('role', 'alert');
    fallback.style.cssText = [
      'width: 100%',
      'max-width: ' + (SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal).width,
      'min-height: 200px',
      'border-radius: ' + this.config.borderRadius,
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'justify-content: center',
      'gap: 12px',
      'padding: 24px',
      'box-sizing: border-box',
      'text-align: center',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'background: ' + (isDark ? '#1f2937' : '#f9fafb'),
      'border: 1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
      'color: ' + (isDark ? '#9ca3af' : '#6b7280'),
    ].join('; ');

    // Shield icon (inline SVG)
    fallback.innerHTML = [
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="' + (isDark ? '#6b7280' : '#9ca3af') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      '</svg>',
      '<p style="font-size:14px;font-weight:500;margin:0;">Verification Unavailable</p>',
      '<p style="font-size:12px;margin:0;opacity:0.7;">The CAPTCHA widget could not be loaded. Please refresh the page or try again later.</p>',
      '<button onclick="window.location.reload()" style="' + [
        'margin-top:8px',
        'padding:8px 20px',
        'font-size:13px',
        'font-weight:500',
        'border:none',
        'border-radius:8px',
        'cursor:pointer',
        'color:#fff',
        'background:' + this.config.primaryColor,
        'transition:opacity 0.2s',
      ].join(';') + '" onmouseover="this.style.opacity=\'0.85\'" onmouseout="this.style.opacity=\'1\'">',
      '  Retry',
      '</button>',
    ].join('\n');

    // Remove any existing content in shadow root
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    this.shadowRoot.appendChild(fallback);
  };

  // ---- Error Handling ----

  /**
   * Centralized error handler. Fires the user's onError callback and emits
   * an error event.
   */
  CaptchaShield.prototype._handleError = function (code, message) {
    var error = {
      code: code,
      message: message,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    Logger.error('[' + code + '] ' + message);

    // Fire user callback
    if (typeof this.config.onError === 'function') {
      try {
        this.config.onError(error);
      } catch (e) {
        Logger.error('onError callback error:', e);
      }
    }

    // Emit error event
    this.events.emit('error', error);
  };

  // ---- Public API ----

  /**
   * Reset the widget — generates a new session and reloads the iframe.
   */
  CaptchaShield.prototype.reset = function () {
    if (this.destroyed) return;

    Logger.info('Resetting widget...');

    this.sessionId = generateId();
    this.ready = false;
    this.retryCount = 0;

    // Remove old iframe
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    // Re-mount
    this._createIframe();
    this._startLoadTimeout();

    this.events.emit('reset', { sessionId: this.sessionId });
  };

  /**
   * Programmatically verify the widget token on your server.
   * This is a convenience method — actual verification logic should be
   * implemented by the host site.
   */
  CaptchaShield.prototype.getToken = function () {
    return {
      sessionId: this.sessionId,
      instanceId: this.instanceId,
      ready: this.ready,
      version: VERSION,
    };
  };

  /**
   * Destroy the widget instance — cleans up all resources, removes event
   * listeners, and removes the DOM elements.
   */
  CaptchaShield.prototype.destroy = function () {
    if (this.destroyed) return;

    Logger.info('Destroying widget...');
    this.destroyed = true;

    // Clear timers
    this._clearLoadTimeout();
    clearTimeout(this.resizeTimeoutId);

    // Remove message listener
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }

    // Remove iframe
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }

    // Clear container
    if (this.shadowRoot && this.container) {
      // If shadow DOM, remove all children
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
    }

    this.ready = false;
    this.events.emit('destroyed');
    Logger.info('Widget destroyed');
  };

  // ---------------------------------------------------------------------------
  // 6. INITIALIZATION
  // ---------------------------------------------------------------------------

  var widget = null;

  /**
   * Wait for the DOM to be ready before mounting.
   * Supports both modern browsers and legacy fallback.
   */
  function initWhenReady() {
    if (document.readyState === 'loading') {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        document.attachEvent('onreadystatechange', function () {
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
          }
        });
      }
    } else {
      // DOM already ready (script loaded with defer or at end of body)
      init();
    }
  }

  /**
   * Main initialization function.
   */
  function init() {
    try {
      widget = new CaptchaShield(CONFIG);
      widget.mount();

      // Expose global API
      window.CaptchaShield = {
        version: VERSION,
        reset: function () { return widget.reset(); },
        destroy: function () { return widget.destroy(); },
        getToken: function () { return widget.getToken(); },
        on: function (event, fn) { return widget.events.on(event, fn); },
        off: function (event, fn) { return widget.events.off(event, fn); },
        isReady: function () { return widget.ready; },
        getSessionId: function () { return widget.sessionId; },
      };

      Logger.info('Global API available as window.CaptchaShield');
    } catch (err) {
      Logger.error('Failed to initialize CAPTCHA Shield:', err);

      // Attempt to show a basic error in the container
      try {
        var container = document.getElementById(CONFIG.containerId);
        if (container) {
          var errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'padding:16px;font-family:sans-serif;font-size:13px;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;';
          errorDiv.textContent = 'CAPTCHA Shield failed to initialize. Please check your browser console for details.';
          container.appendChild(errorDiv);
        }
      } catch (e) {
        // Silent fail — don't throw on top of an already failed init
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. DOMContentLoaded POLYFILL & BOOT
  // ---------------------------------------------------------------------------

  // Prevent double initialization if script is loaded multiple times
  if (window.__captchaShieldInitialized) {
    Logger.warn('CAPTCHA Shield is already initialized. Skipping duplicate initialization.');
  } else {
    window.__captchaShieldInitialized = true;
    window.__captchaShieldVersion = VERSION;
    initWhenReady();
  }

})();
