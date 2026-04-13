/* ========== Configuration ========== */
// If you deploy a backend (Apps Script), paste its URL here.
// Leave empty to use localStorage fallback.
const LEADERBOARD_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/AKfy.../exec"

/* ========== Game state and DOM refs ========== */
(() => {
  const LEVELS = [
    { id: 1, name: "Site Security", type: "quiz" },
    { id: 2, name: "URL Verification", type: "urlspot" },
    { id: 3, name: "Physical Checklist", type: "dragdrop" },
    { id: 4, name: "Perimeter Match", type: "match" },
    { id: 5, name: "Network Security", type: "network" },
    { id: 6, name: "Incident Response", type: "incident" }
  ];

  let score = 0;
  let current = 0;
  let levelPoints = 0;
  let timerInterval = null;
  let timeLeft = 0;
  const badges = new Set();

  // DOM
  const levelsEl = document.getElementById("levels");
  const startAll = document.getElementById("startAll");
  const resetGame = document.getElementById("resetGame");
  const scoreEl = document.getElementById("score");
  const badgeEl = document.getElementById("levelBadge");
  const gameArea = document.getElementById("gameArea");
  const lobby = document.getElementById("lobby");
  const levelTitle = document.getElementById("levelTitle");
  const levelContent = document.getElementById("levelContent");
  const timerEl = document.getElementById("timer");
  const levelPointsEl = document.getElementById("levelPoints");
  const nextLevelBtn = document.getElementById("nextLevel");
  const backToLobby = document.getElementById("backToLobby");
  const finalSection = document.getElementById("final");
  const finalText = document.getElementById("finalText");
  const badgesWrap = document.getElementById("badges");
  const playAgain = document.getElementById("playAgain");

  // Leaderboard DOM refs (lobby only)
  const panel = document.getElementById("leaderboardPanel");
  const submitBtn = document.getElementById("submitScoreBtn");
  const refreshBtn = document.getElementById("refreshLeaderboard");
  const nameInput = document.getElementById("playerName");
  const privacySelect = document.getElementById("playerPrivacy");
  const listEl = document.getElementById("leaderboardList");
  const msgEl = document.getElementById("leaderboardMsg");

  // expose helper for game to set final score before submit
  window.securityQuest = window.securityQuest || {};
  window.securityQuest.setFinalScore = function(value) {
    window.totalGameScore = Number(value) || 0;
  };

  // create level buttons
  LEVELS.forEach(l => {
    const btn = document.createElement("button");
    btn.className = "levelBtn";
    btn.textContent = `Level ${l.id}: ${l.name}`;
    btn.dataset.level = l.id;
    btn.addEventListener("click", () => startLevel(l.id));
    levelsEl.appendChild(btn);
  });

  function updateUI() {
    scoreEl.textContent = `Score: ${score}`;
    badgeEl.textContent = `Badge: ${[...badges].pop() || "None"}`;
    levelPointsEl.textContent = `Level Points: ${levelPoints}`;
  }

  function startLevel(id) {
    current = id;
    levelPoints = 0;
    // hide lobby and leaderboard panel
    lobby.classList.add("hidden");
    panel.classList.add("hidden");
    gameArea.classList.remove("hidden");
    finalSection.classList.add("hidden");
    nextLevelBtn.disabled = true;
    renderLevel();
    updateUI();
  }

  function renderLevel() {
    const level = LEVELS.find(l => l.id === current);
    levelTitle.textContent = `Level ${level.id}: ${level.name}`;
    levelContent.innerHTML = "";
    timeLeft = 90 + (6 - level.id) * 12;
    startTimer();
    if (level.type === "quiz") renderAdvancedQuiz();
    if (level.type === "urlspot") renderUrlSpot();
    if (level.type === "dragdrop") renderDragDrop();
    if (level.type === "match") renderMatch();
    if (level.type === "network") renderNetwork();
    if (level.type === "incident") renderIncident();
  }

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        finishLevel(false, "Time's up!");
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");
    timerEl.textContent = `Time: ${mm}:${ss}`;
    levelPointsEl.textContent = `Level Points: ${levelPoints}`;
  }

  /* ---------- Level implementations ---------- */

  // Level 1: Advanced Site Security Quiz (clickjacking question replaced)
  function renderAdvancedQuiz() {
    const qData = [
      {
        q: "Which practice best defends against credential stuffing attacks?",
        a: ["Use unique passwords and MFA", "Use a single strong password", "Rely on browser password manager only"],
        correct: 0
      },
      {
        q: "A third-party plugin requests broad permissions. Best action?",
        a: ["Grant permissions temporarily", "Review scope and vendor, then limit permissions", "Ignore and install anyway"],
        correct: 1
      },
      {
        q: "You receive a password reset email you didn't request. What do you do?",
        a: ["Click the link to confirm it's you", "Ignore and report to IT; change password if suspicious", "Reply asking who requested it"],
        correct: 1
      },
      {
        q: "Best way to store secrets for an application?",
        a: ["Hard-code in source with access control", "Use a secrets manager with least privilege", "Store in a public repo but obfuscate"],
        correct: 1
      }
    ];
    const container = document.createElement("div");
    qData.forEach((q, i) => {
      const qBox = document.createElement("div");
      qBox.className = "cardItem";
      qBox.style.textAlign = "left";
      qBox.innerHTML = `<strong>Q${i+1}.</strong> ${q.q}`;
      q.a.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          const correct = idx === q.correct;
          if (correct) {
            levelPoints += 30;
            btn.classList.add("correct");
            qBox.classList.add("success");
          } else {
            levelPoints -= 10;
            btn.classList.add("wrong");
            qBox.classList.add("error");
          }
          Array.from(qBox.querySelectorAll(".option")).forEach(b => b.disabled = true);
          updateTimerDisplay();
          checkLevelComplete();
        });
        qBox.appendChild(btn);
      });
      container.appendChild(qBox);
    });
    levelContent.appendChild(container);
  }

  // Level 2: URL Verification
  function renderUrlSpot() {
    const items = [
      { url: "https://accounts.school.edu/login", good: true },
      { url: "https://school-accounts.secure-login.com", good: false },
      { url: "https://accounts.school.edu.login.verify.net", good: false },
      { url: "https://accounts.school.edu/login?redirect=https://evil.com", good: false },
      { url: "https://accounts.school.edu/login#auth", good: true }
    ];
    const container = document.createElement("div");
    container.innerHTML = `<p>Click the secure URL(s). Correct +20; wrong -15. Watch for subdomain tricks and redirects.</p>`;
    const grid = document.createElement("div");
    grid.className = "matchGrid";
    items.forEach(it => {
      const card = document.createElement("div");
      card.className = "cardItem";
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = it.url;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        if (it.good) {
          levelPoints += 20;
          btn.classList.add("correct");
          card.classList.add("success");
        } else {
          levelPoints -= 15;
          btn.classList.add("wrong");
          card.classList.add("error");
        }
        Array.from(card.querySelectorAll(".option")).forEach(b => b.disabled = true);
        updateTimerDisplay();
        checkLevelComplete();
      });
      card.appendChild(btn);
      grid.appendChild(card);
    });
    container.appendChild(grid);
    levelContent.appendChild(container);
  }

  // Level 3: Drag & Drop Checklist (physical security)
  function renderDragDrop() {
    const items = [
      "Lock screen when away",
      "Save passwords on shared PC",
      "Shred printed sensitive docs",
      "Plug unknown USB into workstation",
      "Use cable lock for laptop",
      "Leave workstation unlocked overnight",
      "Store backups in encrypted drives",
      "Label sensitive printouts with 'Confidential'"
    ];
    const good = ["Lock screen when away", "Shred printed sensitive docs", "Use cable lock for laptop", "Store backups in encrypted drives"];
    const container = document.createElement("div");
    container.innerHTML = `<p>Drag secure practices into the secure box. Correct +25, wrong -15.</p>`;
    const dragWrap = document.createElement("div");
    dragWrap.className = "dragArea";
    items.forEach(text => {
      const d = document.createElement("div");
      d.className = "draggable";
      d.draggable = true;
      d.textContent = text;
      d.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", text);
      });
      dragWrap.appendChild(d);
    });
    const drop = document.createElement("div");
    drop.className = "checklistDrop";
    drop.textContent = "Drop secure practices here";
    drop.addEventListener("dragover", e => e.preventDefault());
    drop.addEventListener("drop", e => {
      e.preventDefault();
      const text = e.dataTransfer.getData("text/plain");
      if (!text) return;
      const node = document.createElement("div");
      node.className = "cardItem";
      node.textContent = text;
      drop.appendChild(node);
      if (good.includes(text)) levelPoints += 25;
      else levelPoints -= 15;
      Array.from(dragWrap.children).forEach(c => {
        if (c.textContent === text) c.remove();
      });
      updateTimerDisplay();
      checkLevelComplete();
    });
    container.appendChild(dragWrap);
    container.appendChild(drop);
    levelContent.appendChild(container);
  }

  // Level 4: Perimeter Match (expanded)
  function renderMatch() {
    const pairs = [
      { left: "6-foot chain-link fencing", right: "Deters casual intruders; preserves visibility" },
      { left: "Motion-activated lighting", right: "Increases detection at night; reduces hiding spots" },
      { left: "Cut-resistant padlocks", right: "Prevents easy gate access and lock cutting" },
      { left: "No Trespassing signage with contacts", right: "Provides reporting path and legal notice" },
      { left: "Single monitored entrance", right: "Improves access control and visitor screening" },
      { left: "Clear zone adjacent to fence", right: "Prevents concealment and improves sightlines" }
    ];
    const rightShuffled = pairs.map(p => p.right).sort(() => Math.random() - 0.5);
    const container = document.createElement("div");
    container.innerHTML = `<p>Click a left item, then its matching right item. Correct +30; wrong -15.</p>`;
    const gridL = document.createElement("div");
    gridL.className = "matchGrid";
    pairs.forEach((p, i) => {
      const left = document.createElement("div");
      left.className = "cardItem";
      left.innerHTML = `<strong>${p.left}</strong>`;
      left.dataset.idx = i;
      left.addEventListener("click", () => selectLeft(left));
      gridL.appendChild(left);
    });
    const gridR = document.createElement("div");
    gridR.className = "matchGrid";
    rightShuffled.forEach(r => {
      const right = document.createElement("div");
      right.className = "cardItem";
      right.textContent = r;
      right.addEventListener("click", () => selectRight(right));
      gridR.appendChild(right);
    });
    container.appendChild(gridL);
    container.appendChild(gridR);
    levelContent.appendChild(container);

    let selectedLeft = null;
    function selectLeft(el) {
      Array.from(levelContent.querySelectorAll(".cardItem")).forEach(c => c.style.opacity = 1);
      selectedLeft = el;
      el.style.opacity = 0.6;
    }
    function selectRight(el) {
      if (!selectedLeft) return;
      const leftText = selectedLeft.textContent.replace(/\s+/g, " ").trim();
      const rightText = el.textContent;
      const match = pairs.find(p => p.right === rightText && leftText.includes(p.left.split(" ")[0]));
      if (match && leftText.includes(match.left.split(" ")[0])) {
        levelPoints += 30;
        selectedLeft.classList.add("success");
        el.classList.add("success");
      } else {
        levelPoints -= 15;
        selectedLeft.classList.add("error");
        el.classList.add("error");
      }
      selectedLeft.removeEventListener("click", selectLeft);
      el.removeEventListener("click", selectRight);
      selectedLeft = null;
      updateTimerDisplay();
      checkLevelComplete();
    }
  }

  // Level 5: Network Security (more prompts)
  function renderNetwork() {
    const scenarios = [
      {
        prompt: "A router has default admin credentials. Best action?",
        options: ["Leave as is for convenience", "Change to unique strong password and restrict admin access", "Disable admin access entirely"],
        correct: 1
      },
      {
        prompt: "An open Wi‑Fi SSID with no encryption is discovered. Best immediate step?",
        options: ["Ignore it", "Notify network admin and avoid connecting", "Connect and test throughput"],
        correct: 1
      },
      {
        prompt: "Firewall rule allows all inbound RDP to a server. Best remediation?",
        options: ["Keep it; RDP is needed", "Restrict RDP to specific IPs and enable MFA", "Move server to DMZ without changes"],
        correct: 1
      },
      {
        prompt: "You find an unmanaged switch in a wiring closet. Best practice?",
        options: ["Leave it connected", "Label, inventory, and restrict physical access; document configuration", "Use it for temporary guest access"],
        correct: 1
      },
      {
        prompt: "A server shows unusual outbound traffic to unknown IPs. First technical step?",
        options: ["Block outbound traffic and capture PCAP for analysis", "Reboot server immediately", "Disable logging to reduce noise"],
        correct: 0
      },
      {
        prompt: "Which practice reduces risk from exposed management interfaces?",
        options: ["Expose interfaces to the internet for convenience", "Use jump hosts, restrict by IP, and enable MFA", "Use default ports and credentials"],
        correct: 1
      }
    ];
    const container = document.createElement("div");
    container.innerHTML = `<p>Choose the most secure technical action. Correct +35; wrong -20.</p>`;
    scenarios.forEach((s, i) => {
      const box = document.createElement("div");
      box.className = "cardItem";
      box.style.textAlign = "left";
      box.innerHTML = `<strong>Scenario ${i+1}.</strong> ${s.prompt}`;
      s.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (idx === s.correct) {
            levelPoints += 35;
            btn.classList.add("correct");
            box.classList.add("success");
          } else {
            levelPoints -= 20;
            btn.classList.add("wrong");
            box.classList.add("error");
          }
          Array.from(box.querySelectorAll(".option")).forEach(b => b.disabled = true);
          updateTimerDisplay();
          checkLevelComplete();
        });
        box.appendChild(btn);
      });
      container.appendChild(box);
    });
    levelContent.appendChild(container);
  }

  // Level 6: Incident Response — extended steps and ordering
  function renderIncident() {
    const tasks = [
      "Isolate affected systems",
      "Preserve logs and evidence",
      "Identify scope and affected assets",
      "Notify incident response team",
      "Apply temporary mitigations",
      "Communicate to stakeholders with approved messaging",
      "Perform root cause analysis",
      "Remediate and validate systems before restore",
      "Document lessons learned and update playbooks"
    ];
    const container = document.createElement("div");
    container.innerHTML = `<p>Select and order the first five actions for a suspected breach. Correct selections +40 each; correct order bonus +80.</p>`;
    const optionsWrap = document.createElement("div");
    optionsWrap.className = "matchGrid";
    tasks.forEach(t => {
      const b = document.createElement("div");
      b.className = "cardItem";
      b.textContent = t;
      b.addEventListener("click", () => {
        if (b.dataset.chosen) return;
        const order = container.querySelectorAll(".chosen").length + 1;
        const chosen = document.createElement("div");
        chosen.className = "cardItem chosen";
        chosen.textContent = `${order}. ${t}`;
        container.appendChild(chosen);
        b.dataset.chosen = "1";
      });
      optionsWrap.appendChild(b);
    });
    const submit = document.createElement("div");
    submit.style.marginTop = "0.6rem";
    const sbtn = document.createElement("button");
    sbtn.className = "btn";
    sbtn.textContent = "Submit Incident Plan";
    sbtn.addEventListener("click", () => {
      const chosenEls = Array.from(container.querySelectorAll(".chosen"));
      const chosen = chosenEls.map(e => e.textContent.replace(/^\d+\.\s*/, ""));
      const required = [
        "Isolate affected systems",
        "Preserve logs and evidence",
        "Identify scope and affected assets",
        "Notify incident response team",
        "Apply temporary mitigations"
      ];
      let correctCount = 0;
      chosen.slice(0, 5).forEach(c => {
        if (required.includes(c)) correctCount++;
      });
      levelPoints += correctCount * 40;
      const chosenFirstFive = chosen.slice(0, 5);
      if (chosenFirstFive.length === 5 && chosenFirstFive.every((v, i) => v === required[i])) {
        levelPoints += 80;
        badges.add("IR Specialist");
      }
      const wrong = 5 - correctCount;
      levelPoints -= wrong * 25;
      updateTimerDisplay();
      checkLevelComplete();
    });
    submit.appendChild(sbtn);
    levelContent.appendChild(optionsWrap);
    levelContent.appendChild(submit);
  }

  /* ---------- Level completion and navigation ---------- */

  function checkLevelComplete() {
    setTimeout(() => {
      if (levelPoints >= 120 || timeLeft < 8) {
        finishLevel(true, "Level complete!");
      } else {
        if (levelPoints > 0) nextLevelBtn.disabled = false;
      }
      updateUI();
    }, 250);
  }

  function finishLevel(success, message) {
    clearInterval(timerInterval);
    const bonus = Math.max(0, Math.floor(timeLeft / 4));
    const totalGain = Math.max(0, levelPoints) + (success ? bonus : 0);
    score += totalGain;
    if (levelPoints >= 150) badges.add(`Level${current} Ace`);
    updateUI();
    levelContent.innerHTML = `<div class="result">${message} You earned ${totalGain} points this level.</div>`;
    nextLevelBtn.disabled = false;
    if (current === LEVELS.length) nextLevelBtn.textContent = "Finish Game";
    else nextLevelBtn.textContent = "Next Level";
  }

  nextLevelBtn.addEventListener("click", () => {
    if (current === LEVELS.length) {
      showFinal();
    } else {
      startLevel(current + 1);
    }
  });

  backToLobby.addEventListener("click", () => {
    clearInterval(timerInterval);
    gameArea.classList.add("hidden");
    lobby.classList.remove("hidden");
    panel.classList.remove("hidden"); // show leaderboard again
  });

  startAll.addEventListener("click", () => startLevel(1));
  resetGame.addEventListener("click", resetAll);
  playAgain.addEventListener("click", resetAll);

  function showFinal() {
    clearInterval(timerInterval);
    gameArea.classList.add("hidden");
    finalSection.classList.remove("hidden");
    lobby.classList.add("hidden");
    finalText.textContent = `Your final score is ${score} points.`;
    badgesWrap.innerHTML = "";
    if (badges.size === 0) badgesWrap.textContent = "No badges earned. Try for perfect rounds!";
    else badges.forEach(b => {
      const el = document.createElement("div");
      el.className = "badge";
      el.textContent = b;
      badgesWrap.appendChild(el);
    });
    if (score >= 400) {
      const champ = document.createElement("div");
      champ.className = "badge";
      champ.textContent = "Security Champion";
      badgesWrap.appendChild(champ);
    }
    // set final score for leaderboard submission
    window.securityQuest.setFinalScore(score);
  }

  function resetAll() {
    score = 0;
    current = 0;
    levelPoints = 0;
    badges.clear();
    clearInterval(timerInterval);
    lobby.classList.remove("hidden");
    panel.classList.remove("hidden"); // ensure leaderboard visible
    gameArea.classList.add("hidden");
    finalSection.classList.add("hidden");
    updateUI();
    renderLeaderboard(); // refresh lobby leaderboard
  }

  updateUI();

  /* ========== Leaderboard integration (lobby only) ========== */

  // Basic username rules
  function validUsername(name) {
    if (!name) return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return false;
    const re = /^[A-Za-z0-9_\- ]+$/;
    return re.test(trimmed);
  }

  // Escape HTML
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Local storage helpers
  const LOCAL_KEY = "securityQuest_localLeaderboard_v1";
  function saveLocalScore(name, scoreVal, level) {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    list.push({ name, score: Number(scoreVal) || 0, level, timestamp: new Date().toISOString() });
    list.sort((a,b) => b.score - a.score);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 100)));
  }
  function loadLocalScores(limit=10) {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]").slice(0, limit);
  }

  // Backend functions
  async function fetchLeaderboard(limit=10) {
    if (!LEADERBOARD_ENDPOINT) return loadLocalScores(limit);
    try {
      const url = `${LEADERBOARD_ENDPOINT}?action=leaderboard&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      return data.leaderboard || [];
    } catch (err) {
      console.warn("Leaderboard fetch failed, using local fallback", err);
      return loadLocalScores(limit);
    }
  }

  async function submitScoreToBackend(name, scoreVal, level='Final') {
    if (!LEADERBOARD_ENDPOINT) {
      saveLocalScore(name, scoreVal, level);
      return { status: "ok", source: "local" };
    }
    try {
      const payload = { name, score: Number(scoreVal) || 0, level };
      const res = await fetch(LEADERBOARD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Submit failed, saving locally", err);
      saveLocalScore(name, scoreVal, level);
      return { status: "ok", source: "local" };
    }
  }

  // Render leaderboard (lobby)
  async function renderLeaderboard(limit=6) {
    listEl.innerHTML = "";
    msgEl.textContent = "Loading...";
    const rows = await fetchLeaderboard(limit);
    if (!rows || rows.length === 0) {
      msgEl.textContent = "No scores yet — be the first!";
      return;
    }
    msgEl.textContent = "";
    rows.slice(0, limit).forEach((r, i) => {
      const item = document.createElement("div");
      item.className = "cardItem";
      item.innerHTML = `<strong>#${i+1} ${escapeHtml(r.name)}</strong>
                        <div>Score: ${r.score} — ${escapeHtml(r.level || "")}</div>
                        <div class="muted">${new Date(r.timestamp).toLocaleString()}</div>`;
      listEl.appendChild(item);
    });
  }

  // UI wiring for leaderboard (lobby)
  refreshBtn.addEventListener("click", () => renderLeaderboard());

  submitBtn.addEventListener("click", async () => {
    const rawName = nameInput.value.trim();
    const privacy = privacySelect.value;
    const name = privacy === "anonymous" ? "Anonymous" : rawName;
    if (privacy !== "anonymous" && !validUsername(rawName)) {
      msgEl.textContent = "Username must be 2–20 characters and use letters, numbers, spaces, - or _.";
      return;
    }
    const finalScore = (typeof window.totalGameScore !== "undefined") ? window.totalGameScore : (typeof score !== "undefined" ? score : 0);
    const level = `Final`;
    msgEl.textContent = "Submitting...";
    const res = await submitScoreToBackend(name, finalScore, level);
    if (res && (res.status === "ok" || res.source === "local")) {
      msgEl.textContent = "Score submitted!";
      renderLeaderboard();
    } else {
      msgEl.textContent = "Submission failed.";
    }
  });

  // initial render of leaderboard (lobby)
  renderLeaderboard();

})();
