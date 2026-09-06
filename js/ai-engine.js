/**
 * AI Interview Question Engine (Section 7)
 * Implements 5-Stage Adaptive Question Flow, Resume Project Deep-Dives,
 * Real-time Speech Synthesis (TTS), Speech-to-Text (STT), and Dynamic Follow-ups.
 */

window.AiEngine = {
  sessionId: null,
  currentStage: 1, // 1: Icebreaker, 2: Behavioral, 3: Project Deep-Dive, 4: Technical, 5: Adaptive Wrap-up
  currentQuestionIndex: 0,
  currentQuestionText: '',
  currentQuestionType: 'hr',
  isFollowUpQuestion: false,
  parentQuestionId: null,
  followUpCountForCurrent: 0,
  maxFollowUpsPerQuestion: 1,

  speechSynth: window.speechSynthesis,
  recognition: null,
  isListening: false,
  candidateAnswerBuffer: '',

  startInterview(sessionId) {
    this.sessionId = sessionId;
    this.currentStage = 1;
    this.currentQuestionIndex = 0;
    this.followUpCountForCurrent = 0;

    this.setupSpeechRecognition();
    this.setupUIListeners();
    this.loadNextQuestion();
  },

  setupUIListeners() {
    const btnSubmit = document.getElementById('btn-submit-answer');
    const btnToggleMic = document.getElementById('btn-toggle-mic');
    const transcriptBox = document.getElementById('candidate-answer-input');

    if (btnSubmit) {
      btnSubmit.onclick = () => this.handleAnswerSubmission();
    }

    if (btnToggleMic) {
      btnToggleMic.onclick = () => this.toggleMicrophoneCapture();
    }

    if (transcriptBox) {
      transcriptBox.oninput = (e) => {
        this.candidateAnswerBuffer = e.target.value;
      };
    }
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const inputEl = document.getElementById('candidate-answer-input');
        if (inputEl) {
          const currentText = this.candidateAnswerBuffer;
          const combined = (currentText ? currentText + ' ' : '') + finalTranscript + (interimTranscript ? ` (${interimTranscript})` : '');
          inputEl.value = combined;
        }
      };

      this.recognition.onerror = (e) => {
        console.warn('Speech recognition status:', e.error);
      };
    }
  },

  toggleMicrophoneCapture() {
    const micBtn = document.getElementById('btn-toggle-mic');
    const micStatus = document.getElementById('mic-status-label');

    if (!this.recognition) {
      window.AuthModule.showToast('Audio Input', 'Browser speech recognition not supported. You can type your response below.', 'info');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      if (micBtn) micBtn.classList.remove('btn-danger');
      if (micStatus) micStatus.textContent = 'Microphone Muted (Click to speak)';
    } else {
      try {
        this.recognition.start();
        this.isListening = true;
        if (micBtn) micBtn.classList.add('btn-danger');
        if (micStatus) micStatus.textContent = 'Listening to your voice... (Speak clearly)';
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  },

  // 5-Stage Question Assembly
  loadNextQuestion() {
    const currentUser = window.DataStore.getCurrentUser();
    const profile = currentUser ? window.DataStore.getProfileByUserId(currentUser.id) : null;
    const parsedResume = profile ? window.DataStore.getParsedResume(profile.id) : null;

    let nextQ = "";
    let qType = "hr";
    let isAdaptive = false;

    // Update Stage UI
    this.updateStagePills();

    const proj = (parsedResume && parsedResume.projects && parsedResume.projects.length > 0) 
                 ? parsedResume.projects[0] 
                 : { name: "Full-Stack Distributed System", tech: "Node.js, PostgreSQL, Redis, Docker" };

    const branch = profile ? profile.branch : "Computer Science";
    const skills = (parsedResume && parsedResume.skills) ? parsedResume.skills.slice(0, 4).join(", ") : "JavaScript, APIs, Database Design, Caching";

    switch (this.currentStage) {
      case 1: // 1. Icebreaker / Background
        nextQ = "Welcome to your proctored evaluation. Please start by introducing yourself, your technical journey, and why you are excited to apply for our engineering team.";
        qType = "icebreaker";
        break;

      case 2: // 2. Behavioral & Conflict Resolution
        nextQ = "Describe a challenging situation in a team project where team members had conflicting ideas on system architecture or implementation. How did you resolve the deadlock and align everyone?";
        qType = "behavioral";
        break;

      case 3: // 3. Resume Project Overview & Problem Solved
        nextQ = `In your resume, you highlighted '${proj.name}'. Could you walk us through the high-level business or technical problem this project solved, who the end-users were, and how the overall system is architected?`;
        qType = "project_overview";
        break;

      case 4: // 4. Project Ownership & Individual Contribution
        nextQ = `Regarding '${proj.name}', what was your specific personal technical ownership? Which exact modules, APIs, or database schemas did you design and implement yourself versus relying on open-source libraries or teammates?`;
        qType = "project_ownership";
        break;

      case 5: // 5. Tools & Tech Stack Selection (Why These Tools?)
        nextQ = `You chose to build '${proj.name}' using ${proj.tech}. Why did you specifically choose these tools over alternative technologies (for example, why your chosen database, framework, or runtime)? What technical trade-offs did you evaluate?`;
        qType = "tools_selection";
        break;

      case 6: // 6. Tooling Integration, Workflow & CI/CD Pipelines
        nextQ = `How did you practically integrate and deploy these tools in your development workflow? Did you use Docker containers, Git branching models, CI/CD automated pipelines, or cloud hosting? Walk us through how code moved from your local machine to deployment.`;
        qType = "tools_integration";
        break;

      case 7: // 7. Technical Challenges, Roadblocks & Hardest Bug Solved
        nextQ = `During the development of '${proj.name}', what was the most difficult technical bug, latency bottleneck, or architectural failure you ran into? How did you profile, debug, and ultimately resolve it?`;
        qType = "troubleshooting";
        break;

      case 8: // 8. Scalability, Concurrency & Database Optimization
        nextQ = `If '${proj.name}' experiences a sudden 20x spike in concurrent active requests, where will the system bottleneck first? How would you implement caching (e.g., Redis), database indexing, or horizontal scaling to maintain sub-100ms response times?`;
        qType = "scalability";
        break;

      case 9: // 9. Engineering Best Practices, Testing & Security
        nextQ = `How did you guarantee software reliability and security in your project? Walk us through your automated testing strategy (unit, integration, or API testing) and how you secured sensitive data, API endpoints, or user authentication tokens.`;
        qType = "best_practices";
        break;

      case 10: // 10. Career Vision & Engineering Impact
        nextQ = `Reflecting on your journey and the projects you've built, what is the single most valuable engineering lesson you learned, and what emerging engineering paradigm or architecture are you most excited to master next in our team?`;
        qType = "career_vision";
        break;

      default:
        this.completeInterview();
        return;
    }

    this.currentQuestionText = nextQ;
    this.currentQuestionType = qType;
    this.isFollowUpQuestion = isAdaptive;

    this.renderQuestionUI(nextQ, qType, isAdaptive);
    this.speakQuestion(nextQ);
  },

  updateStagePills() {
    const pills = document.querySelectorAll('.stage-step-pill');
    pills.forEach((pill, idx) => {
      if (idx + 1 === this.currentStage) {
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        pill.classList.remove('active');
      }
    });

    const progressFill = document.getElementById('interview-progress-fill');
    const counterEl = document.getElementById('question-counter-text');
    if (progressFill) {
      progressFill.style.width = `${(this.currentStage / 10) * 100}%`;
    }
    if (counterEl) {
      counterEl.textContent = `Stage ${this.currentStage} of 10`;
    }
  },

  renderQuestionUI(questionText, qType, isAdaptive) {
    const qEl = document.getElementById('ai-question-text');
    const typeBadge = document.getElementById('ai-question-type-badge');
    const adaptiveBadge = document.getElementById('adaptive-followup-badge');
    const inputEl = document.getElementById('candidate-answer-input');

    if (qEl) qEl.textContent = questionText;
    if (typeBadge) typeBadge.textContent = qType.toUpperCase();
    if (adaptiveBadge) {
      if (isAdaptive) adaptiveBadge.classList.add('active');
      else adaptiveBadge.classList.remove('active');
    }

    if (inputEl) {
      inputEl.value = '';
      this.candidateAnswerBuffer = '';
      inputEl.placeholder = "Speak using your microphone or type your response here...";
    }
  },

  speakQuestion(text) {
    if (!this.speechSynth) return;

    this.speechSynth.cancel(); // cancel any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick modern natural voice if available
    const voices = this.speechSynth.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    const avatarCore = document.getElementById('ai-avatar-core');
    utterance.onstart = () => {
      if (avatarCore) avatarCore.classList.add('speaking');
    };
    utterance.onend = () => {
      if (avatarCore) avatarCore.classList.remove('speaking');
    };
    utterance.onerror = () => {
      if (avatarCore) avatarCore.classList.remove('speaking');
    };

    this.speechSynth.speak(utterance);
  },

  handleAnswerSubmission() {
    const inputEl = document.getElementById('candidate-answer-input');
    const answer = inputEl ? inputEl.value.trim() : '';

    if (!answer || answer.length < 10) {
      window.AuthModule.showToast('Elaborate Response', 'Please provide a more detailed answer before continuing.', 'warning');
      return;
    }

    // Stop microphone if listening
    if (this.isListening && this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      const micBtn = document.getElementById('btn-toggle-mic');
      if (micBtn) micBtn.classList.remove('btn-danger');
    }

    // Log Q&A in DataStore (Section 10)
    const currentQId = 'q_' + Date.now();
    window.DataStore.logQA({
      session_id: this.sessionId,
      sequence_no: this.currentQuestionIndex + 1,
      question_text: this.currentQuestionText,
      question_type: this.currentQuestionType,
      answer_text: answer,
      is_followup: this.isFollowUpQuestion,
      parent_question_id: this.parentQuestionId,
      answered_at: new Date().toISOString()
    });

    this.currentQuestionIndex++;

    // Section 7.4: Adaptive Follow-Up Engine ("Why did you say that" behavior)
    const shouldAskFollowUp = this.evaluateAdaptiveFollowUp(answer);

    if (shouldAskFollowUp && this.followUpCountForCurrent < this.maxFollowUpsPerQuestion) {
      this.followUpCountForCurrent++;
      this.generateAdaptiveFollowUp(answer);
    } else {
      this.followUpCountForCurrent = 0;
      this.currentStage++;
      if (this.currentStage > 5) {
        this.completeInterview();
      } else {
        this.loadNextQuestion();
      }
    }
  },

  // Adaptive Follow-Up Trigger Evaluation (Section 7.4)
  evaluateAdaptiveFollowUp(answer) {
    // Check if in project or technical stage and answer contains interesting trigger terms
    if (this.currentStage === 3 || this.currentStage === 4) {
      const triggers = ['alone', 'solo', 'failed', 'bottleneck', 'redis', 'latency', 'scaled', 'refactored', 'microservice', 'distributed', 'security'];
      const lower = answer.toLowerCase();
      return triggers.some(t => lower.includes(t));
    }
    return false;
  },

  // Generate real-time contextual follow-up (Section 7.4)
  generateAdaptiveFollowUp(answer) {
    const lower = answer.toLowerCase();
    let followUp = "";

    if (lower.includes('alone') || lower.includes('solo')) {
      followUp = "You mentioned that you tackled the backend architecture alone. Looking back, what was the steepest technical roadblock you had to resolve without peer assistance?";
    } else if (lower.includes('bottleneck') || lower.includes('latency')) {
      followUp = "You noted identifying a latency bottleneck. Walk us through the exact metrics and debugging tools you used to isolate and measure the improvement.";
    } else if (lower.includes('redis') || lower.includes('cache')) {
      followUp = "You brought up caching with Redis. How did you handle cache invalidation and ensure strong consistency with your primary database?";
    } else {
      followUp = "You made an insightful point in that answer. Could you elaborate on how you validated the performance and resilience of that approach under stress?";
    }

    this.currentQuestionText = followUp;
    this.currentQuestionType = 'followup';
    this.isFollowUpQuestion = true;

    window.AuthModule.showToast('Adaptive Follow-up', 'The AI interviewer is probing deeper based on your response.', 'info');

    this.renderQuestionUI(followUp, 'Adaptive Follow-Up', true);
    this.speakQuestion(followUp);
  },

  completeInterview() {
    if (this.speechSynth) this.speechSynth.cancel();

    // Stop Proctoring
    if (window.ProctorEngine) {
      window.ProctorEngine.stopMonitoring();
    }

    // Update Session status
    const session = window.DataStore.getCurrentSession();
    if (session) {
      session.status = 'completed';
      session.end_time = new Date().toISOString();
      window.DataStore.updateSession(session);
    }

    // Exit Fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    window.AuthModule.showToast('Interview Completed!', 'Generating recruiter evaluation report & transcript...', 'success');

    // Route to Recruiter Dashboard (Section 7.6)
    setTimeout(() => {
      window.AppRouter.navigate('recruiter');
      if (window.RecruiterModule) {
        window.RecruiterModule.generateReport(this.sessionId);
      }
    }, 1000);
  }
};
