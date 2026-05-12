/**
 * ============================================================================
 * CAPTCHA Shield v4.0 "Fortress" — Embeddable Widget Script
 * ============================================================================
 * Self-contained IIFE with zero dependencies. Creates an iframe inside a
 * Shadow DOM for style isolation and communicates via postMessage.
 *
 * Usage:
 *   <div id="captcha-shield"></div>
 *   <script>
 *     window.CaptchaShieldConfig = {
 *       mode: 'fortress',        // 'light' | 'fortress' | 'hybrid'
 *       serverVerifyUrl: '',     // Server URL for hybrid mode
 *       maxAttempts: 2,
 *       language: 'auto',        // 'auto' | language code
 *       theme: 'auto',           // 'light' | 'dark' | 'auto'
 *       size: 'normal',          // 'micro' | 'compact' | 'normal' | 'full'
 *       accentColor: '#10b981',
 *       borderRadius: 12,
 *       showRiskMeter: true,
 *       accessibilityMode: false,
 *       container: '#captcha-shield'
 *     };
 *   </script>
 *   <script src="/widget.js"></script>
 *
 * Public API:  window.CaptchaShield.reset() / .destroy() / .getToken() / .on() / .off()
 * Events:      'verified' | 'failed' | 'expired' | 'error'
 *
 * PostMessage (iframe→parent):
 *   captcha:ready, captcha:verified, captcha:failed, captcha:resize, captcha:error
 * PostMessage (parent→iframe):
 *   captcha:reset, captcha:config
 * ============================================================================
 */
(function () {
  'use strict';

  var VERSION = '4.0.0';
  var NAMESPACE = 'captcha-shield';
  var MAX_RETRIES = 3;
  var RETRY_BASE_DELAY = 1000;
  var LOAD_TIMEOUT = 10000;
  var RESIZE_DEBOUNCE = 80;

  var SIZE_PRESETS = {
    micro:    { width: '280px', minHeight: 64,  height: 64  },
    compact:  { width: '320px', minHeight: 120, height: 120 },
    normal:   { width: '400px', minHeight: 420, height: 420 },
    full:     { width: '100%',  minHeight: 480, height: 480 },
  };

  var DEFAULTS = {
    mode: 'fortress', serverVerifyUrl: '', maxAttempts: 2,
    language: 'auto', theme: 'auto', size: 'normal',
    accentColor: '#10b981', borderRadius: 12,
    showRiskMeter: true, accessibilityMode: false,
    container: '#captcha-shield',
  };

  // --- Utilities ---

  /** Generate a UUID v4-style identifier */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /** Resolve container element from CSS selector, falling back to defaults */
  function resolveContainer(selector) {
    if (selector) {
      try { var el = document.querySelector(selector); if (el) return el; } catch (e) { /* skip */ }
    }
    return document.getElementById('captcha-shield') || document.querySelector('[data-captcha-shield]') || null;
  }

  /** Encode an object into a URL query string (skips null/empty values) */
  function encodeQuery(params) {
    var parts = [];
    for (var key in params) {
      if (!params.hasOwnProperty(key)) continue;
      var val = params[key];
      if (val === null || val === undefined || val === '') continue;
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    }
    return parts.join('&');
  }

  /** Detect dark mode preference */
  function prefersDarkMode() {
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  /** Detect browser language */
  function detectLanguage() {
    try { return navigator.language || navigator.userLanguage || 'en'; } catch (e) { return 'en'; }
  }

  /** Merge user config with defaults (user values take precedence) */
  function buildConfig(userConfig) {
    var config = {};
    for (var key in DEFAULTS) {
      if (!DEFAULTS.hasOwnProperty(key)) continue;
      config[key] = (userConfig && userConfig[key] !== undefined) ? userConfig[key] : DEFAULTS[key];
    }
    return config;
  }

  // --- Logger ---

  var Logger = {
    _prefix: '%c[Captcha Shield v4]%c',
    _styles: ['color:#10b981;font-weight:bold;', 'color:inherit;'],
    info: function () {
      var a = Array.prototype.slice.call(arguments);
      console.log.apply(console, [this._prefix].concat(this._styles, a));
    },
    warn: function () {
      var a = Array.prototype.slice.call(arguments);
      console.warn.apply(console, [this._prefix].concat(this._styles, a));
    },
    error: function () {
      var a = Array.prototype.slice.call(arguments);
      console.error.apply(console, [this._prefix].concat(this._styles, a));
    },
  };

  // --- Event Emitter ---

  function createEventEmitter() {
    var listeners = {};
    return {
      on: function (event, fn) {
        if (typeof fn !== 'function') return this;
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
        return this;
      },
      off: function (event, fn) {
        if (!listeners[event]) return this;
        if (!fn) { delete listeners[event]; }
        else { listeners[event] = listeners[event].filter(function (l) { return l !== fn; }); }
        return this;
      },
      emit: function (event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var fns = listeners[event];
        if (!fns) return;
        for (var i = 0; i < fns.length; i++) {
          try { fns[i].apply(null, args); } catch (err) { Logger.error('Listener error on "' + event + '":', err); }
        }
      },
      removeAll: function () { listeners = {}; },
    };
  }

  // --- Widget Class ---

  /**
   * CaptchaShieldWidget — manages iframe creation, Shadow DOM isolation,
   * postMessage communication, retry logic, and fallback UI.
   * @param {Object} config - Merged configuration
   * @constructor
   */
  function CaptchaShieldWidget(config) {
    this.config = config;
    this.events = createEventEmitter();
    this.sessionId = generateId();
    this.instanceId = generateId();
    this.iframe = null;
    this.container = null;
    this.wrapper = null;
    this.shadowRoot = null;
    this.ready = false;
    this.token = null;
    this.loadTimeoutId = null;
    this.resizeTimeoutId = null;
    this.retryCount = 0;
    this.destroyed = false;
    this._messageHandler = null;
    this._fallbackShown = false;
    Logger.info('v' + VERSION + ' "Fortress" initializing (session: ' + this.sessionId.substring(0, 8) + ')');
  }

  /** Mount the widget: resolve container, create Shadow DOM, iframe, and listeners */
  CaptchaShieldWidget.prototype.mount = function () {
    if (this.destroyed) { Logger.error('Cannot mount: widget destroyed.'); return; }

    this.container = resolveContainer(this.config.container);
    if (!this.container) {
      Logger.error('Container not found. Add <div id="captcha-shield"></div> to your page.');
      this._emitError('CONTAINER_NOT_FOUND', 'Container element not found');
      return;
    }

    // Wrapper div hosts the Shadow DOM (avoids leaking host styles)
    this.wrapper = document.createElement('div');
    this.wrapper.setAttribute('data-' + NAMESPACE + '-wrapper', '');
    this.wrapper.style.cssText = 'display:inline-block;position:relative;';

    // Attach Shadow DOM for style isolation
    try {
      this.shadowRoot = this.wrapper.attachShadow
        ? this.wrapper.attachShadow({ mode: 'open' })
        : this.wrapper;
    } catch (e) {
      Logger.warn('Shadow DOM unavailable, falling back to direct DOM.');
      this.shadowRoot = this.wrapper;
    }

    this.container.appendChild(this.wrapper);
    this._createIframe();
    this._bindMessageListener();
    this._startLoadTimeout();
    Logger.info('Widget mounted.');
  };

  /** Build iframe with config params as query string and append to Shadow DOM */
  CaptchaShieldWidget.prototype._createIframe = function () {
    var self = this;
    var preset = SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal;

    var effectiveTheme = this.config.theme === 'auto' ? (prefersDarkMode() ? 'dark' : 'light') : this.config.theme;
    var effectiveLang = this.config.language === 'auto' ? detectLanguage() : this.config.language;

    var params = {
      mode: this.config.mode, theme: effectiveTheme, lang: effectiveLang,
      size: this.config.size, accent: this.config.accentColor,
      radius: String(this.config.borderRadius),
      riskMeter: this.config.showRiskMeter ? '1' : '0',
      a11y: this.config.accessibilityMode ? '1' : '0',
      maxAttempts: String(this.config.maxAttempts),
      sid: this.sessionId, iid: this.instanceId, v: VERSION,
    };
    if (this.config.serverVerifyUrl) params.serverUrl = this.config.serverVerifyUrl;

    var iframeSrc = window.location.origin + '/widget-embed?' + encodeQuery(params);

    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', iframeSrc);
    iframe.setAttribute('id', NAMESPACE + '-iframe-' + this.instanceId.substring(0, 8));
    iframe.setAttribute('title', 'CAPTCHA Shield Verification Widget');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'clipboard-write; autoplay');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('loading', 'eager');
    iframe.setAttribute('aria-label', 'CAPTCHA verification widget');
    iframe.setAttribute('aria-live', 'polite');

    iframe.style.cssText = [
      'border:none', 'width:100%', 'max-width:' + preset.width,
      'min-height:' + preset.minHeight + 'px', 'height:' + preset.height + 'px',
      'border-radius:' + this.config.borderRadius + 'px', 'overflow:hidden',
      'display:block', 'background:transparent',
      'transition:height 0.25s ease,min-height 0.25s ease',
    ].join(';');

    this.iframe = iframe;
    this.shadowRoot.appendChild(iframe);

    iframe.addEventListener('load', function () { Logger.info('Iframe loaded.'); });
    iframe.addEventListener('error', function () { Logger.error('Iframe error.'); self._retryLoad(); });
  };

  /** Bind the global postMessage listener, filtering by origin and instance ID */
  CaptchaShieldWidget.prototype._bindMessageListener = function () {
    var self = this;
    var ownOrigin = window.location.origin;

    this._messageHandler = function (event) {
      if (event.origin !== ownOrigin) return;
      if (!event.data || typeof event.data !== 'object') return;
      var data = event.data;
      if (data.instanceId && data.instanceId !== self.instanceId) return;

      switch (data.type) {
        case 'captcha:ready':   self._onReady(data); break;
        case 'captcha:verified': self._onVerified(data); break;
        case 'captcha:failed':  self._onFailed(data); break;
        case 'captcha:resize':  self._onResize(data); break;
        case 'captcha:error':   self._emitError('WIDGET_ERROR', data.message || 'Unknown widget error'); break;
      }
    };

    window.addEventListener('message', this._messageHandler);
  };

  /** Post a message to the iframe */
  CaptchaShieldWidget.prototype._postToIframe = function (message) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, window.location.origin);
    }
  };

  // --- Message Handlers ---

  /** Handle captcha:ready — mark widget ready, apply initial size */
  CaptchaShieldWidget.prototype._onReady = function (data) {
    if (this.ready) return;
    this.ready = true;
    this.retryCount = 0;
    this._clearLoadTimeout();
    Logger.info('Widget ready.');
    if (data && typeof data.height === 'number') this._applyResize(data.height, data.width);
    this.events.emit('ready');
  };

  /** Handle captcha:verified — store token and emit event */
  CaptchaShieldWidget.prototype._onVerified = function (data) {
    this.token = data.token || null;
    var payload = {
      token: this.token,
      riskScore: typeof data.riskScore === 'number' ? data.riskScore : 0,
      riskLevel: data.riskLevel || 'low',
      timestamp: Date.now(), sessionId: this.sessionId,
    };
    Logger.info('Verified (risk: ' + payload.riskLevel + ').');
    if (typeof window.onCaptchaVerified === 'function') {
      try { window.onCaptchaVerified(payload); } catch (e) { /* silent */ }
    }
    this.events.emit('verified', payload);
  };

  /** Handle captcha:failed — emit failure event */
  CaptchaShieldWidget.prototype._onFailed = function (data) {
    var payload = { reason: data.reason || 'Verification failed', timestamp: Date.now(), sessionId: this.sessionId };
    Logger.warn('Failed: ' + payload.reason);
    this.events.emit('failed', payload);
  };

  /** Handle captcha:resize — debounce and apply new dimensions */
  CaptchaShieldWidget.prototype._onResize = function (data) {
    var self = this;
    var h = typeof data.height === 'number' ? data.height : 0;
    var w = typeof data.width === 'number' ? data.width : 0;
    if (h <= 0 && w <= 0) return;
    clearTimeout(this.resizeTimeoutId);
    this.resizeTimeoutId = setTimeout(function () { self._applyResize(h, w); }, RESIZE_DEBOUNCE);
  };

  /** Apply height/width changes to the iframe, clamped to minimum presets */
  CaptchaShieldWidget.prototype._applyResize = function (height, width) {
    if (!this.iframe) return;
    var preset = SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal;
    if (height > 0) {
      var h = Math.max(preset.minHeight, Math.round(height));
      this.iframe.style.height = h + 'px';
      this.iframe.style.minHeight = h + 'px';
    }
    if (width > 0) this.iframe.style.maxWidth = Math.round(width) + 'px';
  };

  // --- Timeout & Retry ---

  /** Start the load timeout; triggers retry if iframe doesn't signal ready */
  CaptchaShieldWidget.prototype._startLoadTimeout = function () {
    var self = this;
    this._clearLoadTimeout();
    this.loadTimeoutId = setTimeout(function () {
      if (self.ready || self.destroyed) return;
      Logger.warn('Load timed out after ' + LOAD_TIMEOUT + 'ms.');
      self._emitError('LOAD_TIMEOUT', 'Widget failed to load within ' + LOAD_TIMEOUT + 'ms');
      self._retryLoad();
    }, LOAD_TIMEOUT);
  };

  /** Clear the load timeout */
  CaptchaShieldWidget.prototype._clearLoadTimeout = function () {
    if (this.loadTimeoutId) { clearTimeout(this.loadTimeoutId); this.loadTimeoutId = null; }
  };

  /** Retry loading the iframe with exponential backoff (1s, 2s, 4s) */
  CaptchaShieldWidget.prototype._retryLoad = function () {
    if (this.destroyed) return;
    this.retryCount++;

    if (this.retryCount > MAX_RETRIES) {
      Logger.error('Max retries (' + MAX_RETRIES + ') exceeded. Showing fallback.');
      this._showFallback();
      return;
    }

    var delay = RETRY_BASE_DELAY * Math.pow(2, this.retryCount - 1);
    Logger.info('Retry ' + this.retryCount + '/' + MAX_RETRIES + ' in ' + delay + 'ms...');
    var self = this;

    setTimeout(function () {
      if (self.destroyed) return;
      if (self.iframe && self.iframe.parentNode) self.iframe.parentNode.removeChild(self.iframe);
      self.iframe = null;
      self.ready = false;
      self._createIframe();
      self._startLoadTimeout();
    }, delay);
  };

  // --- Fallback UI ---

  /**
   * Show a fallback checkbox UI when the iframe fails to load after all retries.
   * Provides a basic "I'm not a robot" checkbox with shield icon branding.
   */
  CaptchaShieldWidget.prototype._showFallback = function () {
    if (this._fallbackShown) return;
    this._fallbackShown = true;

    // Clean up iframe
    if (this.iframe && this.iframe.parentNode) { this.iframe.parentNode.removeChild(this.iframe); this.iframe = null; }
    this._clearLoadTimeout();

    var isDark = prefersDarkMode();
    var accent = this.config.accentColor || '#10b981';
    var radius = this.config.borderRadius || 12;
    var preset = SIZE_PRESETS[this.config.size] || SIZE_PRESETS.normal;

    var fallback = document.createElement('div');
    fallback.setAttribute('role', 'alert');
    fallback.setAttribute('aria-label', 'CAPTCHA Shield fallback verification');
    fallback.style.cssText = [
      'width:100%', 'max-width:' + preset.width, 'padding:16px 20px',
      'border-radius:' + radius + 'px', 'display:flex', 'align-items:center',
      'gap:14px', 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'background:' + (isDark ? '#1e293b' : '#fff'),
      'border:1px solid ' + (isDark ? '#334155' : '#e2e8f0'),
      'box-shadow:0 1px 3px rgba(0,0,0,0.08)', 'box-sizing:border-box',
      'cursor:pointer', 'user-select:none', 'transition:border-color 0.2s ease',
    ].join(';');

    // Checkbox
    var checkbox = document.createElement('div');
    checkbox.style.cssText = [
      'width:24px', 'height:24px', 'min-width:24px', 'border-radius:4px',
      'border:2px solid ' + (isDark ? '#475569' : '#cbd5e1'),
      'display:flex', 'align-items:center', 'justify-content:center',
      'transition:all 0.2s ease', 'background:' + (isDark ? 'transparent' : '#f8fafc'),
    ].join(';');

    // Label
    var label = document.createElement('span');
    label.style.cssText = 'font-size:14px;font-weight:500;color:' + (isDark ? '#e2e8f0' : '#334155') + ';flex:1;';
    label.textContent = "I'm not a robot";

    // Shield icon + branding
    var brand = document.createElement('div');
    brand.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
    brand.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' + accent
      + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
      + '<path d="M9 12l2 2 4-4"/></svg>'
      + '<span style="font-size:9px;color:' + (isDark ? '#64748b' : '#94a3b8') + ';font-weight:600;letter-spacing:0.5px;">SHIELD</span>';

    fallback.appendChild(checkbox);
    fallback.appendChild(label);
    fallback.appendChild(brand);

    // Click handler — toggle verified state
    var checked = false;
    var self = this;

    fallback.addEventListener('click', function () {
      checked = !checked;
      if (checked) {
        checkbox.style.borderColor = accent;
        checkbox.style.background = accent;
        checkbox.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
        label.textContent = 'Verified';
        label.style.color = accent;
        self.token = 'fb_' + generateId();
        self.events.emit('verified', { token: self.token, riskScore: 0.5, riskLevel: 'medium', timestamp: Date.now(), sessionId: self.sessionId });
        if (typeof window.onCaptchaVerified === 'function') {
          try { window.onCaptchaVerified({ token: self.token, riskScore: 0.5, riskLevel: 'medium' }); } catch (e) { /* silent */ }
        }
      } else {
        checkbox.style.borderColor = isDark ? '#475569' : '#cbd5e1';
        checkbox.style.background = isDark ? 'transparent' : '#f8fafc';
        checkbox.innerHTML = '';
        label.textContent = "I'm not a robot";
        label.style.color = isDark ? '#e2e8f0' : '#334155';
        self.token = null;
      }
    });

    fallback.addEventListener('mouseenter', function () { fallback.style.borderColor = accent; });
    fallback.addEventListener('mouseleave', function () { if (!checked) fallback.style.borderColor = isDark ? '#334155' : '#e2e8f0'; });

    // Replace shadow root content with fallback
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.appendChild(fallback);
  };

  // --- Error Handling ---

  /** Centralized error emitter */
  CaptchaShieldWidget.prototype._emitError = function (code, message) {
    var error = { code: code, message: message, sessionId: this.sessionId, timestamp: Date.now() };
    Logger.error('[' + code + '] ' + message);
    this.events.emit('error', error);
  };

  // --- Public API ---

  /** Reset the widget: new session, fresh iframe */
  CaptchaShieldWidget.prototype.reset = function () {
    if (this.destroyed) return;
    Logger.info('Resetting widget...');
    if (this.ready && this.iframe) this._postToIframe({ type: 'captcha:reset' });
    this.sessionId = generateId();
    this.token = null;
    this.ready = false;
    this.retryCount = 0;
    this._fallbackShown = false;
    if (this.iframe && this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this._createIframe();
    this._startLoadTimeout();
    this.events.emit('reset', { sessionId: this.sessionId });
  };

  /** Destroy the widget: full cleanup of timers, listeners, and DOM */
  CaptchaShieldWidget.prototype.destroy = function () {
    if (this.destroyed) return;
    Logger.info('Destroying widget...');
    this.destroyed = true;
    this._clearLoadTimeout();
    if (this.resizeTimeoutId) { clearTimeout(this.resizeTimeoutId); this.resizeTimeoutId = null; }
    if (this._messageHandler) { window.removeEventListener('message', this._messageHandler); this._messageHandler = null; }
    if (this.iframe) {
      if (this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
    if (this.shadowRoot) { while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild); }
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
    this.token = null;
    this.ready = false;
    this.events.emit('destroyed');
    this.events.removeAll();
    Logger.info('Widget destroyed.');
  };

  /** Get the current verification token (null if not verified) */
  CaptchaShieldWidget.prototype.getToken = function () { return this.token; };

  /** Subscribe to a lifecycle event */
  CaptchaShieldWidget.prototype.on = function (event, fn) { return this.events.on(event, fn); };

  /** Unsubscribe from a lifecycle event */
  CaptchaShieldWidget.prototype.off = function (event, fn) { return this.events.off(event, fn); };

  // --- Initialization ---

  var widget = null;

  /** Main init: build config, create widget, mount, expose global API */
  function init() {
    try {
      var userConfig = (window.CaptchaShieldConfig && typeof window.CaptchaShieldConfig === 'object') ? window.CaptchaShieldConfig : {};
      var config = buildConfig(userConfig);
      widget = new CaptchaShieldWidget(config);
      widget.mount();

      window.CaptchaShield = {
        version: VERSION,
        reset: function () { widget && widget.reset(); },
        destroy: function () { widget && widget.destroy(); },
        getToken: function () { return widget ? widget.getToken() : null; },
        on: function (event, fn) { widget && widget.on(event, fn); return this; },
        off: function (event, fn) { widget && widget.off(event, fn); return this; },
        isReady: function () { return widget ? widget.ready : false; },
        getSessionId: function () { return widget ? widget.sessionId : null; },
      };
      Logger.info('Global API available as window.CaptchaShield');
    } catch (err) {
      Logger.error('Initialization failed:', err);
      try {
        var container = document.getElementById('captcha-shield') || document.querySelector('[data-captcha-shield]');
        if (container) {
          var errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'padding:16px;font-family:sans-serif;font-size:13px;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;';
          errorDiv.textContent = 'CAPTCHA Shield failed to initialize. Check the browser console.';
          container.appendChild(errorDiv);
        }
      } catch (e) { /* silent */ }
    }
  }

  /** Wait for DOM readiness before initializing */
  function initWhenReady() {
    if (document.readyState === 'loading') {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        document.attachEvent('onreadystatechange', function () {
          if (document.readyState === 'complete' || document.readyState === 'interactive') init();
        });
      }
    } else {
      init();
    }
  }

  // --- Boot: prevent double initialization ---

  if (window.__captchaShieldV4Initialized) {
    Logger.warn('CAPTCHA Shield v4 already initialized. Skipping duplicate.');
  } else {
    window.__captchaShieldV4Initialized = true;
    window.__captchaShieldV4Version = VERSION;
    initWhenReady();
  }

})();
