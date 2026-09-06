/**
 * AI Interview Portal - Data Layer & Persistence Engine
 * Strictly adhering to PRD Section 10 Schema Specifications
 */

const STORAGE_KEYS = {
  USERS: 'ai_portal_users',
  PROFILES: 'ai_portal_candidate_profiles',
  RESUME_PARSED: 'ai_portal_resume_parsed_data',
  OTP: 'ai_portal_otp_verifications',
  SESSIONS: 'ai_portal_interview_sessions',
  VIOLATIONS: 'ai_portal_violation_logs',
  QA_LOG: 'ai_portal_interview_qa_log',
  SUMMARY: 'ai_portal_interview_summary',
  CURRENT_USER: 'ai_portal_current_user',
  CURRENT_SESSION: 'ai_portal_current_session_id'
};

const DEFAULT_QUESTION_BANK = [
  // Stage 1: Icebreaker / HR
  {
    category: 'icebreaker',
    questions: [
      "Welcome to our AI Proctored Interview. To start off, please introduce yourself, highlight your academic journey, and tell us what excites you about this role.",
      "Hello! Great to have you here. Could you walk us through your background and what motivated you to apply for our engineering team?"
    ]
  },
  // Stage 2: Standard HR / Behavioral
  {
    category: 'behavioral',
    questions: [
      "Can you describe a time when you faced an unexpected technical roadblock or team conflict during a project? How did you resolve it?",
      "Tell us about a situation where you had to quickly learn a new technology or framework under a tight deadline. How did you approach it?",
      "Where do you see your technical career trajectory in the next 3 to 5 years, and what skills are you proactively building right now?"
    ]
  },
  // Stage 4: Technical Core (by domain)
  {
    category: 'technical_cse',
    questions: [
      "How would you explain the differences between relational (SQL) and non-relational (NoSQL) databases, and how do you decide which one to use for a high-concurrency app?",
      "Walk us through how asynchronous execution and the event loop work in modern web runtimes.",
      "If an application API endpoint experiences a sudden 10x latency spike in production, what step-by-step diagnostic workflow would you follow?"
    ]
  }
];

class DataStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      // Seed initial demo candidate for easy testing
      const seedUser = {
        id: 'usr_demo_01',
        name: 'Arun Kumar',
        email: 'arun.tech@example.com',
        password_hash: 'Demo@123',
        email_verified: true,
        created_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([seedUser]));
    }
  }

  // Generic Get & Save
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return [];
    }
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  // Users
  findUserByEmail(email) {
    const users = this.get(STORAGE_KEYS.USERS);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData) {
    const users = this.get(STORAGE_KEYS.USERS);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...userData,
      email_verified: false,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    this.save(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  // Session State
  getCurrentUser() {
    try {
      const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  // Candidate Profile
  getProfileByUserId(userId) {
    const profiles = this.get(STORAGE_KEYS.PROFILES);
    return profiles.find(p => p.user_id === userId);
  }

  saveProfile(profileData) {
    const profiles = this.get(STORAGE_KEYS.PROFILES);
    const existingIndex = profiles.findIndex(p => p.user_id === profileData.user_id);
    const newProfile = {
      id: profileData.id || ('prof_' + Date.now()),
      ...profileData,
      updated_at: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    this.save(STORAGE_KEYS.PROFILES, profiles);
    return newProfile;
  }

  // Parsed Resume
  getParsedResume(profileId) {
    const parsed = this.get(STORAGE_KEYS.RESUME_PARSED);
    return parsed.find(r => r.candidate_profile_id === profileId);
  }

  saveParsedResume(resumeData) {
    const parsed = this.get(STORAGE_KEYS.RESUME_PARSED);
    const existingIndex = parsed.findIndex(r => r.candidate_profile_id === resumeData.candidate_profile_id);
    const record = {
      id: 'res_' + Date.now(),
      ...resumeData,
      parsed_at: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      parsed[existingIndex] = record;
    } else {
      parsed.push(record);
    }
    this.save(STORAGE_KEYS.RESUME_PARSED, parsed);
    return record;
  }

  // OTP Verification
  saveOTP(userId, otpCode) {
    const otps = this.get(STORAGE_KEYS.OTP);
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const record = {
      id: 'otp_' + Date.now(),
      user_id: userId,
      otp_code: otpCode,
      expires_at: expiry,
      verified_at: null,
      attempt_count: 0
    };
    otps.push(record);
    this.save(STORAGE_KEYS.OTP, otps);
    return record;
  }

  getLatestOTP(userId) {
    const otps = this.get(STORAGE_KEYS.OTP);
    const userOtps = otps.filter(o => o.user_id === userId);
    return userOtps.length > 0 ? userOtps[userOtps.length - 1] : null;
  }

  updateOTPRecord(record) {
    const otps = this.get(STORAGE_KEYS.OTP);
    const idx = otps.findIndex(o => o.id === record.id);
    if (idx >= 0) {
      otps[idx] = record;
      this.save(STORAGE_KEYS.OTP, otps);
    }
  }

  // Interview Sessions
  createSession(userId, fingerprint) {
    const sessions = this.get(STORAGE_KEYS.SESSIONS);
    const newSession = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      user_id: userId,
      status: 'in_progress', // not_started | in_progress | completed | terminated
      device_fingerprint: fingerprint || ('dev_fp_' + Math.random().toString(36).substr(2, 9)),
      screen_share_type: 'entire_screen',
      start_time: new Date().toISOString(),
      end_time: null,
      strike_count: 0,
      termination_reason: null
    };
    sessions.push(newSession);
    this.save(STORAGE_KEYS.SESSIONS, sessions);
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, newSession.id);
    return newSession;
  }

  getCurrentSession() {
    const sessId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!sessId) return null;
    const sessions = this.get(STORAGE_KEYS.SESSIONS);
    return sessions.find(s => s.id === sessId) || null;
  }

  updateSession(session) {
    const sessions = this.get(STORAGE_KEYS.SESSIONS);
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
      this.save(STORAGE_KEYS.SESSIONS, sessions);
    }
  }

  // Violations
  logViolation(sessionId, violationType) {
    const violations = this.get(STORAGE_KEYS.VIOLATIONS);
    const violation = {
      id: 'viol_' + Date.now(),
      session_id: sessionId,
      violation_type: violationType,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    violations.push(violation);
    this.save(STORAGE_KEYS.VIOLATIONS, violations);
    return violation;
  }

  getViolationsBySession(sessionId) {
    const violations = this.get(STORAGE_KEYS.VIOLATIONS);
    return violations.filter(v => v.session_id === sessionId);
  }

  // Q&A Log
  logQA(qaItem) {
    const qaLogs = this.get(STORAGE_KEYS.QA_LOG);
    const record = {
      id: 'qa_' + Date.now(),
      ...qaItem,
      asked_at: qaItem.asked_at || new Date().toISOString()
    };
    qaLogs.push(record);
    this.save(STORAGE_KEYS.QA_LOG, qaLogs);
    return record;
  }

  getQALogsBySession(sessionId) {
    const qaLogs = this.get(STORAGE_KEYS.QA_LOG);
    return qaLogs.filter(q => q.session_id === sessionId);
  }

  // Summary
  saveSummary(summaryData) {
    const summaries = this.get(STORAGE_KEYS.SUMMARY);
    const idx = summaries.findIndex(s => s.session_id === summaryData.session_id);
    const record = {
      id: 'sum_' + Date.now(),
      ...summaryData,
      generated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      summaries[idx] = record;
    } else {
      summaries.push(record);
    }
    this.save(STORAGE_KEYS.SUMMARY, summaries);
    return record;
  }

  getSummaryBySession(sessionId) {
    const summaries = this.get(STORAGE_KEYS.SUMMARY);
    return summaries.find(s => s.session_id === sessionId);
  }
}

// Global data store singleton
window.DataStore = new DataStore();
