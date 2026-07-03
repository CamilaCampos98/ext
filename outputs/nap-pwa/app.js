const STORAGE_KEY = "soneca-pwa-state-v1";
const CIRCLE_LENGTH = 314;
const PUSH_PUBLIC_KEY_ENDPOINT = "/api/push/public-key";
const PUSH_SUBSCRIBE_ENDPOINT = "/api/push/subscribe";
const PUSH_SCHEDULE_ENDPOINT = "/api/push/schedule";
const ACTIVE_NAP_NOTICE_KEY = "soneca-active-nap-notices-v1";
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXhag4VlD-y5IbQWcYoU2TMoF6RMri96HrzylzMwsRMgJPZQN-pTs1MFPJqFpdKCl-Zg/exec";
const SHEETS_SHARED_TOKEN = "sonecas";
const DEFAULT_DAY_START = "07:00";

const wakeWindows = [
  { minAge: 0, maxAge: 1, min: 45, target: 60, max: 75, naps: "muitas" },
  { minAge: 2, maxAge: 2, min: 60, target: 75, max: 90, naps: "4-5" },
  { minAge: 3, maxAge: 4, min: 90, target: 105, max: 120, naps: "3-4" },
  { minAge: 5, maxAge: 6, min: 120, target: 150, max: 180, naps: "3" },
  { minAge: 7, maxAge: 8, min: 150, target: 180, max: 210, naps: "2-3" },
  { minAge: 9, maxAge: 11, min: 180, target: 210, max: 240, naps: "2" },
  { minAge: 12, maxAge: 15, min: 210, target: 240, max: 270, naps: "1-2" },
  { minAge: 16, maxAge: 24, min: 270, target: 300, max: 360, naps: "1" },
  { minAge: 25, maxAge: 36, min: 300, target: 360, max: 420, naps: "0-1" }
];

const defaultState = {
  babyName: "",
  babyAge: 6,
  babyBirthDate: "",
  dayStart: DEFAULT_DAY_START,
  lastWake: "",
  bedtime: "19:30",
  plannedNapCount: 5,
  activeNapStart: null,
  activeNightStart: null,
  cycleStartAt: null,
  naps: [],
  nights: [],
  feedings: [],
  feedingOptions: {
    breast: true,
    bottle: true,
    formula: true
  }
};

let state = loadState();
let notificationTimers = [];
let currentRingStartMinutes = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60);
let currentRingEndMinutes = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);

const els = {
  nextWindow: document.querySelector("#nextWindow"),
  nextHint: document.querySelector("#nextHint"),
  daySegments: document.querySelector("#daySegments"),
  dayMarkers: document.querySelector("#dayMarkers"),
  dayNowHand: document.querySelector("#dayNowHand"),
  dayCenterTime: document.querySelector("#dayCenterTime"),
  dayCenterLabel: document.querySelector("#dayCenterLabel"),
  dayCenterHint: document.querySelector("#dayCenterHint"),
  ringDayStart: document.querySelector("#ringDayStart"),
  ringDayEnd: document.querySelector("#ringDayEnd"),
  ringCaptions: document.querySelector("#ringCaptions"),
  napDetailCard: document.querySelector("#napDetailCard"),
  dayLegend: document.querySelector("#dayLegend"),
  bedtimeSuggestion: document.querySelector("#bedtimeSuggestion"),
  bedtimeReason: document.querySelector("#bedtimeReason"),
  sleepPressureRing: document.querySelector("#sleepPressureRing"),
  sleepPressure: document.querySelector("#sleepPressure"),
  timerPanel: document.querySelector(".timer-panel"),
  napStatus: document.querySelector("#napStatus"),
  notificationState: document.querySelector("#notificationState"),
  timer: document.querySelector("#timer"),
  currentStart: document.querySelector("#currentStart"),
  currentEnd: document.querySelector("#currentEnd"),
  currentMood: document.querySelector("#currentMood"),
  openStartSheet: document.querySelector("#openStartSheet"),
  startSheet: document.querySelector("#startSheet"),
  closeStartSheet: document.querySelector("#closeStartSheet"),
  startNap: document.querySelector("#startNap"),
  endNap: document.querySelector("#endNap"),
  startNight: document.querySelector("#startNight"),
  endNight: document.querySelector("#endNight"),
  openManualNap: document.querySelector("#openManualNap"),
  openManualNight: document.querySelector("#openManualNight"),
  openFeeding: document.querySelector("#openFeeding"),
  openManualFeeding: document.querySelector("#openManualFeeding"),
  activeNapHint: document.querySelector("#activeNapHint"),
  babyName: document.querySelector("#babyName"),
  babyBirthDate: document.querySelector("#babyBirthDate"),
  dayStart: document.querySelector("#dayStart"),
  lastWake: document.querySelector("#lastWake"),
  bedtime: document.querySelector("#bedtime"),
  plannedNapCount: document.querySelector("#plannedNapCount"),
  feedBreastEnabled: document.querySelector("#feedBreastEnabled"),
  feedBottleEnabled: document.querySelector("#feedBottleEnabled"),
  feedFormulaEnabled: document.querySelector("#feedFormulaEnabled"),
  profileName: document.querySelector("#profileName"),
  profileMeta: document.querySelector("#profileMeta"),
  profileCardName: document.querySelector("#profileCardName"),
  profileCardMeta: document.querySelector("#profileCardMeta"),
  wakeWindowUsed: document.querySelector("#wakeWindowUsed"),
  sleep24h: document.querySelector("#sleep24h"),
  napCount: document.querySelector("#napCount"),
  nightSleep: document.querySelector("#nightSleep"),
  daySleepGoal: document.querySelector("#daySleepGoal"),
  nightSleepGoal: document.querySelector("#nightSleepGoal"),
  assistantInsight: document.querySelector("#assistantInsight"),
  notificationHelpText: document.querySelector("#notificationHelpText"),
  history: document.querySelector("#history"),
  historyDate: document.querySelector("#historyDate"),
  todayHistory: document.querySelector("#todayHistory"),
  requestNotifications: document.querySelector("#requestNotifications"),
  clearHistory: document.querySelector("#clearHistory"),
  profileMenu: document.querySelector("#profileMenu"),
  historyMenu: document.querySelector("#historyMenu"),
  reportMenu: document.querySelector("#reportMenu"),
  profileSheet: document.querySelector("#profileSheet"),
  closeProfile: document.querySelector("#closeProfile"),
  historySheet: document.querySelector("#historySheet"),
  closeHistory: document.querySelector("#closeHistory"),
  reportSheet: document.querySelector("#reportSheet"),
  closeReport: document.querySelector("#closeReport"),
  avgNapCount: document.querySelector("#avgNapCount"),
  avgDaySleep: document.querySelector("#avgDaySleep"),
  avgNightSleep: document.querySelector("#avgNightSleep"),
  avgTotalSleep: document.querySelector("#avgTotalSleep"),
  sleepReportChart: document.querySelector("#sleepReportChart"),
  reportSummary: document.querySelector("#reportSummary"),
  reportWeekLabel: document.querySelector("#reportWeekLabel"),
  previousWeek: document.querySelector("#previousWeek"),
  currentWeek: document.querySelector("#currentWeek"),
  nextWeek: document.querySelector("#nextWeek"),
  profilePanel: document.querySelector("#profilePanel"),
  profileSheetMount: document.querySelector("#profileSheetMount"),
  installHelp: document.querySelector("#installHelp"),
  installSheet: document.querySelector("#installSheet"),
  closeInstall: document.querySelector("#closeInstall"),
  moodSheet: document.querySelector("#moodSheet"),
  closeMood: document.querySelector("#closeMood"),
  skipMood: document.querySelector("#skipMood"),
  manualNapSheet: document.querySelector("#manualNapSheet"),
  closeManualNap: document.querySelector("#closeManualNap"),
  manualStart: document.querySelector("#manualStart"),
  manualEnd: document.querySelector("#manualEnd"),
  manualTitle: document.querySelector("#manualTitle"),
  manualMoodOptions: document.querySelector("#manualMoodOptions"),
  saveManualNap: document.querySelector("#saveManualNap"),
  manualNapError: document.querySelector("#manualNapError"),
  feedingSheet: document.querySelector("#feedingSheet"),
  closeFeeding: document.querySelector("#closeFeeding"),
  feedingTitle: document.querySelector("#feedingTitle"),
  feedingTime: document.querySelector("#feedingTime"),
  feedingType: document.querySelector("#feedingType"),
  feedingSideGroup: document.querySelector("#feedingSideGroup"),
  feedingNote: document.querySelector("#feedingNote"),
  saveFeeding: document.querySelector("#saveFeeding"),
  feedingError: document.querySelector("#feedingError")
};

let manualMood = "";
let manualRecordType = "nap";
let reportWeekStart = startOfWeek(new Date());
let selectedFeedSide = "left";
let feedingSheetSupport = null;

init();

function init() {
  mountProfilePanel();
  hydrateForm();
  bindEvents();
  registerServiceWorker();
  updateNotificationState();
  render();
  syncFromSheetThenPending();
  setInterval(render, 1000);
}

function hydrateForm() {
  repairDayStartIfItHidesTodayNaps();
  applyLastWakeFromLatestNap();
  els.babyName.value = state.babyName;
  els.babyBirthDate.value = state.babyBirthDate || "";
  els.dayStart.value = state.dayStart || DEFAULT_DAY_START;
  els.lastWake.value = state.lastWake || minutesToTime(nowMinutes());
  els.bedtime.value = state.bedtime;
  els.plannedNapCount.value = String(plannedNapCount());
  hydrateFeedingOptions();
  if (!els.historyDate.value) {
    els.historyDate.value = dateInputValue(new Date());
  }
  if (!state.dayStart) {
    state.dayStart = DEFAULT_DAY_START;
  }
  if (!state.lastWake) {
    state.lastWake = els.lastWake.value;
  }
  saveState();
}

function repairDayStartIfItHidesTodayNaps() {
  if (!state.dayStart || !state.naps.length) return;

  const calendarNaps = calendarDayNaps();
  if (!calendarNaps.length) return;

  const currentDayStart = state.dayStart;
  const visibleWithCurrentStart = operationalDayNaps();
  if (visibleWithCurrentStart.length >= calendarNaps.length) return;

  state.dayStart = DEFAULT_DAY_START;
  state.naps = state.naps.map((nap) => (
    nap.dayStart === currentDayStart ? { ...nap, dayStart: DEFAULT_DAY_START } : nap
  ));
}

function bindEvents() {
  ["input", "change"].forEach((eventName) => {
    els.babyName.addEventListener(eventName, updateProfile);
    els.babyBirthDate.addEventListener(eventName, updateProfile);
    els.dayStart.addEventListener(eventName, updateProfile);
    els.lastWake.addEventListener(eventName, updateProfile);
    els.bedtime.addEventListener(eventName, updateProfile);
    els.plannedNapCount.addEventListener(eventName, updateProfile);
  });
  [els.feedBreastEnabled, els.feedBottleEnabled, els.feedFormulaEnabled].forEach((input) => {
    input.addEventListener("change", updateFeedingOptions);
  });

  els.openStartSheet.addEventListener("click", () => toggleStartSheet(true));
  els.closeStartSheet.addEventListener("click", () => toggleStartSheet(false));
  els.startNap.addEventListener("click", startNap);
  els.endNap.addEventListener("click", () => toggleMoodSheet(true));
  els.startNight.addEventListener("click", startNightSleep);
  els.endNight.addEventListener("click", completeNightSleep);
  els.openManualNap.addEventListener("click", () => openManualRecordSheet("nap"));
  els.openManualNight.addEventListener("click", () => openManualRecordSheet("night"));
  els.openFeeding.addEventListener("click", () => {
    toggleStartSheet(false);
    openFeedingSheet(false);
  });
  if (els.openManualFeeding) {
    els.openManualFeeding.addEventListener("click", () => openFeedingSheet(true));
  }
  els.requestNotifications.addEventListener("click", requestNotificationPermission);
  els.clearHistory.addEventListener("click", clearHistory);
  els.dayMarkers.addEventListener("click", handleDayMarkerClick);
  els.napDetailCard.addEventListener("click", handleNapDetailCardClick);
  els.historyDate.addEventListener("change", renderHistory);
  els.todayHistory.addEventListener("click", () => {
    els.historyDate.value = dateInputValue(new Date());
    renderHistory();
  });
  els.profileMenu.addEventListener("click", () => toggleProfileSheet(true));
  els.historyMenu.addEventListener("click", () => toggleHistorySheet(true));
  els.reportMenu.addEventListener("click", () => toggleReportSheet(true));
  els.previousWeek.addEventListener("click", () => shiftReportWeek(-1));
  els.currentWeek.addEventListener("click", () => {
    reportWeekStart = startOfWeek(new Date());
    renderReport();
  });
  els.nextWeek.addEventListener("click", () => shiftReportWeek(1));
  els.installHelp.addEventListener("click", () => toggleInstallSheet(true));
  els.closeProfile.addEventListener("click", () => toggleProfileSheet(false));
  els.closeHistory.addEventListener("click", () => toggleHistorySheet(false));
  els.closeReport.addEventListener("click", () => toggleReportSheet(false));
  els.closeInstall.addEventListener("click", () => toggleInstallSheet(false));
  els.closeMood.addEventListener("click", () => toggleMoodSheet(false));
  els.skipMood.addEventListener("click", () => completeNap(""));
  document.querySelectorAll("[data-mood]").forEach((button) => {
    button.addEventListener("click", () => completeNap(button.dataset.mood));
  });
  document.querySelectorAll("[data-manual-mood]").forEach((button) => {
    button.addEventListener("click", () => selectManualMood(button.dataset.manualMood));
  });
  els.closeManualNap.addEventListener("click", () => toggleManualNapSheet(false));
  els.saveManualNap.addEventListener("click", saveManualNap);
  els.closeFeeding.addEventListener("click", () => toggleFeedingSheet(false));
  els.saveFeeding.addEventListener("click", saveFeeding);
  document.querySelectorAll("[data-feed-side]").forEach((button) => {
    button.addEventListener("click", () => selectFeedSide(button.dataset.feedSide));
  });
  els.feedingType.addEventListener("change", updateFeedingSideVisibility);
  els.installSheet.addEventListener("click", (event) => {
    if (event.target === els.installSheet) toggleInstallSheet(false);
  });
  els.profileSheet.addEventListener("click", (event) => {
    if (event.target === els.profileSheet) toggleProfileSheet(false);
  });
  els.historySheet.addEventListener("click", (event) => {
    if (event.target === els.historySheet) toggleHistorySheet(false);
  });
  els.reportSheet.addEventListener("click", (event) => {
    if (event.target === els.reportSheet) toggleReportSheet(false);
  });
  els.moodSheet.addEventListener("click", (event) => {
    if (event.target === els.moodSheet) toggleMoodSheet(false);
  });
  els.startSheet.addEventListener("click", (event) => {
    if (event.target === els.startSheet) toggleStartSheet(false);
  });
  els.manualNapSheet.addEventListener("click", (event) => {
    if (event.target === els.manualNapSheet) toggleManualNapSheet(false);
  });
  els.feedingSheet.addEventListener("click", (event) => {
    if (event.target === els.feedingSheet) toggleFeedingSheet(false);
  });
  els.history.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-nap]");
    if (button) removeNapRecord(button.dataset.deleteNap);
    const feedingButton = event.target.closest("[data-delete-feeding]");
    if (feedingButton) removeFeedingRecord(feedingButton.dataset.deleteFeeding);
  });
}

function mountProfilePanel() {
  if (!els.profilePanel || !els.profileSheetMount) return;
  els.profileSheetMount.appendChild(els.profilePanel);
  els.profilePanel.classList.add("is-in-sheet");
}

function updateProfile() {
  state.babyName = els.babyName.value.trim();
  state.babyBirthDate = els.babyBirthDate.value;
  state.babyAge = currentBabyAgeMonths();
  state.dayStart = els.dayStart.value;
  state.lastWake = els.lastWake.value;
  state.bedtime = els.bedtime.value;
  state.plannedNapCount = plannedNapCount();
  saveState();
  scheduleUpcomingNotifications();
  render();
}

function hydrateFeedingOptions() {
  const options = inferredFeedingOptions();
  state.feedingOptions = options;
  els.feedBreastEnabled.checked = options.breast;
  els.feedBottleEnabled.checked = options.bottle;
  els.feedFormulaEnabled.checked = options.formula;
}

function updateFeedingOptions() {
  state.feedingOptions = {
    breast: els.feedBreastEnabled.checked,
    bottle: els.feedBottleEnabled.checked,
    formula: els.feedFormulaEnabled.checked
  };

  if (!state.feedingOptions.breast && !state.feedingOptions.bottle && !state.feedingOptions.formula) {
    state.feedingOptions.breast = true;
    els.feedBreastEnabled.checked = true;
  }

  saveState();
  renderFeedingTypeOptions();
}

function startNap() {
  if (state.activeNapStart || state.activeNightStart) return;
  toggleStartSheet(false);
  state.activeNapStart = new Date().toISOString();
  clearNotificationTimers();
  saveState();
  scheduleActiveNapNotifications();
  render();
}

function startNightSleep() {
  if (state.activeNapStart || state.activeNightStart) return;
  state.activeNightStart = new Date().toISOString();
  clearNotificationTimers();
  saveState();
  render();
}

function completeNightSleep() {
  if (!state.activeNightStart) return;
  const startedAt = new Date(state.activeNightStart);
  const endedAt = new Date();

  if (Number.isNaN(startedAt.getTime()) || endedAt <= startedAt) {
    state.activeNightStart = null;
    saveState();
    render();
    return;
  }

  const night = createNightRecord(startedAt, endedAt);
  addNightRecord(night);
  state.activeNightStart = null;
  applyNightAsCycleStartIfLatest(night);
  saveState();
  syncNightToSheet(night);
  scheduleUpcomingNotifications();
  render();
}

function completeNap(mood) {
  if (!state.activeNapStart) return;
  const startedAt = new Date(state.activeNapStart);
  const endedAt = new Date();
  const nap = createNapRecord(startedAt, endedAt, mood);
  addNapRecord(nap);
  state.activeNapStart = null;
  clearNotificationTimers();
  toggleMoodSheet(false);
  scheduleUpcomingNotifications();
  render();
}

function saveManualNap() {
  const startedAt = new Date(els.manualStart.value);
  const endedAt = new Date(els.manualEnd.value);

  if (!els.manualStart.value || !els.manualEnd.value) {
    showManualError(manualRecordType === "night" ? "Informe início e fim do sono noturno." : "Informe início e fim da soneca.");
    return;
  }

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    showManualError("Horário inválido.");
    return;
  }

  if (endedAt <= startedAt) {
    showManualError("O fim precisa ser depois do início.");
    return;
  }

  const durationMinutes = (endedAt - startedAt) / 60000;
  const maxDuration = manualRecordType === "night" ? 16 * 60 : 240;

  if (durationMinutes > maxDuration) {
    showManualError(manualRecordType === "night"
      ? "Confira os horários: o sono noturno ficou maior que 16 horas."
      : "Confira os horários: a soneca ficou maior que 4 horas."
    );
    return;
  }

  if (manualRecordType === "night") {
    const night = createNightRecord(startedAt, endedAt);
    addNightRecord(night);
    applyNightAsCycleStartIfLatest(night);
    syncNightToSheet(night);
  } else {
    const nap = createNapRecord(startedAt, endedAt, manualMood);
    addNapRecord(nap);
  }

  toggleManualNapSheet(false);
  render();
}

function createNapRecord(startedAt, endedAt, mood) {
  return {
    id: `${startedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "nap",
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    dayStart: state.dayStart,
    bedtime: state.bedtime,
    lastWake: state.lastWake,
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: Math.max(1, Math.round((endedAt - startedAt) / 60000)),
    mood,
    synced: false
  };
}

function createNightRecord(startedAt, endedAt) {
  return {
    id: `night-${startedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "night",
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    dayStart: minutesToTime(dateToDayMinutes(endedAt)),
    bedtime: minutesToTime(dateToDayMinutes(startedAt)),
    lastWake: minutesToTime(dateToDayMinutes(endedAt)),
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: Math.max(1, Math.round((endedAt - startedAt) / 60000)),
    mood: "",
    synced: false
  };
}

function createFeedingRecord(fedAt, type, side, note) {
  return {
    id: `feed-${fedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    at: fedAt.toISOString(),
    type,
    side: type === "breast" ? side : "",
    note: note || "",
    dayStart: state.dayStart,
    synced: false
  };
}

function addNapRecord(nap) {
  state.naps.unshift(nap);
  state.naps.sort((a, b) => new Date(b.end) - new Date(a.end));
  state.naps = state.naps.slice(0, 80);
  applyLastWakeFromLatestNap();
  nap.babyName = state.babyName || "";
  nap.babyAge = currentBabyAgeMonths();
  nap.dayStart = state.dayStart;
  nap.bedtime = state.bedtime;
  nap.lastWake = state.lastWake;
  saveState();
  syncNapToSheet(nap);
}

function addNightRecord(night) {
  state.nights.unshift(night);
  state.nights.sort((a, b) => new Date(b.end) - new Date(a.end));
  state.nights = state.nights.slice(0, 80);
}

function addFeedingRecord(feeding) {
  const duplicate = state.feedings.find((item) => feedingSignature(item) === feedingSignature(feeding));
  if (duplicate) {
    setHint("Mamada duplicada ignorada: já existe um registro igual neste horário.");
    return;
  }

  state.feedings.unshift(feeding);
  state.feedings = dedupeFeedings(state.feedings)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  state.feedings = state.feedings.slice(0, 160);
  hydrateFeedingOptions();
  saveState();
  syncFeedingToSheet(feeding);
}

function applyNightAsCycleStartIfLatest(night) {
  const endedAt = new Date(night.end);
  if (Number.isNaN(endedAt.getTime())) return;

  const currentCycle = new Date(state.cycleStartAt || "");
  if (!Number.isNaN(currentCycle.getTime()) && endedAt < currentCycle) return;

  state.cycleStartAt = endedAt.toISOString();
  state.dayStart = minutesToTime(dateToDayMinutes(endedAt));
  els.dayStart.value = state.dayStart;
  if (!napsToday().length) {
    state.lastWake = state.dayStart;
    els.lastWake.value = state.lastWake;
  } else {
    applyLastWakeFromLatestNap();
  }
}

function applyLastWakeFromLatestNap() {
  if (!state.naps.length) return false;
  const sortedNaps = state.naps
    .slice()
    .sort((a, b) => new Date(b.end) - new Date(a.end));
  const latestWake = new Date(sortedNaps[0].end);
  if (Number.isNaN(latestWake.getTime())) return false;

  state.lastWake = minutesToTime(dateToDayMinutes(latestWake));
  if (els.lastWake) els.lastWake.value = state.lastWake;
  return true;
}

function removeNapRecord(napKey) {
  const nap = state.naps.find((item) => napIdentity(item) === napKey);
  const night = state.nights.find((item) => napIdentity(item) === napKey);
  state.naps = state.naps.filter((item) => napIdentity(item) !== napKey);
  state.nights = state.nights.filter((item) => napIdentity(item) !== napKey);

  if (!applyLastWakeFromLatestNap()) {
    state.lastWake = minutesToTime(nowMinutes());
    els.lastWake.value = state.lastWake;
  } else {
    els.lastWake.value = state.lastWake;
  }
  saveState();
  if (nap && nap.id) deleteNapFromSheet(nap.id);
  if (night && night.id) deleteNapFromSheet(night.id);
  render();
}

function removeFeedingRecord(feedingKey) {
  const feeding = state.feedings.find((item) => feedingIdentity(item) === feedingKey);
  state.feedings = state.feedings.filter((item) => feedingIdentity(item) !== feedingKey);
  saveState();
  if (feeding && feeding.id) deleteFeedingFromSheet(feeding.id);
  render();
}

function clearHistory() {
  state.naps = [];
  state.nights = [];
  state.feedings = [];
  state.cycleStartAt = null;
  saveState();
  render();
}

async function requestNotificationPermission() {
  updateNotificationHelp("Verificando suporte de avisos neste navegador...");
  const environment = notificationEnvironment();

  if (!environment.secure) {
    updateNotificationState("Precisa HTTPS");
    updateNotificationHelp("No iPhone, avisos de PWA precisam rodar em HTTPS. O IP local serve para testar a tela, mas não libera push real.");
    return;
  }

  if (!("Notification" in window)) {
    updateNotificationState("Sem suporte");
    updateNotificationHelp("Este navegador não oferece Notification API.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    updateNotificationState("Sem suporte");
    updateNotificationHelp("Este navegador não oferece Service Worker, então não consegue receber avisos de PWA.");
    return;
  }

  await ensureServiceWorkerReady();

  if (!environment.installed && isAppleMobile()) {
    updateNotificationHelp("No iPhone, abra pelo ícone adicionado à Tela de Início. O Safari em aba comum normalmente não libera avisos de web app.");
  }

  const result = await Notification.requestPermission();
  updateNotificationState();

  if (result === "denied") {
    updateNotificationHelp("Os avisos foram bloqueados. No iPhone, ajuste em Ajustes > Notificações, ou remova e adicione a PWA novamente à Tela de Início.");
    return;
  }

  if (result !== "granted") {
    updateNotificationHelp("Permissão ainda não concedida. Toque novamente e aceite o pedido do sistema quando ele aparecer.");
    return;
  }

  const pushReady = "PushManager" in window;
  if (result === "granted") {
    const pushResult = pushReady ? await subscribeToPushIfConfigured() : { ok: false, message: "Este navegador não expôs PushManager para push remoto." };
    updateNotificationHelp(pushResult.message);
    if (state.activeNapStart) {
      scheduleActiveNapNotifications();
    } else {
      scheduleUpcomingNotifications();
    }
  }
}

function render() {
  const prediction = calculatePrediction();
  renderProfile();
  renderPrediction(prediction);
  renderDayPlanner(prediction);
  renderTimer();
  renderInsights(prediction);
  renderHistory();
  renderReport();
}

function renderProfile() {
  const name = state.babyName || "Bebê";
  const age = currentBabyAgeMonths();
  const ageLabel = `${age} ${age === 1 ? "mês" : "meses"}`;
  const dayStart = state.dayStart || state.lastWake || "--:--";

  if (els.profileName) els.profileName.textContent = name;
  if (els.profileMeta) els.profileMeta.textContent = ageLabel;
  els.profileCardName.textContent = name;
  els.profileCardMeta.textContent = `${ageLabel} · dia iniciado às ${dayStart}`;
}

function calculatePrediction() {
  const age = currentBabyAgeMonths();
  const profile = wakeWindowForAge(age);
  const today = napsToday();
  const recent = state.naps.slice(0, 7);
  const lastNap = today[0] || recent[0];
  const sleep24 = sleepInLast24Hours();
  const bedtimeMinutes = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const lastWakeMinutes = effectiveLastWakeMinutes(today);

  let adjustment = 0;
  if (lastNap && lastNap.duration < 35) adjustment -= 20;
  if (lastNap && lastNap.duration > 100) adjustment += 15;

  const averageWindow = averageRecentWakeWindow(recent);
  if (averageWindow) {
    adjustment += clamp(Math.round((averageWindow - profile.target) * 0.35), -25, 25);
  }

  const expectedSleep = expectedDailySleep(age);
  if (sleep24 < expectedSleep.min * 60) adjustment -= 15;
  if (sleep24 > expectedSleep.max * 60) adjustment += 10;

  const minWindow = clamp(profile.min + adjustment, 35, 430);
  const targetWindow = clamp(profile.target + adjustment, minWindow, 450);
  let maxWindow = clamp(profile.max + adjustment, targetWindow, 480);

  const latestBeforeBed = bedtimeMinutes - 120;
  if (lastWakeMinutes + maxWindow > latestBeforeBed && bedtimeMinutes > lastWakeMinutes) {
    maxWindow = Math.max(targetWindow, latestBeforeBed - lastWakeMinutes);
  }

  const start = lastWakeMinutes + minWindow;
  const target = lastWakeMinutes + targetWindow;
  const end = lastWakeMinutes + maxWindow;
  const pressure = targetWindow > 0 ? clamp(Math.round(((nowMinutes() - lastWakeMinutes) / targetWindow) * 100), 0, 130) : 0;

  return {
    profile,
    minWindow,
    targetWindow,
    maxWindow,
    start,
    target,
    end,
    pressure,
    sleep24,
    expectedSleep
  };
}

function renderPrediction(prediction) {
  els.wakeWindowUsed.textContent = `${formatDuration(prediction.minWindow)} - ${formatDuration(prediction.maxWindow)}`;
  els.sleepPressure.textContent = `${Math.min(prediction.pressure, 100)}%`;
  els.sleepPressureRing.style.strokeDashoffset = String(CIRCLE_LENGTH - CIRCLE_LENGTH * Math.min(prediction.pressure, 100) / 100);

  if (state.activeNapStart) {
    if (els.nextWindow) els.nextWindow.textContent = "Soneca em andamento";
    if (els.nextHint) els.nextHint.textContent = "O próximo cálculo será atualizado quando a soneca for encerrada.";
    return;
  }

  if (state.activeNightStart) {
    if (els.nextWindow) els.nextWindow.textContent = "Sono noturno";
    if (els.nextHint) els.nextHint.textContent = "O novo ciclo do dia começa quando o sono noturno for encerrado.";
    return;
  }

  if (nowMinutes() > prediction.end) {
    const name = state.babyName || "bebê";
    if (els.nextWindow) els.nextWindow.textContent = "Janela aberta";
    if (els.nextHint) els.nextHint.textContent = `${name} já passou do alvo provável. Observe sinais de sono e ajuste o próximo registro ao encerrar.`;
    return;
  }

  if (els.nextWindow) els.nextWindow.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`;
  const target = minutesToTime(prediction.target);
  const name = state.babyName || "bebê";
  if (els.nextHint) els.nextHint.textContent = `Alvo provável para ${name}: perto de ${target}.`;
}

function renderDayPlanner(prediction) {
  const now = nowMinutes();
  const night = calculateNightSuggestion(prediction);
  const today = napsToday();
  const ringNaps = [...today].sort((a, b) => new Date(a.start) - new Date(b.start));
  const feedings = feedingsToday();
  currentRingStartMinutes = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60);
  currentRingEndMinutes = night.start;
  const plannedNaps = plannedNapMarkers(prediction, today, night);

  els.daySegments.innerHTML = "";
  els.dayMarkers.innerHTML = [
    { type: "day-start", at: safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60), label: state.dayStart || state.lastWake || DEFAULT_DAY_START },
    ...ringNaps.map((nap, index) => ({
      type: "nap",
      at: dateToDayMinutes(new Date(nap.start)),
      label: timeLabel(new Date(nap.start)),
      id: napIdentity(nap),
      index: index + 1
    })),
    ...(state.activeNapStart ? [{ type: "nap", at: dateToDayMinutes(new Date(state.activeNapStart)), label: timeLabel(new Date(state.activeNapStart)) }] : []),
    ...feedings.map((feeding) => ({ type: "feed", at: dateToDayMinutes(new Date(feeding.at)) })),
    ...plannedNaps.map((nap) => ({ type: "next", at: nap.target, label: minutesToTime(nap.target), startAt: nap.start, endAt: nap.end, startLabel: minutesToTime(nap.start), endLabel: minutesToTime(nap.end) })),
    { type: "day-end", at: night.start, label: minutesToTime(night.start) }
  ]
    .filter((marker) => Number.isFinite(marker.at))
    .map((marker) => markerSvg(marker))
    .join("");

  const nowPoint = pointOnCircle(now, 92);
  els.dayNowHand.setAttribute("x2", String(nowPoint.x));
  els.dayNowHand.setAttribute("y2", String(nowPoint.y));
  renderRingCenter(prediction, today);
  renderRingDayLabels(night);
  if (els.bedtimeSuggestion) {
    els.bedtimeSuggestion.textContent = minutesToTime(night.start);
  }
  if (els.bedtimeReason) {
    els.bedtimeReason.textContent = night.reason;
  }
  els.ringCaptions.innerHTML = "";
  if (els.dayLegend) {
    els.dayLegend.innerHTML = "";
  }
}

function handleDayMarkerClick(event) {
  const dayEndMarker = event.target.closest(".day-marker-group.day-end");
  if (dayEndMarker) {
    showNightDetailCard();
    return;
  }

  const marker = event.target.closest(".day-marker-group.nap[data-nap-id]");
  if (!marker) {
    hideNapDetailCard();
    return;
  }

  const nap = napsToday().find((item) => napIdentity(item) === marker.dataset.napId);
  if (!nap) {
    hideNapDetailCard();
    return;
  }

  showNapDetailCard(nap, Number(marker.dataset.napIndex || 0));
}

function handleNapDetailCardClick(event) {
  if (event.target.closest("[data-close-nap-detail]")) {
    hideNapDetailCard();
  }
}

function showNapDetailCard(nap, index) {
  if (!els.napDetailCard) return;
  const start = new Date(nap.start);
  const end = new Date(nap.end);
  const title = index ? `${ordinalFeminine(index)} soneca` : "Soneca";
  els.napDetailCard.innerHTML = `
    <button class="nap-detail-close" type="button" data-close-nap-detail aria-label="Fechar">×</button>
    <span>${title}</span>
    <strong>Soneca: ${timeLabel(start)} - ${timeLabel(end)}</strong>
    <small>Duração: ${formatDuration(safeDuration(nap))}</small>
  `;
  els.napDetailCard.hidden = false;
}

function showNightDetailCard() {
  if (!els.napDetailCard) return;
  const prediction = calculatePrediction();
  const suggested = calculateNightSuggestion(prediction);
  els.napDetailCard.innerHTML = `
    <button class="nap-detail-close" type="button" data-close-nap-detail aria-label="Fechar">×</button>
    <span>Sono noturno</span>
    <strong>${minutesToTime(suggested.start)}</strong>
    <small>${suggested.reason}</small>
  `;
  els.napDetailCard.hidden = false;
}

function hideNapDetailCard() {
  if (els.napDetailCard) {
    els.napDetailCard.hidden = true;
  }
}

function renderRingCenter(prediction, today) {
  const nextNapName = `${ordinalFeminine(today.length + 1)} soneca`;
  const now = nowMinutes();
  const target = minutesToTime(prediction.target);
  const name = state.babyName || "bebê";

  if (state.activeNapStart) {
    const startedAt = new Date(state.activeNapStart);
    const elapsed = Number.isNaN(startedAt.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
    els.dayCenterLabel.textContent = "dormindo há";
    els.dayCenterTime.textContent = formatRingDuration(elapsed);
    els.dayCenterHint.textContent = `Próxima janela: ${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)} · alvo ${target}`;
    return;
  }

  if (state.activeNightStart) {
    els.dayCenterLabel.textContent = "sono noturno";
    els.dayCenterTime.textContent = "em andamento";
    els.dayCenterHint.textContent = "O novo ciclo começa ao encerrar a noite.";
    return;
  }

  if (now < prediction.start) {
    els.dayCenterLabel.textContent = `${nextNapName} em`;
    els.dayCenterTime.textContent = formatDuration(prediction.start - now);
    els.dayCenterHint.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)} · ${name}: perto de ${target}`;
    return;
  }

  if (now <= prediction.end) {
    els.dayCenterLabel.textContent = nextNapName;
    els.dayCenterTime.textContent = "janela aberta";
    els.dayCenterHint.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)} · ${name}: perto de ${target}`;
    return;
  }

  els.dayCenterLabel.textContent = nextNapName;
  els.dayCenterTime.textContent = "janela aberta";
  els.dayCenterHint.textContent = `${name} já passou do alvo provável.`;
}

function renderRingDayLabels(night) {
  const dayStart = normalizeTimeField(state.dayStart || state.lastWake) || DEFAULT_DAY_START;
  const dayEnd = minutesToTime(night.start);
  if (els.ringDayStart) {
    els.ringDayStart.querySelector("strong").textContent = dayStart;
  }
  if (els.ringDayEnd) {
    els.ringDayEnd.querySelector("strong").textContent = dayEnd;
  }
}

function plannedNapMarkers(prediction, today, night) {
  const total = plannedNapCount();
  const done = today.length + (state.activeNapStart ? 1 : 0);
  const remaining = Math.max(0, total - done);
  if (!remaining || state.activeNightStart) return [];

  const markers = [];
  const now = nowMinutes();
  let start = state.activeNapStart ? now + 45 : prediction.start;
  const dayEnd = night.start;
  const available = Math.max(remaining * 36, minutesBetweenClock(start, dayEnd) - 24);
  const step = remaining <= 1 ? 0 : available / remaining;

  for (let index = 0; index < remaining; index += 1) {
    const windowStart = index === 0 && !state.activeNapStart ? start : start + Math.round(step * index);
    const clampedStart = clampClockWithinDay(windowStart, dayEnd - 30);
    const windowEnd = Math.min(clampedStart + 30, dayEnd - 8);
    const target = Math.round((clampedStart + windowEnd) / 2);
    if (windowEnd <= clampedStart || target >= dayEnd) continue;
    markers.push({ start: clampedStart, end: windowEnd, target });
  }

  return markers;
}

function calculateNightSuggestion(prediction) {
  const profile = prediction.profile;
  const today = napsToday();
  const lastNap = today[0];
  const lastWake = effectiveLastWakeMinutes(today);
  const plannedBedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const finalWakeWindow = clamp(profile.target + 35, profile.min + 20, profile.max + 35);
  const napSleepToday = today.reduce((sum, nap) => sum + safeDuration(nap), 0);
  const expectedNaps = plannedNapCount();

  let adjustment = 0;
  if (lastNap && lastNap.duration < 35) adjustment -= 25;
  if (napSleepToday < 90 && currentBabyAgeMonths() >= 4) adjustment -= 20;
  if (today.length > expectedNaps) adjustment -= 15;
  if (today.length < expectedNaps && nowMinutes() > 15 * 60) adjustment -= 10;

  let suggested = lastWake + finalWakeWindow + adjustment;
  const earliest = plannedBedtime - 75;
  const latest = plannedBedtime + 45;
  suggested = clamp(suggested, earliest, latest);

  if (Math.abs(suggested - plannedBedtime) <= 25) {
    suggested = plannedBedtime;
  }

  const reason = lastNap
    ? `Baseado no último despertar (${minutesToTime(lastWake)}), ${today.length} soneca${today.length === 1 ? "" : "s"}, ${formatDuration(napSleepToday)} de sono diurno e sono noturno cadastrado para ${state.bedtime}.`
    : `Baseado no início do dia (${state.dayStart || state.lastWake}) e no sono noturno cadastrado para ${state.bedtime}.`;

  return { start: suggested, reason };
}

function effectiveLastWakeMinutes(today = napsToday()) {
  const latestNapToday = today[0];
  if (latestNapToday) {
    const endedAt = new Date(latestNapToday.end);
    if (!Number.isNaN(endedAt.getTime())) return dateToDayMinutes(endedAt);
  }

  return safeTimeToMinutes(state.dayStart || state.lastWake, nowMinutes());
}

function renderTimer() {
  const active = Boolean(state.activeNapStart);
  const nightActive = Boolean(state.activeNightStart);
  els.timerPanel.classList.toggle("is-idle", !active && !nightActive);
  els.timerPanel.classList.toggle("is-active", active || nightActive);
  els.openStartSheet.disabled = active || nightActive;
  els.startNap.disabled = active || nightActive;
  els.endNap.disabled = !active;
  els.startNight.disabled = active || nightActive;
  els.endNight.disabled = !nightActive;

  if (nightActive) {
    const startedAt = new Date(state.activeNightStart);
    els.timer.textContent = "noite";
    els.napStatus.textContent = "Sono noturno em andamento";
    els.currentStart.textContent = timeLabel(startedAt);
    els.currentEnd.textContent = "ao acordar";
    els.currentMood.textContent = "Noite";
    return;
  }

  if (!active) {
    const lastNap = state.naps[0];
    els.timer.textContent = "00:00";
    els.napStatus.textContent = "Nenhuma soneca ativa";
    els.currentStart.textContent = lastNap ? timeLabel(new Date(lastNap.start)) : "-";
    els.currentEnd.textContent = lastNap ? timeLabel(new Date(lastNap.end)) : "-";
    els.currentMood.textContent = lastNap ? moodLabel(lastNap.mood) : "-";
    return;
  }
  const startedAt = new Date(state.activeNapStart);
  const minutes = Math.floor((Date.now() - startedAt.getTime()) / 60000);
  const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000) % 60;
  els.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.currentStart.textContent = timeLabel(startedAt);
  els.currentEnd.textContent = "em andamento";
  els.currentMood.textContent = "-";
  els.napStatus.textContent = `Dormindo há ${formatDuration(minutes)}`;
}

function renderInsights(prediction) {
  const daySleep = dayNapSleepMinutes();
  const nightSleep = nightSleepInLast24Hours();
  const goals = sleepGoalsForAge(currentBabyAgeMonths());
  els.sleep24h.textContent = formatDuration(daySleep);
  els.napCount.textContent = String(napsToday().length);
  els.nightSleep.textContent = formatDuration(nightSleep);
  if (els.daySleepGoal) {
    els.daySleepGoal.textContent = `${babyDisplayName()} fez ${formatDuration(daySleep)}`;
  }
  if (els.nightSleepGoal) {
    els.nightSleepGoal.textContent = `${babyDisplayName()} fez ${formatDuration(nightSleep)}`;
  }
  if (els.assistantInsight) {
    els.assistantInsight.textContent = assistantSuggestion(prediction, daySleep, nightSleep, goals);
  }
}

function renderHistory() {
  if (!els.historyDate.value) {
    els.historyDate.value = dateInputValue(new Date());
  }

  const records = [
    ...state.naps.map((record) => ({ ...record, type: "nap" })),
    ...state.nights.map((record) => ({ ...record, type: "night" })),
    ...dedupeFeedings(state.feedings).map((record) => ({ ...record, type: "feeding", start: record.at, end: record.at }))
  ]
    .filter((record) => recordDateInputValue(record) === els.historyDate.value)
    .sort((a, b) => new Date(b.end) - new Date(a.end));

  if (!records.length) {
    els.history.innerHTML = `<li><span>Nenhum registro nesta data</span><strong>-</strong></li>`;
    return;
  }
  els.history.innerHTML = records.map((record) => {
    const start = new Date(record.start);
    const end = new Date(record.end);
    if (record.type === "feeding") {
      return `<li><div><span>Mamada · ${dateLabel(start)}</span><div class="history-times"><b>${timeLabel(start)}</b><b>${feedingLabel(record)}</b></div></div><div class="history-actions"><div class="history-mood">${feedingSideLabel(record.side)}</div><button class="delete-nap" data-delete-feeding="${feedingIdentity(record)}" aria-label="Excluir mamada" title="Excluir mamada">×</button></div></li>`;
    }
    const label = record.type === "night" ? "Sono noturno" : moodLabel(record.mood);
    const typeLabel = record.type === "night" ? "Noite" : "Soneca";
    return `<li><div><span>${typeLabel} · ${dateLabel(start)}</span><div class="history-times"><b>${timeLabel(start)} - ${timeLabel(end)}</b><b>${formatDuration(safeDuration(record))}</b></div></div><div class="history-actions"><div class="history-mood">${label}</div><button class="delete-nap" data-delete-nap="${napIdentity(record)}" aria-label="Excluir registro" title="Excluir registro">×</button></div></li>`;
  }).join("");
}

function renderReport() {
  const days = reportWeekDays(reportWeekStart);
  const activeDays = days.filter((day) => day.napCount || day.daySleep || day.nightSleep);
  const divisor = activeDays.length || 1;
  const avgNapCount = activeDays.reduce((sum, day) => sum + day.napCount, 0) / divisor;
  const avgDaySleep = activeDays.reduce((sum, day) => sum + day.daySleep, 0) / divisor;
  const avgNightSleep = activeDays.reduce((sum, day) => sum + day.nightSleep, 0) / divisor;
  const avgTotalSleep = activeDays.reduce((sum, day) => sum + day.totalSleep, 0) / divisor;
  const weekEnd = addDays(reportWeekStart, 6);

  els.reportWeekLabel.textContent = `${shortDateLabel(reportWeekStart)} - ${shortDateLabel(weekEnd)}`;
  els.avgNapCount.textContent = activeDays.length ? avgNapCount.toFixed(1).replace(".", ",") : "0";
  els.avgDaySleep.textContent = formatDuration(Math.round(avgDaySleep));
  els.avgNightSleep.textContent = formatDuration(Math.round(avgNightSleep));
  els.avgTotalSleep.textContent = formatDuration(Math.round(avgTotalSleep));
  els.reportSummary.textContent = activeDays.length
    ? `${activeDays.length} dia${activeDays.length === 1 ? "" : "s"} com registro nesta semana.`
    : "Sem registros suficientes para calcular a media.";

  renderSleepReportChart(days);
}

function reportWeekDays(startDate) {
  const days = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(startDate, offset);
    const key = dateInputValue(date);
    const naps = state.naps.filter((nap) => recordDateInputValue(nap) === key);
    const nights = state.nights.filter((night) => recordDateInputValue({ ...night, start: night.end }) === key);
    const daySleep = naps.reduce((sum, nap) => sum + safeDuration(nap), 0);
    const nightSleep = nights.reduce((sum, night) => sum + safeDuration(night), 0);

    days.push({
      key,
      label: shortWeekdayLabel(date),
      napCount: naps.length,
      daySleep,
      nightSleep,
      totalSleep: daySleep + nightSleep
    });
  }

  return days;
}

function shiftReportWeek(direction) {
  reportWeekStart = addDays(reportWeekStart, direction * 7);
  renderReport();
}

function renderSleepReportChart(days) {
  if (!els.sleepReportChart) return;

  const width = 640;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(60, ...days.flatMap((day) => [day.daySleep, day.nightSleep, day.totalSleep]));
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const pathFor = (selector) => days.map((day, index) => `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleY(selector(day)))}`).join(" ");
  const tickValues = [0, Math.round(maxValue / 2), maxValue];
  const labelIndexes = [0, Math.floor((days.length - 1) / 2), days.length - 1];

  els.sleepReportChart.innerHTML = `
    <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
    ${tickValues.map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="8" y="${roundSvg(scaleY(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
    <path class="chart-line day" d="${pathFor((day) => day.daySleep)}"></path>
    <path class="chart-line night" d="${pathFor((day) => day.nightSleep)}"></path>
    <path class="chart-line total" d="${pathFor((day) => day.totalSleep)}"></path>
    ${days.map((day, index) => day.totalSleep ? `<circle class="chart-point total" cx="${roundSvg(scaleX(index))}" cy="${roundSvg(scaleY(day.totalSleep))}" r="3"></circle>` : "").join("")}
    ${labelIndexes.map((index) => `<text class="chart-label x" x="${roundSvg(scaleX(index))}" y="${height - 10}">${days[index] ? days[index].label : ""}</text>`).join("")}
  `;
}

function napIdentity(nap) {
  return nap.id || `${nap.start}|${nap.end}|${nap.duration}|${nap.mood || ""}`;
}

function stableNapId(nap) {
  return `legacy-${Math.abs(hashString(napIdentity(nap)))}`;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

async function syncNapToSheet(nap) {
  if (!SHEETS_WEB_APP_URL || !nap) return;
  return syncNapsToSheet([nap], "Registro salvo no aparelho. Enviando para o Google Sheets...");
}

async function syncNightToSheet(night) {
  if (!SHEETS_WEB_APP_URL || !night) return;
  return syncNapsToSheet([night], "Sono noturno salvo no aparelho. Enviando para o Google Sheets...");
}

async function syncPendingNapsToSheet() {
  const pending = [...state.naps, ...state.nights].filter((record) => !record.synced);
  if (!pending.length) return;
  await syncNapsToSheet(pending, "Sincronizando registros pendentes com o Google Sheets...");
}

async function syncFromSheetThenPending() {
  await loadNapsFromSheet();
  await loadFeedingsFromSheet();
  await syncPendingNapsToSheet();
  await syncPendingFeedingsToSheet();
}

async function loadNapsFromSheet() {
  if (!SHEETS_WEB_APP_URL) return;

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=list&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar planilha.");

    const remoteNaps = (result.records || [])
      .filter((record) => record.type !== "night")
      .map(sheetRecordToNap)
      .filter(Boolean);
    const remoteNights = (result.records || [])
      .filter((record) => record.type === "night")
      .map(sheetRecordToNight)
      .filter(Boolean);

    if (!remoteNaps.length && !remoteNights.length) return;

    mergeNaps(remoteNaps);
    mergeNights(remoteNights);
    saveState();
    render();
    setHint(`Google Sheets carregado: ${remoteNaps.length + remoteNights.length} registro(s) encontrados.`);
  } catch (error) {
    setHint(`Não consegui carregar o Google Sheets: ${error.message}`);
  }
}

function sheetRecordToNap(record) {
  if (!record.id || !record.start || !record.end) return null;
  const startedAt = new Date(record.start);
  const endedAt = new Date(record.end);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) return null;
  return {
    id: String(record.id),
    type: "nap",
    babyName: record.babyName || "",
    babyAge: Number(record.babyAge || 0),
    dayStart: normalizeTimeField(record.dayStart),
    bedtime: normalizeTimeField(record.bedtime),
    lastWake: normalizeTimeField(record.lastWake),
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: safeDuration({ ...record, start: startedAt.toISOString(), end: endedAt.toISOString() }),
    mood: moodKeyFromLabel(record.mood),
    synced: true
  };
}

function sheetRecordToNight(record) {
  if (!record.id || !record.start || !record.end) return null;
  const startedAt = new Date(record.start);
  const endedAt = new Date(record.end);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) return null;
  return {
    id: String(record.id),
    type: "night",
    babyName: record.babyName || "",
    babyAge: Number(record.babyAge || 0),
    dayStart: normalizeTimeField(record.dayStart) || minutesToTime(dateToDayMinutes(endedAt)),
    bedtime: normalizeTimeField(record.bedtime) || minutesToTime(dateToDayMinutes(startedAt)),
    lastWake: normalizeTimeField(record.lastWake) || minutesToTime(dateToDayMinutes(endedAt)),
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: safeDuration({ ...record, start: startedAt.toISOString(), end: endedAt.toISOString() }),
    mood: "",
    synced: true
  };
}

async function loadFeedingsFromSheet() {
  if (!SHEETS_WEB_APP_URL) return;

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listFeedings&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar mamadas.");
    if (!Array.isArray(result.records)) {
      feedingSheetSupport = false;
      return;
    }
    feedingSheetSupport = true;

    const remoteFeedings = (result.records || [])
      .map(sheetRecordToFeeding)
      .filter(Boolean);

    if (!remoteFeedings.length) return;

    mergeFeedings(remoteFeedings);
    saveState();
    render();
    setHint(`Google Sheets carregado: ${remoteFeedings.length} mamada(s) encontrada(s).`);
  } catch (error) {
    setHint(`Nao consegui carregar as mamadas do Google Sheets: ${error.message}`);
  }
}

function sheetRecordToFeeding(record) {
  if (!record.id || !record.at) return null;
  const fedAt = new Date(record.at);
  if (Number.isNaN(fedAt.getTime())) return null;
  return {
    id: String(record.id),
    babyName: record.babyName || "",
    babyAge: Number(record.babyAge || 0),
    at: fedAt.toISOString(),
    type: record.type || "breast",
    side: record.side || "",
    note: record.note || "",
    dayStart: normalizeTimeField(record.dayStart),
    synced: true
  };
}

function mergeNaps(remoteNaps) {
  const byId = new Map();
  state.naps.forEach((nap) => byId.set(String(nap.id || napIdentity(nap)), nap));
  remoteNaps.forEach((nap) => byId.set(String(nap.id), nap));
  state.naps = Array.from(byId.values())
    .sort((a, b) => new Date(b.end) - new Date(a.end))
    .slice(0, 80);

  if (state.naps.length) {
    applyLastWakeFromLatestNap();
    applyProfileFromLatestNap();
  }
}

function mergeNights(remoteNights) {
  const byId = new Map();
  state.nights.forEach((night) => byId.set(String(night.id || napIdentity(night)), night));
  remoteNights.forEach((night) => byId.set(String(night.id), night));
  state.nights = Array.from(byId.values())
    .sort((a, b) => new Date(b.end) - new Date(a.end))
    .slice(0, 80);

  if (state.nights.length) {
    if (state.nights[0].babyName) state.babyName = state.nights[0].babyName;
    if (!state.babyBirthDate && Number(state.nights[0].babyAge) > 0) state.babyAge = clamp(Number(state.nights[0].babyAge), 0, 36);
    if (state.nights[0].bedtime) state.bedtime = state.nights[0].bedtime;
    const latestNightEnd = new Date(state.nights[0].end);
    if (!Number.isNaN(latestNightEnd.getTime())) {
      state.cycleStartAt = latestNightEnd.toISOString();
      state.dayStart = minutesToTime(dateToDayMinutes(latestNightEnd));
      if (!state.naps.length) state.lastWake = state.dayStart;
      els.dayStart.value = state.dayStart;
      els.lastWake.value = state.lastWake;
      els.babyName.value = state.babyName;
      els.babyBirthDate.value = state.babyBirthDate || "";
      els.bedtime.value = state.bedtime;
    }
  }
}

function mergeFeedings(remoteFeedings) {
  const byId = new Map();
  state.feedings.forEach((feeding) => byId.set(String(feeding.id || feedingIdentity(feeding)), feeding));
  remoteFeedings.forEach((feeding) => byId.set(String(feeding.id), feeding));
  state.feedings = dedupeFeedings(Array.from(byId.values()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 160);
  hydrateFeedingOptions();
}

function applyProfileFromLatestNap() {
  const latest = state.naps[0];
  if (!latest) return;

  if (latest.babyName) state.babyName = latest.babyName;
  if (!state.babyBirthDate && Number(latest.babyAge) > 0) state.babyAge = clamp(Number(latest.babyAge), 0, 36);
  if (!state.nights.length && latest.dayStart) state.dayStart = latest.dayStart;
  if (!state.nights.length && latest.bedtime) state.bedtime = latest.bedtime;

  els.babyName.value = state.babyName;
  els.babyBirthDate.value = state.babyBirthDate || "";
  els.dayStart.value = state.dayStart;
  els.bedtime.value = state.bedtime;
  els.lastWake.value = state.lastWake;
}

async function syncNapsToSheet(naps, statusMessage) {
  if (!SHEETS_WEB_APP_URL || !naps.length) return;

  const records = naps.map((nap) => sheetPayloadForNap(nap));
  const payload = {
    token: SHEETS_SHARED_TOKEN,
    action: records.length > 1 ? "bulkAppend" : "append",
    records,
    ...records[0]
  };

  try {
    setHint(statusMessage);
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao gravar.");

    const syncedIds = new Set([...(result.inserted || []), ...(result.skipped || [])].map(String));
    state.naps = state.naps.map((nap) => (
      syncedIds.has(String(nap.id || napIdentity(nap))) ? { ...nap, synced: true } : nap
    ));
    state.nights = state.nights.map((night) => (
      syncedIds.has(String(night.id || napIdentity(night))) ? { ...night, synced: true } : night
    ));
    saveState();

    const inserted = (result.inserted || []).length;
    const skipped = (result.skipped || []).length;
    setHint(records.length > 1
      ? `Google Sheets sincronizado: ${inserted} nova(s), ${skipped} já existia(m).`
      : "Registro salvo no aparelho e sincronizado com o Google Sheets."
    );
  } catch (error) {
    setHint(`Registro salvo no aparelho, mas não foi enviado ao Google Sheets: ${error.message}`);
  }
}

function sheetPayloadForNap(nap) {
  const prediction = calculatePrediction();
  const night = calculateNightSuggestion(prediction);
  const recordType = nap.type || "nap";
  const startedAt = new Date(nap.start);
  const endedAt = new Date(nap.end);
  const babyName = nap.babyName || state.babyName || "Bebê";
  const babyAge = Number(nap.babyAge || currentBabyAgeMonths() || 0);
  const dayStart = normalizeTimeField(nap.dayStart || state.dayStart || state.lastWake);
  const bedtime = recordType === "night" ? minutesToTime(dateToDayMinutes(startedAt)) : normalizeTimeField(nap.bedtime || state.bedtime);
  const lastWake = recordType === "night" ? minutesToTime(dateToDayMinutes(endedAt)) : normalizeTimeField(state.lastWake || nap.lastWake);
  const payload = {
    id: nap.id || napIdentity(nap),
    type: recordType,
    babyName,
    babyAge,
    dayStart,
    start: toLocalDateTimeValue(startedAt),
    end: toLocalDateTimeValue(endedAt),
    duration: safeDuration(nap),
    mood: recordType === "night" ? "Sono noturno" : moodLabel(nap.mood),
    lastWake,
    bedtime,
    sleep24: prediction.sleep24,
    napCount: napsToday().length,
    wakeWindow: `${formatDuration(prediction.minWindow)} - ${formatDuration(prediction.maxWindow)}`,
    nextWindow: `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`,
    nightSuggestion: recordType === "night" ? bedtime : minutesToTime(night.start),
    note: ""
  };
  return payload;
}

async function syncFeedingToSheet(feeding) {
  if (!SHEETS_WEB_APP_URL || !feeding) return;
  return syncFeedingsToSheet([feeding], "Mamada salva no aparelho. Enviando para o Google Sheets...");
}

async function syncPendingFeedingsToSheet() {
  state.feedings = dedupeFeedings(state.feedings)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 160);
  saveState();
  const pending = state.feedings.filter((record) => !record.synced);
  if (!pending.length) return;
  await syncFeedingsToSheet(pending, "Sincronizando mamadas pendentes com o Google Sheets...");
}

async function syncFeedingsToSheet(feedings, statusMessage) {
  if (!SHEETS_WEB_APP_URL || !feedings.length) return;
  const supported = await ensureFeedingSheetSupport(true);
  if (!supported) {
    setHint("Mamada salva no aparelho. Reimplante o Apps Script novo para criar/sincronizar a aba Mamadas.");
    return;
  }

  const records = feedings.map((feeding) => sheetPayloadForFeeding(feeding));
  const payload = {
    token: SHEETS_SHARED_TOKEN,
    action: records.length > 1 ? "bulkAppendFeedings" : "appendFeeding",
    records,
    ...records[0]
  };

  try {
    setHint(statusMessage);
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao gravar mamada.");

    const syncedIds = new Set([...(result.inserted || []), ...(result.skipped || [])].map(String));
    state.feedings = state.feedings.map((feeding) => (
      syncedIds.has(String(feeding.id || feedingIdentity(feeding))) ? { ...feeding, synced: true } : feeding
    ));
    saveState();
    setHint("Mamada salva no aparelho e sincronizada com o Google Sheets.");
  } catch (error) {
    setHint(`Mamada salva no aparelho, mas nao foi enviada ao Google Sheets: ${error.message}`);
  }
}

async function ensureFeedingSheetSupport(forceRetry = false) {
  if (feedingSheetSupport === true && !forceRetry) return true;
  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listFeedings&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    feedingSheetSupport = Boolean(result.ok && Array.isArray(result.records));
  } catch {
    if (!forceRetry) feedingSheetSupport = false;
    return false;
  }
  return feedingSheetSupport;
}

function sheetPayloadForFeeding(feeding) {
  const fedAt = new Date(feeding.at);
  return {
    id: feeding.id || feedingIdentity(feeding),
    babyName: feeding.babyName || state.babyName || "Bebê",
    babyAge: Number(feeding.babyAge || currentBabyAgeMonths() || 0),
    at: toLocalDateTimeValue(fedAt),
    type: feeding.type || "breast",
    typeLabel: feedingLabel(feeding),
    side: feeding.side || "",
    sideLabel: feedingSideLabel(feeding.side),
    note: feeding.note || "",
    dayStart: normalizeTimeField(feeding.dayStart || state.dayStart)
  };
}

async function deleteNapFromSheet(id) {
  if (!SHEETS_WEB_APP_URL || !id) return;

  try {
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: SHEETS_SHARED_TOKEN,
        action: "delete",
        id
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao remover.");
    setHint("Soneca removida do aparelho e do Google Sheets.");
  } catch (error) {
    setHint(`Soneca removida do aparelho, mas não foi removida do Google Sheets: ${error.message}`);
  }
}

async function deleteFeedingFromSheet(id) {
  if (!SHEETS_WEB_APP_URL || !id) return;

  try {
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: SHEETS_SHARED_TOKEN,
        action: "deleteFeeding",
        id
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao remover mamada.");
    setHint("Mamada removida do aparelho e do Google Sheets.");
  } catch (error) {
    setHint(`Mamada removida do aparelho, mas nao foi removida do Google Sheets: ${error.message}`);
  }
}

function scheduleUpcomingNotifications() {
  clearNotificationTimers();
  if (!canNotify() || state.activeNapStart || state.activeNightStart) return;
  const prediction = calculatePrediction();
  const night = calculateNightSuggestion(prediction);
  const now = nowMinutes();
  const minutesToWindow = minutesUntilReminder(prediction.start, now);
  const reminders = [
    {
      at: prediction.start - 15,
      title: "Janela chegando",
      body: `Próxima soneca provável entre ${minutesToTime(prediction.start)} e ${minutesToTime(prediction.end)}.`,
      tag: "soneca-janela-chegando",
      catchUpUntil: prediction.start
    },
    {
      at: prediction.start,
      title: "Janela de soneca aberta",
      body: `A janela começou. Alvo provável perto de ${minutesToTime(prediction.target)}.`,
      tag: "soneca-janela-aberta"
    },
    {
      at: prediction.target,
      title: "Hora provável da soneca",
      body: "A pressão de sono está perto do alvo calculado.",
      tag: "soneca-alvo"
    },
    {
      at: night.start - 30,
      title: "Sono noturno chegando",
      body: `Sono noturno sugerido por volta de ${minutesToTime(night.start)}.`,
      tag: "soneca-noite-chegando",
      catchUpUntil: night.start
    },
    {
      at: night.start,
      title: "Sono noturno sugerido",
      body: "A rotina do dia indica que pode ser hora de iniciar o sono noturno.",
      tag: "soneca-noite"
    }
  ];
  reminders.forEach((reminder) => {
    scheduleReminder(reminder, now);
  });
  syncRemoteNotificationSchedule(reminders, now);
  const nextReminder = nextUpcomingReminder(reminders, now);
  const nextReminderDelay = nextReminder ? nextReminder.delay : null;
  updateNotificationHelp(minutesToWindow <= 15
    ? "Avisos ligados. Como a janela está próxima, um lembrete deve aparecer agora."
    : nextReminderDelay
      ? `Avisos ligados. Próximo lembrete em ${formatDuration(nextReminderDelay)} (${minutesToTime(nextReminder.at)}).`
      : "Avisos ligados. Não há outro lembrete previsto para as próximas horas."
  );
}

function scheduleActiveNapNotifications() {
  if (!canNotify() || !state.activeNapStart) return;
  clearNotificationTimers();
  const started = new Date(state.activeNapStart).getTime();
  if (!Number.isFinite(started)) return;

  const elapsedMinutes = Math.floor((Date.now() - started) / 60000);
  const activeReminders = [
    { minute: 30, body: "Soneca há 30 minutos. Observe se vai emendar o próximo ciclo.", tag: "soneca-ativa-30" },
    { minute: 45, body: "Soneca há 45 minutos. Muitos bebês mudam de ciclo nessa faixa.", tag: "soneca-ativa-45" },
    { minute: 90, body: "Soneca há 1h30. Vale observar a rotina do resto do dia.", tag: "soneca-ativa-90" }
  ];
  let nextDelay = null;
  activeReminders.forEach((item) => {
    const delay = started + item.minute * 60000 - Date.now();
    if (delay > 0) {
      nextDelay = nextDelay === null ? delay : Math.min(nextDelay, delay);
      notificationTimers.push(setTimeout(() => {
        markActiveNapNoticeSent(item.tag);
        notify("Soneca em andamento", item.body, item.tag);
      }, delay));
      return;
    }

    if (elapsedMinutes >= item.minute && elapsedMinutes <= item.minute + 10 && !wasActiveNapNoticeSent(item.tag)) {
      markActiveNapNoticeSent(item.tag);
      notify("Soneca em andamento", item.body, item.tag);
    }
  });
  syncRemoteNotificationScheduleAbsolute(activeReminders.map((item) => ({
    at: new Date(started + item.minute * 60000).toISOString(),
    title: "Soneca em andamento",
    body: item.body,
    tag: item.tag
  })));
  updateNotificationHelp(nextDelay === null
    ? "Avisos ligados para esta soneca. Os marcos de acompanhamento previstos já passaram."
    : `Avisos ligados para esta soneca. Próximo acompanhamento em ${formatDuration(nextDelay / 60000)}.`
  );
}

function scheduleReminder(reminder, now = nowMinutes()) {
  if (reminder.catchUpUntil && isClockMinuteBetween(now, reminder.at, reminder.catchUpUntil)) {
    if (state.activeNapStart || state.activeNightStart) return;
    notify(reminder.title, reminder.body, reminder.tag);
    return;
  }

  const delayMinutes = minutesUntilToday(reminder.at, now);
  if (!Number.isFinite(delayMinutes)) return;

  if (delayMinutes <= 0 || delayMinutes > 18 * 60) return;
  notificationTimers.push(setTimeout(() => {
    if (state.activeNapStart || state.activeNightStart) return;
    notify(reminder.title, reminder.body, reminder.tag);
  }, delayMinutes * 60000));
}

function nextUpcomingReminder(reminders, now = nowMinutes()) {
  return reminders
    .map((reminder) => ({
      ...reminder,
      delay: minutesUntilToday(reminder.at, now)
    }))
    .filter((reminder) => Number.isFinite(reminder.delay) && reminder.delay > 0 && reminder.delay <= 18 * 60)
    .sort((a, b) => a.delay - b.delay)[0] || null;
}

function minutesUntilReminder(targetMinutes, now = nowMinutes()) {
  if (!Number.isFinite(Number(targetMinutes))) return NaN;
  let diff = normalizeDayMinutes(targetMinutes) - normalizeDayMinutes(now);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

function minutesUntilToday(targetMinutes, now = nowMinutes()) {
  if (!Number.isFinite(Number(targetMinutes))) return NaN;
  const diff = normalizeDayMinutes(targetMinutes) - normalizeDayMinutes(now);
  return diff > 0 ? diff : NaN;
}

function isClockMinuteBetween(value, start, end) {
  const current = normalizeDayMinutes(value);
  start = normalizeDayMinutes(start);
  end = normalizeDayMinutes(end);
  if (start <= end) return current >= start && current < end;
  return current >= start || current < end;
}

function clearNotificationTimers() {
  notificationTimers.forEach((timer) => clearTimeout(timer));
  notificationTimers = [];
}

function activeNapNoticeKey(tag) {
  return `${state.activeNapStart || "sem-soneca"}:${tag}`;
}

function loadActiveNapNotices() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_NAP_NOTICE_KEY)) || {};
  } catch {
    return {};
  }
}

function wasActiveNapNoticeSent(tag) {
  const notices = loadActiveNapNotices();
  return Boolean(notices[activeNapNoticeKey(tag)]);
}

function markActiveNapNoticeSent(tag) {
  const notices = loadActiveNapNotices();
  notices[activeNapNoticeKey(tag)] = new Date().toISOString();
  localStorage.setItem(ACTIVE_NAP_NOTICE_KEY, JSON.stringify(notices));
}

function notify(title, body, tag = "soneca-alerta") {
  if (!canNotify()) return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "icon.svg",
        badge: "icon.svg",
        tag
      });
    }).catch(() => new Notification(title, { body, icon: "icon.svg", tag }));
    return;
  }
  new Notification(title, { body, icon: "icon.svg", tag });
}

function updateNotificationState(label) {
  if (label) {
    els.notificationState.textContent = label;
    return;
  }
  if (!("Notification" in window)) {
    els.notificationState.textContent = "Sem suporte";
    return;
  }
  const labels = {
    granted: "Avisos ligados",
    denied: "Avisos bloqueados",
    default: "Avisos desligados"
  };
  els.notificationState.textContent = labels[Notification.permission] || "Avisos desligados";
}

function setHint(message) {
  els.activeNapHint.textContent = message;
}

function updateNotificationHelp(message) {
  if (els.notificationHelpText) els.notificationHelpText.textContent = message;
}

function notificationEnvironment() {
  return {
    secure: window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1",
    installed: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  };
}

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function ensureServiceWorkerReady() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("sw.js");
  return navigator.serviceWorker.ready.then(() => registration);
}

async function subscribeToPushIfConfigured() {
  try {
    const keyResponse = await fetch(PUSH_PUBLIC_KEY_ENDPOINT, { cache: "no-store" });
    const keyResult = await keyResponse.json();
    if (!keyResponse.ok || !keyResult.ok || !keyResult.publicKey) {
      return {
        ok: false,
        message: keyResult.error || "Permissão OK. O servidor ainda não está pronto para push remoto."
      };
    }

    const registration = await ensureServiceWorkerReady();
    let subscription = await registration.pushManager.getSubscription();
    if (subscription && !subscriptionUsesKey(subscription, keyResult.publicKey)) {
      await subscription.unsubscribe();
      subscription = null;
    }
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey)
      });
    }

    const response = await fetch(PUSH_SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription })
    });

    if (!response.ok) {
      return { ok: false, message: "Permissão OK, mas o servidor não aceitou a assinatura push deste aparelho." };
    }

    return { ok: true, message: "Push remoto ativado. O servidor vai enviar os próximos avisos mesmo se o app sair de cena." };
  } catch (error) {
    return { ok: false, message: `Permissão OK, mas o push remoto falhou: ${error.message}` };
  }
}

async function syncRemoteNotificationSchedule(reminders, now = nowMinutes()) {
  const scheduled = reminders
    .map((reminder) => ({
      id: reminder.tag,
      at: dateForClockMinuteToday(reminder.at).toISOString(),
      title: reminder.title,
      body: reminder.body,
      tag: reminder.tag
    }))
    .filter((reminder) => new Date(reminder.at).getTime() > Date.now() + 5000);
  await syncRemoteNotificationScheduleAbsolute(scheduled);
}

async function syncRemoteNotificationScheduleAbsolute(reminders) {
  if (!canNotify() || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await ensureServiceWorkerReady();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch(PUSH_SCHEDULE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, reminders })
    });
  } catch {
    // Avisos locais continuam funcionando mesmo se o agendamento remoto falhar.
  }
}

function dateForClockMinuteToday(targetMinutes) {
  const target = normalizeDayMinutes(targetMinutes);
  const date = new Date();
  date.setHours(Math.floor(target / 60), target % 60, 0, 0);
  return date;
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function subscriptionUsesKey(subscription, publicKey) {
  const currentKey = subscription?.options?.applicationServerKey;
  if (!currentKey) return true;
  return uint8ArrayToUrlBase64(new Uint8Array(currentKey)) === publicKey;
}

function uint8ArrayToUrlBase64(bytes) {
  let raw = "";
  bytes.forEach((byte) => {
    raw += String.fromCharCode(byte);
  });
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function wakeWindowForAge(age) {
  return wakeWindows.find((row) => age >= row.minAge && age <= row.maxAge) || wakeWindows[wakeWindows.length - 1];
}

function expectedDailySleep(age) {
  if (age <= 3) return { min: 14, max: 17 };
  if (age <= 12) return { min: 12, max: 16 };
  if (age <= 24) return { min: 11, max: 14 };
  return { min: 10, max: 13 };
}

function averageRecentWakeWindow(naps) {
  const windows = [];
  const today = napsToday().slice().reverse();
  const firstNapToday = today[0];
  if (firstNapToday) {
    const firstStart = dateToDayMinutes(new Date(firstNapToday.start));
    const dayStart = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60);
    const firstWindow = firstStart >= dayStart ? firstStart - dayStart : firstStart + 24 * 60 - dayStart;
    if (firstWindow > 30 && firstWindow < 520) windows.push(firstWindow);
  }

  for (let i = 0; i < naps.length - 1; i += 1) {
    const newerStart = new Date(naps[i].start);
    const olderEnd = new Date(naps[i + 1].end);
    const minutes = Math.round((newerStart - olderEnd) / 60000);
    if (minutes > 30 && minutes < 520) windows.push(minutes);
  }
  if (!windows.length) return null;
  return Math.round(windows.reduce((sum, value) => sum + value, 0) / windows.length);
}

function sleepInLast24Hours() {
  return clamp(dayNapSleepMinutes() + latestNightSleepMinutes(), 0, 24 * 60);
}

function dayNapSleepMinutes() {
  return napsInCurrentDay().reduce((sum, nap) => sum + safeDuration(nap), 0);
}

function nightSleepInLast24Hours() {
  return latestNightSleepMinutes();
}

function latestNightSleepMinutes() {
  const latestNight = latestNightRecord();
  return latestNight ? safeDuration(latestNight) : 0;
}

function latestNightRecord() {
  return state.nights
    .filter((night) => {
      const start = new Date(night.start).getTime();
      const end = new Date(night.end).getTime();
      return Number.isFinite(start) && Number.isFinite(end) && end > start;
    })
    .sort((a, b) => new Date(b.end) - new Date(a.end))[0] || null;
}

function sleepGoalsForAge(age) {
  if (age <= 4) return { day: 4 * 60, night: 11 * 60 };
  if (age <= 8) return { day: 3.5 * 60, night: 11 * 60 };
  if (age <= 12) return { day: 3 * 60, night: 11 * 60 };
  if (age <= 24) return { day: 2 * 60, night: 11 * 60 };
  return { day: 90, night: 10.5 * 60 };
}

function goalStatus(value, target) {
  return value >= target * 0.92 ? "✔" : "•";
}

function assistantSuggestion(prediction, daySleep, nightSleep, goals) {
  const today = napsToday();
  const lastNap = today[0];

  if (lastNap && safeDuration(lastNap) < 35) {
    return `Sugestão: como a última soneca foi curta (${safeDuration(lastNap)} min), tente encurtar a próxima janela de vigília em 15 minutos.`;
  }

  if (nightSleep > 0 && nightSleep < goals.night - 60) {
    return `Ela dormiu apenas ${formatDuration(nightSleep)} à noite. Hoje pode precisar de uma soneca extra ou janela de vigília menor.`;
  }

  if (daySleep < goals.day * 0.65 && nowMinutes() > 15 * 60) {
    return "O sono diurno está abaixo da meta. Observe sinais de cansaço e antecipe a próxima soneca se necessário.";
  }

  if (nowMinutes() > prediction.target) {
    return "A janela provável já abriu. Observe sinais de sono antes de alongar mais a vigília.";
  }

  return "Rotina dentro do esperado até agora. Mantenha a próxima janela conforme o alvo calculado.";
}

function estimateNightSleepMinutes(bedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30), morning = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60)) {
  const duration = bedtime <= morning ? morning - bedtime : 24 * 60 - bedtime + morning;
  return clamp(duration, 0, 13 * 60);
}

function napsToday() {
  return napsInCurrentDay();
}

function feedingsToday() {
  const start = currentCycleStartDate();
  const end = state.activeNightStart ? new Date(state.activeNightStart) : new Date();

  return state.feedings.filter((feeding) => {
    const fedAt = new Date(feeding.at);
    return !Number.isNaN(fedAt.getTime()) && fedAt >= start && fedAt <= end;
  });
}

function napsInCurrentDay() {
  const operationalNaps = operationalDayNaps();
  if (operationalNaps.length) return operationalNaps;

  const calendarNaps = calendarDayNaps();
  return calendarNaps.length ? calendarNaps : operationalNaps;
}

function operationalDayNaps() {
  const start = currentCycleStartDate();
  const end = state.activeNightStart ? new Date(state.activeNightStart) : new Date();

  return state.naps.filter((nap) => {
    const napStart = new Date(nap.start);
    return !Number.isNaN(napStart.getTime()) && napStart >= start && napStart <= end;
  });
}

function currentCycleStartDate() {
  const savedStart = new Date(state.cycleStartAt || "");
  if (!Number.isNaN(savedStart.getTime())) return savedStart;

  const now = new Date();
  const startMinutes = safeTimeToMinutes(state.dayStart, 7 * 60);
  const start = new Date(now);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

function calendarDayNaps(date = new Date()) {
  const day = date.toDateString();
  return state.naps.filter((nap) => {
    const napStart = new Date(nap.start);
    return !Number.isNaN(napStart.getTime()) && napStart.toDateString() === day;
  });
}

function expectedNapCount(value) {
  if (value === "muitas") return 5;
  const match = String(value).match(/\d+/g);
  if (!match) return 1;
  return Number(match[match.length - 1]);
}

function plannedNapCount() {
  const raw = els?.plannedNapCount?.value || state.plannedNapCount || defaultState.plannedNapCount;
  return clamp(Math.round(Number(raw) || defaultState.plannedNapCount), 1, 8);
}

function minutesBetweenClock(start, end) {
  let diff = normalizeDayMinutes(end) - normalizeDayMinutes(start);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function clampClockWithinDay(value, max) {
  return Math.min(normalizeDayMinutes(value), normalizeDayMinutes(max));
}

function ordinalFeminine(number) {
  const labels = ["primeira", "segunda", "terceira", "quarta", "quinta", "sexta", "sétima", "oitava"];
  return labels[number - 1] || `${number}ª`;
}

function dateToDayMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function arcPath(startMinutes, endMinutes, type) {
  const startProgress = ringProgress(startMinutes);
  let endProgress = ringProgress(endMinutes);
  if (endProgress < startProgress) endProgress = startProgress;

  const visibleEnd = Math.max(startProgress + 0.006, endProgress);
  const startPoint = pointOnRingProgress(startProgress, 92);
  const endPoint = pointOnRingProgress(visibleEnd, 92);
  const largeArc = (visibleEnd - startProgress) * 270 > 180 ? 1 : 0;

  return `<path class="day-ring-segment ${type}" d="M ${startPoint.x} ${startPoint.y} A 92 92 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}"></path>`;
}

function markerSvg(marker) {
  const point = pointOnCircle(marker.at, 92);
  const icon = markerIcon(marker.type);

  if (marker.type === "next") {
    return `
      <g class="day-marker-group next" transform="translate(${point.x} ${point.y})">
        <circle class="marker-orb" cx="0" cy="0" r="10"></circle>
        <text class="marker-icon" x="0" y="5" text-anchor="middle">${icon}</text>
      </g>
      ${markerTimeText(marker.startLabel, marker.startAt, "next")}
      ${markerTimeText(marker.endLabel, marker.endAt, "next")}
    `;
  }

  if (marker.type === "day-start" || marker.type === "day-end") {
    const timePoint = pointOnCircle(marker.at, 102);
    return `
      <g class="day-marker-group ${marker.type}" ${marker.type === "day-end" ? 'role="button" tabindex="0"' : ""} transform="translate(${point.x} ${point.y})">
        <circle class="marker-orb" cx="0" cy="0" r="13"></circle>
        <text class="marker-icon" x="0" y="6" text-anchor="middle">${icon}</text>
      </g>
      <text class="marker-time ${marker.type}" x="${timePoint.x}" y="${timePoint.y + 9}" text-anchor="middle">${marker.label}</text>
    `;
  }

  return `
    <g class="day-marker-group ${marker.type}" ${marker.id ? `data-nap-id="${marker.id}" data-nap-index="${marker.index || ""}" role="button" tabindex="0"` : ""} transform="translate(${point.x} ${point.y})">
      <circle class="marker-orb" cx="0" cy="0" r="10"></circle>
      <text class="marker-icon" x="0" y="5" text-anchor="middle">${icon}</text>
    </g>
  `;
}

function markerTimeText(label, at, type) {
  const point = pointOnCircle(at, 112);
  const rotation = tangentTextRotation(at);
  return `<text class="marker-time ${type}" x="${point.x}" y="${point.y}" text-anchor="middle" transform="rotate(${rotation} ${point.x} ${point.y})">${label}</text>`;
}

function markerIcon(type) {
  if (type === "feed") return "🍼";
  const icons = {
    nap: "☁",
    next: "☁",
    feed: "•",
    "day-start": "☀",
    "day-end": "☾"
  };
  return icons[type] || "•";
}

function markerRotation(minutes) {
  return Math.round(135 + ringProgress(minutes) * 270);
}

function tangentTextRotation(minutes) {
  let rotation = markerRotation(minutes) + 90;
  if (rotation > 90 && rotation < 270) rotation += 180;
  return Math.round(rotation);
}

function babyDisplayName() {
  return state.babyName || "Bebê";
}

function pointOnCircle(minutes, radius) {
  return pointOnRingProgress(ringProgress(minutes), radius);
}

function pointOnRingProgress(progress, radius) {
  const angle = (135 + clamp(progress, 0, 1) * 270) * Math.PI / 180;
  return {
    x: roundSvg(120 + Math.cos(angle) * radius),
    y: roundSvg(120 + Math.sin(angle) * radius)
  };
}

function ringProgress(minutes) {
  const start = normalizeDayMinutes(currentRingStartMinutes);
  const end = normalizeDayMinutes(currentRingEndMinutes);
  let span = end - start;
  if (span <= 0) span += 24 * 60;
  if (span < 60) span = 24 * 60;

  let elapsed = normalizeDayMinutes(minutes) - start;
  if (elapsed < 0) elapsed += 24 * 60;
  return clamp(elapsed / span, 0, 1);
}

function normalizeDayMinutes(minutes) {
  return ((Math.round(minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
}

function roundSvg(value) {
  return Math.round(value * 100) / 100;
}

function canNotify() {
  return "Notification" in window && Notification.permission === "granted";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {
    updateNotificationHelp("Não consegui registrar o Service Worker. Avisos e modo offline podem falhar.");
  });
}

function loadState() {
  try {
    const loaded = { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    loaded.dayStart = normalizeTimeField(loaded.dayStart) || DEFAULT_DAY_START;
    loaded.lastWake = normalizeTimeField(loaded.lastWake);
    loaded.bedtime = normalizeTimeField(loaded.bedtime) || defaultState.bedtime;
    loaded.plannedNapCount = clamp(Math.round(Number(loaded.plannedNapCount) || defaultState.plannedNapCount), 1, 8);
    loaded.feedingOptions = { ...defaultState.feedingOptions, ...(loaded.feedingOptions || {}) };
    loaded.babyBirthDate = normalizeDateInputValue(loaded.babyBirthDate);
    loaded.babyAge = Number.isFinite(Number(loaded.babyAge)) ? clamp(Number(loaded.babyAge), 0, 36) : defaultState.babyAge;
    if (loaded.babyBirthDate) {
      loaded.babyAge = ageMonthsFromBirthDate(loaded.babyBirthDate);
    }
    loaded.naps = (loaded.naps || []).map((nap) => ({
      ...nap,
      id: nap.id || stableNapId(nap),
      dayStart: normalizeTimeField(nap.dayStart) || loaded.dayStart,
      bedtime: normalizeTimeField(nap.bedtime) || loaded.bedtime,
      lastWake: normalizeTimeField(nap.lastWake),
      babyAge: Number.isFinite(Number(nap.babyAge)) ? Number(nap.babyAge) : loaded.babyAge,
      duration: safeDuration(nap),
      synced: Boolean(nap.synced)
    }));
    loaded.nights = (loaded.nights || []).map((night) => ({
      ...night,
      type: "night",
      id: night.id || stableNapId(night),
      dayStart: normalizeTimeField(night.dayStart) || loaded.dayStart,
      bedtime: normalizeTimeField(night.bedtime) || loaded.bedtime,
      lastWake: normalizeTimeField(night.lastWake),
      babyAge: Number.isFinite(Number(night.babyAge)) ? Number(night.babyAge) : loaded.babyAge,
      duration: safeDuration(night),
      synced: Boolean(night.synced)
    })).sort((a, b) => new Date(b.end) - new Date(a.end));
    if (!loaded.cycleStartAt && loaded.nights[0]) {
      loaded.cycleStartAt = loaded.nights[0].end;
    }
    loaded.feedings = dedupeFeedings((loaded.feedings || []).map((feeding) => ({
      ...feeding,
      id: feeding.id || `feed-legacy-${Math.abs(hashString(feedingIdentity(feeding)))}`,
      at: feeding.at,
      type: feeding.type || "breast",
      side: feeding.side || "",
      babyAge: Number.isFinite(Number(feeding.babyAge)) ? Number(feeding.babyAge) : loaded.babyAge,
      dayStart: normalizeTimeField(feeding.dayStart) || loaded.dayStart,
      synced: Boolean(feeding.synced)
    })).filter((feeding) => !Number.isNaN(new Date(feeding.at).getTime())))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  if (loaded.nights[0]) {
      const latestNightStart = new Date(loaded.nights[0].start);
      const latestNightEnd = new Date(loaded.nights[0].end);
      if (!Number.isNaN(latestNightEnd.getTime())) {
        loaded.cycleStartAt = latestNightEnd.toISOString();
        loaded.dayStart = minutesToTime(dateToDayMinutes(latestNightEnd));
        if (!loaded.naps.length) {
          loaded.lastWake = loaded.dayStart;
        }
      }
      if (!Number.isNaN(latestNightStart.getTime())) {
        loaded.bedtime = normalizeTimeField(loaded.nights[0].bedtime) || minutesToTime(dateToDayMinutes(latestNightStart));
      }
    }
    if (loaded.naps.length) {
      const latestNap = loaded.naps.slice().sort((a, b) => new Date(b.end) - new Date(a.end))[0];
      const latestWake = new Date(latestNap.end);
      if (!Number.isNaN(latestWake.getTime())) {
        loaded.lastWake = minutesToTime(dateToDayMinutes(latestWake));
      }
    }
    return loaded;
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toggleInstallSheet(open) {
  els.installSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function toggleProfileSheet(open) {
  els.profileSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function toggleHistorySheet(open) {
  els.historySheet.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) renderHistory();
}

function toggleReportSheet(open) {
  els.reportSheet.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) renderReport();
}

function toggleMoodSheet(open) {
  if (open && !state.activeNapStart) return;
  els.moodSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function toggleStartSheet(open) {
  if (open && (state.activeNapStart || state.activeNightStart)) return;
  els.startSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function openManualRecordSheet(type = "nap") {
  manualRecordType = type;
  const end = type === "night" ? defaultManualNightEnd() : new Date();
  const start = type === "night" ? defaultManualNightStart(end) : new Date(end.getTime() - 45 * 60000);

  els.manualTitle.textContent = type === "night" ? "Adicionar sono noturno anterior" : "Adicionar soneca anterior";
  els.saveManualNap.textContent = type === "night" ? "Salvar sono noturno" : "Salvar soneca";
  els.manualMoodOptions.hidden = type === "night";
  els.manualStart.value = toDateTimeLocalValue(start);
  els.manualEnd.value = toDateTimeLocalValue(end);
  showManualError("");
  selectManualMood("");
  toggleManualNapSheet(true);
}

function defaultManualNightEnd() {
  const end = new Date();
  end.setHours(6, 10, 0, 0);
  if (new Date() < end) end.setDate(end.getDate() - 1);
  return end;
}

function defaultManualNightStart(end) {
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(21, 0, 0, 0);
  return start;
}

function toggleManualNapSheet(open) {
  els.manualNapSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function openFeedingSheet(manual = false) {
  renderFeedingTypeOptions();
  els.feedingTitle.textContent = manual ? "Adicionar mamada anterior" : "Registrar mamada";
  const fedAt = new Date();
  if (manual) fedAt.setMinutes(fedAt.getMinutes() - 60);
  els.feedingTime.value = toDateTimeLocalValue(fedAt);
  els.feedingNote.value = "";
  selectFeedSide(selectedFeedSide || "left");
  updateFeedingSideVisibility();
  showFeedingError("");
  toggleFeedingSheet(true);
}

function toggleFeedingSheet(open) {
  els.feedingSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function renderFeedingTypeOptions() {
  const current = els.feedingType.value;
  const options = availableFeedingTypes();
  els.feedingType.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
  els.feedingType.value = options.some((option) => option.value === current) ? current : options[0].value;
  updateFeedingSideVisibility();
}

function selectFeedSide(side) {
  selectedFeedSide = side || "left";
  document.querySelectorAll("[data-feed-side]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.feedSide === selectedFeedSide);
  });
}

function updateFeedingSideVisibility() {
  els.feedingSideGroup.hidden = els.feedingType.value !== "breast";
}

function saveFeeding() {
  if (els.saveFeeding.disabled) return;
  els.saveFeeding.disabled = true;
  const fedAt = new Date(els.feedingTime.value);
  if (!els.feedingTime.value || Number.isNaN(fedAt.getTime())) {
    showFeedingError("Informe o horario da mamada.");
    els.saveFeeding.disabled = false;
    return;
  }

  const type = els.feedingType.value || "breast";
  const feeding = createFeedingRecord(fedAt, type, selectedFeedSide, els.feedingNote.value.trim());
  addFeedingRecord(feeding);
  toggleFeedingSheet(false);
  els.saveFeeding.disabled = false;
  render();
}

function showFeedingError(message) {
  els.feedingError.textContent = message;
}

function selectManualMood(mood) {
  manualMood = mood || "";
  document.querySelectorAll("[data-manual-mood]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.manualMood === manualMood);
  });
}

function showManualError(message) {
  els.manualNapError.textContent = message;
}

function moodLabel(mood) {
  const labels = {
    happy: "Bem humorado",
    neutral: "Neutro",
    upset: "Mau humorado"
  };
  return labels[mood] || "Sem humor";
}

function moodKeyFromLabel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("bem")) return "happy";
  if (normalized.includes("neutro")) return "neutral";
  if (normalized.includes("mau")) return "upset";
  return "";
}

function currentBabyAgeMonths() {
  if (state.babyBirthDate) {
    return ageMonthsFromBirthDate(state.babyBirthDate);
  }

  return Number.isFinite(Number(state.babyAge)) ? clamp(Number(state.babyAge), 0, 36) : 0;
}

function ageMonthsFromBirthDate(value) {
  const normalized = normalizeDateInputValue(value);
  if (!normalized) return Number.isFinite(Number(state.babyAge)) ? clamp(Number(state.babyAge), 0, 36) : 0;

  const birth = new Date(`${normalized}T00:00:00`);
  const today = new Date();
  if (Number.isNaN(birth.getTime()) || birth > today) return 0;

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  return clamp(months, 0, 36);
}

function normalizeDateInputValue(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dateInputValue(value);
  }

  const text = String(value);
  const match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function normalizedFeedingOptions() {
  return {
    breast: state.feedingOptions?.breast !== false,
    bottle: state.feedingOptions?.bottle !== false,
    formula: state.feedingOptions?.formula !== false
  };
}

function inferredFeedingOptions() {
  const recentTypes = new Set(
    dedupeFeedings(state.feedings || [])
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 20)
      .map((feeding) => feeding.type || "breast")
  );

  if (!recentTypes.size) return normalizedFeedingOptions();

  return {
    breast: recentTypes.has("breast"),
    bottle: recentTypes.has("bottle"),
    formula: recentTypes.has("formula")
  };
}

function availableFeedingTypes() {
  const options = inferredFeedingOptions();
  const types = [];
  if (options.breast) types.push({ value: "breast", label: "Leite materno" });
  if (options.bottle) types.push({ value: "bottle", label: "Mamadeira" });
  if (options.formula) types.push({ value: "formula", label: "Fórmula" });
  return types.length ? types : [{ value: "breast", label: "Leite materno" }];
}

function feedingLabel(feeding) {
  const labels = {
    breast: "Leite materno",
    bottle: "Mamadeira",
    formula: "Fórmula"
  };
  return labels[feeding.type] || "Mamada";
}

function feedingSideLabel(side) {
  const labels = {
    left: "Esquerdo",
    right: "Direito",
    both: "Ambos"
  };
  return labels[side] || "-";
}

function feedingIdentity(feeding) {
  return feeding.id || `${feeding.at}|${feeding.type}|${feeding.side || ""}|${feeding.note || ""}`;
}

function feedingSignature(feeding) {
  const date = new Date(feeding.at);
  const minuteKey = Number.isNaN(date.getTime())
    ? String(feeding.at || "")
    : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  return [
    minuteKey,
    feeding.type || "breast",
    feeding.side || "",
    String(feeding.note || "").trim().toLowerCase()
  ].join("|");
}

function dedupeFeedings(feedings) {
  const bySignature = new Map();

  feedings.forEach((feeding) => {
    const signature = feedingSignature(feeding);
    const current = bySignature.get(signature);
    if (!current) {
      bySignature.set(signature, feeding);
      return;
    }

    if (!current.synced && feeding.synced) {
      bySignature.set(signature, feeding);
      return;
    }

    const currentTime = new Date(current.at).getTime();
    const candidateTime = new Date(feeding.at).getTime();
    if (!feeding.synced && current.synced) return;
    if (Number.isFinite(candidateTime) && (!Number.isFinite(currentTime) || candidateTime > currentTime)) {
      bySignature.set(signature, feeding);
    }
  });

  return Array.from(bySignature.values());
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function safeTimeToMinutes(value, fallback) {
  value = normalizeTimeField(value);
  if (typeof value !== "string" || !value.includes(":")) return fallback;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  return clamp(hours * 60 + minutes, 0, 23 * 60 + 59);
}

function normalizeTimeField(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return minutesToTime(dateToDayMinutes(value));
  }

  const text = String(value);
  if (/^1899-12-(30|31)/.test(text)) return "";

  const isoTime = text.match(/T(\d{2}):(\d{2})/);
  if (isoTime) return `${isoTime[1]}:${isoTime[2]}`;

  const plainTime = text.match(/(\d{1,2}):(\d{2})/);
  if (plainTime) return `${String(Number(plainTime[1])).padStart(2, "0")}:${plainTime[2]}`;

  return text;
}

function nowMinutes() {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToTime(totalMinutes) {
  const minutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatDuration(minutes) {
  minutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

function formatRingDuration(minutes) {
  minutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${String(rest).padStart(2, "0")}min` : `${hours}h`;
}

function safeDuration(nap) {
  const direct = Number(nap.duration);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);

  const start = new Date(nap.start).getTime();
  const end = new Date(nap.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(1, Math.round((end - start) / 60000));
}

function timeLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function toDateTimeLocalValue(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toLocalDateTimeValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
}

function dateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function recordDateInputValue(record) {
  const date = new Date(record.start);
  return dateInputValue(date);
}

function startOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function shortDateLabel(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortWeekdayLabel(date) {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return labels[date.getDay()];
}

function dateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--/--";
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
