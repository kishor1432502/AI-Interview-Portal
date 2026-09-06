/**
 * AI Interview Portal - Email OTP Verification Gate (Section 5)
 * Manages 6-box input, countdown timer, resend logic, and attempt rate-limiting
 */

window.OtpModule = {
  currentUserId: null,
  currentEmail: null,
  timerInterval: null,
  remainingSeconds: 300, // 5 minutes
  maxAttempts: 5,
  attemptsUsed: 0,
  currentOtpCode: null,

  init() {
    const inputs = document.querySelectorAll('.otp-box');
    inputs.forEach((input, index) => {
      // Auto-focus next input on digit entry
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        this.checkAutoSubmit();
      });

      // Handle Backspace navigation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      // Handle paste of 6-digit code
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pasted)) {
          inputs.forEach((box, i) => {
            box.value = pasted[i];
          });
          inputs[5].focus();
          this.checkAutoSubmit();
        }
      });
    });

    const resendBtn = document.getElementById('btn-resend-otp');
    if (resendBtn) {
      resendBtn.addEventListener('click', () => this.resendOTP());
    }

    const verifyBtn = document.getElementById('btn-verify-otp');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen entry on verify click:', err);
        }
        this.checkAutoSubmit();
      });
    }

    const previewEl = document.getElementById('otp-simulation-code');
    if (previewEl) {
      previewEl.style.cursor = 'pointer';
      previewEl.title = 'Click to auto-fill test code';
      previewEl.addEventListener('click', () => {
        if (this.currentOtpCode) {
          inputs.forEach((box, i) => box.value = this.currentOtpCode[i]);
          this.checkAutoSubmit();
        }
      });
    }
  },

  initiateOTP(userId, email) {
    this.currentUserId = userId;
    this.currentEmail = email;
    this.attemptsUsed = 0;
    this.generateAndSendOTP();

    // Navigate to OTP view
    window.AppRouter.navigate('otp');

    const emailDisplay = document.getElementById('otp-sent-email');
    if (emailDisplay) emailDisplay.textContent = email;

    // Clear previous inputs
    const inputs = document.querySelectorAll('.otp-box');
    inputs.forEach(box => box.value = '');
    if (inputs[0]) inputs[0].focus();

    this.startCountdown();
  },

  async generateAndSendOTP() {
    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.currentOtpCode = code;

    // Store in persistence layer
    window.DataStore.saveOTP(this.currentUserId, code);

    // Show a sending indicator immediately
    this._setOtpDisplayCode('......', 'Sending...');

    // Dispatch real email via server API
    let emailSent = false;
    try {
      const resp = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.currentEmail, otp: code })
      });
      const data = await resp.json();
      console.log('[OTP DISPATCH]', data);

      if (data.sentViaSmtp) {
        emailSent = true;
        window.AuthModule.showToast(
          '✅ Email Sent!',
          `Real OTP email delivered to ${this.currentEmail}. Check your Inbox & Spam folder.`,
          'success'
        );
        // Still show on screen as backup
        this._setOtpDisplayCode(code, `📧 Email sent to ${this.currentEmail} — Code also shown below (click to auto-fill):`);
      } else {
        // Email failed — show code prominently on screen
        const errHint = data.error ? `Reason: ${data.error}` : 'SMTP not configured.';
        console.warn('[EMAIL FAILED]', errHint);
        this._setOtpDisplayCode(code, `⚠️ Email could not be sent. Use this on-screen code (click to auto-fill):`);
        window.AuthModule.showToast(
          '⚠️ Email Not Sent',
          'SMTP not configured properly. Your OTP is displayed on screen — click it to auto-fill.',
          'warning'
        );
      }
    } catch (err) {
      console.warn('API send-otp error (server offline?):', err);
      // Server offline — still show OTP on screen
      this._setOtpDisplayCode(code, '⚠️ Server not reachable. Use this on-screen code (click to auto-fill):');
      window.AuthModule.showToast(
        '⚠️ Server Offline',
        'Could not contact email server. Your OTP is displayed on screen — click it to auto-fill.',
        'warning'
      );
    }
  },

  // Show the OTP code prominently on the OTP screen
  _setOtpDisplayCode(code, label) {
    // Update label
    const labelEl = document.getElementById('otp-screen-label');
    if (labelEl) labelEl.textContent = label || 'Your OTP code (click to auto-fill):';

    // Update code display
    const previewEl = document.getElementById('otp-simulation-code');
    if (previewEl) {
      previewEl.textContent = code;
      previewEl.style.display = 'block';
      // Make it clickable to auto-fill
      previewEl.onclick = () => {
        if (this.currentOtpCode && code !== '......') {
          const inputs = document.querySelectorAll('.otp-box');
          inputs.forEach((box, i) => box.value = this.currentOtpCode[i] || '');
          this.checkAutoSubmit();
        }
      };
    }
  },

  startCountdown() {
    clearInterval(this.timerInterval);
    this.remainingSeconds = 300; // 5 min
    const timerDisplay = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('btn-resend-otp');
    if (resendBtn) resendBtn.disabled = true;

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        if (timerDisplay) timerDisplay.textContent = 'Expired';
        if (resendBtn) resendBtn.disabled = false;
        window.AuthModule.showToast('OTP Expired', 'The verification code has expired. Please click Resend OTP.', 'warning');
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const timerDisplay = document.getElementById('otp-timer');
    if (!timerDisplay) return;
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  resendOTP() {
    this.attemptsUsed = 0;
    this.generateAndSendOTP();
    this.startCountdown();
  },

  checkAutoSubmit() {
    const inputs = document.querySelectorAll('.otp-box');
    let enteredCode = '';
    inputs.forEach(box => enteredCode += box.value.trim());

    if (enteredCode.length === 6) {
      this.verifyCode(enteredCode);
    }
  },

  async verifyCode(code) {
    if (this.remainingSeconds <= 0) {
      window.AuthModule.showToast('Expired Code', 'This code has expired. Please request a new OTP.', 'danger');
      return;
    }

    if (this.attemptsUsed >= this.maxAttempts) {
      window.AuthModule.showToast('Lockout Triggered', 'Too many invalid attempts. Your session has been temporarily locked for security.', 'danger');
      return;
    }

    const latestOTPRecord = window.DataStore.getLatestOTP(this.currentUserId);

    if (latestOTPRecord && latestOTPRecord.otp_code === code) {
      // Success!
      clearInterval(this.timerInterval);
      latestOTPRecord.verified_at = new Date().toISOString();
      window.DataStore.updateOTPRecord(latestOTPRecord);

      window.AuthModule.showToast('Identity Verified!', 'Authentication successful. Entering proctored lockdown...', 'success');

      // Direct seamless start: Auto-request Screen Share & Fullscreen, then enter interview directly!
      await this.startInterviewDirectly();
    } else {
      this.attemptsUsed++;
      const remainingAttempts = this.maxAttempts - this.attemptsUsed;
      window.AuthModule.showToast('Invalid Code', `Incorrect OTP code. ${remainingAttempts} attempts remaining.`, 'danger');

      const inputs = document.querySelectorAll('.otp-box');
      inputs.forEach(box => {
        box.classList.add('input-error');
        setTimeout(() => box.classList.remove('input-error'), 1000);
      });
    }
  },

  async startInterviewDirectly() {
    try {
      // 1. CRITICAL: Request Fullscreen FIRST before any awaits
      // Browser requires a direct user gesture call — no await before this!
      const fsPromise = document.fullscreenElement
        ? Promise.resolve()
        : document.documentElement.requestFullscreen().catch((e) => {
            console.warn('Fullscreen blocked by browser (will retry on navigation):', e);
          });

      // 2. Request Entire Screen Share
      window.AuthModule.showToast('Screen Share Required', 'Please select "Entire Screen" in the browser dialog.', 'warning');
      let screenStream = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor', cursor: 'always' },
          audio: false
        });
      } catch (e) {
        console.warn('Screen share skipped or cancelled:', e);
      }

      // Wait for fullscreen to complete
      await fsPromise.catch(() => {});

      // 3. Connect Camera & Mic automatically
      let camStream = null;
      try {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const liveVideo = document.getElementById('live-candidate-video');
        if (liveVideo && camStream) {
          liveVideo.srcObject = camStream;
          liveVideo.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Camera/Mic permission bypassed or unavailable:', e);
      }

      // 4. Create session and launch directly into Interview!
      const session = window.DataStore.createSession(this.currentUserId, 'LKD-' + Date.now());

      // Ensure fullscreen overlay is hidden
      const overlay = document.getElementById('fullscreen-required-overlay');
      if (document.fullscreenElement && overlay) overlay.style.display = 'none';

      window.AppRouter.navigate('interview');

      if (window.ProctorEngine) {
        window.ProctorEngine.startMonitoring(session.id);
      }
      if (window.AiEngine) {
        window.AiEngine.startInterview(session.id);
      }

    } catch (err) {
      console.error('Direct interview start error:', err);
      // Fallback — navigate anyway
      window.AppRouter.navigate('interview');
    }
  }
};
