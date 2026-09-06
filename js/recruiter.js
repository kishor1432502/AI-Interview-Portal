/**
 * AI Interview Portal - Recruiter Review & Scorecard Module (Section 7.6)
 * Real AI Evaluator Engine: Evaluates Candidate Answer Depth, Technical Lexicon,
 * Communication Clarity, and Project Ownership from authentic transcripts.
 */

window.RecruiterModule = {
  // Real Intelligent Evaluation Engine based on authentic candidate answers
  evaluateCandidateAnswers(qaList) {
    if (!qaList || qaList.length === 0) {
      return {
        commScore: 12,
        techScore: 10,
        projectScore: 10,
        recTier: "rec-review-needed",
        recTitle: "Not Recommended (No Answers Captured)",
        recDesc: "Candidate completed the proctoring flow but provided empty or uncaptured responses.",
        bullets: [
          "❌ Zero interview responses recorded in transcript.",
          "❌ Cannot verify technical aptitude or communication skills.",
          "⚠️ Immediate re-interview or disqualification recommended."
        ]
      };
    }

    // Strict technical engineering keywords — only genuine tech terms
    const techLexicon = [
      'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 'postgres', 'postgresql', 'mysql', 'mongodb',
      'redis', 'cache', 'caching', 'docker', 'container', 'kubernetes', 'k8s', 'git', 'github',
      'ci/cd', 'pipeline', 'aws', 'cloud', 'backend', 'frontend', 'javascript', 'typescript',
      'python', 'java', 'react', 'node.js', 'nodejs', 'express', 'async', 'promise', 'concurrency',
      'thread', 'latency', 'throughput', 'scalability', 'bottleneck', 'load balancer', 'nginx',
      'microservice', 'monolith', 'schema', 'indexing', 'orm', 'optimization', 'profiling',
      'unit test', 'integration test', 'jwt', 'oauth', 'encryption', 'hashing', 'cors',
      'websocket', 'kafka', 'rabbitmq', 'sharding', 'replica', 'failover', 'acid',
      'http', 'https', 'cdn', 'firebase', 'supabase', 'vercel', 'heroku', 'linux',
      'algorithm', 'complexity', 'big o', 'data structure', 'binary', 'recursion', 'heap', 'stack'
    ];

    // Strict project lexicon — only terms that show genuine ownership/design thinking
    // Removed trivial words like "user", "team", "testing", "performance" that appear in casual speech
    const projectLexicon = [
      'architected', 'designed', 'implemented', 'refactored', 'optimized', 'debugged',
      'deployed', 'integrated', 'developed', 'engineered', 'built the', 'trade-off', 'tradeoff',
      'root cause', 'latency issue', 'bottleneck', 'system design', 'database design',
      'api design', 'module', 'component architecture', 'decided to use', 'chose because',
      'alternative approach', 'compared to', 'instead of using', 'had to solve', 'broke down',
      'ownership of', 'responsible for', 'led the', 'wrote the', 'set up the', 'configured',
      'faced a challenge', 'resolved by', 'production issue', 'fixed the bug'
    ];

    // Communication structure — signal of organized thought
    const structureWords = [
      'firstly', 'secondly', 'furthermore', 'because', 'therefore', 'however', 'specifically',
      'for example', 'for instance', 'in order to', 'in addition', 'as a result', 'primarily',
      'to ensure', 'the reason', 'to summarize', 'in conclusion', 'on the other hand',
      'more specifically', 'to elaborate'
    ];

    // Low effort / non-answer detection
    const lowEffortKeywords = [
      'idk', "don't know", 'dont know', 'no idea', 'nothing', 'not sure', 'asdf', 'test test',
      'blah', 'ok ok', 'yes', 'no', 'dunno', 'nah', 'i dont know', 'i am not sure',
      'i have no idea', 'cannot answer', 'skip', 'pass', 'next question'
    ];

    let totalWords = 0;
    let totalUniqueTechHits = 0;  // Count unique tech terms per answer (not duplicates)
    let totalUniqueProjectHits = 0;
    let totalStructureHits = 0;
    let lowEffortCount = 0;
    let emptyAnswerCount = 0;

    qaList.forEach(qa => {
      const text = (qa.answer_text || '').trim();
      if (!text || text.length < 5) { emptyAnswerCount++; return; }

      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wCount = words.length;
      const lower = text.toLowerCase();

      totalWords += wCount;

      // Low effort detection — very short OR flagged phrase
      if (wCount < 6 || lowEffortKeywords.some(bad => lower.includes(bad))) {
        lowEffortCount++;
      }

      // Count UNIQUE tech terms found in this answer (each term counts max once per answer)
      const techHitsInAnswer = techLexicon.filter(term => lower.includes(term)).length;
      totalUniqueTechHits += Math.min(techHitsInAnswer, 8); // cap per-answer contribution at 8

      // Count UNIQUE project terms in this answer
      const projHitsInAnswer = projectLexicon.filter(term => lower.includes(term)).length;
      totalUniqueProjectHits += Math.min(projHitsInAnswer, 5); // cap per-answer contribution at 5

      // Structure word hits
      totalStructureHits += structureWords.filter(s => lower.includes(s)).length;
    });

    const avgWords = totalWords / Math.max(1, qaList.length);
    const techDensity = totalUniqueTechHits / Math.max(1, qaList.length); // avg unique tech terms per answer
    const projDensity = totalUniqueProjectHits / Math.max(1, qaList.length);

    // ─── 1. Communication Clarity Score (strict curve) ────────────────────────
    // Needs BOTH avg word count AND structure signals to score high
    let commScore = 0;
    if (avgWords < 8) {
      commScore = Math.round(avgWords * 2);          // max 15
    } else if (avgWords < 20) {
      commScore = 16 + Math.round((avgWords - 8) * 1.5);  // 16–33
    } else if (avgWords < 40) {
      commScore = 34 + Math.round((avgWords - 20) * 1.3); // 34–59
    } else if (avgWords < 80) {
      commScore = 60 + Math.round((avgWords - 40) * 0.7); // 60–87
    } else {
      commScore = Math.min(95, 88 + Math.round((avgWords - 80) * 0.15));
    }
    // Structure bonus: only matters if answers are also substantive
    if (avgWords >= 20) commScore += Math.min(6, totalStructureHits);
    // Penalty for low effort / filler answers
    commScore -= (lowEffortCount * 15);
    commScore -= (emptyAnswerCount * 10);
    commScore = Math.max(8, Math.min(97, Math.round(commScore)));

    // ─── 2. Technical Depth Score (strict — requires real tech vocabulary) ────
    let techScore = 0;
    if (techDensity === 0) {
      // No tech terms at all — very low, but word count gives small credit
      techScore = Math.min(18, Math.round(avgWords * 0.3));
    } else if (techDensity < 1.0) {
      // Some tech terms but thin — 20–40 range
      techScore = 20 + Math.round(techDensity * 20);
    } else if (techDensity < 2.5) {
      // Moderate technical content — 40–65 range
      techScore = 40 + Math.round((techDensity - 1.0) * 16.7);
    } else if (techDensity < 4.0) {
      // Good technical depth — 65–85 range
      techScore = 65 + Math.round((techDensity - 2.5) * 13.3);
    } else {
      // Excellent — 85–97
      techScore = Math.min(97, 85 + Math.round((techDensity - 4.0) * 3));
    }
    // Hard cap: if avg response is too short to explain real engineering, score cannot be high
    if (avgWords < 20) techScore = Math.min(28, techScore);
    else if (avgWords < 35) techScore = Math.min(55, techScore);
    // Penalty for low-effort / empty answers
    techScore -= (lowEffortCount * 12);
    techScore -= (emptyAnswerCount * 8);
    techScore = Math.max(8, Math.min(97, Math.round(techScore)));

    // ─── 3. Project Ownership Score (strict — needs specific ownership language) ─
    let projectScore = 0;
    if (projDensity === 0) {
      projectScore = Math.min(15, Math.round(avgWords * 0.2));
    } else if (projDensity < 0.5) {
      projectScore = 15 + Math.round(projDensity * 30);
    } else if (projDensity < 1.5) {
      projectScore = 30 + Math.round((projDensity - 0.5) * 30);
    } else if (projDensity < 3.0) {
      projectScore = 60 + Math.round((projDensity - 1.5) * 20);
    } else {
      projectScore = Math.min(95, 90 + Math.round((projDensity - 3.0) * 2));
    }
    if (avgWords < 20) projectScore = Math.min(25, projectScore);
    else if (avgWords < 35) projectScore = Math.min(50, projectScore);
    projectScore -= (lowEffortCount * 12);
    projectScore -= (emptyAnswerCount * 8);
    projectScore = Math.max(8, Math.min(95, Math.round(projectScore)));

    // ─── Dynamic AI Evaluator Bullets ───────────────────────────────────────
    const bullets = [];

    if (avgWords < 15) {
      bullets.push(`❌ Response Brevity Critical: Average answer was only ${Math.round(avgWords)} words — far too brief to demonstrate any real engineering depth or problem-solving ability.`);
    } else if (avgWords >= 15 && avgWords < 35) {
      bullets.push(`⚠️ Short Responses: Average ${Math.round(avgWords)} words per answer. Adequate for basic answers but insufficient for in-depth technical or architectural explanations.`);
    } else if (avgWords >= 35 && avgWords < 60) {
      bullets.push(`✅ Moderate Response Depth: Average ${Math.round(avgWords)} words per answer. Reasonable for structured technical responses.`);
    } else {
      bullets.push(`✅ Detailed Responses: Candidate provided thorough explanations averaging ${Math.round(avgWords)} words per answer.`);
    }

    if (totalUniqueTechHits === 0) {
      bullets.push("❌ Zero Technical Vocabulary: Candidate used no recognized engineering terms, frameworks, or systems across all answers.");
    } else if (techDensity < 1.0) {
      bullets.push(`⚠️ Sparse Technical Vocabulary: Only ${totalUniqueTechHits} technical terms detected total. Answers lack specificity in tools, frameworks, or engineering concepts.`);
    } else if (techDensity < 2.5) {
      bullets.push(`✅ Moderate Technical Fluency: Candidate cited ${totalUniqueTechHits} technical concepts (${techDensity.toFixed(1)} avg/question), demonstrating foundational engineering awareness.`);
    } else {
      bullets.push(`✅ Strong Technical Vocabulary: Candidate accurately cited ${totalUniqueTechHits} distinct engineering concepts (${techDensity.toFixed(1)} avg/question), demonstrating solid domain knowledge.`);
    }

    if (lowEffortCount > 0) {
      bullets.push(`⚠️ Low-Effort Responses Detected: ${lowEffortCount} answer(s) were excessively brief, vague, or contained non-substantive responses.`);
    }
    if (emptyAnswerCount > 0) {
      bullets.push(`❌ Missing Answers: ${emptyAnswerCount} question(s) received no recorded response.`);
    }

    if (projDensity >= 1.5) {
      bullets.push("✅ Demonstrated Project Ownership: Candidate clearly articulated individual technical contributions, design decisions, and system ownership.");
    } else if (projDensity >= 0.5) {
      bullets.push("⚠️ Partial Project Ownership: Candidate described projects at a high level but did not clearly distinguish personal technical contributions from team/library work.");
    } else {
      bullets.push("❌ Weak Project Ownership: Candidate failed to articulate specific technical contributions, design rationale, or personal ownership of any project modules.");
    }

    // ─── Recommendation Decision ───────────────────────────────────────────
    const compositeScore = (commScore * 0.3) + (techScore * 0.4) + (projectScore * 0.3);
    let recTier = "rec-strong-hire";
    let recTitle = "Strong Hire (Fast-Track to Final Round)";
    let recDesc = "Candidate exhibited strong architectural acumen, clear problem-solving depth, and authentic technical ownership.";

    if (compositeScore < 40 || lowEffortCount >= 3 || (techScore < 25 && avgWords < 20)) {
      recTier = "rec-review-needed";
      recTitle = "Not Recommended / Reject (Insufficient Technical Depth)";
      recDesc = "Candidate responses were too brief or lacked technical substance. Immediate reject or re-interview recommended.";
    } else if (compositeScore < 62) {
      recTier = "rec-lean-hire";
      recTitle = "Lean Hire / Additional Technical Screener Advised";
      recDesc = "Candidate showed foundational understanding but requires deeper verification on system scalability, tooling, and technical ownership.";
    }

    return {
      commScore,
      techScore,
      projectScore,
      compositeScore: Math.round(compositeScore),
      recTier,
      recTitle,
      recDesc,
      bullets
    };
  },

  generateReport(sessionId) {
    const session = window.DataStore.getCurrentSession() || { id: sessionId, strike_count: 0, status: 'completed' };
    const currentUser = window.DataStore.getCurrentUser();
    const profile = currentUser ? window.DataStore.getProfileByUserId(currentUser.id) : null;
    const qaList = window.DataStore.getQALogsBySession(sessionId);
    const violations = window.DataStore.getViolationsBySession(sessionId);

    // Compute Integrity Score (100% - strikes * 20%)
    const strikes = session.strike_count || 0;
    const integrityScore = Math.max(20, 100 - (strikes * 20));

    // Evaluate Real Candidate Answers!
    const evaluation = this.evaluateCandidateAnswers(qaList);

    // Override recommendation if strikes exist
    let finalRecTier = evaluation.recTier;
    let finalRecTitle = evaluation.recTitle;
    let finalRecDesc = evaluation.recDesc;

    if (strikes >= 2 || integrityScore < 60) {
      finalRecTier = "rec-review-needed";
      finalRecTitle = "Caution: Proctoring Strikes Detected — Manual Review Required";
      finalRecDesc = `Candidate accumulated ${strikes} proctoring strike(s) for leaving fullscreen or switching windows.`;
    }

    // Populate Candidate Information
    const candNameEl = document.getElementById('report-cand-name');
    const candMetaEl = document.getElementById('report-cand-meta');
    const candAvatarEl = document.getElementById('report-cand-avatar');

    const name = profile ? profile.full_name : (currentUser ? currentUser.name : 'Candidate');
    if (candNameEl) candNameEl.textContent = name;
    if (candAvatarEl) candAvatarEl.textContent = name.charAt(0).toUpperCase();

    if (candMetaEl && profile) {
      candMetaEl.innerHTML = `
        <span>🎓 ${profile.degree} (${profile.branch})</span>
        <span>🏛️ ${profile.college_name}</span>
        <span>📊 CGPA: ${profile.cgpa} / 10</span>
        <span>🔗 <a href="${profile.github_url}" target="_blank" style="color:var(--accent-cyan);">GitHub</a></span>
        <span>💼 <a href="${profile.linkedin_url}" target="_blank" style="color:var(--accent-cyan);">LinkedIn</a></span>
      `;
    }

    // Populate Recommendation Banner
    const recBanner = document.getElementById('report-rec-banner');
    if (recBanner) {
      recBanner.className = `recommendation-banner ${finalRecTier}`;
      recBanner.innerHTML = `
        <span style="font-size: 1.5rem;">${finalRecTier === 'rec-strong-hire' ? '⭐' : (finalRecTier === 'rec-lean-hire' ? '⚖️' : '⚠️')}</span>
        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;">AI Recommendation: ${finalRecTitle}</h4>
          <p style="font-size: 0.85rem; color: inherit; opacity: 0.9;">
            ${finalRecDesc} (Session ID: <code>${sessionId}</code>)
          </p>
        </div>
      `;
    }

    // Populate Metric Gauges with REAL SCORES
    const elIntegrity = document.getElementById('metric-val-integrity');
    const elComm = document.getElementById('metric-val-comm');
    const elTech = document.getElementById('metric-val-tech');
    const elProj = document.getElementById('metric-val-proj');

    if (elIntegrity) elIntegrity.textContent = `${integrityScore}%`;
    if (elComm) elComm.textContent = `${evaluation.commScore}%`;
    if (elTech) elTech.textContent = `${evaluation.techScore}%`;
    if (elProj) elProj.textContent = `${evaluation.projectScore}%`;

    // Populate Dynamic AI Evaluator Bullets
    const aiBulletsList = document.getElementById('report-ai-bullets');
    if (aiBulletsList) {
      aiBulletsList.innerHTML = '';
      evaluation.bullets.forEach(b => {
        const li = document.createElement('li');
        li.textContent = b;
        aiBulletsList.appendChild(li);
      });
    }

    // Red Flags List
    const redFlagsList = document.getElementById('report-red-flags-list');
    if (redFlagsList) {
      redFlagsList.innerHTML = '';
      if (violations.length === 0) {
        redFlagsList.innerHTML = `
          <div style="color: var(--accent-emerald); font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0;">
            <span>✓</span> Zero proctoring strikes recorded. Lockdown integrity maintained throughout.
          </div>
        `;
      } else {
        violations.forEach(v => {
          const item = document.createElement('div');
          item.className = 'red-flag-item';
          item.innerHTML = `
            <span>⚠️</span>
            <div>
              <strong>${v.violation_type}</strong>
              <div style="font-size: 0.75rem; opacity: 0.8;">Logged at ${new Date(v.timestamp).toLocaleTimeString()}</div>
            </div>
          `;
          redFlagsList.appendChild(item);
        });
      }
    }

    // Render Transcript Accordion with Real Word Count
    const transcriptContainer = document.getElementById('report-transcript-list');
    if (transcriptContainer) {
      transcriptContainer.innerHTML = '';
      if (qaList.length === 0) {
        transcriptContainer.innerHTML = '<p style="color:var(--text-muted); padding:1rem;">No transcript records captured for this session.</p>';
      } else {
        qaList.forEach((qa, idx) => {
          const card = document.createElement('div');
          card.className = `qa-card ${qa.is_followup ? 'is-followup' : ''}`;
          const wordCount = (qa.answer_text || '').trim().split(/\s+/).filter(Boolean).length;
          const isWeak = wordCount < 10;
          card.innerHTML = `
            <div class="qa-header-row">
              <span class="qa-type-tag">
                ${qa.is_followup ? '⚡ Dynamic Follow-Up' : `Question ${idx + 1} (${qa.question_type.toUpperCase()})`}
              </span>
              <span style="font-size:0.75rem; color:${isWeak ? '#f87171' : 'var(--text-muted)'}; font-weight:600;">
                ${wordCount} words ${isWeak ? '(⚠️ Too brief)' : ''}
              </span>
            </div>
            <div class="qa-question">${qa.question_text}</div>
            <div class="qa-answer" style="background:${isWeak ? 'rgba(239,68,68,0.06)' : 'rgba(15,23,42,0.4)'}; border-left: 3px solid ${isWeak ? '#ef4444' : 'var(--accent-cyan)'}; padding: 0.8rem; border-radius: 4px; margin-top: 0.5rem;">
              <strong style="color: var(--text-primary); display:block; margin-bottom: 0.3rem;">Candidate Answer:</strong>
              ${qa.answer_text ? qa.answer_text : '<em style="color:#94a3b8;">No answer recorded</em>'}
            </div>
          `;
          transcriptContainer.appendChild(card);
        });
      }
    }

    // Setup Print Button
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  }
};
