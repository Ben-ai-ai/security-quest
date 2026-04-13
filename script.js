/* ========== Configuration ========== */
const LEADERBOARD_ENDPOINT = "";

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

  // 🔥 GLOBAL FIX: always use this instead of closure-broken levelFinished
  window._levelFinished = false;

  const badges = new Set();

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // DOM refs
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

  const panel = document.getElementById("leaderboardPanel");
  const submitBtn = document.getElementById("submitScoreBtn");
  const refreshBtn = document.getElementById("refreshLeaderboard");
  const nameInput = document.getElementById("playerName");
  const privacySelect = document.getElementById("playerPrivacy");
  const listEl = document.getElementById("leaderboardList");
  const msgEl = document.getElementById("leaderboardMsg");

  window.securityQuest = window.securityQuest || {};
  window.securityQuest.setFinalScore = function(value) {
    window.totalGameScore = Number(value) || 0;
  };

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

    // 🔥 FIX: reset global flag
    window._levelFinished = false;

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
      if (timeLeft <= 0 && !window._levelFinished) {
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

  /* ---------- LEVEL 1 ---------- */
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
    let answered = 0;

    qData.forEach((q, i) => {
      const qBox = document.createElement("div");
      qBox.className = "cardItem";
      qBox.style.textAlign = "left";
      qBox.innerHTML = `<strong>Q${i+1}.</strong> ${q.q}`;

      const options = q.a.map((text, idx) => ({
        text,
        isCorrect: idx === q.correct
      }));
      shuffle(options);

      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt.text;
        btn.addEventListener("click", () => {
          if (btn.disabled || window._levelFinished) return;

          if (opt.isCorrect) {
            levelPoints += 30;
            btn.classList.add("correct");
            qBox.classList.add("success");
          } else {
            levelPoints -= 10;
            btn.classList.add("wrong");
            qBox.classList.add("error");
          }

          Array.from(qBox.querySelectorAll(".option")).forEach(b => b.disabled = true);
          answered++;
          updateTimerDisplay();

          if (answered === qData.length && !window._levelFinished) {
            finishLevel(true, "Level complete!");
          }
        });
        qBox.appendChild(btn);
      });

      container.appendChild(qBox);
    });

    levelContent.appendChild(container);
  }

  /* ---------- LEVEL 2 ---------- */
  function renderUrlSpot() {
    const items = [
      { url: "https://accounts.school.edu/login", good: true },
      { url: "https://school-accounts.secure-login.com", good: false },
      { url: "https://accounts.school.edu.login.verify.net", good: false },
      { url: "https://accounts.school.edu/login?redirect=https://evil.com", good: false },
      { url: "https://accounts.school.edu/login#auth", good: true }
    ];

    shuffle(items);

    const container = document.createElement("div");
    container.innerHTML = `<p>Click the secure URL(s). Correct +20; wrong -15.</p>`;
    const grid = document.createElement("div");
    grid.className = "matchGrid";

    let clicks = 0;

    items.forEach(it => {
      const card = document.createElement("div");
      card.className = "cardItem";

      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = it.url;

      btn.addEventListener("click", () => {
        if (btn.disabled || window._levelFinished) return;

        clicks++;

        if (it.good) {
          levelPoints += 20;
          btn.classList.add("correct");
          card.classList.add("success");
        } else {
          levelPoints -= 15;
          btn.classList.add("wrong");
          card.classList.add("error");
        }

        btn.disabled = true;
        updateTimerDisplay();

        if (clicks === items.length && !window._levelFinished) {
          finishLevel(true, "Level complete!");
        }
      });

      card.appendChild(btn);
      grid.appendChild(card);
    });

    container.appendChild(grid);
    levelContent.appendChild(container);
  }

  /* ---------- LEVEL 3 ---------- */
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

    const good = [
      "Lock screen when away",
      "Shred printed sensitive docs",
      "Use cable lock for laptop",
      "Store backups in encrypted drives"
    ];

    shuffle(items);

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
      if (window._levelFinished) return;

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

      if (dragWrap.children.length === 0 && !window._levelFinished) {
        finishLevel(true, "Level complete!");
      }
    });

    container.appendChild(dragWrap);
    container.appendChild(drop);
    levelContent.appendChild(container);
  }
  /* ---------- LEVEL 4 ---------- */
  function renderMatch() {
    const pairs = [
      { left: "6-foot chain-link fencing", right: "Deters casual intruders; preserves visibility" },
      { left: "Motion-activated lighting", right: "Increases detection at night; reduces hiding spots" },
      { left: "Cut-resistant padlocks", right: "Prevents easy gate access and lock cutting" },
      { left: "No Trespassing signage with contacts", right: "Provides reporting path and legal notice" },
      { left: "Single monitored entrance", right: "Improves access control and visitor screening" },
      { left: "Clear zone adjacent to fence", right: "Prevents concealment and improves sightlines" }
    ];

    shuffle(pairs);
    const rightShuffled = shuffle(pairs.map(p => p.right));

    const container = document.createElement("div");
    container.innerHTML = `<p>Click a left item, then its matching right item. Correct +30; wrong -15.</p>`;

    const gridL = document.createElement("div");
    gridL.className = "matchGrid";

    const gridR = document.createElement("div");
    gridR.className = "matchGrid";

    pairs.forEach((p, i) => {
      const left = document.createElement("div");
      left.className = "cardItem";
      left.innerHTML = `<strong>${p.left}</strong>`;
      left.dataset.idx = i;
      gridL.appendChild(left);
    });

    rightShuffled.forEach(r => {
      const right = document.createElement("div");
      right.className = "cardItem";
      right.textContent = r;
      gridR.appendChild(right);
    });

    container.appendChild(gridL);
    container.appendChild(gridR);
    levelContent.appendChild(container);

    let selectedLeft = null;
    let matches = 0;

    gridL.addEventListener("click", e => {
      if (window._levelFinished) return;

      const card = e.target.closest(".cardItem");
      if (!card || card.classList.contains("matched")) return;

      selectedLeft = card;

      Array.from(levelContent.querySelectorAll(".cardItem")).forEach(c => {
        c.style.opacity = 1;
      });

      card.style.opacity = 0.6;
    });

    gridR.addEventListener("click", e => {
      if (window._levelFinished) return;

      const cardR = e.target.closest(".cardItem");
      if (!cardR || cardR.classList.contains("matched") || !selectedLeft) return;

      const leftIdx = Number(selectedLeft.dataset.idx);
      const pair = pairs[leftIdx];

      if (pair.right === cardR.textContent) {
        levelPoints += 30;
        selectedLeft.classList.add("success", "matched");
        cardR.classList.add("success", "matched");
        matches++;
      } else {
        levelPoints -= 15;
        selectedLeft.classList.add("error");
        cardR.classList.add("error");
      }

      selectedLeft.style.opacity = 1;
      selectedLeft = null;
      updateTimerDisplay();

      if (matches === pairs.length && !window._levelFinished) {
        finishLevel(true, "Level complete!");
      }
    });
  }

  /* ---------- LEVEL 5 ---------- */
  function renderNetwork() {
    const scenarios = [
      {
        prompt: "A router has default admin credentials. Best action?",
        options: [
          "Leave as is for convenience",
          "Change to unique strong password and restrict admin access",
          "Disable admin access entirely"
        ],
        correct: 1
      },
      {
        prompt: "An open Wi‑Fi SSID with no encryption is discovered. Best immediate step?",
        options: [
          "Ignore it",
          "Notify network admin and avoid connecting",
          "Connect and test throughput"
        ],
        correct: 1
      },
      {
        prompt: "Firewall rule allows all inbound RDP to a server. Best remediation?",
        options: [
          "Keep it; RDP is needed",
          "Restrict RDP to specific IPs and enable MFA",
          "Move server to DMZ without changes"
        ],
        correct: 1
      },
      {
        prompt: "You find an unmanaged switch in a wiring closet. Best practice?",
        options: [
          "Leave it connected",
          "Label, inventory, and restrict physical access; document configuration",
          "Use it for temporary guest access"
        ],
        correct: 1
      },
      {
        prompt: "A server shows unusual outbound traffic to unknown IPs. First technical step?",
        options: [
          "Block outbound traffic and capture PCAP for analysis",
          "Reboot server immediately",
          "Disable logging to reduce noise"
        ],
        correct: 0
      },
      {
        prompt: "Which practice reduces risk from exposed management interfaces?",
        options: [
          "Expose interfaces to the internet for convenience",
          "Use jump hosts, restrict by IP, and enable MFA",
          "Use default ports and credentials"
        ],
        correct: 1
      }
    ];

    const container = document.createElement("div");
    container.innerHTML = `<p>Choose the most secure technical action. Correct +35; wrong -20.</p>`;

    let answered = 0;

    scenarios.forEach((s, i) => {
      const box = document.createElement("div");
      box.className = "cardItem";
      box.style.textAlign = "left";
      box.innerHTML = `<strong>Scenario ${i+1}.</strong> ${s.prompt}`;

      const opts = s.options.map((text, idx) => ({
        text,
        isCorrect: idx === s.correct
      }));
      shuffle(opts);

      opts.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = opt.text;

        btn.addEventListener("click", () => {
          if (btn.disabled || window._levelFinished) return;

          if (opt.isCorrect) {
            levelPoints += 35;
            btn.classList.add("correct");
            box.classList.add("success");
          } else {
            levelPoints -= 20;
            btn.classList.add("wrong");
            box.classList.add("error");
          }

          Array.from(box.querySelectorAll(".option")).forEach(b => b.disabled = true);
          answered++;
          update
