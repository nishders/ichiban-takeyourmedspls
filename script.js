// ====== CONFIG ======

// First day of her 3-week Isoprinosine course
// Format: YYYY-MM-DD
const REGIMEN_START_DATE = "2025-11-22";

// ====== UTILITIES ======

function formatDateHuman(d) {
  const opts = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  return d.toLocaleDateString(undefined, opts);
}

function getDateKey(d) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const msDiff = d2 - d1;
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

// ====== MED SCHEDULE LOGIC ======

/**
 * Returns an array of tasks for the given date.
 * Each task: { id, label, med, timeOfDay, details }
 */
function getTasksForDate(date) {
  const tasks = [];
  const dateKey = getDateKey(date);
  const weekday = date.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat

  // Prosentials: 1 tablet daily - morning
  tasks.push({
    id: `${dateKey}_prosentials_morning`,
    label: "Prosentials – 1 tablet",
    med: "Prosentials",
    timeOfDay: "Morning",
    details: "Daily"
  });

  // Vitamin D – Sunday & Wednesday - morning
  if (weekday === 0 || weekday === 3) {
    tasks.push({
      id: `${dateKey}_vitd_morning`,
      label: "Vitamin D – 1 tablet",
      med: "Vitamin D",
      timeOfDay: "Morning",
      details: "Twice a week (Sun & Wed)"
    });
  }

  // Course-based meds: Isoprinosine (weeks 1–3), then Valvir (week 4)
  const regimenStart = new Date(REGIMEN_START_DATE);
  const diffDays = daysBetween(getDateKey(regimenStart), dateKey);

  if (diffDays >= 0) {
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Weeks 1–3: Isoprinosine on Tuesday & Saturday - morning & evening
    if (weekNumber >= 1 && weekNumber <= 3) {
      if (weekday === 2 || weekday === 6) {
        // Tuesday or Saturday
        tasks.push({
          id: `${dateKey}_isoprinosine_morning`,
          label: "Isoprinosine – 1 tablet",
          med: "Isoprinosine",
          timeOfDay: "Morning",
          details: "Weeks 1–3: Tue & Sat"
        });
        tasks.push({
          id: `${dateKey}_isoprinosine_evening`,
          label: "Isoprinosine – 1 tablet",
          med: "Isoprinosine",
          timeOfDay: "Evening",
          details: "Weeks 1–3: Tue & Sat"
        });
      }
    }

    // Week 4: Valvir for 10 days – morning & evening
    if (weekNumber === 4 && diffDays >= 21 && diffDays <= 30) {
      tasks.push({
        id: `${dateKey}_valvir_morning`,
        label: "Valvir – 1 tablet",
        med: "Valvir",
        timeOfDay: "Morning",
        details: "Week 4: 10 days"
      });
      tasks.push({
        id: `${dateKey}_valvir_evening`,
        label: "Valvir – 1 tablet",
        med: "Valvir",
        timeOfDay: "Evening",
        details: "Week 4: 10 days"
      });
    }
  }

  return tasks;
}

// ====== STORAGE HELPERS ======

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStars() {
  const raw = localStorage.getItem("ppc_stars");
  return raw ? parseInt(raw, 10) : 0;
}

function setStars(val) {
  localStorage.setItem("ppc_stars", String(val));
}

function getStreak() {
  const raw = localStorage.getItem("ppc_streak");
  return raw ? parseInt(raw, 10) : 0;
}

function setStreak(val) {
  localStorage.setItem("ppc_streak", String(val));
}

function getLastFullDate() {
  return localStorage.getItem("ppc_lastFullDate");
}

function setLastFullDate(dateKey) {
  localStorage.setItem("ppc_lastFullDate", dateKey);
}

// Pet name

function getPetName() {
  return localStorage.getItem("ppc_petName") || "Pipi";
}

function setPetName(name) {
  localStorage.setItem("ppc_petName", name);
}

function refreshPetNameUI() {
  const name = getPetName();

  // Update inline spots
  document.querySelectorAll(".pet-name").forEach(el => {
    el.textContent = name;
  });

  // Update default world message if not overridden
  const worldMessage = document.getElementById("world-message");
  if (worldMessage && !worldMessage.dataset.custom) {
    worldMessage.innerHTML =
      `Every med you log gives <span class="pet-name">${name}</span> a Care Star and brightens the room 🌸`;
  }
}

// Music

function getMusicOn() {
  const raw = localStorage.getItem("ppc_musicOn");
  return raw === "true";
}

function setMusicOn(flag) {
  localStorage.setItem("ppc_musicOn", flag ? "true" : "false");
}

// ====== UI RENDERING ======

function showStarBurst(x, y) {
  const starEl = document.getElementById("star-burst");
  starEl.style.left = x + "px";
  starEl.style.top = y + "px";
  starEl.classList.add("show");
  setTimeout(() => {
    starEl.classList.remove("show");
  }, 400);
}

function glowPipi() {
  const pipi = document.getElementById("pipi");
  pipi.classList.add("glow");
  setTimeout(() => pipi.classList.remove("glow"), 500);
}

function updateStatsUI() {
  document.getElementById("star-count").textContent = getStars();
  document.getElementById("streak-count").textContent = getStreak();
}

function updateDailyStatus(tasks, completedMap) {
  const statusEl = document.getElementById("daily-status");

  if (!tasks.length) {
    statusEl.textContent =
      "No specific course meds today beyond your daily ones. Every pill still counts. 💕";
    return;
  }

  const total = tasks.length;
  const done = tasks.filter(t => completedMap[t.id]).length;

  if (done === 0) {
    statusEl.textContent =
      "No meds logged yet today. Start with just one dose – that’s already a win. 🌸";
  } else if (done < total) {
    statusEl.textContent =
      `You’ve logged ${done} of ${total} today. Every single one matters. ✨`;
  } else {
    const petName = getPetName();
    statusEl.textContent =
      `You completed all of today’s meds. ${petName}’s world sparkles a little brighter. 💖`;
  }
}

function renderTasksForToday() {
  const now = new Date();
  const dateKey = getDateKey(now);
  const tasks = getTasksForDate(now);
  const taskListEl = document.getElementById("task-list");

  document.getElementById("today-date").textContent = formatDateHuman(now);

  // Load completed tasks map for today
  const completedMap = loadJSON(`ppc_tasks_${dateKey}`, {});

  taskListEl.innerHTML = "";

  if (tasks.length === 0) {
    const msg = document.createElement("p");
    msg.textContent =
      "No specific meds scheduled today beyond your daily ones. Keep following your doctor’s advice. 💊";
    taskListEl.appendChild(msg);
    updateDailyStatus(tasks, completedMap);
    return;
  }

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";

    const info = document.createElement("div");
    info.className = "task-info";

    const timeEl = document.createElement("span");
    timeEl.className = "task-time";
    timeEl.textContent = task.timeOfDay;

    const labelEl = document.createElement("span");
    labelEl.className = "task-label";
    labelEl.textContent = task.label;

    const metaEl = document.createElement("span");
    metaEl.className = "task-meta";
    metaEl.textContent = task.details;

    info.appendChild(timeEl);
    info.appendChild(labelEl);
    info.appendChild(metaEl);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const status = document.createElement("span");
    status.className = "task-status";

    const button = document.createElement("button");
    button.className = "btn-pill";
    button.innerHTML = "<span>I took it</span>";

    const isDone = !!completedMap[task.id];
    if (isDone) {
      button.classList.add("done");
      status.textContent = "Logged";
    } else {
      status.textContent = "Not logged yet";
    }

    button.addEventListener("click", (event) => {
      handleTaskClick(task, dateKey, completedMap, event);
    });

    actions.appendChild(status);
    actions.appendChild(button);

    card.appendChild(info);
    card.appendChild(actions);

    taskListEl.appendChild(card);
  });

  updateDailyStatus(tasks, completedMap);
}

// ====== TASK COMPLETION & GAME LOGIC ======

function handleTaskClick(task, dateKey, completedMap, event) {
  if (completedMap[task.id]) {
    return; // already logged
  }

  completedMap[task.id] = true;
  saveJSON(`ppc_tasks_${dateKey}`, completedMap);

  // Add a star
  const newStars = getStars() + 1;
  setStars(newStars);

  const button = event.currentTarget;
  button.classList.add("done");
  const statusEl = button.parentElement.querySelector(".task-status");
  statusEl.textContent = "Logged";

  const rect = button.getBoundingClientRect();
  showStarBurst(rect.left + rect.width / 2, rect.top);
  glowPipi();
  updateStatsUI();

  const todayTasks = getTasksForDate(new Date(dateKey));
  const total = todayTasks.length;
  const done = todayTasks.filter(t => completedMap[t.id]).length;

  if (done === total) {
    const alreadyFull = localStorage.getItem(`ppc_full_${dateKey}`) === "true";
    if (!alreadyFull) {
      localStorage.setItem(`ppc_full_${dateKey}`, "true");

      const lastFull = getLastFullDate();
      let newStreak = 1;
      if (lastFull) {
        const diff = daysBetween(lastFull, dateKey);
        if (diff === 1) {
          newStreak = getStreak() + 1;
        }
      }

      setStreak(newStreak);
      setLastFullDate(dateKey);
      updateStatsUI();

      const worldMessage = document.getElementById("world-message");
      const petName = getPetName();
      worldMessage.dataset.custom = "1";
      worldMessage.textContent =
        `Full day complete. You showed up for yourself today – ${petName} feels very safe. 💗`;
    }
  }

  updateDailyStatus(todayTasks, completedMap);
}

// ====== RESET ======

function resetProgress() {
  const sure = confirm(
    "This will reset ALL stars, streak, and logged meds history.\n\n" +
    "Use this only if you really want to start over.\n\nContinue?"
  );
  if (!sure) return;

  localStorage.clear();
  location.reload();
}

// ====== MUSIC TOGGLE ======

function updateMusicButtonUI(isOn) {
  const musicIcon = document.getElementById("music-icon");
  if (!musicIcon) return;
  musicIcon.textContent = isOn ? "🎵" : "🔇";
}

// ====== INIT ======

document.addEventListener("DOMContentLoaded", () => {
  // Set initial pet name in UI
  refreshPetNameUI();

  updateStatsUI();
  renderTasksForToday();

  const settingsBtn = document.getElementById("settings-btn");
  const settingsOverlay = document.getElementById("settings-overlay");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const resetProgressBtn = document.getElementById("reset-progress-btn");
  const petNameInput = document.getElementById("pet-name-input");
  const saveNameBtn = document.getElementById("save-name-btn");

  const musicBtn = document.getElementById("music-btn");
  const bgMusic = document.getElementById("bg-music");

  // Music initial state
  if (bgMusic) {
    bgMusic.volume = 0.4;
    const musicOn = getMusicOn();
    updateMusicButtonUI(musicOn);
    // We only actually start playback when user taps, to avoid autoplay blocking
  }

  // Settings / name stuff
  if (petNameInput) {
    petNameInput.value = getPetName();
  }

  function openSettings() {
    settingsOverlay.classList.remove("hidden");
    settingsModal.classList.remove("hidden");
    if (petNameInput) {
      petNameInput.value = getPetName();
    }
  }

  function closeSettings() {
    settingsOverlay.classList.add("hidden");
    settingsModal.classList.add("hidden");
  }

  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", closeSettings);
  resetProgressBtn.addEventListener("click", resetProgress);

  if (saveNameBtn && petNameInput) {
    saveNameBtn.addEventListener("click", () => {
      const newName = petNameInput.value.trim() || "Pipi";
      setPetName(newName);
      refreshPetNameUI();
      alert(`Okay, I’ll call them ${newName} from now on 💗`);
    });
  }

  // Music toggle handler
  if (musicBtn && bgMusic) {
    musicBtn.addEventListener("click", () => {
      const currentlyOn = getMusicOn();
      const next = !currentlyOn;
      setMusicOn(next);
      updateMusicButtonUI(next);

      if (next) {
        bgMusic.play().catch(() => {
          setMusicOn(false);
          updateMusicButtonUI(false);
          alert("Your browser blocked autoplay. Try tapping again to allow music.");
        });
      } else {
        bgMusic.pause();
      }
    });
  }
});
