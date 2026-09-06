/**
 * AI Interview Portal - Authentication Module
 * Manages Signup, Login, Password validation, and CTA routing logic (Section 3)
 */

window.AuthModule = {
  // Show toast utility
  showToast(title, desc, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(60px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  // Evaluate Landing Page CTA routing (Section 2 & 3)
  handleLandingCTA() {
    const currentUser = window.DataStore.getCurrentUser();
    if (currentUser) {
      // User is logged in -> route to Profile
      window.AppRouter.navigate('profile');
      this.showToast("Welcome Back!", `Logged in as ${currentUser.email}`, 'info');
      return;
    }

    // Check if any registered user exists in system
    const allUsers = window.DataStore.get(STORAGE_KEYS.USERS);
    if (allUsers && allUsers.length > 0) {
      // Show email gate or direct to login
      window.AppRouter.navigate('auth');
      this.switchAuthTab('login');
    } else {
      window.AppRouter.navigate('auth');
      this.switchAuthTab('signup');
    }
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    const loginTabBtn = document.getElementById('tab-btn-login');
    const signupTabBtn = document.getElementById('tab-btn-signup');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
      if (loginTabBtn) loginTabBtn.classList.add('active');
      if (signupTabBtn) signupTabBtn.classList.remove('active');
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (loginTabBtn) loginTabBtn.classList.remove('active');
      if (signupTabBtn) signupTabBtn.classList.add('active');
    }
  },

  handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) {
      this.showToast('Validation Error', 'Please fill in all required fields.', 'danger');
      return;
    }

    if (password !== confirmPassword) {
      this.showToast('Password Mismatch', 'Passwords do not match. Please verify.', 'danger');
      return;
    }

    if (password.length < 6) {
      this.showToast('Weak Password', 'Password must be at least 6 characters.', 'warning');
      return;
    }

    const existingUser = window.DataStore.findUserByEmail(email);
    if (existingUser) {
      this.showToast('Account Exists', 'An account with this email already exists. Please log in.', 'warning');
      this.switchAuthTab('login');
      document.getElementById('login-email').value = email;
      return;
    }

    // Create user
    const newUser = window.DataStore.createUser({
      name,
      email,
      password_hash: password // simulated secure hash
    });

    window.DataStore.setCurrentUser(newUser);
    this.showToast('Account Created!', 'Welcome! Please complete your candidate profile.', 'success');
    window.AppRouter.navigate('profile');
    if (window.ProfileModule) {
      window.ProfileModule.populateUserEmail(email, name);
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showToast('Missing Credentials', 'Please provide both email and password.', 'danger');
      return;
    }

    const user = window.DataStore.findUserByEmail(email);
    if (!user || user.password_hash !== password) {
      this.showToast('Authentication Failed', 'Invalid email or password combination.', 'danger');
      return;
    }

    window.DataStore.setCurrentUser(user);
    this.showToast('Login Successful', `Welcome back, ${user.name}!`, 'success');

    // Route to Candidate Profile
    window.AppRouter.navigate('profile');
    if (window.ProfileModule) {
      window.ProfileModule.populateUserEmail(user.email, user.name);
    }
  },

  logout() {
    window.DataStore.setCurrentUser(null);
    this.showToast('Logged Out', 'You have been successfully signed out.', 'info');
    window.AppRouter.navigate('landing');
  }
};
