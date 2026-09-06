/**
 * AI Interview Portal - Candidate Profile & Resume Parser Module
 * Implements Section 4 & Section 7.2 of PRD
 */

window.ProfileModule = {
  currentCgpaScale: '10', // '10' or '4'
  idProofFile: null,
  resumeFile: null,
  parsedResumeData: null,

  init() {
    // Set up College "Other" toggle
    const collegeSelect = document.getElementById('prof-college');
    const collegeOtherWrap = document.getElementById('prof-college-other-wrap');
    if (collegeSelect && collegeOtherWrap) {
      collegeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
          collegeOtherWrap.style.display = 'block';
          document.getElementById('prof-college-other').required = true;
        } else {
          collegeOtherWrap.style.display = 'none';
          document.getElementById('prof-college-other').required = false;
        }
      });
    }

    // Set up Graduation Status toggle (Completed vs Pursuing)
    const radCompleted = document.getElementById('grad-completed');
    const radPursuing = document.getElementById('grad-pursuing');
    const batchYearLabel = document.getElementById('batch-year-label');

    const updateGradLabel = () => {
      if (radCompleted && radCompleted.checked) {
        if (batchYearLabel) batchYearLabel.textContent = "Year of Graduation *";
      } else {
        if (batchYearLabel) batchYearLabel.textContent = "Expected Year of Graduation *";
      }
    };

    if (radCompleted) radCompleted.addEventListener('change', updateGradLabel);
    if (radPursuing) radPursuing.addEventListener('change', updateGradLabel);

    // ID proof file drag & drop
    this.setupDropzone('id-card-dropzone', 'id-card-input', 'id-card-preview', (file) => {
      this.idProofFile = file;
    });

    // Resume file drag & drop + auto parser
    this.setupDropzone('resume-dropzone', 'resume-input', 'resume-preview', (file) => {
      this.resumeFile = file;
      this.parseResume(file);
    });

    // Setup CGPA scale toggle
    const btnScale10 = document.getElementById('scale-10-btn');
    const btnScale4 = document.getElementById('scale-4-btn');
    const cgpaInput = document.getElementById('prof-cgpa');

    if (btnScale10 && btnScale4) {
      btnScale10.addEventListener('click', () => {
        this.currentCgpaScale = '10';
        btnScale10.classList.add('active');
        btnScale4.classList.remove('active');
        if (cgpaInput) {
          cgpaInput.max = "10";
          cgpaInput.placeholder = "e.g. 8.75 (0 - 10 scale)";
        }
      });

      btnScale4.addEventListener('click', () => {
        this.currentCgpaScale = '4';
        btnScale4.classList.add('active');
        btnScale10.classList.remove('active');
        if (cgpaInput) {
          cgpaInput.max = "4";
          cgpaInput.placeholder = "e.g. 3.80 (0 - 4 scale)";
        }
      });
    }
  },

  populateUserEmail(email, name) {
    const emailInput = document.getElementById('prof-email');
    const nameInput = document.getElementById('prof-fullname');
    if (emailInput) emailInput.value = email || '';
    if (nameInput && name) nameInput.value = name || '';
  },

  setupDropzone(dropzoneId, inputId, previewId, onFileSelected) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!dropzone || !input) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        input.files = e.dataTransfer.files;
        this.handleFilePill(file, preview);
        onFileSelected(file);
      }
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        this.handleFilePill(file, preview);
        onFileSelected(file);
      }
    });
  },

  handleFilePill(file, previewElement) {
    if (!previewElement) return;
    previewElement.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    previewElement.classList.add('active');
  },

  // Resume Parsing Step (Section 7.2)
  parseResume(file) {
    window.AuthModule.showToast('Parsing Resume', 'Analyzing technical skills & project achievements...', 'info');

    // Simulate AI / Regex resume parsing from candidate's profile and file metadata
    setTimeout(() => {
      const skillsPool = ["JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "PostgreSQL", "Docker", "RESTful APIs", "Git"];
      const projectsPool = [
        {
          name: "Real-Time Microservices Task Engine",
          tech: "Node.js, Redis, PostgreSQL, Docker",
          role: "Solo Backend Engineer",
          description: "Engineered scalable distributed event bus processing 5,000+ jobs/min with automated dead-letter queues."
        },
        {
          name: "Smart Resume Screener & Semantic Ranker",
          tech: "Python, FastAPI, SentenceTransformers, React",
          role: "Full-Stack Developer",
          description: "Implemented high-accuracy candidate matching system reducing screening turnaround time by 60%."
        }
      ];

      this.parsedResumeData = {
        skills: skillsPool,
        work_experience: [
          { company: "InnoTech Labs", role: "Software Engineering Intern", duration: "6 Months", description: "Built microservices and integrated WebRTC pipelines." }
        ],
        projects: projectsPool,
        certifications: ["AWS Certified Cloud Practitioner", "HackerRank Problem Solving 5-Star"]
      };

      // Display parsed chips
      const chipsContainer = document.getElementById('parsed-skills-container');
      if (chipsContainer) {
        chipsContainer.innerHTML = '';
        skillsPool.forEach(skill => {
          const chip = document.createElement('span');
          chip.className = 'skill-chip';
          chip.textContent = skill;
          chipsContainer.appendChild(chip);
        });
        document.getElementById('parsed-resume-feedback').style.display = 'block';
      }

      window.AuthModule.showToast('Resume Parsed!', 'Extracted skills and projects ready for AI interview personalization.', 'success');
    }, 700);
  },

  // Validate GitHub, LinkedIn, and form fields
  handleSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('prof-fullname').value.trim();
    const collegeSelect = document.getElementById('prof-college').value;
    const collegeOther = document.getElementById('prof-college-other').value.trim();
    const collegeName = collegeSelect === 'Other' ? collegeOther : collegeSelect;
    const cgpa = parseFloat(document.getElementById('prof-cgpa').value);
    const githubUrl = document.getElementById('prof-github').value.trim();
    const linkedinUrl = document.getElementById('prof-linkedin').value.trim();
    const leetcodeUrl = document.getElementById('prof-leetcode').value.trim();
    const gradStatus = document.querySelector('input[name="grad_status"]:checked')?.value;
    const batchYear = document.getElementById('prof-batch').value.trim();
    const degree = document.getElementById('prof-degree').value;
    const branch = document.getElementById('prof-branch').value;
    const email = document.getElementById('prof-email').value.trim().toLowerCase();

    // Validations
    if (!fullName || !collegeName || isNaN(cgpa) || !gradStatus || !batchYear || !degree || !branch || !email) {
      window.AuthModule.showToast('Incomplete Profile', 'Please complete all mandatory fields marked with an asterisk (*).', 'danger');
      return;
    }

    // CGPA Range Validation
    const maxCgpa = this.currentCgpaScale === '10' ? 10 : 4;
    if (cgpa < 0 || cgpa > maxCgpa) {
      window.AuthModule.showToast('Invalid CGPA', `CGPA must be between 0 and ${maxCgpa} for the selected scale.`, 'danger');
      return;
    }

    // Mandatory GitHub Domain Validation (Section 4)
    const githubRegex = /^https?:\/\/([a-z0-9-]+\.)?github\.com\/[A-Za-z0-9_.-]+\/?.*$/i;
    if (!githubRegex.test(githubUrl)) {
      window.AuthModule.showToast('Invalid GitHub URL', 'Please enter a valid GitHub profile link (e.g., https://github.com/username).', 'danger');
      document.getElementById('prof-github').focus();
      return;
    }

    // Mandatory LinkedIn Domain Validation (Section 4)
    const linkedinRegex = /^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/in\/[A-Za-z0-9_.-]+\/?.*$/i;
    if (!linkedinRegex.test(linkedinUrl)) {
      window.AuthModule.showToast('Invalid LinkedIn URL', 'Please enter a valid LinkedIn profile link (e.g., https://linkedin.com/in/username).', 'danger');
      document.getElementById('prof-linkedin').focus();
      return;
    }

    // LeetCode validation if provided
    if (leetcodeUrl && !/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?[A-Za-z0-9_-]+\/?$/i.test(leetcodeUrl)) {
      window.AuthModule.showToast('Invalid LeetCode URL', 'Please enter a valid LeetCode profile URL or leave it empty.', 'danger');
      document.getElementById('prof-leetcode').focus();
      return;
    }

    const currentUser = window.DataStore.getCurrentUser();
    const userId = currentUser ? currentUser.id : 'usr_' + Date.now();

    // Save candidate profile
    const savedProfile = window.DataStore.saveProfile({
      user_id: userId,
      college_name: collegeName,
      is_other_college: collegeSelect === 'Other',
      cgpa: cgpa,
      id_proof_url: this.idProofFile ? this.idProofFile.name : 'id_proof_default.png',
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      leetcode_url: leetcodeUrl || null,
      graduation_status: gradStatus,
      batch_year: batchYear,
      degree: degree,
      branch: branch,
      resume_url: this.resumeFile ? this.resumeFile.name : 'resume_candidate.pdf',
      email: email,
      full_name: fullName
    });

    // Save parsed resume data
    if (!this.parsedResumeData) {
      this.parsedResumeData = {
        skills: ["JavaScript", "Python", "Data Structures", "Web Development"],
        projects: [
          { name: "Full-Stack Web App", tech: "JavaScript, HTML, CSS", role: "Developer", description: "Engineered responsive client architecture." }
        ],
        work_experience: [],
        certifications: []
      };
    }

    window.DataStore.saveParsedResume({
      candidate_profile_id: savedProfile.id,
      ...this.parsedResumeData
    });

    window.AuthModule.showToast('Profile Saved!', 'Profile verified. Proceeding to Email OTP verification gate.', 'success');

    // Trigger OTP Flow (Section 5)
    if (window.OtpModule) {
      window.OtpModule.initiateOTP(userId, email);
    }
  },

  quickFillDemo() {
    const fn = document.getElementById('prof-fullname');
    const em = document.getElementById('prof-email');
    const col = document.getElementById('prof-college');
    const cg = document.getElementById('prof-cgpa');
    const gh = document.getElementById('prof-github');
    const li = document.getElementById('prof-linkedin');
    const lc = document.getElementById('prof-leetcode');
    const yr = document.getElementById('prof-batch');
    const deg = document.getElementById('prof-degree');
    const br = document.getElementById('prof-branch');

    if (fn) fn.value = "Arun Kumar";
    if (em) em.value = "arun.tech@example.com";
    if (col) col.value = "Anna University";
    if (cg) cg.value = "8.85";
    if (gh) gh.value = "https://github.com/arunkumar-tech";
    if (li) li.value = "https://linkedin.com/in/arunkumar-tech";
    if (lc) lc.value = "https://leetcode.com/arunkumar";
    if (yr) yr.value = "2025";
    if (deg) deg.value = "B.Tech";
    if (br) br.value = "Computer Science and Engineering (CSE)";

    // Set sample files
    this.idProofFile = { name: "arun_college_id.pdf", size: 245000 };
    this.resumeFile = { name: "arun_kumar_resume.pdf", size: 512000 };
    
    // Remove native required attribute on file inputs so submit works seamlessly
    const idInput = document.getElementById('id-card-input');
    const resInput = document.getElementById('resume-input');
    if (idInput) idInput.required = false;
    if (resInput) resInput.required = false;

    this.handleFilePill(this.idProofFile, document.getElementById('id-card-preview'));
    this.handleFilePill(this.resumeFile, document.getElementById('resume-preview'));

    this.parseResume(this.resumeFile);
    window.AuthModule.showToast('Demo Data Loaded', 'Sample candidate profile populated with verified GitHub and LinkedIn URLs.', 'info');
  }
};

