/**
 * AI Interview Portal - Proctoring Rules Engine & Lockdown Monitor
 * Strictly implements Section 8: Strike Policy, 10s Countdown Overlay, and Auto-Termination
 */

window.ProctorEngine = {
  sessionId: null,
  isMonitoring: false,
  strikeCount: 0,
  maxStrikes: 3, // 4th violation causes immediate termination
  isWarningActive: false,
  warningCountdown: 10,
  warningInterval: null,
  faceMissingTimer: null,
  faceMissingSeconds: 0,
  boundListeners: {},

  startMonitoring(sessionId) {
    this.sessionId = sessionId;
    this.isMonitoring = true;
    this.strikeCount = 0;
    this.isWarningActive = false;

    this.updateStrikePipsUI();
    this.attachEventListeners();
    this.startFacePresenceLoop();

    // Arm Anti-Extension Shield against "Always Active Window" & bypass extensions
    if (window.AntiExtensionShield) {
      window.AntiExtensionShield.startShield((violation) => {
        this.triggerViolation(violation);
      });
    }

    window.AuthModule.showToast('Lockdown Active', 'Proctoring & Anti-Extension shield armed. Fullscreen monitored.', 'info');
  },

  stopMonitoring() {
    this.isMonitoring = false;
    this.removeEventListeners();
    clearInterval(this.warningInterval);
    clearInterval(this.faceMissingTimer);

    if (window.AntiExtensionShield) {
      window.AntiExtensionShield.stopShield();
    }

    const overlay = document.getElementById('lockdown-warning-modal');
    if (overlay) overlay.classList.remove('active');
  },

  attachEventListeners() {
    // 1. Fullscreen Change
    this.boundListeners.fullscreenChange = () => {
      if (this.isMonitoring && !document.fullscreenElement && !this.isWarningActive) {
        this.triggerViolation('Exiting Fullscreen Mode');
      }
    };
    document.addEventListener('fullscreenchange', this.boundListeners.fullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.boundListeners.fullscreenChange);

    // 2. Tab Switch or Minimize (visibilitychange)
    this.boundListeners.visibilityChange = () => {
      if (this.isMonitoring && document.hidden && !this.isWarningActive) {
        this.triggerViolation('Tab Switching / Window Hidden');
      }
    };
    document.addEventListener('visibilitychange', this.boundListeners.visibilityChange);

    // 3. Window Blur (unfocus or VM / app switch)
    this.boundListeners.windowBlur = () => {
      if (this.isMonitoring && !this.isWarningActive) {
        this.triggerViolation('Window Lost Focus / External App Detected');
      }
    };
    window.addEventListener('blur', this.boundListeners.windowBlur);

    // Resume button on warning modal
    const btnResume = document.getElementById('btn-resume-lockdown');
    if (btnResume) {
      btnResume.onclick = () => this.handleResumeClick();
    }
  },

  removeEventListeners() {
    if (this.boundListeners.fullscreenChange) {
      document.removeEventListener('fullscreenchange', this.boundListeners.fullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.boundListeners.fullscreenChange);
    }
    if (this.boundListeners.visibilityChange) {
      document.removeEventListener('visibilitychange', this.boundListeners.visibilityChange);
    }
    if (this.boundListeners.windowBlur) {
      window.removeEventListener('blur', this.boundListeners.windowBlur);
    }
  },

  startFacePresenceLoop() {
    this.faceMissingSeconds = 0;
    const videoEl = document.getElementById('live-candidate-video');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    this.faceMissingTimer = setInterval(() => {
      if (!this.isMonitoring || this.isWarningActive || !videoEl || videoEl.paused) return;

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      let skinPixels = 0;
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuma += (r + g + b) / 3;
        if (r > 50 && g > 30 && b > 20 && (r - g) > 10 && (r - b) > 10) skinPixels++;
      }

      const ratio = skinPixels / (canvas.width * canvas.height);
      const hasFace = ratio > 0.03 && totalLuma > 400000;

      if (!hasFace) {
        this.faceMissingSeconds += 1.5;
        // Grace period of 4 seconds (Section 12)
        if (this.faceMissingSeconds >= 4.5 && !this.isWarningActive) {
          this.triggerViolation('Candidate Left Camera Frame / Camera Blocked');
          this.faceMissingSeconds = 0;
        }
      } else {
        this.faceMissingSeconds = 0;
      }
    }, 1500);
  },

  // 8.2 Warning & Strike Flow
  triggerViolation(reason) {
    if (!this.isMonitoring) return;

    // Log violation to DataStore
    window.DataStore.logViolation(this.sessionId, reason);

    this.strikeCount++;
    this.updateStrikePipsUI();

    // Check if 4th violation reached -> immediate termination
    if (this.strikeCount > this.maxStrikes) {
      this.terminateSession(`Maximum Strike Violations Exceeded (${this.strikeCount} strikes)`);
      return;
    }

    // Play alert sound via Web Audio
    this.playEmergencyBeep();

    // Show 10-Second Lockdown Warning Overlay
    this.isWarningActive = true;
    this.warningCountdown = 10;

    const overlay = document.getElementById('lockdown-warning-modal');
    const violationLabel = document.getElementById('warning-violation-label');
    const countdownEl = document.getElementById('warning-countdown-seconds');
    const barFill = document.getElementById('warning-bar-fill');
    const strikesLabel = document.getElementById('warning-strikes-left');

    if (violationLabel) violationLabel.textContent = reason;
    if (countdownEl) countdownEl.textContent = '10';
    if (barFill) barFill.style.width = '100%';
    if (strikesLabel) strikesLabel.textContent = `Strike ${this.strikeCount} of ${this.maxStrikes}. (4th violation terminates test)`;
    if (overlay) overlay.classList.add('active');

    clearInterval(this.warningInterval);
    this.warningInterval = setInterval(() => {
      this.warningCountdown--;
      if (countdownEl) countdownEl.textContent = this.warningCountdown.toString();
      if (barFill) barFill.style.width = `${(this.warningCountdown / 10) * 100}%`;

      // Countdown expired (0 seconds) -> Terminate immediately
      if (this.warningCountdown <= 0) {
        clearInterval(this.warningInterval);
        this.terminateSession('Failed to Resume Environment Within 10 Seconds');
      }
    }, 1000);
  },

  handleResumeClick() {
    clearInterval(this.warningInterval);

    // Re-enter Fullscreen (Section 8.2)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    this.isWarningActive = false;
    const overlay = document.getElementById('lockdown-warning-modal');
    if (overlay) overlay.classList.remove('active');

    window.AuthModule.showToast('Resumed', `Session resumed. Strike ${this.strikeCount} recorded.`, 'warning');
  },

  updateStrikePipsUI() {
    const pips = document.querySelectorAll('.strike-pip');
    pips.forEach((pip, idx) => {
      if (idx < this.strikeCount) {
        pip.classList.add('active');
      } else {
        pip.classList.remove('active');
      }
    });

    // Update session record
    const session = window.DataStore.getCurrentSession();
    if (session) {
      session.strike_count = this.strikeCount;
      window.DataStore.updateSession(session);
    }
  },

  playEmergencyBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },

  terminateSession(reason) {
    this.stopMonitoring();

    // Update Session
    const session = window.DataStore.getCurrentSession();
    if (session) {
      session.status = 'terminated';
      session.end_time = new Date().toISOString();
      session.termination_reason = reason;
      window.DataStore.updateSession(session);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Populate termination view
    const reasonEl = document.getElementById('term-reason-text');
    const listEl = document.getElementById('term-violations-list');
    if (reasonEl) reasonEl.textContent = reason;

    if (listEl) {
      listEl.innerHTML = '';
      const violations = window.DataStore.getViolationsBySession(this.sessionId);
      violations.forEach((v, i) => {
        const item = document.createElement('div');
        item.className = 'violation-item';
        item.innerHTML = `
          <span><strong>#${i + 1}</strong> ${v.violation_type}</span>
          <span class="mono-text" style="color:var(--text-muted); font-size:0.75rem;">${new Date(v.timestamp).toLocaleTimeString()}</span>
        `;
        listEl.appendChild(item);
      });
    }

    window.AppRouter.navigate('terminated');
  }
};
