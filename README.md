# Aegis AI Interview Portal ⚡

> Next-Generation AI-Powered Proctored Interview Platform with Real-Time Anti-Cheat, Automated Identity Verification, and Recruiter Intelligence Dashboard.

[![Live Demo](https://img.shields.io/badge/Demo-Localhost%3A8080-brightgreen)](http://localhost:8080)
[![Tech](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20%7C%20PowerShell-blue)](/)
[![Security](https://img.shields.io/badge/Proctoring-Anti--Extension%20Guard-orange)](/)

---

## 🌟 Key Features

### 1. 🛡️ Advanced Anti-Cheat & Anti-Extension Guard
- **Extension Neutralization:** Detects and defeats extensions like "Always Active Window", focus-spoofers, and iframe wrappers.
- **Fullscreen & Focus Enforcement:** Automatically monitors window blur, tab switching, and developer tools inspection.
- **3-Strike Auto-Termination:** Provides strict candidate integrity with instantaneous session termination on repeated violations.

### 2. 📧 Automated Email OTP Verification
- **Real-Time SMTP Dispatch:** Real 6-digit verification codes sent directly to any candidate's email (`@gmail.com`, `@yahoo.com`, `@outlook.com`).
- **One-Time Gmail App Password Architecture:** Secure sender authentication via Google App Passwords.
- **Interactive Setup Guide:** Built-in graphical walkthrough (`/setup-guide.html`) with instant configuration testing.
- **On-Screen Fallback:** Display of alternate verification code if network delays occur.

### 3. 🤖 AI-Powered Adaptive Interview Engine (10 Core Dimensions)
1. **Icebreaker & Self-Introduction:** Professional journey and communication poise.
2. **Behavioral & Conflict Resolution:** Team collaboration and stakeholder alignment.
3. **Project Architecture Overview:** High-level design and engineering rationale.
4. **Individual Ownership & Impact:** Specific modules, APIs, and key contributions.
5. **Tool & Stack Selection:** Evaluation of chosen frameworks and trade-offs.
6. **CI/CD & DevOps Workflow:** Build pipelines, Docker containers, and deployment strategies.
7. **Production Debugging & Root Cause:** Hardest bug faced and resolution methodology.
8. **Scalability & High Availability:** Handling 20x traffic spikes, database sharding, and caching.
9. **Quality, Security & Standards:** Unit testing, OWASP compliance, and code review practices.
10. **Vision & Long-Term Trajectory:** Career aspirations and technological adaptability.

### 4. 📊 Recruiter Evaluation Intelligence
- Real-time scoring across Technical Competence, Problem Solving, Communication, and Integrity.
- Automated generation of recruitment summary, key strengths, red flags, and hiring recommendations.
- One-click evaluation report export.

---

## 🚀 Getting Started

### Quick Start (Windows)
Double-click `START_PORTAL.bat` or run via PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Open your browser and navigate to:
- **Main Portal:** `http://localhost:8080`
- **Gmail OTP Setup Guide:** `http://localhost:8080/setup-guide.html`

---

## 📁 Project Structure

```
ai-interview-portal/
├── index.html              # Main SPA portal interface
├── setup-guide.html        # Interactive Gmail App Password setup guide
├── server.ps1              # High-performance HTTP server & SMTP email dispatcher
├── smtp_config.json        # SMTP credentials (git-ignored for security)
├── smtp_config.example.json# Template for SMTP configuration
├── START_PORTAL.bat        # One-click Windows startup script
├── css/
│   ├── main.css            # Design system, glassmorphism & typography
│   ├── landing.css         # Hero, Vision/Mission & features
│   ├── auth-profile.css    # Authentication & candidate onboarding
│   ├── interview.css       # Proctored interview UI & video feed
│   ├── proctor.css         # Anti-cheat warning alerts & strike monitors
│   └── recruiter.css       # Recruiter evaluation scorecard
├── js/
│   ├── app.js              # State router & navigation controller
│   ├── auth.js             # User session management
│   ├── otp.js              # Real email OTP dispatch & fallback logic
│   ├── profile.js          # Candidate resume upload & document parsing
│   ├── diagnostics.js      # Camera & microphone readiness check
│   ├── proctor.js          # Fullscreen, tab switch, & strike tracking
│   ├── anti-extension.js   # Anti-cheat guard against browser extensions
│   ├── ai-engine.js        # 10 AI interview questions & response recorder
│   ├── recruiter.js        # Recruiter scoring & evaluation report engine
│   └── demo-tour.js        # Automated live demonstration walkthrough
└── electron-app/           # Optional native lockdown browser wrapper
```

---

## 🔒 Security Notice
Do not commit `smtp_config.json` with active credentials. Always use `smtp_config.example.json` as the configuration reference.

---

## 👤 Author
- **Kishor** ([@kishor1432502](https://github.com/kishor1432502))
