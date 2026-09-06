/**
 * AI Interview Portal - Automated Practical Live Demo Tour
 * Runs an autonomous end-to-end visual walkthrough of the entire portal
 */

window.LiveDemoTour = {
  isRunning: false,
  stepDelay: 1800,

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async startTour() {
    if (this.isRunning) return;
    this.isRunning = true;

    window.AuthModule.showToast('Practical Demo Started', 'Automated end-to-end demonstration running...', 'info');

    try {
      // Step 1: Navigate to Landing Page
      window.AppRouter.navigate('landing');
      await this.sleep(1500);

      // Step 2: Highlight & Click "Going to attend the Interview"
      const cta = document.getElementById('hero-cta-attend');
      if (cta) {
        cta.style.outline = '4px solid var(--accent-cyan)';
        cta.style.boxShadow = '0 0 35px var(--accent-cyan)';
        await this.sleep(1200);
        cta.style.outline = 'none';
        cta.click();
      }

      await this.sleep(1800);

      // Step 3: Auth Screen - Create Account
      window.AuthModule.switchAuthTab('signup');
      await this.sleep(800);

      const nameInput = document.getElementById('signup-name');
      const emailInput = document.getElementById('signup-email');
      const passInput = document.getElementById('signup-password');
      const confInput = document.getElementById('signup-confirm');

      if (nameInput) nameInput.value = "Arun Kumar";
      if (emailInput) emailInput.value = "arun.tech@example.com";
      if (passInput) passInput.value = "Password123";
      if (confInput) confInput.value = "Password123";

      await this.sleep(1200);
      const signupForm = document.getElementById('form-signup');
      if (signupForm) signupForm.dispatchEvent(new Event('submit', { cancelable: true }));

      await this.sleep(1800);

      // Step 4: Candidate Profile Form Auto-Fill & Resume Parsing
      window.AuthModule.showToast('Auto-Filling Profile', 'Populating verified candidate credentials & parsing resume...', 'info');
      if (window.ProfileModule) {
        window.ProfileModule.quickFillDemo();
      }
      await this.sleep(2200);

      // Submit Profile
      const profSubmit = document.getElementById('btn-submit-profile');
      if (profSubmit) {
        profSubmit.style.outline = '3px solid var(--accent-emerald)';
        await this.sleep(1000);
        profSubmit.click();
      }

      await this.sleep(2200);

      // Step 5: OTP Verification Gate
      window.AuthModule.showToast('OTP Step', 'Simulating verified email OTP entry...', 'info');
      await this.sleep(1000);

      // Auto fill OTP from storage
      const currentUser = window.DataStore.getCurrentUser();
      const latestOTP = window.DataStore.getLatestOTP(currentUser ? currentUser.id : 'usr_demo_01');
      const otpCode = latestOTP ? latestOTP.otp_code : '849201';

      const otpBoxes = document.querySelectorAll('.otp-box');
      otpBoxes.forEach((box, i) => {
        box.value = otpCode[i] || '9';
      });

      await this.sleep(1500);
      if (window.OtpModule) {
        await window.OtpModule.verifyCode(otpCode);
      }

      await this.sleep(2500);

      // Step 6: In Live Interview Room
      window.AuthModule.showToast('AI Interview Room', 'Connected to Live AI Interview Engine with Anti-Extension shield.', 'success');
      await this.sleep(2000);

      // Submit Answer for Current Question
      const answerInput = document.getElementById('candidate-answer-input');
      if (answerInput) {
        answerInput.value = "Hello! I am Arun Kumar, an engineering graduate specializing in distributed cloud microservices. I built a scalable task orchestration engine alone with Node.js and Redis.";
      }
      await this.sleep(2200);

      const submitAnsBtn = document.getElementById('btn-submit-answer');
      if (submitAnsBtn) submitAnsBtn.click();

      // Step 7: Demonstrate Adaptive Follow-Up
      await this.sleep(3000);
      window.AuthModule.showToast('Adaptive Probing', 'AI detected "alone" & triggered contextual follow-up probing!', 'info');

      if (answerInput) {
        answerInput.value = "When building the backend alone, handling high-concurrency race conditions without team assistance was my biggest roadblock. I solved it using Redis distributed mutex locks with TTL.";
      }
      await this.sleep(2500);
      if (submitAnsBtn) submitAnsBtn.click();

      // Step 8: Demonstrate Anti-Extension & Proctoring Warning Alert
      await this.sleep(2500);
      window.AuthModule.showToast('Proctoring Test', 'Testing Cheat Detection & 10-Second Lockdown Warning Modal...', 'warning');

      if (window.ProctorEngine) {
        window.ProctorEngine.triggerViolation('Extension Tamper Detected: "Always Active Window" spoofing focus');
      }

      // Show the 10-second alert modal for 3 seconds then resume
      await this.sleep(3500);
      if (window.ProctorEngine) {
        window.ProctorEngine.handleResumeClick();
      }

      await this.sleep(2000);

      // Step 9: Complete Interview & View Recruiter Scorecard
      window.AuthModule.showToast('Generating Scorecard', 'Compiling candidate review and integrity scorecard...', 'info');
      if (window.AiEngine) {
        window.AiEngine.completeInterview();
      }

      this.isRunning = false;
      window.AuthModule.showToast('Demo Complete!', 'Full practical workflow demonstrated successfully.', 'success');

    } catch (err) {
      console.error('Demo tour error:', err);
      this.isRunning = false;
    }
  }
};

// Check if URL has ?demo=true or ?tour=true to auto-launch
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true' || params.get('tour') === 'true') {
    setTimeout(() => {
      window.LiveDemoTour.startTour();
    }, 1200);
  }
});
