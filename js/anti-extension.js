/**
 * AI Interview Portal - Anti-Extension & Tamper Shield
 * Specifically detects & blocks cheat extensions like "Always Active Window",
 * "Focus Lock", "Visibility Spoofers", and user-script injectors.
 */

(function() {
  'use strict';

  console.log('[ANTI-EXTENSION SHIELD] Initializing Deep Proctor Defenses...');

  // 1. Cache pristine native functions before any late extension content script can patch them
  const nativeHasFocus = document.hasFocus ? document.hasFocus.bind(document) : null;
  const nativeToString = Function.prototype.toString;
  const nativeRaf = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  const nativeNow = performance.now.bind(performance);

  // 2. Freeze native descriptors if possible to prevent extension overrides
  try {
    const visDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    if (visDesc && visDesc.configurable) {
      Object.defineProperty(Document.prototype, 'visibilityState', {
        get: function() {
          return document.hidden ? 'hidden' : 'visible';
        },
        configurable: false
      });
    }
  } catch (e) {}

  window.AntiExtensionShield = {
    isShieldArmed: false,
    tamperDetected: false,
    lastFrameTime: nativeNow(),
    driftToleranceMs: 700, // Background throttling threshold
    checkInterval: null,
    rafId: null,

    startShield(onViolationCallback) {
      this.isShieldArmed = true;
      this.onViolation = onViolationCallback;

      this.verifyNativeAPIIntegrity();
      this.startHardwareThrottlingDetector();
      this.scanForExtensionInjections();

      console.log('[ANTI-EXTENSION SHIELD] Shield armed and actively monitoring for "Always Active Window" & bypass extensions.');
    },

    stopShield() {
      this.isShieldArmed = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      clearInterval(this.checkInterval);
    },

    // Detection Vector 1: Native API Monkey-Patch Verification
    verifyNativeAPIIntegrity() {
      const isNative = (fn) => {
        try {
          return nativeToString.call(fn).includes('[native code]');
        } catch (e) {
          return false;
        }
      };

      // Check if document.hasFocus was hijacked by an extension (like "Always Active Window")
      if (document.hasFocus && !isNative(document.hasFocus)) {
        this.triggerExtensionViolation('Proctor Bypass Extension Detected: "Always Active Window" tampered document.hasFocus()');
        return;
      }

      // Check if document.addEventListener was hijacked
      if (!isNative(window.addEventListener) || !isNative(document.addEventListener)) {
        this.triggerExtensionViolation('Cheat Extension Detected: Event listener tampering detected.');
        return;
      }

      // Periodic check in case extension injects late
      this.checkInterval = setInterval(() => {
        if (!this.isShieldArmed) return;

        if (document.hasFocus && !isNative(document.hasFocus)) {
          this.triggerExtensionViolation('Extension Tamper Detected: document.hasFocus() hijacked in real-time');
        }

        // Test if hasFocus returns true while document.hidden is true (spoofing indicator)
        if (document.hidden && document.hasFocus && document.hasFocus() === true) {
          this.triggerExtensionViolation('Visibility Spoofer Detected: Active state falsely reported while tab hidden');
        }
      }, 1000);
    },

    // Detection Vector 2: Chromium Background Throttling Monitor
    // (Chromium's C++ core slows requestAnimationFrame when user switches tabs - extensions CANNOT fake this!)
    startHardwareThrottlingDetector() {
      this.lastFrameTime = nativeNow();

      const monitorFrame = (currentTime) => {
        if (!this.isShieldArmed) return;

        const delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // If delta > 600ms without system pause, Chrome has throttled this tab because the candidate navigated away
        // even if an extension like "Always Active Window" lied and claimed the window was still focused!
        if (delta > this.driftToleranceMs) {
          // If window claims it's focused but hardware timers were throttled, user was in another tab/window!
          const claimedFocused = document.hasFocus ? document.hasFocus() : true;
          if (claimedFocused && !document.hidden) {
            console.warn(`[ANTI-EXTENSION] Frame delta anomaly (${Math.round(delta)}ms). Background tab throttling detected!`);
            this.triggerExtensionViolation('Background Tab Activity Detected (Bypassed Focus Extension)');
          }
        }

        this.rafId = nativeRaf(monitorFrame);
      };

      this.rafId = nativeRaf(monitorFrame);
    },

    // Detection Vector 3: Scanning for Chrome Extension Injected DOM Artifacts
    scanForExtensionInjections() {
      const checkDOM = () => {
        if (!this.isShieldArmed) return;

        // Look for common extension injected iframes or attributes
        const scripts = document.querySelectorAll('script');
        scripts.forEach(s => {
          if (s.src && s.src.startsWith('chrome-extension://')) {
            this.triggerExtensionViolation('Unauthorized Chrome Extension Resource Injected: ' + s.src.slice(0, 40));
          }
        });

        // Detect known extension attributes
        const badNodes = document.querySelectorAll('[data-extension-id], [class*="always-active"], [id*="extension"]');
        if (badNodes.length > 0) {
          console.warn('[ANTI-EXTENSION] Suspicious extension DOM nodes found');
        }
      };

      setInterval(checkDOM, 2500);
    },

    triggerExtensionViolation(details) {
      if (!this.isShieldArmed) return;
      console.error(`[ANTI-EXTENSION BREACH]: ${details}`);

      if (this.onViolation) {
        this.onViolation(details);
      } else if (window.ProctorEngine) {
        window.ProctorEngine.triggerViolation(details);
      }
    }
  };

})();
