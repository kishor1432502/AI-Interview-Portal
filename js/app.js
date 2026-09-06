/**
 * AI Interview Portal - Master App Controller & SPA Router
 * Coordinates view switching, component initialization, and global navigation
 */

window.AppRouter = {
  currentView: 'landing',

  navigate(viewName) {
    this.currentView = viewName;
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.updateNavState();
  },

  updateNavState() {
    const currentUser = window.DataStore.getCurrentUser();
    const authActions = document.getElementById('nav-auth-actions');
    const userActions = document.getElementById('nav-user-actions');
    const userDisplay = document.getElementById('nav-user-display');

    // Hide or show nav based on fullscreen interview mode
    const header = document.querySelector('.main-header');
    if (this.currentView === 'interview') {
      if (header) header.style.display = 'none';
    } else {
      if (header) header.style.display = 'block';
    }

    if (currentUser) {
      if (authActions) authActions.style.display = 'none';
      if (userActions) userActions.style.display = 'flex';
      if (userDisplay) userDisplay.textContent = currentUser.name;
    } else {
      if (authActions) authActions.style.display = 'flex';
      if (userActions) userActions.style.display = 'none';
    }
  }
};

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Modules
  if (window.ProfileModule) window.ProfileModule.init();
  if (window.OtpModule) window.OtpModule.init();

  // Navigation Links
  const navLinks = document.querySelectorAll('[data-nav-view]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-nav-view');
      window.AppRouter.navigate(view);
    });
  });

  // Section Scroll Links
  const scrollLinks = document.querySelectorAll('[data-scroll-to]');
  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-scroll-to');
      if (window.AppRouter.currentView !== 'landing') {
        window.AppRouter.navigate('landing');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // CTA Button "Going to attend the Interview" (Section 2 & 3)
  const ctaButtons = document.querySelectorAll('.btn-attend-interview');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      window.AuthModule.handleLandingCTA();
    });
  });

  // Auth Form Handlers
  const formSignup = document.getElementById('form-signup');
  const formLogin = document.getElementById('form-login');
  if (formSignup) formSignup.onsubmit = (e) => window.AuthModule.handleSignup(e);
  if (formLogin) formLogin.onsubmit = (e) => window.AuthModule.handleLogin(e);

  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnSignup = document.getElementById('tab-btn-signup');
  if (tabBtnLogin) tabBtnLogin.onclick = () => window.AuthModule.switchAuthTab('login');
  if (tabBtnSignup) tabBtnSignup.onclick = () => window.AuthModule.switchAuthTab('signup');

  // Candidate Profile Submit
  const formProfile = document.getElementById('candidate-profile-form');
  if (formProfile) formProfile.onsubmit = (e) => window.ProfileModule.handleSubmit(e);

  // Logout
  const btnLogout = document.getElementById('btn-nav-logout');
  if (btnLogout) btnLogout.onclick = () => window.AuthModule.logout();

  // Route to landing by default
  window.AppRouter.navigate('landing');
});
