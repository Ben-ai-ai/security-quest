/* Security Quest game logic
   - Six levels with different mini-games:
     1. Quick Quiz (multiple choice)
     2. URL Spotter (spot fake URL)
     3. Drag & Drop Checklist (physical security)
     4. Match Cards (perimeter controls)
     5. Surveillance Puzzle (sequence)
     6. Construction Lockdown (tool security)
   - Points, timer, badges, final score
*/

(() => {
  const LEVELS = [
    { id: 1, name: "Site Security", type: "quiz" },
    { id: 2, name: "URL Verification", type: "urlspot" },
    { id: 3, name: "Physical Checklist", type: "dragdrop" },
    { id: 4, name: "Perimeter Match", type: "match" },
    { id: 5, name: "Surveillance Patrol", type: "sequence" },
    { id: 6, name: "Construction Lockdown", type: "final" }
  ];

  // Game state
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
    lobby.classList.add("hidden");
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
    // set a default timer per level (seconds)
    timeLeft = 60 + (6 - level.id) * 10; // earlier levels shorter
    startTimer();
    if (level.type === "quiz") renderQuiz();
    if (level.type === "urlspot") renderUrlSpot();
    if (level.type === "dragdrop") renderDragDrop();
    if (level.type === "match") renderMatch();
    if (level.type === "sequence") renderSequence();
    if (level.type === "final") renderFinalMini();
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

  // Level 1: Quick Quiz
  function renderQuiz() {
    const qData = [
      { q: "Use the same password for all sites?", a: ["Yes", "No", "Only for similar sites"], correct: 1 },
      { q: "What should you do before entering credentials?", a: ["Check URL & HTTPS", "Trust the email link", "Ignore certificate warnings"], correct: 0 },
      { q: "Leaving a shared computer?", a: ["Lock screen", "Leave logged in", "Write password down"], correct: 0 }
    ];
    const container = document.createElement("div");
    qData.forEach((q, i) => {
      const qBox = document.createElement("div");
      qBox.className = "cardItem";
      qBox.innerHTML = `<strong>Q${i+1}.</strong> ${q.q}`;
      q.a.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "btn ghost";
        btn.style.margin = "0.35rem";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          const correct = idx === q.correct;
          if (correct) {
            levelPoints += 20;
            btn.style.background = "linear-gradient(180deg,#2bb673,#1f8a56)";
            btn.style.color = "#04210f";
          } else {
            levelPoints -= 5;
            btn.style.background = "linear-gradient(180deg,#ff6b6b,#d94b4b)";
          }
          // disable siblings
          Array.from(qBox.querySelectorAll("button")).forEach(b => b.disabled = true);
          updateTimerDisplay();
          checkLevelComplete();
        });
        qBox.appendChild(btn);
      });
      container.appendChild(qBox);
    });
    levelContent.appendChild(container);
  }

  // Level 2: URL Spotter
  function renderUrlSpot() {
    const items = [
      { url: "https://portal.school.edu/login", good: true },
      { url: "http://portal.school.edu/login", good: false },
      { url: "https://portal.school.eduu/login", good: false },
      { url: "https://school.edu.secure-login.com", good: false }
    ];
    const container = document.createElement("div");
    container.innerHTML = `<p>Click the <strong>secure</strong> URL(s). Correct picks +15 points each; wrong picks -10.</p>`;
    const grid = document.createElement("div");
    grid.className = "matchGrid";
    items.forEach(it => {
      const card = document.createElement("div");
      card.className = "cardItem";
      card.textContent = it.url;
      card.addEventListener("click", () => {
        if (card.dataset.done) return;
        if (it.good) {
          levelPoints += 15;
          card.style.borderColor = "var(--success)";
          card.style.boxShadow = "0 6px 18px rgba(43,182,115,0.08)";
        } else {
          levelPoints -= 10;
          card.style.borderColor = "var(--danger)";
          card.style.boxShadow = "0 6px 18px rgba(255,107,107,0.08)";
        }
        card.dataset.done = "1";
        updateTimerDisplay();
        checkLevelComplete();
      });
      grid.appendChild(card);
    });
    container.appendChild(grid);
    levelContent.appendChild(container);
  }

  // Level 3: Drag & Drop Checklist
  function renderDragDrop() {
    const items = [
      "Lock screen when away",
      "Save passwords on shared PC",
      "Shred printed sensitive docs",
      "Share account with coworkers"
    ];
    const good = ["Lock screen when away", "Shred printed sensitive docs"];
    const container = document.createElement("div");
    container.innerHTML = `<p>Drag the good practices into the secure box. Each correct +20, wrong -10.</p>`;
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
      // score
      if (good.includes(text)) levelPoints += 20;
      else levelPoints -= 10;
      // remove draggable
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

  // Level 4: Match Cards (Perimeter)
  function renderMatch() {
    const pairs = [
      { left: "6-foot fencing", right: "Prevents easy climb" },
      { left: "Motion lights", right: "Expose nighttime activity" },
      { left: "No Trespassing signs", right: "Warn and provide contacts" }
    ];
    // shuffle right side
    const rightShuffled = pairs.map(p => p.right).sort(() => Math.random() - 0.5);
    const container = document.createElement("div");
    container.innerHTML = `<p>Click a left item, then its matching right item.</p>`;
    const grid = document.createElement("div");
    grid.className = "matchGrid";
    pairs.forEach((p, i) => {
      const left = document.createElement("div");
      left.className = "cardItem";
      left.textContent = p.left;
      left.dataset.idx = i;
      left.addEventListener("click", () => selectLeft(left));
      grid.appendChild(left);
    });
    const gridR = document.createElement("div");
    gridR.className = "matchGrid";
    rightShuffled.forEach((r, i) => {
      const right = document.createElement("div");
      right.className = "cardItem";
      right.textContent = r;
      right.dataset.r = r;
      right.addEventListener("click", () => selectRight(right));
      gridR.appendChild(right);
    });
    container.appendChild(grid);
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
      const leftText = selectedLeft.textContent;
      const rightText = el.textContent;
      const match = pairs.find(p => p.left === leftText && p.right === rightText);
      if (match) {
        levelPoints += 25;
        selectedLeft.style.background = "linear-gradient(180deg,#2bb673,#1f8a56)";
        el.style.background = "linear-gradient(180deg,#2bb673,#1f8a56)";
      } else {
        levelPoints -= 10;
        selectedLeft.style.background = "linear-gradient(180deg,#ff6b6b,#d94b4b)";
        el.style.background = "linear-gradient(180deg,#ff6b6b,#d94b4b)";
      }
      selectedLeft.removeEventListener("click", selectLeft);
      el.removeEventListener("click", selectRight);
      selectedLeft = null;
      updateTimerDisplay();
      checkLevelComplete();
    }
  }

  // Level 5: Sequence (Surveillance Patrol)
  function renderSequence() {
    const steps = [
      "Check cameras",
      "Patrol blind spots",
      "Secure storage",
      "Log findings"
    ];
    const shuffled = steps.slice().sort(() => Math.random() - 0.5);
    const container = document.createElement("div");
    container.innerHTML = `<p>Click the steps in the correct order for a patrol. Correct order gives +30 bonus.</p>`;
    const grid = document.createElement("div");
    grid.className = "matchGrid";
    shuffled.forEach(s => {
      const b = document.createElement("div");
      b.className = "cardItem";
      b.textContent = s;
      b.addEventListener("click", () => pickStep(b));
      grid.appendChild(b);
    });
    container.appendChild(grid);
    levelContent.appendChild(container);

    let idx = 0;
    function pickStep(el) {
      const expected = steps[idx];
      if (el.textContent === expected) {
        levelPoints += 10;
        el.style.background = "linear-gradient(180deg,#2bb673,#1f8a56)";
        idx++;
        if (idx === steps.length) {
          levelPoints += 30; // bonus
          checkLevelComplete();
        }
      } else {
        levelPoints -= 10;
        el.style.background = "linear-gradient(180deg,#ff6b6b,#d94b4b)";
      }
      el.removeEventListener("click", pickStep);
      updateTimerDisplay();
    }
  }

  // Level 6: Final mini-game (Construction Lockdown)
  function renderFinalMini() {
    const container = document.createElement("div");
    container.innerHTML = `<p>Final challenge: choose the three best actions to secure a construction site. Choose wisely — big points for perfect selection.</p>`;
    const options = [
      "Lock tools in steel container",
      "Leave small tools overnight",
      "Keep a clear zone by the fence",
      "Share site keys with contractors",
      "Post emergency contact numbers"
    ];
    const correct = ["Lock tools in steel container", "Keep a clear zone by the fence", "Post emergency contact numbers"];
    options.forEach(opt => {
      const b = document.createElement("button");
      b.className = "btn ghost";
      b.style.margin = "0.35rem";
      b.textContent = opt;
      b.addEventListener("click", () => {
        if (b.dataset.chosen) {
          b.dataset.chosen = "";
          b.style.opacity = 1;
        } else {
          b.dataset.chosen = "1";
          b.style.opacity = 0.6;
        }
      });
      container.appendChild(b);
    });
    const submit = document.createElement("div");
    submit.style.marginTop = "0.6rem";
    const sbtn = document.createElement("button");
    sbtn.className = "btn";
    sbtn.textContent = "Submit Final Selection";
    sbtn.addEventListener("click", () => {
      const chosen = Array.from(container.querySelectorAll("button")).filter(b => b.dataset.chosen).map(b => b.textContent);
      let correctCount = chosen.filter(c => correct.includes(c)).length;
      let wrongCount = chosen.length - correctCount;
      levelPoints += correctCount * 30;
      levelPoints -= wrongCount * 15;
      // perfect bonus
      if (correctCount === correct.length && wrongCount === 0) {
        levelPoints += 50;
        badges.add("Construction Guardian");
      }
      updateTimerDisplay();
      checkLevelComplete();
    });
    submit.appendChild(sbtn);
    container.appendChild(submit);
    levelContent.appendChild(container);
  }

  // Check if level should finish (simple heuristic: enough interactions or time)
  function checkLevelComplete() {
    // small delay to allow UI updates
    setTimeout(() => {
      // if levelPoints high enough or many interactions, finish
      if (levelPoints >= 60 || timeLeft < 10) {
        finishLevel(true, "Level complete!");
      } else {
        // enable next if some progress
        if (levelPoints > 0) nextLevelBtn.disabled = false;
      }
      updateUI();
    }, 250);
  }

  function finishLevel(success, message) {
    clearInterval(timerInterval);
    // award score
    const bonus = Math.max(0, Math.floor(timeLeft / 5));
    const totalGain = Math.max(0, levelPoints) + (success ? bonus : 0);
    score += totalGain;
    // badges by level
    if (levelPoints >= 80) badges.add(`Level${current} Ace`);
    updateUI();
    // show message and enable next
    levelContent.innerHTML = `<div class="result">${message} You earned ${totalGain} points this level.</div>`;
    nextLevelBtn.disabled = false;
    // if last level, show final button text
    if (current === LEVELS.length) {
      nextLevelBtn.textContent = "Finish Game";
    } else {
      nextLevelBtn.textContent = "Next Level";
    }
  }

  nextLevelBtn.addEventListener("click", () => {
    if (current === LEVELS.length) {
      // finish game
      showFinal();
    } else {
      startLevel(current + 1);
    }
  });

  backToLobby.addEventListener("click", () => {
    clearInterval(timerInterval);
    gameArea.classList.add("hidden");
    lobby.classList.remove("hidden");
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
    if (badges.size === 0) {
      badgesWrap.textContent = "No badges earned. Try for perfect rounds!";
    } else {
      badges.forEach(b => {
        const el = document.createElement("div");
        el.className = "badge";
        el.textContent = b;
        badgesWrap.appendChild(el);
      });
    }
    // champion title
    if (score >= 300) {
      const champ = document.createElement("div");
      champ.className = "badge";
      champ.textContent = "Security Champion";
      badgesWrap.appendChild(champ);
    }
  }

  function resetAll() {
    score = 0;
    current = 0;
    levelPoints = 0;
    badges.clear();
    clearInterval(timerInterval);
    lobby.classList.remove("hidden");
    gameArea.classList.add("hidden");
    finalSection.classList.add("hidden");
    updateUI();
  }

  // initial UI
  updateUI();
})();
