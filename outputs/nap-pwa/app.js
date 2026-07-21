const STORAGE_KEY = "soneca-pwa-state-v1";
const CIRCLE_LENGTH = 314;
const PUSH_PUBLIC_KEY_ENDPOINT = "/api/push/public-key";
const PUSH_SUBSCRIBE_ENDPOINT = "/api/push/subscribe";
const PUSH_SCHEDULE_ENDPOINT = "/api/push/schedule";
const ACTIVE_NAP_NOTICE_KEY = "soneca-active-nap-notices-v1";
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjAo50gBEjr8YDvMEPTov6XIcINaA3WXfEDkJ7QD3G2cALcpOKvhBaiV2Cj8Q5o9g4/exec";
const SHEETS_SHARED_TOKEN = "sonecas";
const DEFAULT_DAY_START = "07:00";
const CYCLE_START_GRACE_MINUTES = 5;
const ACTIVE_SESSION_POLL_MS = 15000;
const ACTIVE_SESSION_CLEAR_GRACE_MS = 60000;
const ACTIVE_NAP_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const ACTIVE_NIGHT_MAX_AGE_MS = 18 * 60 * 60 * 1000;

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

const activityCatalog = [
  {
    minAge: 0,
    maxAge: 2,
    items: [
      { area: "Motor", title: "Barriguinha no peito", time: "2-5 min", description: "Deite reclinada e coloque o bebê de barriga para baixo no seu peito para fortalecer pescoço e tronco." },
      { area: "Visual", title: "Rosto perto", time: "3 min", description: "Fique a 20-30 cm, fale devagar e mude sua expressão para ela acompanhar seu rosto." },
      { area: "Auditivo", title: "Voz de um lado", time: "3 min", description: "Chame suavemente de um lado e depois do outro, observando se ela procura o som." }
    ]
  },
  {
    minAge: 3,
    maxAge: 4,
    items: [
      { area: "Motor", title: "Barriguinha com brinquedo", time: "5-8 min", description: "Coloque um brinquedo à frente durante o tummy time para incentivar levantar a cabeça e apoiar os braços." },
      { area: "Coordenação", title: "Alcançar paninho", time: "5 min", description: "Ofereça um paninho leve próximo das mãos e espere ela tentar tocar, agarrar ou puxar." },
      { area: "Social", title: "Espelho com conversa", time: "5 min", description: "Mostre o rosto dela no espelho, sorria e nomeie expressões: feliz, surpresa, calma." },
      { area: "Linguagem", title: "Pausa para responder", time: "3-5 min", description: "Faça sons simples, pause e espere qualquer vocalização ou movimento como resposta." }
    ]
  },
  {
    minAge: 5,
    maxAge: 6,
    items: [
      { area: "Motor", title: "Rolar com apoio", time: "5 min", description: "Com ela de barriga para cima, incentive virar para o lado usando um brinquedo colorido." },
      { area: "Coordenação", title: "Troca de mãos", time: "5 min", description: "Ofereça um brinquedo leve e observe se ela leva ao centro ou tenta passar de uma mão para outra." },
      { area: "Sensorial", title: "Texturas seguras", time: "5 min", description: "Apresente tecidos diferentes, sempre limpos e grandes o suficiente para não ir inteiro à boca." }
    ]
  },
  {
    minAge: 7,
    maxAge: 9,
    items: [
      { area: "Motor", title: "Brinquedo fora do alcance", time: "5-10 min", description: "Coloque um brinquedo um pouco à frente para incentivar deslocamento, pivô ou tentativa de engatinhar." },
      { area: "Cognitivo", title: "Cadê? Achou!", time: "5 min", description: "Cubra parcialmente um brinquedo com pano e convide ela a procurar." },
      { area: "Linguagem", title: "Imitar sílabas", time: "3-5 min", description: "Repita sons como ba, ma e da, dando tempo para ela tentar responder." }
    ]
  },
  {
    minAge: 10,
    maxAge: 12,
    items: [
      { area: "Motor", title: "Apoio para ficar em pé", time: "5 min", description: "Com supervisão, deixe ela se apoiar em móvel firme e baixo, sem puxar pelos braços." },
      { area: "Cognitivo", title: "Colocar e tirar", time: "5-8 min", description: "Use potes grandes e objetos seguros para ela colocar dentro e tirar." },
      { area: "Linguagem", title: "Nomear rotina", time: "3 min", description: "Durante troca, banho ou comida, nomeie ações simples: abre, fecha, pegou, caiu." }
    ]
  },
  {
    minAge: 13,
    maxAge: 18,
    items: [
      { area: "Motor", title: "Caminho com almofadas", time: "8-10 min", description: "Monte um percurso baixo com almofadas para subir, descer e equilibrar com supervisão." },
      { area: "Cognitivo", title: "Encaixe simples", time: "5-8 min", description: "Ofereça potes, argolas ou formas grandes para testar encaixe e tentativa." },
      { area: "Social", title: "Dar e receber", time: "5 min", description: "Peça um objeto com a mão aberta, agradeça e devolva para ela repetir a troca." }
    ]
  },
  {
    minAge: 19,
    maxAge: 36,
    items: [
      { area: "Linguagem", title: "Escolha entre dois", time: "5 min", description: "Mostre duas opções e pergunte qual quer. Espere gesto, palavra ou tentativa." },
      { area: "Motor", title: "Dança com comandos", time: "5-8 min", description: "Coloque música curta e alterne comandos simples: para, gira, bate palma." },
      { area: "Cognitivo", title: "Separar por cor", time: "8 min", description: "Use objetos grandes e seguros para separar em dois grupos de cores." }
    ]
  }
];

const defaultState = {
  babyName: "",
  babyAge: 6,
  babyBirthDate: "",
  dayStart: DEFAULT_DAY_START,
  lastWake: "",
  bedtime: "19:30",
  plannedNapCount: 5,
  activeNapAttemptStart: null,
  activeNapStart: null,
  activeNapResumeId: null,
  activeNightStart: null,
  activeNightId: null,
  activeNightAwakeStart: null,
  activeNightAwakenings: [],
  cycleStartAt: null,
  naps: [],
  nights: [],
  feedings: [],
  diapers: [],
  sleepDiary: {},
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
  dayCenterFeedingLabel: document.querySelector("#dayCenterFeedingLabel"),
  dayCenterFeedingTime: document.querySelector("#dayCenterFeedingTime"),
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
  startInfoText: document.querySelector("#startInfoText"),
  closeStartSheet: document.querySelector("#closeStartSheet"),
  napStartSheet: document.querySelector("#napStartSheet"),
  closeNapStartSheet: document.querySelector("#closeNapStartSheet"),
  napStartTime: document.querySelector("#napStartTime"),
  confirmStartNap: document.querySelector("#confirmStartNap"),
  napAttemptStatus: document.querySelector("#napAttemptStatus"),
  napAttemptTimer: document.querySelector("#napAttemptTimer"),
  confirmNapAsleep: document.querySelector("#confirmNapAsleep"),
  cancelNapAttempt: document.querySelector("#cancelNapAttempt"),
  nightTimeSheet: document.querySelector("#nightTimeSheet"),
  closeNightTimeSheet: document.querySelector("#closeNightTimeSheet"),
  nightTimeTitle: document.querySelector("#nightTimeTitle"),
  nightEventTime: document.querySelector("#nightEventTime"),
  confirmNightTime: document.querySelector("#confirmNightTime"),
  nightTimeError: document.querySelector("#nightTimeError"),
  startNap: document.querySelector("#startNap"),
  endNap: document.querySelector("#endNap"),
  startNight: document.querySelector("#startNight"),
  endNight: document.querySelector("#endNight"),
  startNightAwake: document.querySelector("#startNightAwake"),
  endNightAwake: document.querySelector("#endNightAwake"),
  openManualNap: document.querySelector("#openManualNap"),
  openManualNight: document.querySelector("#openManualNight"),
  openFeeding: document.querySelector("#openFeeding"),
  openDiaper: document.querySelector("#openDiaper"),
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
  profileAwakeTime: document.querySelector("#profileAwakeTime"),
  profileGeneralMood: document.querySelector("#profileGeneralMood"),
  profileAverageWindow: document.querySelector("#profileAverageWindow"),
  profileAssistantObservation: document.querySelector("#profileAssistantObservation"),
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
  diaryMenu: document.querySelector("#diaryMenu"),
  activitiesMenu: document.querySelector("#activitiesMenu"),
  reportMenu: document.querySelector("#reportMenu"),
  profileSheet: document.querySelector("#profileSheet"),
  closeProfile: document.querySelector("#closeProfile"),
  historySheet: document.querySelector("#historySheet"),
  closeHistory: document.querySelector("#closeHistory"),
  diarySheet: document.querySelector("#diarySheet"),
  closeDiary: document.querySelector("#closeDiary"),
  sleepDiaryList: document.querySelector("#sleepDiaryList"),
  diaryStats: document.querySelector("#diaryStats"),
  diaryTips: document.querySelector("#diaryTips"),
  activitiesSheet: document.querySelector("#activitiesSheet"),
  closeActivities: document.querySelector("#closeActivities"),
  activityAgeLabel: document.querySelector("#activityAgeLabel"),
  activityList: document.querySelector("#activityList"),
  reportSheet: document.querySelector("#reportSheet"),
  closeReport: document.querySelector("#closeReport"),
  avgNapCount: document.querySelector("#avgNapCount"),
  avgDaySleep: document.querySelector("#avgDaySleep"),
  avgNightSleep: document.querySelector("#avgNightSleep"),
  avgTotalSleep: document.querySelector("#avgTotalSleep"),
  avgFeedingCount: document.querySelector("#avgFeedingCount"),
  avgNightAwake: document.querySelector("#avgNightAwake"),
  avgDayAwake: document.querySelector("#avgDayAwake"),
  avgWakeWindowReal: document.querySelector("#avgWakeWindowReal"),
  avgSleepLatencyReport: document.querySelector("#avgSleepLatencyReport"),
  wakeMoodReport: document.querySelector("#wakeMoodReport"),
  avgLastWindowBeforeNight: document.querySelector("#avgLastWindowBeforeNight"),
  avgNightWakeCount: document.querySelector("#avgNightWakeCount"),
  avgNapGoal: document.querySelector("#avgNapGoal"),
  avgDiaperCount: document.querySelector("#avgDiaperCount"),
  avgPoopCount: document.querySelector("#avgPoopCount"),
  avgPeeOnlyCount: document.querySelector("#avgPeeOnlyCount"),
  avgPoopOnlyCount: document.querySelector("#avgPoopOnlyCount"),
  avgBothDiaperCount: document.querySelector("#avgBothDiaperCount"),
  reportCharts: document.querySelector("#reportCharts"),
  sleepReportChart: document.querySelector("#sleepReportChart"),
  reportSummary: document.querySelector("#reportSummary"),
  reportWeekLabel: document.querySelector("#reportWeekLabel"),
  reportFilter: document.querySelector("#reportFilter"),
  reportDate: document.querySelector("#reportDate"),
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
  feedingTypeGroup: document.querySelector("#feedingTypeGroup"),
  feedingSideGroup: document.querySelector("#feedingSideGroup"),
  feedingNote: document.querySelector("#feedingNote"),
  saveFeeding: document.querySelector("#saveFeeding"),
  feedingError: document.querySelector("#feedingError"),
  diaperSheet: document.querySelector("#diaperSheet"),
  closeDiaper: document.querySelector("#closeDiaper"),
  diaperTime: document.querySelector("#diaperTime"),
  diaperTypeGroup: document.querySelector("#diaperTypeGroup"),
  saveDiaper: document.querySelector("#saveDiaper"),
  diaperError: document.querySelector("#diaperError")
};

let manualMood = "";
let manualRecordType = "nap";
let nightEventMode = "";
let reportWeekStart = startOfWeek(new Date());
let selectedFeedSide = "left";
let feedingSheetSupport = null;
let diaperSheetSupport = null;
let sleepDiarySheetSupport = null;
let selectedDiaperType = "pee";
let activeSessionSheetSupport = null;
let activeSessionPollInFlight = false;
let lastActiveSessionWriteAt = 0;
const recentlyClosedActiveSessions = new Map();

init();

function init() {
  mountProfilePanel();
  hydrateForm();
  bindEvents();
  registerServiceWorker();
  updateNotificationState();
  render();
  syncFromSheetThenPending();
  if (state.activeNapStart || state.activeNightStart) syncActiveSessionToSheet();
  setInterval(render, 1000);
  loadActiveSessionFromSheet();
  setInterval(loadActiveSessionFromSheet, ACTIVE_SESSION_POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadActiveSessionFromSheet();
  });
}

function hydrateForm() {
  repairDayStartIfItHidesTodayNaps();
  applyLastWakeFromLatestNap();
  els.babyName.value = state.babyName;
  els.babyBirthDate.value = state.babyBirthDate || "";
  els.dayStart.value = state.dayStart || DEFAULT_DAY_START;
  els.lastWake.value = state.lastWake || minutesToTime(nowMinutes());
  els.bedtime.value = state.bedtime;
  els.plannedNapCount.value = String(state.plannedNapCount || defaultState.plannedNapCount);
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
  els.startSheet.addEventListener("click", handleStartActionInfoClick, true);
  if (els.napStartTime) {
    ["click", "pointerdown", "touchstart"].forEach((eventName) => {
      els.napStartTime.addEventListener(eventName, (event) => event.stopPropagation());
    });
  }
  els.startNap.addEventListener("click", () => toggleNapStartSheet(true));
  els.closeNapStartSheet.addEventListener("click", () => toggleNapStartSheet(false));
  els.confirmStartNap.addEventListener("click", startNapAttempt);
  els.confirmNapAsleep.addEventListener("click", confirmNapAsleep);
  els.cancelNapAttempt.addEventListener("click", cancelNapAttempt);
  els.closeNightTimeSheet.addEventListener("click", () => toggleNightTimeSheet(false));
  els.confirmNightTime.addEventListener("click", confirmNightTime);
  els.endNap.addEventListener("click", () => {
    toggleStartSheet(false);
    toggleMoodSheet(true);
  });
  els.startNight.addEventListener("click", () => {
    toggleStartSheet(false);
    openNightTimeSheet("startNight");
  });
  els.endNight.addEventListener("click", () => {
    toggleStartSheet(false);
    openNightTimeSheet("endNight");
  });
  els.startNightAwake.addEventListener("click", () => {
    toggleStartSheet(false);
    openNightTimeSheet("startAwake");
  });
  els.endNightAwake.addEventListener("click", () => {
    toggleStartSheet(false);
    openNightTimeSheet("endAwake");
  });
  els.openManualNap.addEventListener("click", () => {
    toggleStartSheet(false);
    openManualRecordSheet("nap");
  });
  els.openManualNight.addEventListener("click", () => {
    toggleStartSheet(false);
    openManualRecordSheet("night");
  });
  els.openFeeding.addEventListener("click", () => {
    toggleStartSheet(false);
    openFeedingSheet(false);
  });
  els.openDiaper.addEventListener("click", () => {
    toggleStartSheet(false);
    openDiaperSheet();
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
  els.diaryMenu.addEventListener("click", () => toggleDiarySheet(true));
  els.activitiesMenu.addEventListener("click", () => toggleActivitiesSheet(true));
  els.reportMenu.addEventListener("click", () => toggleReportSheet(true));
  els.reportFilter.addEventListener("click", handleReportFilterClick);
  els.reportDate.addEventListener("change", handleReportDateChange);
  els.installHelp.addEventListener("click", () => toggleInstallSheet(true));
  els.closeProfile.addEventListener("click", () => toggleProfileSheet(false));
  els.closeHistory.addEventListener("click", () => toggleHistorySheet(false));
  els.closeDiary.addEventListener("click", () => toggleDiarySheet(false));
  els.closeActivities.addEventListener("click", () => toggleActivitiesSheet(false));
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
  els.closeDiaper.addEventListener("click", () => toggleDiaperSheet(false));
  els.saveDiaper.addEventListener("click", saveDiaper);
  els.diaperTypeGroup.addEventListener("click", handleDiaperTypeClick);
  els.sleepDiaryList.addEventListener("click", handleSleepDiaryOptionClick);
  els.sleepDiaryList.addEventListener("change", handleSleepDiaryChange);
  document.querySelectorAll("[data-feed-side]").forEach((button) => {
    button.addEventListener("click", () => selectFeedSide(button.dataset.feedSide));
  });
  els.feedingTypeGroup.addEventListener("click", handleFeedingTypeClick);
  els.installSheet.addEventListener("click", (event) => {
    if (event.target === els.installSheet) toggleInstallSheet(false);
  });
  els.profileSheet.addEventListener("click", (event) => {
    if (event.target === els.profileSheet) toggleProfileSheet(false);
  });
  els.historySheet.addEventListener("click", (event) => {
    if (event.target === els.historySheet) toggleHistorySheet(false);
  });
  els.diarySheet.addEventListener("click", (event) => {
    if (event.target === els.diarySheet) toggleDiarySheet(false);
  });
  els.activitiesSheet.addEventListener("click", (event) => {
    if (event.target === els.activitiesSheet) toggleActivitiesSheet(false);
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
  els.napStartSheet.addEventListener("click", (event) => {
    if (event.target === els.napStartSheet) toggleNapStartSheet(false);
  });
  els.nightTimeSheet.addEventListener("click", (event) => {
    if (event.target === els.nightTimeSheet) toggleNightTimeSheet(false);
  });
  els.manualNapSheet.addEventListener("click", (event) => {
    if (event.target === els.manualNapSheet) toggleManualNapSheet(false);
  });
  els.feedingSheet.addEventListener("click", (event) => {
    if (event.target === els.feedingSheet) toggleFeedingSheet(false);
  });
  els.diaperSheet.addEventListener("click", (event) => {
    if (event.target === els.diaperSheet) toggleDiaperSheet(false);
  });
  els.history.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-nap]");
    if (button) removeNapRecord(button.dataset.deleteNap);
    const feedingButton = event.target.closest("[data-delete-feeding]");
    if (feedingButton) removeFeedingRecord(feedingButton.dataset.deleteFeeding);
    const diaperButton = event.target.closest("[data-delete-diaper]");
    if (diaperButton) removeDiaperRecord(diaperButton.dataset.deleteDiaper);
  });
}

function handleStartActionInfoClick(event) {
  const info = event.target.closest(".action-info");
  if (!info || !els.startSheet.contains(info)) return;
  event.preventDefault();
  event.stopPropagation();
  const text = info.getAttribute("title") || "";
  if (!text || !els.startInfoText) return;
  els.startInfoText.textContent = text;
  els.startInfoText.hidden = false;
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

function startNapAttempt() {
  if (state.activeNapStart || state.activeNightStart) return;
  if (state.activeNapAttemptStart) return;
  const informedStart = els.napStartTime?.value ? new Date(els.napStartTime.value) : null;
  const now = new Date();
  const startedAt = informedStart && !Number.isNaN(informedStart.getTime()) && informedStart <= now
    ? informedStart
    : now;
  const sessionId = newNapId(startedAt);
  state.activeNapAttemptStart = startedAt.toISOString();
  state.activeNapResumeId = sessionId;
  clearNotificationTimers();
  saveState();
  render();
}

function confirmNapAsleep() {
  if (state.activeNapStart || state.activeNightStart || !state.activeNapAttemptStart) return;
  const attemptStartedAt = new Date(state.activeNapAttemptStart || "");
  const startedAt = new Date();
  if (!state.activeNapResumeId) state.activeNapResumeId = newNapId(startedAt);
  if (Number.isNaN(attemptStartedAt.getTime())) {
    state.activeNapAttemptStart = startedAt.toISOString();
  }
  state.activeNapStart = startedAt.toISOString();
  toggleNapStartSheet(false);
  clearNotificationTimers();
  saveState();
  syncActiveSessionToSheet();
  scheduleActiveNapNotifications();
  render();
}

function cancelNapAttempt() {
  state.activeNapAttemptStart = null;
  state.activeNapResumeId = null;
  if (els.napStartTime) els.napStartTime.value = "";
  saveState();
  toggleNapStartSheet(false);
  render();
}

function startNightSleep(startedAt = new Date()) {
  if (state.activeNapAttemptStart || state.activeNapStart || state.activeNightStart) return;
  state.activeNightStart = startedAt.toISOString();
  state.activeNightId = newNightId(startedAt);
  state.activeNightAwakeStart = null;
  state.activeNightAwakenings = [];
  clearNotificationTimers();
  syncRemoteNotificationScheduleAbsolute([]);
  saveState();
  syncActiveSessionToSheet();
  if (canNotify()) {
    notify("Sono noturno iniciado \ud83c\udf19", `${babyDisplayName()} dormiu! Hora de descansar \ud83d\udc9e`, "soneca-noite-iniciada");
  }
  render();
}

function openNightTimeSheet(mode) {
  nightEventMode = mode;
  const titles = {
    startNight: "Hora de dormir",
    endNight: "Acordou",
    startAwake: "Acordou na madrugada",
    endAwake: "Voltou a dormir"
  };
  els.nightTimeTitle.textContent = titles[mode] || "Registrar horário";
  els.nightEventTime.value = "";
  els.nightTimeError.textContent = "";
  toggleNightTimeSheet(true);
}

function confirmNightTime() {
  const eventAt = nightEventTimeValue();
  if (!eventAt) return;

  if (nightEventMode === "startNight") {
    startNightSleep(eventAt);
  } else if (nightEventMode === "endNight") {
    completeNightSleep(eventAt);
  } else if (nightEventMode === "startAwake") {
    startNightAwake(eventAt);
  } else if (nightEventMode === "endAwake") {
    endNightAwake(eventAt);
  }

  toggleNightTimeSheet(false);
}

function nightEventTimeValue() {
  const value = els.nightEventTime.value;
  const eventAt = value ? new Date(value) : new Date();
  if (Number.isNaN(eventAt.getTime())) {
    els.nightTimeError.textContent = "Horário inválido.";
    return null;
  }
  if (eventAt > new Date()) {
    els.nightTimeError.textContent = "O horário não pode ser no futuro.";
    return null;
  }
  if ((nightEventMode === "endNight" || nightEventMode === "startAwake" || nightEventMode === "endAwake") && state.activeNightStart) {
    const nightStart = new Date(state.activeNightStart);
    if (!Number.isNaN(nightStart.getTime()) && eventAt < nightStart) {
      els.nightTimeError.textContent = "O horário precisa ser depois do início do sono noturno.";
      return null;
    }
  }
  if (nightEventMode === "endAwake" && state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    if (!Number.isNaN(awakeStart.getTime()) && eventAt <= awakeStart) {
      els.nightTimeError.textContent = "O horário precisa ser depois que ela acordou.";
      return null;
    }
  }
  if (nightEventMode === "endNight" && state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    if (!Number.isNaN(awakeStart.getTime()) && eventAt <= awakeStart) {
      els.nightTimeError.textContent = "O horário precisa ser depois que ela acordou na madrugada.";
      return null;
    }
  }
  return eventAt;
}

function startNightAwake(startedAt = new Date()) {
  if (!state.activeNightStart || state.activeNightAwakeStart) return;
  state.activeNightAwakeStart = startedAt.toISOString();
  saveState();
  syncActiveSessionToSheet();
  render();
}

function endNightAwake(endedAt = new Date()) {
  if (!state.activeNightStart || !state.activeNightAwakeStart) return;
  const startedAt = new Date(state.activeNightAwakeStart);
  if (!Number.isNaN(startedAt.getTime()) && endedAt > startedAt) {
    state.activeNightAwakenings = [
      ...(state.activeNightAwakenings || []),
      { start: startedAt.toISOString(), end: endedAt.toISOString() }
    ];
  }
  state.activeNightAwakeStart = null;
  saveState();
  syncActiveSessionToSheet();
  render();
}

function completeNightSleep(endedAt = new Date()) {
  if (!state.activeNightStart) return;
  const startedAt = new Date(state.activeNightStart);

  if (Number.isNaN(startedAt.getTime()) || endedAt <= startedAt) {
    if (state.activeNightId) rememberClosedActiveSession(state.activeNightId);
    state.activeNightStart = null;
    state.activeNightId = null;
    state.activeNightAwakeStart = null;
    state.activeNightAwakenings = [];
    clearActiveSessionFromSheet();
    saveState();
    render();
    return;
  }

  const activeNightId = state.activeNightId || newNightId(startedAt);
  state.activeNightId = activeNightId;
  const night = createNightRecord(startedAt, endedAt, activeNightAwakeningsUntil(endedAt), { id: activeNightId });
  rememberClosedActiveSession(activeNightId);
  addNightRecord(night);
  state.activeNightStart = null;
  state.activeNightId = null;
  state.activeNightAwakeStart = null;
  state.activeNightAwakenings = [];
  applyNightAsCycleStartIfLatest(night);
  saveState();
  clearActiveSessionFromSheet(activeNightId);
  syncNightToSheet(night);
  scheduleUpcomingNotifications();
  render();
}

function completeNap(mood) {
  if (!state.activeNapStart) return;
  const startedAt = new Date(state.activeNapStart);
  const endedAt = new Date();
  const activeNapId = state.activeNapResumeId || newNapId(startedAt);
  state.activeNapResumeId = activeNapId;
  const nap = createNapRecord(startedAt, endedAt, mood, { id: activeNapId });
  const attemptStartedAt = new Date(state.activeNapAttemptStart || "");
  const sleepLatency = !Number.isNaN(attemptStartedAt.getTime()) && startedAt > attemptStartedAt
    ? Math.max(0, Math.round((startedAt - attemptStartedAt) / 60000))
    : 0;
  if (sleepLatency > 0) {
    state.sleepDiary = state.sleepDiary || {};
    state.sleepDiary[activeNapId] = {
      ...sleepDiaryEntry(activeNapId),
      sleepLatency: String(sleepLatency),
      synced: false
    };
  }
  rememberClosedActiveSession(activeNapId);
  state.activeNapStart = null;
  state.activeNapAttemptStart = null;
  state.activeNapResumeId = null;
  clearNotificationTimers();
  saveState();
  addNapRecord(nap);
  clearActiveSessionFromSheet(activeNapId);
  if (sleepLatency > 0) syncSleepDiaryToSheet([activeNapId], "Sincronizando tempo para adormecer com o Google Sheets...");
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

function createNapRecord(startedAt, endedAt, mood, options = {}) {
  const napIndex = napIndexForStart(startedAt);
  const goalDuration = napGoalMinutesForIndex(napIndex);
  const duration = Math.max(1, Math.round((endedAt - startedAt) / 60000));
  return {
    id: options.id || newNapId(startedAt),
    type: "nap",
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    dayStart: state.dayStart,
    bedtime: state.bedtime,
    lastWake: state.lastWake,
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration,
    goalDuration,
    goalPercent: napGoalPercent(duration, goalDuration),
    mood,
    synced: false
  };
}

function createNightRecord(startedAt, endedAt, awakenings = [], options = {}) {
  const awakeMinutes = totalAwakeMinutes(awakenings);
  const grossDuration = Math.max(1, Math.round((endedAt - startedAt) / 60000));
  return {
    id: options.id || newNightId(startedAt),
    type: "night",
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    dayStart: minutesToTime(dateToDayMinutes(endedAt)),
    bedtime: minutesToTime(dateToDayMinutes(startedAt)),
    lastWake: minutesToTime(dateToDayMinutes(endedAt)),
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: Math.max(1, grossDuration - awakeMinutes),
    awakeDuration: awakeMinutes,
    awakenings,
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

function createDiaperRecord(changedAt, type) {
  return {
    id: `diaper-${changedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    babyName: state.babyName || "",
    babyAge: currentBabyAgeMonths(),
    at: changedAt.toISOString(),
    type,
    dayStart: state.dayStart,
    synced: false
  };
}

function activeNightAwakeningsUntil(endedAt = new Date()) {
  const awakenings = normalizeAwakenings(state.activeNightAwakenings || []);
  const awakeStart = new Date(state.activeNightAwakeStart || "");
  if (!Number.isNaN(awakeStart.getTime()) && endedAt > awakeStart) {
    awakenings.push({ start: awakeStart.toISOString(), end: endedAt.toISOString() });
  }
  return awakenings;
}

function normalizeAwakenings(awakenings = []) {
  return awakenings
    .map((item) => {
      const start = new Date(item.start);
      const end = new Date(item.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
      return { start: start.toISOString(), end: end.toISOString() };
    })
    .filter(Boolean);
}

function totalAwakeMinutes(awakenings = []) {
  return normalizeAwakenings(awakenings).reduce((sum, item) => {
    return sum + Math.max(1, Math.round((new Date(item.end) - new Date(item.start)) / 60000));
  }, 0);
}

function nightAwakeningsNote(night) {
  const awakenings = normalizeAwakenings(night.awakenings || []);
  const awakeMinutes = Number(night.awakeDuration || totalAwakeMinutes(awakenings));
  if (!awakenings.length && !awakeMinutes) return "";
  const ranges = awakenings
    .map((item) => `${timeLabel(new Date(item.start))}-${timeLabel(new Date(item.end))}`)
    .join(", ");
  return `Acordada na noite: ${formatDuration(awakeMinutes)}${ranges ? ` (${ranges})` : ""}`;
}

function napGoalNote(nap) {
  if ((nap.type || "nap") === "night") return "";
  const goal = Number(nap.goalDuration) || napGoalMinutesForIndex(napIndexForStart(new Date(nap.start)));
  const percent = Number(nap.goalPercent) || napGoalPercent(safeDuration(nap), goal);
  return `Meta da soneca: ${formatDuration(goal)} (${percent}% atingido)`;
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

function addDiaperRecord(diaper) {
  const duplicate = state.diapers.find((item) => diaperSignature(item) === diaperSignature(diaper));
  if (duplicate) {
    setHint("Troca duplicada ignorada: já existe um registro igual neste horário.");
    return;
  }

  state.diapers.unshift(diaper);
  state.diapers = dedupeDiapers(state.diapers)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 240);
  saveState();
  syncDiaperToSheet(diaper);
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

function removeDiaperRecord(diaperKey) {
  const diaper = state.diapers.find((item) => diaperIdentity(item) === diaperKey);
  state.diapers = state.diapers.filter((item) => diaperIdentity(item) !== diaperKey);
  saveState();
  if (diaper && diaper.id) deleteDiaperFromSheet(diaper.id);
  render();
}

function clearHistory() {
  state.naps = [];
  state.nights = [];
  state.feedings = [];
  state.diapers = [];
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
  updateProfileRoutineStats();
  renderPrediction(prediction);
  renderDayPlanner(prediction);
  renderTimer();
  renderInsights(prediction);
  renderHistory();
  renderSleepDiary();
  renderActivities();
  renderReport();
  renderNapAttemptControls();
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

function updateProfileRoutineStats() {
  const today = napsToday();
  const wakeWindowsUsed = today.map(wakeWindowUsedForNap).filter((value) => value > 0);
  const averageWindow = wakeWindowsUsed.length
    ? Math.round(wakeWindowsUsed.reduce((sum, value) => sum + value, 0) / wakeWindowsUsed.length)
    : 0;
  if (els.profileAwakeTime) els.profileAwakeTime.textContent = formatDuration(currentCycleAwakeMinutes());
  if (els.profileGeneralMood) els.profileGeneralMood.textContent = profileGeneralMoodLabel(today);
  if (els.profileAverageWindow) els.profileAverageWindow.textContent = averageWindow ? formatDuration(averageWindow) : "-";
  if (els.profileAssistantObservation) els.profileAssistantObservation.textContent = profileAssistantObservation(today);
}

function calculatePrediction() {
  const age = currentBabyAgeMonths();
  const ageProfile = wakeWindowForAge(age);
  const today = napsToday();
  const recent = state.naps.slice(0, 7);
  const lastNap = today[0] || recent[0];
  const sleep24 = sleepInLast24Hours();
  const bedtimeMinutes = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const lastWakeMinutes = effectiveLastWakeMinutes(today);
  const profile = customWakeWindowProfile(ageProfile, today);

  let adjustment = 0;
  if (lastNap && lastNap.duration < 35) adjustment -= 20;
  if (lastNap && lastNap.duration > 100) adjustment += 15;

  const averageWindow = averageRecentWakeWindow(recent);
  if (averageWindow && !profile.custom) {
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

  if (state.activeNapAttemptStart) {
    if (els.nextWindow) els.nextWindow.textContent = "Tentando dormir";
    if (els.nextHint) els.nextHint.textContent = "O tempo para adormecer sera salvo no diario quando a soneca for encerrada.";
    return;
  }

  if (state.activeNightStart && state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    const awakeMinutes = Number.isNaN(awakeStart.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - awakeStart.getTime()) / 60000));
    if (els.nextWindow) els.nextWindow.textContent = "Acordada na madrugada";
    if (els.nextHint) els.nextHint.textContent = `Acordada h\u00e1 ${formatRingDuration(awakeMinutes)}. O sono noturno continua quando voltar a dormir.`;
    return;
  }

  if (state.activeNightStart && totalAwakeMinutes(state.activeNightAwakenings || []) > 0) {
    if (els.nextWindow) els.nextWindow.textContent = "Sono noturno";
    if (els.nextHint) els.nextHint.textContent = `Acordada na noite: ${formatRingDuration(totalAwakeMinutes(state.activeNightAwakenings || []))}.`;
    return;
  }

  if (state.activeNightStart) {
    if (els.nextWindow) els.nextWindow.textContent = "Sono noturno";
    if (els.nextHint) els.nextHint.textContent = "O novo ciclo do dia começa quando o sono noturno for encerrado.";
    return;
  }

  if (!shouldSuggestNapBeforeNight(prediction)) {
    const night = calculateNightSuggestion(prediction);
    const delay = minutesUntilReminder(night.start, nowMinutes());
    if (els.nextWindow) els.nextWindow.textContent = `Sono noturno em ${formatDuration(delay)}`;
    if (els.nextHint) els.nextHint.textContent = `Próxima janela não cabe bem antes da noite. Sono noturno sugerido por volta de ${minutesToTime(night.start)}.`;
    return;
  }

  const night = calculateNightSuggestion(prediction);
  if (shouldSkipNextNapForNight(prediction, night)) {
    const delay = minutesUntilReminder(night.start, nowMinutes());
    if (els.nextWindow) els.nextWindow.textContent = `Sono noturno em ${formatDuration(delay)}`;
    if (els.nextHint) els.nextHint.textContent = `A próxima soneca ficaria muito perto do sono noturno. Melhor preparar a noite por volta de ${minutesToTime(night.start)}.`;
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
  if (state.activeNightStart) {
    renderNightPlanner();
    return;
  }

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
    ...feedings.map((feeding) => ({
      type: "feed",
      at: ringMarkerMinute(new Date(feeding.at)),
      id: feedingIdentity(feeding)
    })),
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
  renderLastFeedingInRingCenter();
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

function renderNightPlanner() {
  const startedAt = new Date(state.activeNightStart);
  const now = new Date();
  if (Number.isNaN(startedAt.getTime())) return;

  const nightStart = dateToDayMinutes(startedAt);
  currentRingStartMinutes = nightStart;
  currentRingEndMinutes = normalizeDayMinutes(nightStart + 12 * 60);
  const nowMinute = dateToDayMinutes(now);
  const awakenings = activeNightAwakeningsUntil(now);
  const feedings = feedingsInActiveNight();

  els.daySegments.innerHTML = [
    arcPath(nightStart, nowMinute, "night")
  ].join("");

  els.dayMarkers.innerHTML = [
    { type: "day-end", at: nightStart, label: timeLabel(startedAt) },
    ...feedings.map((feeding) => ({
      type: "feed",
      at: dateToDayMinutes(new Date(feeding.at)),
      id: feedingIdentity(feeding)
    }))
  ]
    .filter((marker) => Number.isFinite(marker.at))
    .map((marker) => markerSvg(marker))
    .join("");

  const nowPoint = pointOnCircle(nowMinute, 92);
  els.dayNowHand.setAttribute("x2", String(nowPoint.x));
  els.dayNowHand.setAttribute("y2", String(nowPoint.y));
  renderNightRingCenter(startedAt, now, awakenings, feedings);
  renderNightRingLabels(startedAt, now);
  if (els.bedtimeSuggestion) els.bedtimeSuggestion.textContent = timeLabel(startedAt);
  if (els.bedtimeReason) els.bedtimeReason.textContent = "Concha noturna ativa: mamadas e despertares aparecem nesta linha da noite.";
  if (els.ringCaptions) els.ringCaptions.innerHTML = "";
  if (els.dayLegend) els.dayLegend.innerHTML = "";
}

function renderNightRingCenter(startedAt, now, awakenings, feedings = []) {
  if (state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    els.dayCenterLabel.textContent = "acordada h\u00e1";
    els.dayCenterTime.textContent = formatRingDuration(minutesSinceDate(awakeStart));
    els.dayCenterHint.textContent = feedings.length ? `mamada ${timeLabel(new Date(feedings[0].at))}` : "mamada e colo ficam na concha da noite";
    return;
  }

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 60000));
  const awake = totalAwakeMinutes(awakenings);
  els.dayCenterLabel.textContent = "dormindo h\u00e1";
  els.dayCenterTime.textContent = formatRingDuration(Math.max(0, elapsed - awake));
  const lastFeeding = feedings[0];
  els.dayCenterHint.textContent = lastFeeding
    ? `\u00faltima mamada ${timeLabel(new Date(lastFeeding.at))}`
    : awake ? `acordada na noite: ${formatRingDuration(awake)}` : `iniciou ${timeLabel(startedAt)}`;
}

function renderNightRingLabels(startedAt, now) {
  if (els.ringDayStart) {
    els.ringDayStart.querySelector("strong").textContent = timeLabel(startedAt);
  }
  if (els.ringDayEnd) {
    els.ringDayEnd.querySelector("strong").textContent = timeLabel(now);
  }
}

function handleDayMarkerClick(event) {
  const dayEndMarker = event.target.closest(".day-marker-group.day-end");
  if (dayEndMarker) {
    showNightDetailCard();
    return;
  }

  const marker = event.target.closest(".day-marker-group.nap[data-nap-id]");
  const feedMarker = event.target.closest(".day-marker-group.feed[data-feeding-id]");
  if (feedMarker) {
    const feeding = [...feedingsToday(), ...feedingsInActiveNight()].find((item) => feedingIdentity(item) === feedMarker.dataset.feedingId);
    if (feeding) {
      showFeedingDetailCard(feeding);
      return;
    }
  }

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
    return;
  }

  const continueButton = event.target.closest("[data-continue-nap]");
  if (continueButton) {
    event.preventDefault();
    event.stopPropagation();
    continueNapFromRecord(continueButton.dataset.continueNap);
    return;
  }

  const saveEditButton = event.target.closest("[data-save-nap-edit]");
  if (saveEditButton) {
    event.preventDefault();
    event.stopPropagation();
    saveNapDetailEdits(saveEditButton.dataset.saveNapEdit);
  }
}

function showNapDetailCard(nap, index) {
  if (!els.napDetailCard) return;
  const start = new Date(nap.start);
  const end = new Date(nap.end);
  const title = index ? `${ordinalFeminine(index)} soneca` : "Soneca";
  const goal = Number(nap.goalDuration) || napGoalMinutesForIndex(index || napIndexForStart(start));
  const goalPercent = Number(nap.goalPercent) || napGoalPercent(safeDuration(nap), goal);
  els.napDetailCard.innerHTML = `
    <button class="nap-detail-close" type="button" data-close-nap-detail aria-label="Fechar">×</button>
    <span>${title}</span>
    <strong>Soneca: ${timeLabel(start)} - ${timeLabel(end)}</strong>
    <small>Meta: ${formatDuration(goal)} · ${goalPercent}% atingido</small>
    <small>Duração: ${formatDuration(safeDuration(nap))}</small>
    <div class="nap-detail-edit">
      <label>
        <span>Inicio</span>
        <input type="datetime-local" data-nap-edit-start="${napIdentity(nap)}" value="${toLocalDateTimeValue(start)}">
      </label>
      <label>
        <span>Fim</span>
        <input type="datetime-local" data-nap-edit-end="${napIdentity(nap)}" value="${toLocalDateTimeValue(end)}">
      </label>
    </div>
    <small class="nap-detail-error" data-nap-edit-error="${napIdentity(nap)}"></small>
    <button class="nap-detail-action secondary" type="button" data-save-nap-edit="${napIdentity(nap)}">
      <i class="fa-solid fa-check"></i>
      Salvar horarios
    </button>
    <button class="nap-detail-action" type="button" data-continue-nap="${napIdentity(nap)}">
      <i class="fa-solid fa-play"></i>
      Continuar timer
    </button>
  `;
  els.napDetailCard.hidden = false;
}

async function saveNapDetailEdits(napKey) {
  if (state.activeNapStart || state.activeNightStart) {
    showNapEditError(napKey, "Encerre o timer ativo antes de editar.");
    return;
  }

  const nap = state.naps.find((item) => napIdentity(item) === napKey);
  if (!nap) {
    hideNapDetailCard();
    return;
  }

  const startInput = napDetailField("start", napKey);
  const endInput = napDetailField("end", napKey);
  const startedAt = new Date(startInput?.value || "");
  const endedAt = new Date(endInput?.value || "");

  if (!startInput?.value || !endInput?.value || Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    showNapEditError(napKey, "Informe inicio e fim validos.");
    return;
  }

  if (endedAt <= startedAt) {
    showNapEditError(napKey, "O fim precisa ser depois do inicio.");
    return;
  }

  if ((endedAt - startedAt) / 60000 > 240) {
    showNapEditError(napKey, "Confira os horarios: a soneca ficou maior que 4 horas.");
    return;
  }

  const updatedNap = createNapRecord(startedAt, endedAt, nap.mood, { id: nap.id || stableNapId(nap) });
  updatedNap.babyName = nap.babyName || state.babyName || "";
  updatedNap.babyAge = Number.isFinite(Number(nap.babyAge)) ? Number(nap.babyAge) : currentBabyAgeMonths();
  updatedNap.dayStart = nap.dayStart || state.dayStart;
  updatedNap.bedtime = nap.bedtime || state.bedtime;
  updatedNap.synced = false;
  state.naps = state.naps.map((item) => napIdentity(item) === napKey ? updatedNap : item)
    .sort((a, b) => new Date(b.end) - new Date(a.end));
  applyLastWakeFromLatestNap();
  saveState();
  render();
  setHint("Soneca corrigida. Atualizando Google Sheets...");

  if (nap.id) await deleteNapFromSheet(nap.id, { silent: true });
  syncNapToSheet(updatedNap);
}

function showNapEditError(napKey, message) {
  const error = napDetailField("error", napKey);
  if (error) error.textContent = message;
}

function napDetailField(kind, napKey) {
  const attribute = kind === "start" ? "napEditStart" : kind === "end" ? "napEditEnd" : "napEditError";
  const selector = kind === "start" ? "[data-nap-edit-start]" : kind === "end" ? "[data-nap-edit-end]" : "[data-nap-edit-error]";
  return [...(els.napDetailCard?.querySelectorAll(selector) || [])]
    .find((item) => item.dataset[attribute] === napKey) || null;
}

function continueNapFromRecord(napKey) {
  if (state.activeNapStart || state.activeNightStart) {
    setHint("Ja existe um sono em andamento.");
    return;
  }

  const nap = state.naps.find((item) => napIdentity(item) === napKey);
  if (!nap) {
    hideNapDetailCard();
    return;
  }

  const startedAt = new Date(nap.start);
  if (Number.isNaN(startedAt.getTime())) return;

  const resumedId = nap.id || stableNapId(nap);
  state.naps = state.naps.filter((item) => napIdentity(item) !== napKey);
  state.activeNapAttemptStart = null;
  state.activeNapStart = startedAt.toISOString();
  state.activeNapResumeId = resumedId;
  if (nap.id) deleteNapFromSheet(nap.id, { silent: true });
  clearNotificationTimers();
  hideNapDetailCard();
  saveState();
  syncActiveSessionToSheet();
  scheduleActiveNapNotifications();
  setHint("Timer retomado na mesma soneca. Ao encerrar, a duracao sera atualizada.");
  render();
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

function showFeedingDetailCard(feeding) {
  if (!els.napDetailCard) return;
  const fedAt = new Date(feeding.at);
  const side = feedingSideLabel(feeding.side);
  els.napDetailCard.innerHTML = `
    <button class="nap-detail-close" type="button" data-close-nap-detail aria-label="Fechar">×</button>
    <span>Mamada</span>
    <strong>${timeLabel(fedAt)} · ${feedingLabel(feeding)}</strong>
    <small>Lado: ${side || "não informado"}</small>
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
    const goal = activeNapGoalMinutes();
    const remaining = Math.max(0, goal - elapsed);
    els.dayCenterLabel.textContent = "dormindo há";
    els.dayCenterTime.textContent = formatRingDuration(elapsed);
    els.dayCenterHint.textContent = remaining
      ? `meta ${formatDuration(goal)} · faltam ${formatDuration(remaining)}`
      : `meta ${formatDuration(goal)} atingida`;
    return;
  }

  if (state.activeNapAttemptStart) {
    const startedAt = new Date(state.activeNapAttemptStart);
    const elapsed = Number.isNaN(startedAt.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
    els.dayCenterLabel.textContent = "tentando dormir ha";
    els.dayCenterTime.textContent = formatRingDuration(elapsed);
    els.dayCenterHint.textContent = "toque em Dormiu quando a soneca comecar";
    return;
  }

  if (state.activeNightStart && state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    const awakeMinutes = Number.isNaN(awakeStart.getTime())
      ? 0
      : Math.max(0, Math.floor((Date.now() - awakeStart.getTime()) / 60000));
    els.dayCenterLabel.textContent = "acordada h\u00e1";
    els.dayCenterTime.textContent = formatRingDuration(awakeMinutes);
    els.dayCenterHint.textContent = "sono noturno continua";
    return;
  }

  if (state.activeNightStart && totalAwakeMinutes(state.activeNightAwakenings || []) > 0) {
    els.dayCenterLabel.textContent = "sono noturno";
    els.dayCenterTime.textContent = "em andamento";
    els.dayCenterHint.textContent = `acordada na noite: ${formatRingDuration(totalAwakeMinutes(state.activeNightAwakenings || []))}`;
    return;
  }

  if (state.activeNightStart) {
    els.dayCenterLabel.textContent = "sono noturno";
    els.dayCenterTime.textContent = "em andamento";
    els.dayCenterHint.textContent = "O novo ciclo começa ao encerrar a noite.";
    return;
  }

  if (!shouldSuggestNapBeforeNight(prediction, today)) {
    const night = calculateNightSuggestion(prediction);
    els.dayCenterLabel.textContent = "sono noturno em";
    els.dayCenterTime.textContent = formatDuration(minutesUntilReminder(night.start, now));
    els.dayCenterHint.textContent = `previsto ${minutesToTime(night.start)}`;
    return;
  }

  const night = calculateNightSuggestion(prediction);
  if (shouldSkipNextNapForNight(prediction, night)) {
    els.dayCenterLabel.textContent = "sono noturno em";
    els.dayCenterTime.textContent = formatDuration(minutesUntilReminder(night.start, now));
    els.dayCenterHint.textContent = `próximo evento previsto ${minutesToTime(night.start)}`;
    return;
  }

  if (now < prediction.start) {
    els.dayCenterLabel.textContent = `${nextNapName} em`;
    els.dayCenterTime.textContent = formatDuration(prediction.start - now);
    els.dayCenterHint.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`;
    return;
  }

  if (now <= prediction.end) {
    els.dayCenterLabel.textContent = nextNapName;
    els.dayCenterTime.textContent = "janela aberta";
    els.dayCenterHint.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`;
    return;
  }

  els.dayCenterLabel.textContent = nextNapName;
  els.dayCenterTime.textContent = "janela aberta";
  els.dayCenterHint.textContent = `${name} já passou do alvo provável.`;
}

function renderLastFeedingInRingCenter() {
  if (!els.dayCenterFeedingLabel || !els.dayCenterFeedingTime) return;
  const lastFeeding = latestPastFeeding();
  if (!lastFeeding) {
    els.dayCenterFeedingLabel.textContent = "";
    els.dayCenterFeedingTime.textContent = "";
    return;
  }

  els.dayCenterFeedingLabel.textContent = "\u00faltima mamada";
  els.dayCenterFeedingTime.textContent = formatFeedingAge(lastFeeding);
}

function latestPastFeeding() {
  const now = Date.now();
  return dedupeFeedings(state.feedings || [])
    .map((feeding) => ({ feeding, time: new Date(feeding.at).getTime() }))
    .filter((item) => Number.isFinite(item.time) && item.time <= now)
    .sort((a, b) => b.time - a.time)[0]?.feeding || null;
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
  const done = today.length + (state.activeNapStart ? 1 : 0);
  const total = Math.max(plannedNapCount(), done + (shouldSuggestNapBeforeNight(prediction, today) ? 1 : 0));
  const remaining = Math.max(0, total - done);
  if (!remaining || state.activeNightStart) return [];
  if (shouldSkipNextNapForNight(prediction, night)) return [];

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

function shouldSkipNextNapForNight(prediction, night) {
  if (!prediction || !night) return false;
  const napWouldEndTooClose = prediction.end >= night.start - 45;
  const napWouldStartTooClose = prediction.start >= night.start - 90;
  return napWouldEndTooClose || napWouldStartTooClose;
}

function shouldSuggestNapBeforeNight(prediction, today = napsToday()) {
  if (!prediction || state.activeNightStart) return false;
  if (hasPlannedNapSlot(today)) return true;
  const night = calculateNightSuggestion(prediction);
  if (shouldSkipNextNapForNight(prediction, night)) return false;
  const now = nowMinutes();
  const windowStillUseful = prediction.end >= now - 10;
  const enoughGapAfterNap = minutesBetweenClock(prediction.end, night.start) >= 45;
  const notTooLate = minutesBetweenClock(now, night.start) >= 80;
  return windowStillUseful && enoughGapAfterNap && notTooLate;
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
  const attemptingNap = Boolean(state.activeNapAttemptStart);
  const nightActive = Boolean(state.activeNightStart);
  const nightAwake = Boolean(state.activeNightAwakeStart);
  els.timerPanel.classList.toggle("is-idle", !active && !attemptingNap && !nightActive);
  els.timerPanel.classList.toggle("is-active", active || attemptingNap || nightActive);
  els.openStartSheet.disabled = false;
  els.startNap.disabled = active || nightActive;
  els.endNap.disabled = !active;
  els.startNight.disabled = active || attemptingNap || nightActive;
  els.endNight.disabled = !nightActive;
  els.startNightAwake.disabled = !nightActive || nightAwake;
  els.endNightAwake.disabled = !nightActive || !nightAwake;

  if (nightActive) {
    const startedAt = new Date(state.activeNightStart);
    els.timer.textContent = "noite";
    els.napStatus.textContent = nightAwake ? "Acordada durante o sono noturno" : "Sono noturno em andamento";
    els.currentStart.textContent = timeLabel(startedAt);
    els.currentEnd.textContent = nightAwake ? "voltou a dormir" : "ao acordar";
    els.currentMood.textContent = "Noite";
    return;
  }

  if (attemptingNap) {
    const startedAt = new Date(state.activeNapAttemptStart);
    const minutes = Number.isNaN(startedAt.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
    els.timer.textContent = `${String(minutes).padStart(2, "0")}min`;
    els.napStatus.textContent = `Tentando dormir ha ${formatDuration(minutes)}`;
    els.currentStart.textContent = timeLabel(startedAt);
    els.currentEnd.textContent = "toque em Dormiu";
    els.currentMood.textContent = "Tempo para dormir";
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
  const goal = activeNapGoalMinutes();
  els.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.currentStart.textContent = timeLabel(startedAt);
  els.currentEnd.textContent = `meta ${formatDuration(goal)}`;
  els.currentMood.textContent = "-";
  els.napStatus.textContent = `Dormindo há ${formatDuration(minutes)}`;
  els.napStatus.textContent = `Dormindo h\u00e1 ${formatDuration(minutes)} · ${napGoalPercent(minutes, goal)}% da meta`;
}

function renderNapAttemptControls() {
  if (!els.confirmStartNap || !els.confirmNapAsleep || !els.cancelNapAttempt || !els.napAttemptStatus || !els.napAttemptTimer) return;
  const attempting = Boolean(state.activeNapAttemptStart) && !state.activeNapStart;
  els.confirmStartNap.hidden = attempting;
  els.confirmNapAsleep.hidden = !attempting;
  els.cancelNapAttempt.hidden = !attempting;
  els.napAttemptStatus.hidden = !attempting;
  if (els.napStartTime) els.napStartTime.disabled = attempting;

  if (!attempting) {
    els.napAttemptTimer.textContent = "00min";
    return;
  }

  const startedAt = new Date(state.activeNapAttemptStart);
  const minutes = Number.isNaN(startedAt.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
  els.napAttemptTimer.textContent = formatDuration(minutes);
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
    ...dedupeFeedings(state.feedings).map((record) => ({ ...record, type: "feeding", start: record.at, end: record.at })),
    ...dedupeDiapers(state.diapers).map((record) => ({ ...record, type: "diaper", diaperType: record.type, start: record.at, end: record.at }))
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
    if (record.type === "diaper") {
      return `<li><div><span>Troca de fralda · ${dateLabel(start)}</span><div class="history-times"><b>${timeLabel(start)}</b><b>${diaperTypeLabel(record.diaperType || record.kind || record.typeValue || record.type)}</b></div></div><div class="history-actions"><div class="history-mood">${diaperHasPoop(record) ? "Com cocô" : "Sem cocô"}</div><button class="delete-nap" data-delete-diaper="${diaperIdentity(record)}" aria-label="Excluir troca" title="Excluir troca">×</button></div></li>`;
    }
    const label = record.type === "night" ? "Sono noturno" : moodLabel(record.mood);
    const typeLabel = record.type === "night" ? "Noite" : "Soneca";
    return `<li><div><span>${typeLabel} · ${dateLabel(start)}</span><div class="history-times"><b>${timeLabel(start)} - ${timeLabel(end)}</b><b>${formatDuration(safeDuration(record))}</b></div></div><div class="history-actions"><div class="history-mood">${label}</div><button class="delete-nap" data-delete-nap="${napIdentity(record)}" aria-label="Excluir registro" title="Excluir registro">×</button></div></li>`;
  }).join("");
}

function renderSleepDiary() {
  if (!els.sleepDiaryList) return;
  if (els.diarySheet?.getAttribute("aria-hidden") === "true") return;

  const naps = napsToday()
    .slice()
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  if (!naps.length) {
    els.diaryStats.innerHTML = "";
    els.sleepDiaryList.innerHTML = `<div class="empty-diary">Nenhuma soneca finalizada neste ciclo ainda.</div>`;
    els.diaryTips.innerHTML = `<strong>Dica</strong><p>Quando uma soneca for encerrada, ela aparece aqui para você registrar como foi o adormecer.</p>`;
    return;
  }

  els.sleepDiaryList.innerHTML = naps.map((nap, index) => sleepDiaryCard(nap, index + 1)).join("");
  renderSleepDiaryStats(naps);
}

function sleepDiaryCard(nap, napNumber) {
  const id = napIdentity(nap);
  const entry = sleepDiaryEntry(id);
  const start = new Date(nap.start);
  const end = new Date(nap.end);
  const wakeWindowUsed = wakeWindowUsedForNap(nap);
  return `
    <article class="sleep-diary-card">
      <div class="sleep-diary-head">
        <div>
          <span>${napNumber}ª soneca</span>
          <strong>${timeLabel(start)} - ${timeLabel(end)}</strong>
        </div>
        <div class="diary-duration">
          <span>Duração</span>
          <strong>${formatDuration(safeDuration(nap))}</strong>
        </div>
      </div>
      <div class="diary-fields">
        ${diaryChoiceGroup(id, "sleepEndPlace", "Onde terminou de dormir?", entry.sleepEndPlace, [
          ["lap", "Colo"],
          ["crib-help", "Berço com ajuda"],
          ["crib-alone", "Berço sozinha"]
        ])}
        ${diaryChoiceGroup(id, "wakeMood", "Humor ao acordar", entry.wakeMood, [
          ["happy", "Feliz"],
          ["calm", "Calma"],
          ["upset", "Irritada"],
          ["crying", "Chorando"]
        ])}
        <label>
          Tempo para dormir (min)
          <input type="number" min="0" max="90" inputmode="numeric" value="${escapeAttribute(entry.sleepLatency || "")}" data-diary-id="${escapeAttribute(id)}" data-diary-field="sleepLatency">
        </label>
        ${diaryChoiceGroup(id, "pacifier", "Usou chupeta para dormir?", entry.pacifier, [
          ["yes", "Sim"],
          ["no", "Não"]
        ])}
        ${diaryChoiceGroup(id, "pacifierWake", "Acordou quando caiu?", entry.pacifierWake, [
          ["yes", "Sim"],
          ["no", "Não"]
        ])}
        <label>
          Duração da soneca
          <input type="text" value="${formatDuration(safeDuration(nap))}" readonly>
        </label>
        <label>
          Janela de sono usada
          <input type="text" value="${formatDuration(wakeWindowUsed)}" readonly>
        </label>
        <label>
          Mamada antes da soneca
          <input type="text" value="${escapeAttribute(feedingBeforeNapLabel(nap))}" readonly>
        </label>
      </div>
      <div class="diary-help-block">
        <span>Tipo de ajuda</span>
        <div class="diary-help-grid">
          ${helpTypeOptions(entry.helpTypes, id)}
        </div>
      </div>
    </article>
  `;
}

function diaryChoiceGroup(id, field, label, currentValue, options) {
  return `
    <div class="diary-choice-field">
      <span>${label}</span>
      <div class="diary-choice-group" role="group" aria-label="${escapeAttribute(label)}">
        ${options.map(([value, text]) => `
          <button
            class="diary-choice${currentValue === value ? " is-selected" : ""}"
            type="button"
            data-diary-id="${escapeAttribute(id)}"
            data-diary-field="${escapeAttribute(field)}"
            data-diary-value="${escapeAttribute(value)}"
            aria-pressed="${currentValue === value ? "true" : "false"}"
          >${text}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function legacySleepEndPlace(value) {
  if (value === "yes") return "crib-help";
  if (value === "no") return "lap";
  if (value === "crib") return "crib-help";
  return "";
}

function helpTypeOptions(selected, napId) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : []);
  return [
    ["lap", "Colo"],
    ["rocking", "Balanço"],
    ["chest-hand", "Mão no peito"],
    ["pacifier", "Chupeta"],
    ["voice", "Voz"],
    ["shush", "Shhhh"]
  ].map(([value, label]) => `
    <label class="diary-help-option">
      <input type="checkbox" value="${value}" data-diary-id="${escapeAttribute(napId)}" data-diary-help="true"${selectedSet.has(value) ? " checked" : ""}>
      <span>${label}</span>
    </label>
  `).join("");
}

function wakeWindowUsedForNap(nap) {
  const start = new Date(nap.start);
  if (Number.isNaN(start.getTime())) return 0;
  const sameDayNaps = state.naps
    .filter((item) => recordDateInputValue(item) === recordDateInputValue(nap))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const index = sameDayNaps.findIndex((item) => napIdentity(item) === napIdentity(nap));
  const previousNap = index > 0 ? sameDayNaps[index - 1] : null;
  const previousWake = previousNap
    ? new Date(previousNap.end)
    : dateAtTime(recordDateInputValue(nap), nap.dayStart || state.dayStart || state.lastWake || DEFAULT_DAY_START);
  if (!(previousWake instanceof Date) || Number.isNaN(previousWake.getTime())) return 0;
  return Math.max(0, Math.round((start - previousWake) / 60000));
}

function currentCycleAwakeMinutes() {
  const cycleStart = currentCycleStartDate();
  const cycleEnd = state.activeNightStart ? new Date(state.activeNightStart) : new Date();
  if (!(cycleStart instanceof Date) || Number.isNaN(cycleStart.getTime()) || Number.isNaN(cycleEnd.getTime()) || cycleEnd <= cycleStart) {
    return 0;
  }
  const elapsed = Math.round((cycleEnd - cycleStart) / 60000);
  const finishedNapSleep = napsToday().reduce((sum, nap) => sum + safeDuration(nap), 0);
  const activeNapSleep = state.activeNapStart ? minutesSinceDate(state.activeNapStart) : 0;
  return Math.max(0, elapsed - finishedNapSleep - activeNapSleep);
}

function profileGeneralMoodLabel(naps) {
  const counts = { good: 0, neutral: 0, bad: 0 };
  naps.forEach((nap) => {
    const diaryMood = sleepDiaryEntry(napIdentity(nap)).wakeMood;
    const mood = String(diaryMood || nap.mood || "").toLowerCase();
    if (["happy", "calm", "good", "bem humorado"].includes(mood)) counts.good += 1;
    else if (["upset", "crying", "bad", "mau humorado"].includes(mood)) counts.bad += 1;
    else if (["neutral", "neutro"].includes(mood)) counts.neutral += 1;
  });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ranked[0][1]) return "-";
  if (ranked[0][0] === "good") return "Bom";
  if (ranked[0][0] === "bad") return "Ruim";
  return "Neutro";
}

function profileAssistantObservation(naps) {
  const ordered = naps.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  if (!ordered.length) return "Sem sonecas finalizadas neste ciclo ainda.";

  const resisted = ordered
    .map((nap, index) => ({ nap, index, latency: Number(sleepDiaryEntry(napIdentity(nap)).sleepLatency) || 0 }))
    .find((item) => item.latency >= 20);
  const longNap = ordered
    .map((nap, index) => ({ nap, index, duration: safeDuration(nap) }))
    .filter((item) => item.duration >= 90)
    .sort((a, b) => b.duration - a.duration)[0];
  if (resisted && longNap && longNap.index > resisted.index) {
    return `Resistiu a ${ordinalFeminine(resisted.index + 1)} soneca, mas compensou com ${formatDuration(longNap.duration)} depois.`;
  }

  const napDurations = ordered.map((nap, index) => ({ nap, index, duration: safeDuration(nap) }));
  const shortThenLong = napDurations.find((item, index) => {
    return item.duration < 35 && napDurations.slice(index + 1).some((later) => later.duration >= 80);
  });
  if (shortThenLong) {
    const laterLong = napDurations.slice(shortThenLong.index + 1).find((item) => item.duration >= 80);
    return `A ${ordinalFeminine(shortThenLong.index + 1)} soneca foi curta (${shortThenLong.duration}min), mas ela compensou depois com ${formatDuration(laterLong.duration)}.`;
  }

  const lastNap = napDurations[napDurations.length - 1];
  if (lastNap && lastNap.duration < 35) {
    return `A ultima soneca foi curta (${lastNap.duration}min), entao antecipei a proxima janela em cerca de 20min.`;
  }

  const wakeWindowsUsed = ordered.map(wakeWindowUsedForNap).filter((value) => value > 0);
  if (wakeWindowsUsed.length >= 2) {
    const averageWindow = Math.round(wakeWindowsUsed.reduce((sum, value) => sum + value, 0) / wakeWindowsUsed.length);
    return `Hoje a janela real media esta em ${formatDuration(averageWindow)} antes das sonecas.`;
  }

  return "Registre tempo para adormecer e humor para o assistente comparar melhor.";
}

function dateAtTime(dateValue, timeValue) {
  const [year, month, day] = String(dateValue || "").split("-").map(Number);
  const [hour, minute] = String(timeValue || "").split(":").map(Number);
  if (!year || !month || !day || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return new Date(year, month - 1, day, hour, minute, 0);
}

function feedingBeforeNapLabel(nap) {
  const start = new Date(nap.start);
  if (Number.isNaN(start.getTime())) return "Não mamou";
  const previousFeeding = state.feedings
    .map((feeding) => ({ ...feeding, atDate: new Date(feeding.at) }))
    .filter((feeding) => !Number.isNaN(feeding.atDate.getTime()) && feeding.atDate <= start)
    .sort((a, b) => b.atDate - a.atDate)[0];
  if (!previousFeeding) return "Não mamou";
  const minutes = Math.max(0, Math.round((start - previousFeeding.atDate) / 60000));
  if (minutes <= 5) return "Mamou imediatamente antes";
  if (minutes <= 20) return "Mamou há 15 min";
  if (minutes <= 45) return "Mamou há 30 min";
  return `Mamou há ${formatDuration(minutes)}`;
}

function sleepDiaryEntry(id) {
  state.sleepDiary = state.sleepDiary || {};
  const entry = state.sleepDiary[id] || {};
  return {
    sleepEndPlace: entry.sleepEndPlace || legacySleepEndPlace(entry.crib),
    cribHelp: entry.cribHelp || "",
    wakeMood: entry.wakeMood || "",
    sleepLatency: Number.isFinite(Number(entry.sleepLatency)) ? String(Number(entry.sleepLatency)) : "",
    helpTypes: Array.isArray(entry.helpTypes) ? entry.helpTypes : [],
    crib: entry.crib || "",
    pacifier: entry.pacifier || "",
    pacifierWake: entry.pacifierWake || "",
    synced: entry.synced === true
  };
}

function handleSleepDiaryOptionClick(event) {
  const button = event.target.closest("[data-diary-value]");
  if (!button) return;

  const id = button.dataset.diaryId;
  const field = button.dataset.diaryField;
  const value = button.dataset.diaryValue;
  if (!id || !field) return;

  state.sleepDiary = state.sleepDiary || {};
  state.sleepDiary[id] = {
    ...sleepDiaryEntry(id),
    [field]: value,
    synced: false
  };
  saveState();
  renderSleepDiary();
  syncSleepDiaryEntryToSheet(id);
}

function handleSleepDiaryChange(event) {
  if (event.target?.dataset?.diaryHelp) {
    handleSleepDiaryHelpChange(event);
    return;
  }

  const field = event.target?.dataset?.diaryField;
  const id = event.target?.dataset?.diaryId;
  if (!field || !id) return;

  state.sleepDiary = state.sleepDiary || {};
  state.sleepDiary[id] = {
    ...sleepDiaryEntry(id),
    [field]: event.target.value,
    synced: false
  };
  saveState();
  renderSleepDiary();
  syncSleepDiaryEntryToSheet(id);
}

function handleSleepDiaryHelpChange(event) {
  const id = event.target?.dataset?.diaryId;
  const value = event.target?.value;
  if (!id || !value) return;

  const entry = sleepDiaryEntry(id);
  const selected = new Set(entry.helpTypes || []);
  if (event.target.checked) {
    selected.add(value);
  } else {
    selected.delete(value);
  }

  state.sleepDiary = state.sleepDiary || {};
  state.sleepDiary[id] = {
    ...entry,
    helpTypes: Array.from(selected),
    synced: false
  };
  saveState();
  renderSleepDiary();
  syncSleepDiaryEntryToSheet(id);
}

function renderSleepDiaryStats(naps) {
  const entries = naps.map((nap) => sleepDiaryEntry(napIdentity(nap)));
  const filledPlace = entries.filter((entry) => entry.sleepEndPlace).length;
  const cribEnd = entries.filter((entry) => entry.sleepEndPlace === "crib-help" || entry.sleepEndPlace === "crib-alone").length;
  const cribHelpYes = entries.filter((entry) => entry.sleepEndPlace === "crib-help").length;
  const cribAlone = entries.filter((entry) => entry.sleepEndPlace === "crib-alone").length;
  const sleepLatencies = entries.map((entry) => Number(entry.sleepLatency)).filter((value) => Number.isFinite(value) && value > 0);
  const avgLatency = sleepLatencies.length ? Math.round(sleepLatencies.reduce((sum, value) => sum + value, 0) / sleepLatencies.length) : 0;
  const pacifierYes = entries.filter((entry) => entry.pacifier === "yes").length;
  const pacifierWakeYes = entries.filter((entry) => entry.pacifierWake === "yes").length;
  const avgDuration = Math.round(naps.reduce((sum, nap) => sum + safeDuration(nap), 0) / naps.length);
  const cribRate = filledPlace ? Math.round((cribEnd / filledPlace) * 100) : 0;

  els.diaryStats.innerHTML = `
    <div><span>Sonecas</span><strong>${naps.length}</strong></div>
    <div><span>Média</span><strong>${formatDuration(avgDuration)}</strong></div>
    <div><span>Terminou no berço</span><strong>${filledPlace ? `${cribRate}%` : "-"}</strong></div>
    <div><span>Berço sozinha</span><strong>${cribAlone}</strong></div>
    <div><span>Tempo p/ dormir</span><strong>${avgLatency ? `${avgLatency}min` : "-"}</strong></div>
    <div><span>Com chupeta</span><strong>${pacifierYes}</strong></div>
    <div><span>Acordou sem chupeta</span><strong>${pacifierWakeYes}</strong></div>
  `;

  els.diaryTips.innerHTML = sleepDiaryTips(naps, entries, avgDuration, cribRate, pacifierYes, pacifierWakeYes, cribHelpYes, cribAlone, avgLatency);
}

function sleepDiaryTips(naps, entries, avgDuration, cribRate, pacifierYes, pacifierWakeYes, cribHelpYes, cribAlone, avgLatency) {
  const shortNaps = naps.filter((nap) => safeDuration(nap) < 35).length;
  const longNaps = naps.filter((nap) => safeDuration(nap) >= 75).length;
  const pacifierNoWake = entries.filter((entry) => entry.pacifier === "yes" && entry.pacifierWake === "no").length;
  const filled = entries.filter((entry) => entry.sleepEndPlace || entry.wakeMood || entry.sleepLatency || entry.helpTypes.length || entry.pacifier || entry.pacifierWake).length;
  const tips = [];

  if (!filled) {
    tips.push("Preencha onde a soneca terminou e se precisou de ajuda no berço para o diário começar a apontar padrões.");
  }
  if (shortNaps) {
    tips.push(`${shortNaps} soneca${shortNaps === 1 ? "" : "s"} curta${shortNaps === 1 ? "" : "s"} hoje. Se ela despertar perto de 30 minutos, tente manter pouca luz, pouco estímulo e ajudar no berço antes de tirar do ambiente de sono.`);
  }
  if (cribAlone) {
    tips.push(`${cribAlone} soneca${cribAlone === 1 ? "" : "s"} já terminou no berço sozinha. Esse é o principal sinal de progresso do treino.`);
  } else if (cribRate >= 70 && filled) {
    tips.push("A maior parte das sonecas já termina no berço. Continue reduzindo o balanço aos poucos e mantenha a mesma sequência antes de cada soneca.");
  } else if (filled) {
    tips.push("A transição ainda está mais no colo. Um bom próximo passo é desacelerar o balanço antes de dormir totalmente e tentar finalizar no berço com apoio.");
  }
  if (cribHelpYes) {
    tips.push(`Ela precisou de ajuda no berço em ${cribHelpYes} soneca${cribHelpYes === 1 ? "" : "s"}. Observe quais ajudas funcionam melhor: mão firme, voz baixa, reposicionar ou pausa curta antes de intervir.`);
  }
  if (avgLatency) {
    tips.push(`Tempo médio para dormir hoje: ${avgLatency} min. Se esse número cair mesmo com sonecas parecidas, também é evolução.`);
  }
  if (pacifierNoWake) {
    tips.push(`A chupeta ajudou a iniciar o sono e ela continuou dormindo quando caiu em ${pacifierNoWake} soneca${pacifierNoWake === 1 ? "" : "s"}. Isso sugere apoio inicial, não dependência forte para manter o sono.`);
  }
  if (pacifierWakeYes) {
    tips.push(`Ela acordou quando a chupeta caiu em ${pacifierWakeYes} soneca${pacifierWakeYes === 1 ? "" : "s"}. Nesses casos, observe se vale recolocar com pouca intervenção ou tentar acalmar primeiro com toque e voz baixa.`);
  }
  if (longNaps) {
    tips.push("Houve soneca com ciclo emendado. Anote o que foi diferente nesse momento para repetir amanhã.");
  }

  return `<strong>Estatísticas e dicas</strong>${tips.map((tip) => `<p>${tip}</p>`).join("")}`;
}

function renderActivities() {
  if (!els.activityList) return;
  const age = currentBabyAgeMonths();
  const group = activityCatalog.find((item) => age >= item.minAge && age <= item.maxAge) || activityCatalog[activityCatalog.length - 1];
  const name = babyDisplayName();
  const ageText = `${age} ${age === 1 ? "mês" : "meses"}`;

  els.activityAgeLabel.textContent = `${name}: ${ageText}. ${safeTummyTimeSuggestionText()}`;
  els.activityList.innerHTML = group.items.map((activity) => `
    <article class="activity-card">
      <div>
        <span>${activity.area}</span>
        <strong>${activity.title}</strong>
      </div>
      <small>${activity.time}</small>
      <p>${activity.description}</p>
    </article>
  `).join("");
}

function safeTummyTimeSuggestionText() {
  try {
    return tummyTimeSuggestionText();
  } catch {
    return "Tummy time: tente blocos curtos quando ela estiver acordada, calma e sem sinais de sono.";
  }
}

function tummyTimeSuggestionText() {
  const suggestions = tummyTimeSuggestions();
  if (!suggestions.length) {
    return "Tummy time: tente blocos curtos quando ela estiver acordada, calma e sem sinais de sono.";
  }
  return `Tummy time sugerido hoje: ${suggestions.join(", ")}. Evite fazer logo depois da mamada ou perto da janela de sono.`;
}

function tummyTimeSuggestions() {
  const candidates = [];
  const addCandidate = (minutes) => {
    const normalized = normalizeDayMinutes(minutes);
    if (!candidates.some((item) => Math.abs(item - normalized) < 25)) candidates.push(normalized);
  };

  const dayStart = safeTimeToMinutes(state.dayStart || state.lastWake, timeToMinutes(DEFAULT_DAY_START));
  addCandidate(dayStart + 35);
  feedingsToday()
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 2)
    .forEach((feeding) => addCandidate(dateToDayMinutes(new Date(feeding.at)) + 25));
  napsToday()
    .slice()
    .sort((a, b) => new Date(b.end) - new Date(a.end))
    .slice(0, 2)
    .forEach((nap) => addCandidate(dateToDayMinutes(new Date(nap.end)) + 20));

  const prediction = calculatePrediction();
  const bedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const now = nowMinutes();
  return candidates
    .filter((minutes) => minutes >= now - 30)
    .filter((minutes) => Math.abs(minutes - prediction.start) > 35 && Math.abs(minutes - prediction.target) > 35)
    .filter((minutes) => minutes < bedtime - 45)
    .sort((a, b) => a - b)
    .slice(0, 3)
    .map(minutesToTime);
}

function renderReport() {
  const days = reportWeekDays(reportWeekStart);
  const activeDays = days.filter((day) => day.napCount || day.daySleep || day.nightSleep || day.feedingCount || day.diaperCount || day.nightAwake);
  const divisor = activeDays.length || 1;
  const avgNapCount = activeDays.reduce((sum, day) => sum + day.napCount, 0) / divisor;
  const avgDaySleep = activeDays.reduce((sum, day) => sum + day.daySleep, 0) / divisor;
  const avgNightSleep = activeDays.reduce((sum, day) => sum + day.nightSleep, 0) / divisor;
  const avgTotalSleep = activeDays.reduce((sum, day) => sum + day.totalSleep, 0) / divisor;
  const avgFeedingCount = activeDays.reduce((sum, day) => sum + day.feedingCount, 0) / divisor;
  const avgDiaperCount = activeDays.reduce((sum, day) => sum + day.diaperCount, 0) / divisor;
  const avgPoopCount = activeDays.reduce((sum, day) => sum + day.poopCount, 0) / divisor;
  const avgPeeOnlyCount = activeDays.reduce((sum, day) => sum + day.peeOnlyCount, 0) / divisor;
  const avgPoopOnlyCount = activeDays.reduce((sum, day) => sum + day.poopOnlyCount, 0) / divisor;
  const avgBothDiaperCount = activeDays.reduce((sum, day) => sum + day.bothDiaperCount, 0) / divisor;
  const avgNightAwake = activeDays.reduce((sum, day) => sum + day.nightAwake, 0) / divisor;
  const avgDayAwake = activeDays.reduce((sum, day) => sum + day.dayAwake, 0) / divisor;
  const wakeWindowDays = activeDays.filter((day) => day.avgWakeWindowUsed);
  const avgWakeWindowReal = wakeWindowDays.reduce((sum, day) => sum + day.avgWakeWindowUsed, 0) / (wakeWindowDays.length || 1);
  const latencyDays = activeDays.filter((day) => day.avgSleepLatency);
  const avgSleepLatencyReport = latencyDays.reduce((sum, day) => sum + day.avgSleepLatency, 0) / (latencyDays.length || 1);
  const lastWindowDays = activeDays.filter((day) => day.lastWindowBeforeNight);
  const avgLastWindowBeforeNight = lastWindowDays.reduce((sum, day) => sum + day.lastWindowBeforeNight, 0) / (lastWindowDays.length || 1);
  const avgNightWakeCount = activeDays.reduce((sum, day) => sum + day.nightWakeCount, 0) / divisor;
  const goalDays = activeDays.filter((day) => day.napGoalPercent);
  const avgNapGoal = goalDays.reduce((sum, day) => sum + day.napGoalPercent, 0) / (goalDays.length || 1);
  const weekEnd = addDays(reportWeekStart, 6);

  els.reportWeekLabel.textContent = `${shortDateLabel(reportWeekStart)} - ${shortDateLabel(weekEnd)}`;
  if (els.reportDate) els.reportDate.value = dateInputValue(reportWeekStart);
  els.avgNapCount.textContent = activeDays.length ? avgNapCount.toFixed(1).replace(".", ",") : "0";
  els.avgDaySleep.textContent = formatDuration(Math.round(avgDaySleep));
  els.avgNightSleep.textContent = formatDuration(Math.round(avgNightSleep));
  els.avgTotalSleep.textContent = formatDuration(Math.round(avgTotalSleep));
  if (els.avgFeedingCount) els.avgFeedingCount.textContent = activeDays.length ? avgFeedingCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgDiaperCount) els.avgDiaperCount.textContent = activeDays.length ? avgDiaperCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgPoopCount) els.avgPoopCount.textContent = activeDays.length ? avgPoopCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgPeeOnlyCount) els.avgPeeOnlyCount.textContent = activeDays.length ? avgPeeOnlyCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgPoopOnlyCount) els.avgPoopOnlyCount.textContent = activeDays.length ? avgPoopOnlyCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgBothDiaperCount) els.avgBothDiaperCount.textContent = activeDays.length ? avgBothDiaperCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgNightAwake) els.avgNightAwake.textContent = formatDuration(Math.round(avgNightAwake));
  if (els.avgDayAwake) els.avgDayAwake.textContent = activeDays.length ? formatDuration(Math.round(avgDayAwake)) : "0h";
  if (els.avgWakeWindowReal) els.avgWakeWindowReal.textContent = wakeWindowDays.length ? formatDuration(Math.round(avgWakeWindowReal)) : "-";
  if (els.avgSleepLatencyReport) els.avgSleepLatencyReport.textContent = latencyDays.length ? `${Math.round(avgSleepLatencyReport)}min` : "-";
  if (els.wakeMoodReport) els.wakeMoodReport.textContent = dominantWakeMoodLabel(activeDays) || "-";
  if (els.avgLastWindowBeforeNight) els.avgLastWindowBeforeNight.textContent = lastWindowDays.length ? formatDuration(Math.round(avgLastWindowBeforeNight)) : "-";
  if (els.avgNightWakeCount) els.avgNightWakeCount.textContent = activeDays.length ? avgNightWakeCount.toFixed(1).replace(".", ",") : "0";
  if (els.avgNapGoal) els.avgNapGoal.textContent = goalDays.length ? `${Math.round(avgNapGoal)}%` : "0%";
  els.reportSummary.textContent = activeDays.length
    ? reportSummaryText(activeDays)
    : "Sem registros suficientes para calcular a media.";

  renderSleepReportChart(days);
}

function reportWeekDays(startDate) {
  const days = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(startDate, offset);
    const key = dateInputValue(date);
    const naps = state.naps.filter((nap) => recordDateInputValue(nap) === key);
    const nights = reportNightsForDay(key);
    const feedings = state.feedings.filter((feeding) => recordDateInputValue({ start: feeding.at }) === key);
    const diapers = state.diapers.filter((diaper) => recordDateInputValue({ start: diaper.at }) === key);
    const peeOnlyCount = diapers.filter((diaper) => diaperTypeKey(diaper.type) === "pee").length;
    const poopOnlyCount = diapers.filter((diaper) => diaperTypeKey(diaper.type) === "poop").length;
    const bothDiaperCount = diapers.filter((diaper) => diaperTypeKey(diaper.type) === "both").length;
    const daySleep = naps.reduce((sum, nap) => sum + safeDuration(nap), 0);
    const nightSleep = nights.reduce((sum, night) => sum + nightDuration(night), 0);
    const nightAwake = nights.reduce((sum, night) => sum + Number(night.awakeDuration || totalAwakeMinutes(night.awakenings || [])), 0);
    const napDurations = naps
      .slice()
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map((nap) => safeDuration(nap));
    const dayWakeCount = naps.length;
    const nightWakeCount = nights.reduce((sum, night) => sum + normalizeAwakenings(night.awakenings || []).length, 0);
    const napGoalPercents = naps.map((nap, index) => {
      const goal = Number(nap.goalDuration) || napGoalMinutesForIndex(index + 1);
      return Number(nap.goalPercent) || napGoalPercent(safeDuration(nap), goal);
    });
    const averageNapGoalPercent = napGoalPercents.length
      ? Math.round(napGoalPercents.reduce((sum, value) => sum + value, 0) / napGoalPercents.length)
      : 0;
    const diaryEntries = naps.map((nap) => sleepDiaryEntry(napIdentity(nap)));
    const wakeWindowsUsed = naps.map(wakeWindowUsedForNap).filter((value) => value > 0);
    const diaryFilled = diaryEntries.filter((entry) => (
      entry.sleepEndPlace || entry.wakeMood || entry.sleepLatency || entry.helpTypes.length || entry.pacifier || entry.pacifierWake
    )).length;
    const cribEnd = diaryEntries.filter((entry) => entry.sleepEndPlace === "crib-help" || entry.sleepEndPlace === "crib-alone").length;
    const cribHelpYes = diaryEntries.filter((entry) => entry.sleepEndPlace === "crib-help").length;
    const cribAlone = diaryEntries.filter((entry) => entry.sleepEndPlace === "crib-alone").length;
    const pacifierYes = diaryEntries.filter((entry) => entry.pacifier === "yes").length;
    const pacifierWakeYes = diaryEntries.filter((entry) => entry.pacifierWake === "yes").length;
    const pacifierNoWake = diaryEntries.filter((entry) => entry.pacifier === "yes" && entry.pacifierWake === "no").length;
    const sleepLatencies = diaryEntries.map((entry) => Number(entry.sleepLatency)).filter((value) => Number.isFinite(value) && value > 0);
    const avgWakeWindowUsed = wakeWindowsUsed.length
      ? Math.round(wakeWindowsUsed.reduce((sum, value) => sum + value, 0) / wakeWindowsUsed.length)
      : 0;
    const avgSleepLatency = sleepLatencies.length
      ? Math.round(sleepLatencies.reduce((sum, value) => sum + value, 0) / sleepLatencies.length)
      : 0;
    const lastWindowBeforeNight = lastWakeWindowBeforeNightForDay(key, naps, nights);
    const dayAwake = dayAwakeMinutesForReportDay(key, naps, nights, daySleep);
    const wakeMoodCounts = countWakeMoods(diaryEntries, naps);

    days.push({
      key,
      label: shortWeekdayLabel(date),
      napCount: naps.length,
      feedingCount: feedings.length,
      diaperCount: diapers.length,
      peeOnlyCount,
      poopOnlyCount,
      bothDiaperCount,
      poopCount: poopOnlyCount + bothDiaperCount,
      feedingInterval: averageFeedingInterval(feedings),
      napGoalPercent: averageNapGoalPercent,
      napDurations,
      diaryFilled,
      cribEnd,
      cribHelpYes,
      cribAlone,
      pacifierYes,
      pacifierWakeYes,
      pacifierNoWake,
      avgWakeWindowUsed,
      avgSleepLatency,
      lastWindowBeforeNight,
      dayAwake,
      wakeMoodCounts,
      dayWakeCount,
      nightWakeCount,
      daySleep,
      nightSleep,
      nightAwake,
      totalSleep: daySleep + nightSleep
    });
  }

  return days;
}

function reportNightsForDay(dayKey) {
  const nights = state.nights
    .filter((night) => recordDateInputValue({ ...night, start: night.end }) === dayKey)
    .map((night) => ({
      ...night,
      startTime: new Date(night.start).getTime(),
      endTime: new Date(night.end).getTime()
    }))
    .filter((night) => Number.isFinite(night.startTime) && Number.isFinite(night.endTime) && night.endTime > night.startTime)
    .sort((a, b) => a.startTime - b.startTime);

  const merged = [];
  nights.forEach((night) => {
    const last = merged[merged.length - 1];
    if (!last || night.startTime >= last.endTime) {
      merged.push(night);
      return;
    }

    const sameWindow = Math.abs(night.startTime - last.startTime) <= 15 * 60000
      && Math.abs(night.endTime - last.endTime) <= 15 * 60000;
    if (sameWindow) {
      const nightHasAwake = hasNightAwakeInfo(night);
      const lastHasAwake = hasNightAwakeInfo(last);
      if ((nightHasAwake && !lastHasAwake) || (nightHasAwake === lastHasAwake && nightDuration(night) < nightDuration(last))) {
        merged[merged.length - 1] = night;
      }
      return;
    }

    if (nightDuration(night) > nightDuration(last)) {
      merged[merged.length - 1] = night;
    }
  });

  return merged;
}

function lastWakeWindowBeforeNightForDay(dayKey, naps, nights) {
  const orderedNaps = naps
    .slice()
    .sort((a, b) => new Date(a.end) - new Date(b.end));
  const night = nightStartingOnDay(dayKey, nights);
  if (!orderedNaps.length || !night) return 0;

  const lastNapEnd = new Date(orderedNaps[orderedNaps.length - 1].end);
  const nightStart = new Date(night.start);
  if (Number.isNaN(lastNapEnd.getTime()) || Number.isNaN(nightStart.getTime()) || nightStart <= lastNapEnd) return 0;
  return Math.round((nightStart - lastNapEnd) / 60000);
}

function nightStartingOnDay(dayKey, fallbackNights = []) {
  const nights = [
    ...fallbackNights,
    ...state.nights.filter((night) => dateInputValue(new Date(night.start)) === dayKey)
  ]
    .filter((night) => !Number.isNaN(new Date(night.start).getTime()))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  return nights[0] || null;
}

function dayAwakeMinutesForReportDay(dayKey, naps, nights, daySleep) {
  const dayStart = dateAtTime(dayKey, state.dayStart || state.lastWake || DEFAULT_DAY_START);
  if (!dayStart) return 0;

  const night = nightStartingOnDay(dayKey, nights);
  const latestNapEnd = naps
    .map((nap) => new Date(nap.end))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0];
  const todayKey = dateInputValue(new Date());
  const fallbackEnd = dayKey === todayKey ? new Date() : latestNapEnd;
  const dayEnd = night ? new Date(night.start) : fallbackEnd;
  if (!dayEnd || Number.isNaN(dayEnd.getTime()) || dayEnd <= dayStart) return 0;
  return Math.max(0, Math.round((dayEnd - dayStart) / 60000) - Math.round(daySleep || 0));
}

function countWakeMoods(entries, naps = []) {
  const counts = {};
  entries.forEach((entry, index) => {
    const mood = entry.wakeMood || naps[index]?.mood || "";
    if (!mood) return;
    counts[mood] = (counts[mood] || 0) + 1;
  });
  return counts;
}

function dominantWakeMoodLabel(days) {
  const totals = {};
  days.forEach((day) => {
    Object.entries(day.wakeMoodCounts || {}).forEach(([mood, count]) => {
      totals[mood] = (totals[mood] || 0) + count;
    });
  });
  const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return winner ? wakeMoodLabel(winner[0]) || moodLabel(winner[0]) : "";
}

function nightDuration(night) {
  const start = new Date(night.start).getTime();
  const end = new Date(night.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const elapsed = Math.round((end - start) / 60000);
  const awake = Number(night.awakeDuration || totalAwakeMinutes(night.awakenings || [])) || 0;
  return clamp(elapsed - awake, 0, 16 * 60);
}

function hasNightAwakeInfo(night) {
  return Number(night.awakeDuration || 0) > 0 || normalizeAwakenings(night.awakenings || []).length > 0;
}

function awakeDurationFromNightNote(note) {
  const match = String(note || "").match(/Acordada na noite:\s*(\d+)min/i);
  return match ? Number(match[1]) : 0;
}

function averageFeedingInterval(feedings) {
  const times = feedings
    .map((feeding) => new Date(feeding.at).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (times.length < 2) return 0;
  const intervals = [];
  for (let index = 1; index < times.length; index += 1) {
    const minutes = Math.round((times[index] - times[index - 1]) / 60000);
    if (minutes > 10 && minutes < 8 * 60) intervals.push(minutes);
  }
  return intervals.length ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length) : 0;
}

function reportSummaryText(activeDays) {
  const feedingDays = activeDays.filter((day) => day.feedingInterval);
  const firstInterval = feedingDays[0]?.feedingInterval || 0;
  const lastInterval = feedingDays[feedingDays.length - 1]?.feedingInterval || 0;
  const pattern = firstInterval && lastInterval
    ? Math.abs(lastInterval - firstInterval) <= 20
      ? ` Mamadas com intervalo est\u00e1vel perto de ${formatDuration(lastInterval)}.`
      : ` Intervalo das mamadas mudou de ${formatDuration(firstInterval)} para ${formatDuration(lastInterval)}.`
    : "";
  const awake = activeDays.reduce((sum, day) => sum + day.nightAwake, 0);
  const awakeText = awake ? ` Acordada \u00e0 noite: ${formatDuration(awake)} no per\u00edodo.` : "";
  const goalDays = activeDays.filter((day) => day.napGoalPercent);
  const goalAverage = goalDays.length
    ? Math.round(goalDays.reduce((sum, day) => sum + day.napGoalPercent, 0) / goalDays.length)
    : 0;
  const goalText = goalDays.length ? ` Meta das sonecas atingida em m\u00e9dia: ${goalAverage}%.` : "";
  const wakeWindowDays = activeDays.filter((day) => day.avgWakeWindowUsed);
  const realWindow = wakeWindowDays.length
    ? Math.round(wakeWindowDays.reduce((sum, day) => sum + day.avgWakeWindowUsed, 0) / wakeWindowDays.length)
    : 0;
  const realWindowText = realWindow ? ` Janela real media antes das sonecas: ${formatDuration(realWindow)}.` : "";
  const latencyDays = activeDays.filter((day) => day.avgSleepLatency);
  const latency = latencyDays.length
    ? Math.round(latencyDays.reduce((sum, day) => sum + day.avgSleepLatency, 0) / latencyDays.length)
    : 0;
  const latencyText = latency ? ` Tempo medio para adormecer: ${latency}min.` : "";
  const mood = dominantWakeMoodLabel(activeDays);
  const moodText = mood ? ` Humor mais comum ao acordar: ${mood}.` : "";
  const dayAwake = activeDays.reduce((sum, day) => sum + day.dayAwake, 0);
  const dayAwakeText = dayAwake ? ` Tempo acordada no dia: ${formatDuration(dayAwake)} no periodo.` : "";
  const lastWindowDays = activeDays.filter((day) => day.lastWindowBeforeNight);
  const lastWindow = lastWindowDays.length
    ? Math.round(lastWindowDays.reduce((sum, day) => sum + day.lastWindowBeforeNight, 0) / lastWindowDays.length)
    : 0;
  const lastWindowText = lastWindow ? ` Ultima janela antes da noite: ${formatDuration(lastWindow)} em media.` : "";
  const nightWakeCount = activeDays.reduce((sum, day) => sum + day.nightWakeCount, 0);
  const nightWakeText = nightWakeCount ? ` Despertares noturnos registrados: ${nightWakeCount}.` : "";
  return `${activeDays.length} dia${activeDays.length === 1 ? "" : "s"} com registro nesta semana.${pattern}${realWindowText}${latencyText}${moodText}${dayAwakeText}${lastWindowText}${nightWakeText}${awakeText}${goalText}`;
}

function handleReportFilterClick(event) {
  const shiftButton = event.target.closest("[data-report-shift]");
  const currentButton = event.target.closest("[data-report-current]");
  if (!shiftButton && !currentButton) return;

  event.preventDefault();
  event.stopPropagation();

  if (shiftButton) {
    shiftReportWeek(Number(shiftButton.dataset.reportShift || 0));
    return;
  }

  reportWeekStart = startOfWeek(new Date());
  renderReport();
}

function handleReportDateChange() {
  const selected = parseDateInputValue(els.reportDate.value);
  if (!selected) return;
  reportWeekStart = startOfWeek(selected);
  renderReport();
}

function shiftReportWeek(direction) {
  reportWeekStart = startOfWeek(addDays(reportWeekStart, direction * 7));
  renderReport();
}

function nearestReportWeek(fromWeekStart, direction) {
  for (let step = 1; step <= 26; step += 1) {
    const candidate = addDays(fromWeekStart, direction * 7 * step);
    if (weekHasReportData(candidate)) return candidate;
  }
  return null;
}

function latestReportWeekWithData() {
  const dates = [
    ...state.naps.map((nap) => new Date(nap.start)),
    ...state.nights.map((night) => new Date(night.end || night.start)),
    ...state.feedings.map((feeding) => new Date(feeding.at)),
    ...state.diapers.map((diaper) => new Date(diaper.at))
  ]
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);
  return dates[0] ? startOfWeek(dates[0]) : null;
}

function weekHasReportData(weekStart) {
  return reportWeekDays(weekStart).some((day) => (
    day.napCount || day.daySleep || day.nightSleep || day.feedingCount || day.diaperCount || day.nightAwake
  ));
}

function renderSleepReportChart(days) {
  if (!els.reportCharts) return;
  els.reportCharts.innerHTML = `
    ${reportTotalSleepChart(days)}
    ${reportNapDurationChart(days)}
    ${reportDiaperChart(days)}
    ${reportSleepDiaryChart(days)}
    ${reportWakeChart(days)}
  `;
  els.sleepReportChart = document.querySelector("#sleepReportChart");
}

function reportTotalSleepChart(days) {
  const width = 640;
  const height = 260;
  const padding = { top: 62, right: 20, bottom: 44, left: 46 };
  const maxValue = Math.max(12 * 60, ...days.flatMap((day) => [day.nightSleep, day.avgWakeWindowUsed]));
  const roundedMax = Math.ceil(maxValue / 120) * 120;
  const maxCount = Math.max(5, ...days.map((day) => day.napCount));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / days.length;
  const nightBarWidth = Math.min(42, groupWidth * 0.44);
  const napBarWidth = Math.min(18, groupWidth * 0.2);
  const baseY = padding.top + plotHeight;
  const scaleHeight = (value) => (value / roundedMax) * plotHeight;
  const scaleCountHeight = (value) => (value / maxCount) * Math.min(80, plotHeight * 0.45);
  const scaleX = (index) => padding.left + groupWidth * index + groupWidth / 2;
  const scaleY = (value) => baseY - scaleHeight(value);
  const windowPath = days.map((day, index) => {
    const value = day.avgWakeWindowUsed || 0;
    return `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleY(value))}`;
  }).join(" ");
  const ticks = [0, Math.round(roundedMax / 2), roundedMax];

  return `
    <svg id="sleepReportChart" class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Sonecas, sono noturno e janelas">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Sonecas, noite e janelas</text>
      <text class="chart-subtitle" x="18" y="40">Barras: sono noturno e quantidade de sonecas. Linha: janela real media.</text>
      <circle class="legend-dot-svg night" cx="350" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="362" y="28">Sono noturno</text>
      <circle class="legend-dot-svg nap" cx="468" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="480" y="28">Sonecas</text>
      <circle class="legend-dot-svg window" cx="548" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="560" y="28">Janela</text>
      ${ticks.map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(baseY - scaleHeight(value))}" x2="${width - padding.right}" y2="${roundSvg(baseY - scaleHeight(value))}"></line><text class="chart-label" x="8" y="${roundSvg(baseY - scaleHeight(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
      ${days.map((day, index) => {
        const center = scaleX(index);
        const nightX = center - nightBarWidth - 2;
        const napX = center + 4;
        const nightHeight = scaleHeight(day.nightSleep);
        const napHeight = scaleCountHeight(day.napCount);
        return `
          ${day.nightSleep ? `
            <rect class="chart-bar total-night" x="${roundSvg(nightX)}" y="${roundSvg(baseY - nightHeight)}" width="${roundSvg(nightBarWidth)}" height="${roundSvg(nightHeight)}" rx="5"></rect>
            <text class="chart-total-value" x="${roundSvg(nightX + nightBarWidth / 2)}" y="${roundSvg(Math.max(padding.top + 12, baseY - nightHeight - 8))}">${formatDuration(day.nightSleep)}</text>
          ` : `
            <rect class="chart-empty-day" x="${roundSvg(nightX)}" y="${roundSvg(baseY - 4)}" width="${roundSvg(nightBarWidth)}" height="4" rx="2"></rect>
          `}
          ${day.napCount ? `
            <rect class="chart-bar nap-count" x="${roundSvg(napX)}" y="${roundSvg(baseY - napHeight)}" width="${roundSvg(napBarWidth)}" height="${roundSvg(napHeight)}" rx="3"></rect>
            <text class="chart-total-value" x="${roundSvg(napX + napBarWidth / 2)}" y="${roundSvg(baseY - napHeight - 6)}">${day.napCount}</text>
          ` : ""}
          <text class="chart-label x" x="${roundSvg(center)}" y="${height - 14}">${day.label}</text>
        `;
      }).join("")}
      <path class="chart-line window" d="${windowPath}"></path>
      ${days.map((day, index) => day.avgWakeWindowUsed ? `<circle class="chart-point window" cx="${roundSvg(scaleX(index))}" cy="${roundSvg(scaleY(day.avgWakeWindowUsed))}" r="3"></circle>` : "").join("")}
    </svg>`;
}

function reportLineChart(title, days, selector, typeClass, subtitle = "") {
  const width = 640;
  const height = 230;
  const padding = { top: 42, right: 18, bottom: 34, left: 46 };
  const values = days.map(selector);
  const maxValue = Math.max(60, ...values);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const path = values.map((value, index) => `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleY(value))}`).join(" ");
  const ticks = [0, Math.round(maxValue / 2), maxValue];
  return `
    <svg id="sleepReportChart" class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">${title}</text>
      ${subtitle ? `<text class="chart-subtitle" x="18" y="39">${subtitle}</text>` : ""}
      ${ticks.map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="8" y="${roundSvg(scaleY(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
      <path class="chart-line ${typeClass}" d="${path}"></path>
      ${values.map((value, index) => value ? `<circle class="chart-point ${typeClass}" cx="${roundSvg(scaleX(index))}" cy="${roundSvg(scaleY(value))}" r="3"></circle>` : "").join("")}
      ${days.map((day, index) => `<text class="chart-label x" x="${roundSvg(scaleX(index))}" y="${height - 10}">${day.label}</text>`).join("")}
    </svg>`;
}

function reportNapDurationChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 42, right: 18, bottom: 34, left: 46 };
  const allDurations = days.flatMap((day) => day.napDurations || []);
  const maxValue = Math.max(60, ...allDurations);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const barWidth = 7;
  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Duração das sonecas do dia">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Duração das sonecas</text>
      <text class="chart-subtitle" x="18" y="39">Cada barra é uma soneca registrada no dia.</text>
      ${[0, Math.round(maxValue / 2), maxValue].map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="8" y="${roundSvg(scaleY(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
      ${days.map((day, dayIndex) => (day.napDurations || []).map((duration, napIndex) => {
        const x = scaleX(dayIndex) - ((day.napDurations.length - 1) * (barWidth + 2) / 2) + napIndex * (barWidth + 2);
        const y = scaleY(duration);
        return `<rect class="chart-bar nap-duration" x="${roundSvg(x)}" y="${roundSvg(y)}" width="${barWidth}" height="${roundSvg(padding.top + plotHeight - y)}" rx="3"></rect>`;
      }).join("")).join("")}
      ${days.map((day, index) => `<text class="chart-label x" x="${roundSvg(scaleX(index))}" y="${height - 10}">${day.label}</text>`).join("")}
    </svg>`;
}

function reportDiaperChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 48, right: 18, bottom: 34, left: 38 };
  const maxValue = Math.max(1, ...days.flatMap((day) => [day.peeOnlyCount, day.poopOnlyCount, day.bothDiaperCount]));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / days.length;
  const barWidth = Math.min(12, groupWidth / 5);
  const baseY = padding.top + plotHeight;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;

  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trocas de fralda na semana">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Trocas de fralda</text>
      <text class="chart-subtitle" x="18" y="40">Quantidade por tipo de troca: xixi, cocô e xixi+cocô.</text>
      <circle class="legend-dot-svg pee" cx="330" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="342" y="28">Xixi</text>
      <circle class="legend-dot-svg poop" cx="394" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="406" y="28">Cocô</text>
      <circle class="legend-dot-svg both-diaper" cx="462" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="474" y="28">Xixi+cocô</text>
      ${[0, Math.ceil(maxValue / 2), maxValue].map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="16" y="${roundSvg(scaleY(value) + 4)}">${value}</text></g>`).join("")}
      ${days.map((day, index) => {
        const center = padding.left + groupWidth * index + groupWidth / 2;
        const bars = [
          { value: day.peeOnlyCount, className: "pee-count", offset: -barWidth - 3 },
          { value: day.poopOnlyCount, className: "poop-count", offset: 0 },
          { value: day.bothDiaperCount, className: "both-diaper-count", offset: barWidth + 3 }
        ];
        return `
          ${bars.map((bar) => {
            const y = scaleY(bar.value);
            return `<rect class="chart-bar ${bar.className}" x="${roundSvg(center + bar.offset - barWidth / 2)}" y="${roundSvg(y)}" width="${roundSvg(barWidth)}" height="${roundSvg(baseY - y)}" rx="3"></rect>`;
          }).join("")}
          <text class="chart-label x" x="${roundSvg(center)}" y="${height - 10}">${day.label}</text>
        `;
      }).join("")}
    </svg>`;
}

function reportSleepDiaryChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 48, right: 18, bottom: 34, left: 38 };
  const maxValue = Math.max(1, ...days.flatMap((day) => [day.napCount - day.cribEnd, day.cribHelpYes, day.cribAlone]));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / days.length;
  const barWidth = Math.min(12, groupWidth / 5);
  const baseY = padding.top + plotHeight;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;

  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Diário do sono na semana">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Diário do sono</text>
      <text class="chart-subtitle" x="18" y="40">Migração de colo para berço com ajuda e berço sozinha.</text>
      <circle class="legend-dot-svg lap" cx="338" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="350" y="28">Colo</text>
      <circle class="legend-dot-svg crib-help" cx="398" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="410" y="28">Berço ajuda</text>
      <circle class="legend-dot-svg crib" cx="510" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="522" y="28">Sozinha</text>
      ${[0, Math.ceil(maxValue / 2), maxValue].map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="16" y="${roundSvg(scaleY(value) + 4)}">${value}</text></g>`).join("")}
      ${days.map((day, index) => {
        const center = padding.left + groupWidth * index + groupWidth / 2;
        const lapCount = Math.max(0, day.napCount - day.cribEnd);
        const bars = [
          { value: lapCount, className: "diary-lap", offset: -barWidth - 3 },
          { value: day.cribHelpYes, className: "diary-crib-help", offset: 0 },
          { value: day.cribAlone, className: "diary-crib", offset: barWidth + 3 }
        ];
        return `
          ${bars.map((bar) => {
            const y = scaleY(bar.value);
            return `<rect class="chart-bar ${bar.className}" x="${roundSvg(center + bar.offset - barWidth / 2)}" y="${roundSvg(y)}" width="${roundSvg(barWidth)}" height="${roundSvg(baseY - y)}" rx="3"></rect>`;
          }).join("")}
          <text class="chart-label x" x="${roundSvg(center)}" y="${height - 10}">${day.label}</text>
        `;
      }).join("")}
    </svg>`;
}

function reportDistributionChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 42, right: 18, bottom: 34, left: 46 };
  const maxValue = Math.max(60, ...days.map((day) => day.totalSleep));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const barWidth = 22;
  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribuição do sono durante o dia">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Distribuição do sono</text>
      <text class="chart-subtitle" x="18" y="39">Sonecas + sono noturno por dia da semana.</text>
      ${[0, Math.round(maxValue / 2), maxValue].map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="8" y="${roundSvg(scaleY(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
      ${days.map((day, index) => {
        const x = scaleX(index) - barWidth / 2;
        const nightY = scaleY(day.nightSleep);
        const dayY = scaleY(day.totalSleep);
        const base = padding.top + plotHeight;
        return `
          <rect class="chart-bar night-stack" x="${roundSvg(x)}" y="${roundSvg(nightY)}" width="${barWidth}" height="${roundSvg(base - nightY)}" rx="4"></rect>
          <rect class="chart-bar day-stack" x="${roundSvg(x)}" y="${roundSvg(dayY)}" width="${barWidth}" height="${roundSvg(nightY - dayY)}" rx="4"></rect>
        `;
      }).join("")}
      ${days.map((day, index) => `<text class="chart-label x" x="${roundSvg(scaleX(index))}" y="${height - 10}">${day.label}</text>`).join("")}
    </svg>`;
}

function reportDistributionChart(days) {
  const width = 640;
  const height = 230;
  const daySleep = days.reduce((sum, day) => sum + day.daySleep, 0);
  const nightSleep = days.reduce((sum, day) => sum + day.nightSleep, 0);
  const total = Math.max(1, daySleep + nightSleep);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const dayLength = circumference * (daySleep / total);
  const nightLength = circumference - dayLength;
  const dayPercent = Math.round((daySleep / total) * 100);
  const nightPercent = 100 - dayPercent;

  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribuicao do sono durante o dia">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Distribuicao do sono</text>
      <text class="chart-subtitle" x="18" y="39">Rosca da semana: sonecas x sono noturno.</text>
      <g transform="translate(168 124) rotate(-90)">
        <circle class="donut-bg" cx="0" cy="0" r="${radius}"></circle>
        <circle class="donut-segment night" cx="0" cy="0" r="${radius}" stroke-dasharray="${roundSvg(nightLength)} ${roundSvg(circumference - nightLength)}" stroke-dashoffset="0"></circle>
        <circle class="donut-segment day" cx="0" cy="0" r="${radius}" stroke-dasharray="${roundSvg(dayLength)} ${roundSvg(circumference - dayLength)}" stroke-dashoffset="${roundSvg(-nightLength)}"></circle>
      </g>
      <text class="donut-total" x="168" y="116" text-anchor="middle">${formatDuration(total)}</text>
      <text class="chart-subtitle" x="168" y="136" text-anchor="middle">sono total</text>
      <circle class="legend-dot-svg day" cx="318" cy="88" r="5"></circle>
      <text class="chart-label" x="332" y="92">Sonecas: ${formatDuration(daySleep)} (${dayPercent}%)</text>
      <circle class="legend-dot-svg night" cx="318" cy="126" r="5"></circle>
      <text class="chart-label" x="332" y="130">Sono noturno: ${formatDuration(nightSleep)} (${nightPercent}%)</text>
    </svg>`;
}

function reportDistributionChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 58, right: 20, bottom: 42, left: 46 };
  const maxValue = Math.max(12 * 60, ...days.map((day) => day.totalSleep));
  const roundedMax = Math.ceil(maxValue / 120) * 120;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / days.length;
  const barWidth = Math.min(38, groupWidth * 0.55);
  const baseY = padding.top + plotHeight;
  const scaleHeight = (value) => (value / roundedMax) * plotHeight;
  const ticks = [0, Math.round(roundedMax / 2), roundedMax];

  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribuicao do sono por dia da semana">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Distribuicao do sono</text>
      <text class="chart-subtitle" x="18" y="40">Por dia da semana selecionada: sono noturno + sonecas.</text>
      <circle class="legend-dot-svg night" cx="398" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="410" y="28">Noite</text>
      <circle class="legend-dot-svg day" cx="470" cy="24" r="5"></circle>
      <text class="chart-legend-label" x="482" y="28">Sonecas</text>
      ${ticks.map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(baseY - scaleHeight(value))}" x2="${width - padding.right}" y2="${roundSvg(baseY - scaleHeight(value))}"></line><text class="chart-label" x="8" y="${roundSvg(baseY - scaleHeight(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
      ${days.map((day, index) => {
        const x = padding.left + groupWidth * index + (groupWidth - barWidth) / 2;
        const nightHeight = scaleHeight(day.nightSleep);
        const dayHeight = scaleHeight(day.daySleep);
        const totalHeight = nightHeight + dayHeight;
        return `
          ${day.totalSleep ? `
            <rect class="chart-bar night-stack" x="${roundSvg(x)}" y="${roundSvg(baseY - nightHeight)}" width="${roundSvg(barWidth)}" height="${roundSvg(nightHeight)}" rx="5"></rect>
            <rect class="chart-bar day-stack" x="${roundSvg(x)}" y="${roundSvg(baseY - totalHeight)}" width="${roundSvg(barWidth)}" height="${roundSvg(dayHeight)}" rx="5"></rect>
          ` : `<rect class="chart-empty-day" x="${roundSvg(x)}" y="${roundSvg(baseY - 4)}" width="${roundSvg(barWidth)}" height="4" rx="2"></rect>`}
          <text class="chart-label x" x="${roundSvg(x + barWidth / 2)}" y="${height - 14}">${day.label}</text>
        `;
      }).join("")}
    </svg>`;
}

function reportWakeChart(days) {
  const width = 640;
  const height = 230;
  const padding = { top: 42, right: 18, bottom: 34, left: 46 };
  const maxValue = Math.max(1, ...days.flatMap((day) => [day.dayWakeCount, day.nightWakeCount]));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const pathFor = (selector) => days.map((day, index) => `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleY(selector(day)))}`).join(" ");
  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Despertares diurnos e noturnos">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <text class="chart-title" x="18" y="24">Despertares</text>
      <text class="chart-subtitle" x="18" y="39">Diurno considera fim de sonecas; noturno considera pausas acordada.</text>
      ${[0, Math.ceil(maxValue / 2), maxValue].map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="18" y="${roundSvg(scaleY(value) + 4)}">${value}</text></g>`).join("")}
      <path class="chart-line day" d="${pathFor((day) => day.dayWakeCount)}"></path>
      <path class="chart-line awake" d="${pathFor((day) => day.nightWakeCount)}"></path>
      ${days.map((day, index) => `<text class="chart-label x" x="${roundSvg(scaleX(index))}" y="${height - 10}">${day.label}</text>`).join("")}
    </svg>`;
}

function renderLegacySleepReportChart(days) {
  if (!els.sleepReportChart) return;

  const width = 640;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(60, ...days.flatMap((day) => [day.daySleep, day.nightSleep, day.totalSleep, day.nightAwake]));
  const maxCount = Math.max(1, ...days.flatMap((day) => [day.napCount, day.feedingCount]));
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const scaleCountY = (value) => padding.top + plotHeight - (value / maxCount) * Math.min(90, plotHeight * 0.46);
  const scaleX = (index) => padding.left + (days.length <= 1 ? 0 : (index / (days.length - 1)) * plotWidth);
  const pathFor = (selector) => days.map((day, index) => `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleY(selector(day)))}`).join(" ");
  const countPathFor = (selector) => days.map((day, index) => `${index === 0 ? "M" : "L"} ${roundSvg(scaleX(index))} ${roundSvg(scaleCountY(selector(day)))}`).join(" ");
  const tickValues = [0, Math.round(maxValue / 2), maxValue];
  const labelIndexes = [0, Math.floor((days.length - 1) / 2), days.length - 1];
  const barWidth = 10;

  els.sleepReportChart.innerHTML = `
    <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
    ${tickValues.map((value) => `<g><line class="chart-grid" x1="${padding.left}" y1="${roundSvg(scaleY(value))}" x2="${width - padding.right}" y2="${roundSvg(scaleY(value))}"></line><text class="chart-label" x="8" y="${roundSvg(scaleY(value) + 4)}">${formatDuration(value)}</text></g>`).join("")}
    ${days.map((day, index) => `<rect class="chart-bar nap-count" x="${roundSvg(scaleX(index) - barWidth - 1)}" y="${roundSvg(scaleCountY(day.napCount))}" width="${barWidth}" height="${roundSvg(padding.top + plotHeight - scaleCountY(day.napCount))}" rx="3"></rect>`).join("")}
    ${days.map((day, index) => `<rect class="chart-bar feed-count" x="${roundSvg(scaleX(index) + 1)}" y="${roundSvg(scaleCountY(day.feedingCount))}" width="${barWidth}" height="${roundSvg(padding.top + plotHeight - scaleCountY(day.feedingCount))}" rx="3"></rect>`).join("")}
    <path class="chart-line day" d="${pathFor((day) => day.daySleep)}"></path>
    <path class="chart-line night" d="${pathFor((day) => day.nightSleep)}"></path>
    <path class="chart-line total" d="${pathFor((day) => day.totalSleep)}"></path>
    <path class="chart-line awake" d="${pathFor((day) => day.nightAwake)}"></path>
    <path class="chart-line feed" d="${countPathFor((day) => day.feedingCount)}"></path>
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

function newNapId(startedAt = new Date()) {
  const time = Number.isNaN(new Date(startedAt).getTime()) ? Date.now() : new Date(startedAt).getTime();
  return `${time}-${Math.random().toString(36).slice(2, 8)}`;
}

function newNightId(startedAt = new Date()) {
  const time = Number.isNaN(new Date(startedAt).getTime()) ? Date.now() : new Date(startedAt).getTime();
  return `night-${time}-${Math.random().toString(36).slice(2, 8)}`;
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

function activeSessionPayload() {
  if (state.activeNapStart) {
    if (!state.activeNapResumeId) state.activeNapResumeId = newNapId(new Date(state.activeNapStart));
    return {
      id: state.activeNapResumeId,
      type: "nap",
      start: state.activeNapStart,
      babyName: state.babyName || "",
      babyAge: currentBabyAgeMonths()
    };
  }

  if (state.activeNightStart) {
    if (!state.activeNightId) state.activeNightId = newNightId(new Date(state.activeNightStart));
    return {
      id: state.activeNightId,
      type: "night",
      start: state.activeNightStart,
      babyName: state.babyName || "",
      babyAge: currentBabyAgeMonths(),
      nightAwakeStart: state.activeNightAwakeStart || "",
      awakenings: normalizeAwakenings(state.activeNightAwakenings || [])
    };
  }

  return null;
}

async function syncActiveSessionToSheet() {
  if (!SHEETS_WEB_APP_URL) return;
  const session = activeSessionPayload();
  if (!session) return;
  lastActiveSessionWriteAt = Date.now();
  saveState();

  try {
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: SHEETS_SHARED_TOKEN,
        action: "setActiveSession",
        ...session
      })
    });
    const result = await response.json();
    activeSessionSheetSupport = Boolean(result.ok && result.activeSessionSupported);
  } catch {
    activeSessionSheetSupport = false;
  }
}

async function clearActiveSessionFromSheet(id = "") {
  if (!SHEETS_WEB_APP_URL) return;
  lastActiveSessionWriteAt = Date.now();

  try {
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: SHEETS_SHARED_TOKEN,
        action: "clearActiveSession",
        id
      })
    });
    const result = await response.json();
    activeSessionSheetSupport = Boolean(result.ok && result.activeSessionSupported);
  } catch {
    activeSessionSheetSupport = false;
  }
}

function rememberClosedActiveSession(id) {
  if (!id) return;
  recentlyClosedActiveSessions.set(String(id), Date.now());
  pruneClosedActiveSessions();
}

function wasRecentlyClosedActiveSession(id) {
  if (!id) return false;
  pruneClosedActiveSessions();
  return recentlyClosedActiveSessions.has(String(id));
}

function pruneClosedActiveSessions() {
  const now = Date.now();
  recentlyClosedActiveSessions.forEach((closedAt, id) => {
    if (now - closedAt > ACTIVE_SESSION_CLEAR_GRACE_MS) {
      recentlyClosedActiveSessions.delete(id);
    }
  });
}

async function loadActiveSessionFromSheet() {
  if (!SHEETS_WEB_APP_URL || activeSessionPollInFlight) return;
  activeSessionPollInFlight = true;

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=getActiveSession&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar timer ativo.");
    if (!result.activeSessionSupported) return;
    activeSessionSheetSupport = true;

    if (result.session) {
      if (completedSessionExists(result.session.id)) {
        rememberClosedActiveSession(result.session.id);
        clearActiveSessionFromSheet(result.session.id);
        return;
      }
      if (isStaleActiveSession(result.session)) {
        clearActiveSessionFromSheet(result.session.id);
        if (state.activeNapResumeId === result.session.id || state.activeNightId === result.session.id) {
          clearLocalActiveSession("Timer antigo removido da aba Ativo.");
        }
        return;
      }
      if (wasRecentlyClosedActiveSession(result.session.id)) {
        clearActiveSessionFromSheet(result.session.id);
        return;
      }
      applyRemoteActiveSession(result.session);
      return;
    }

    if ((state.activeNapStart || state.activeNightStart) && Date.now() - lastActiveSessionWriteAt > 5000) {
      clearLocalActiveSession("Timer encerrado em outro aparelho.");
    }
  } catch {
    if (activeSessionSheetSupport === null) activeSessionSheetSupport = false;
  } finally {
    activeSessionPollInFlight = false;
  }
}

function applyRemoteActiveSession(session) {
  const startedAt = new Date(session.start);
  if (!session.id || Number.isNaN(startedAt.getTime())) return;
  if (completedSessionExists(session.id)) {
    rememberClosedActiveSession(session.id);
    clearActiveSessionFromSheet(session.id);
    return;
  }
  if (isStaleActiveSession(session)) {
    clearActiveSessionFromSheet(session.id);
    return;
  }
  if (wasRecentlyClosedActiveSession(session.id)) {
    clearActiveSessionFromSheet(session.id);
    return;
  }

  const type = session.type === "night" ? "night" : "nap";
  const sameNap = type === "nap" && state.activeNapStart && state.activeNapResumeId === session.id;
  const sameNight = type === "night" && state.activeNightStart && state.activeNightId === session.id;
  if (sameNap) return;

  if (type === "nap") {
    state.activeNapAttemptStart = null;
    state.activeNapStart = startedAt.toISOString();
    state.activeNapResumeId = String(session.id);
    state.activeNightStart = null;
    state.activeNightId = null;
    state.activeNightAwakeStart = null;
    state.activeNightAwakenings = [];
    clearNotificationTimers();
    scheduleActiveNapNotifications();
  } else {
    const remoteAwakeStart = session.nightAwakeStart ? new Date(session.nightAwakeStart) : null;
    state.activeNightStart = startedAt.toISOString();
    state.activeNightId = String(session.id);
    state.activeNightAwakeStart = remoteAwakeStart && !Number.isNaN(remoteAwakeStart.getTime()) ? remoteAwakeStart.toISOString() : null;
    state.activeNightAwakenings = normalizeAwakenings(session.awakenings || []);
    if (!sameNight) {
      state.activeNapStart = null;
      state.activeNapResumeId = null;
      clearNotificationTimers();
      syncRemoteNotificationScheduleAbsolute([]);
    }
  }

  if (session.babyName && !state.babyName) state.babyName = session.babyName;
  saveState();
  hydrateForm();
  render();
}

function isStaleActiveSession(session) {
  const startedAt = new Date(session?.start);
  if (Number.isNaN(startedAt.getTime())) return true;
  const age = Date.now() - startedAt.getTime();
  if (session.type === "night") return age > ACTIVE_NIGHT_MAX_AGE_MS;
  return age > ACTIVE_NAP_MAX_AGE_MS;
}

function completedSessionExists(id) {
  if (!id) return false;
  const key = String(id);
  return state.naps.some((nap) => String(nap.id || napIdentity(nap)) === key)
    || state.nights.some((night) => String(night.id || napIdentity(night)) === key);
}

function clearLocalActiveSession(message = "") {
  state.activeNapAttemptStart = null;
  state.activeNapStart = null;
  state.activeNapResumeId = null;
  state.activeNightStart = null;
  state.activeNightId = null;
  state.activeNightAwakeStart = null;
  state.activeNightAwakenings = [];
  clearNotificationTimers();
  saveState();
  scheduleUpcomingNotifications();
  if (message) setHint(message);
  render();
}

async function syncFromSheetThenPending() {
  const [sleepLoad, feedingLoad, diaryLoad, diaperLoad] = await Promise.allSettled([
    loadNapsFromSheet({ deferRender: true }),
    loadFeedingsFromSheet({ deferRender: true }),
    loadSleepDiaryFromSheet({ deferRender: true }),
    loadDiapersFromSheet({ deferRender: true })
  ]);

  const loadedSleep = sleepLoad.status === "fulfilled" ? sleepLoad.value : null;
  const loadedFeedings = feedingLoad.status === "fulfilled" ? feedingLoad.value : null;
  const loadedDiary = diaryLoad.status === "fulfilled" ? diaryLoad.value : null;
  const loadedDiapers = diaperLoad.status === "fulfilled" ? diaperLoad.value : null;
  const loadedCount = (loadedSleep?.count || 0) + (loadedFeedings?.count || 0) + (loadedDiary?.count || 0) + (loadedDiapers?.count || 0);
  const errors = [loadedSleep, loadedFeedings, loadedDiary, loadedDiapers]
    .filter((result) => result && result.error)
    .map((result) => result.error);

  if (loadedCount || loadedSleep?.changed || loadedFeedings?.changed || loadedDiary?.changed || loadedDiapers?.changed) {
    saveState();
    render();
  }

  if (errors.length) {
    setHint(errors.join(" "));
  } else if (loadedCount) {
    setHint(`Google Sheets carregado: ${loadedCount} registro(s) encontrados.`);
  }

  await Promise.allSettled([
    syncPendingNapsToSheet(),
    syncPendingFeedingsToSheet(),
    syncPendingSleepDiaryToSheet(),
    syncPendingDiapersToSheet()
  ]);
}

async function loadNapsFromSheet(options = {}) {
  const { deferRender = false } = options;
  if (!SHEETS_WEB_APP_URL) return { count: 0, changed: false };

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

    const hadLocalSynced = state.naps.some((nap) => nap.synced) || state.nights.some((night) => night.synced);

    mergeNaps(remoteNaps);
    mergeNights(remoteNights);
    if (!deferRender) {
      saveState();
      render();
      setHint(`Google Sheets carregado: ${remoteNaps.length + remoteNights.length} registro(s) encontrados.`);
    }
    return { count: remoteNaps.length + remoteNights.length, changed: hadLocalSynced || Boolean(remoteNaps.length || remoteNights.length) };
  } catch (error) {
    const message = `Não consegui carregar o Google Sheets: ${error.message}`;
    if (!deferRender) setHint(message);
    return { count: 0, changed: false, error: message };
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
  const awakeDuration = Number(record.awakeDuration || awakeDurationFromNightNote(record.note));
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
    awakeDuration,
    duration: nightDuration({
      ...record,
      start: startedAt.toISOString(),
      end: endedAt.toISOString(),
      awakeDuration
    }),
    mood: "",
    synced: true
  };
}

async function loadFeedingsFromSheet(options = {}) {
  const { deferRender = false } = options;
  if (!SHEETS_WEB_APP_URL) return { count: 0, changed: false };

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listFeedings&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar mamadas.");
    if (!Array.isArray(result.records)) {
      feedingSheetSupport = false;
      return { count: 0, changed: false };
    }
    feedingSheetSupport = true;

    const remoteFeedings = (result.records || [])
      .map(sheetRecordToFeeding)
      .filter(Boolean);

    const hadLocalSynced = state.feedings.some((feeding) => feeding.synced);

    mergeFeedings(remoteFeedings);
    if (!deferRender) {
      saveState();
      render();
      setHint(`Google Sheets carregado: ${remoteFeedings.length} mamada(s) encontrada(s).`);
    }
    return { count: remoteFeedings.length, changed: hadLocalSynced || Boolean(remoteFeedings.length) };
  } catch (error) {
    const message = `Nao consegui carregar as mamadas do Google Sheets: ${error.message}`;
    if (!deferRender) setHint(message);
    return { count: 0, changed: false, error: message };
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

async function loadDiapersFromSheet(options = {}) {
  const { deferRender = false } = options;
  if (!SHEETS_WEB_APP_URL) return { count: 0, changed: false };

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listDiapers&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar fraldas.");
    if (!Array.isArray(result.records)) {
      diaperSheetSupport = false;
      return { count: 0, changed: false };
    }
    diaperSheetSupport = true;

    const remoteDiapers = (result.records || [])
      .map(sheetRecordToDiaper)
      .filter(Boolean);

    const hadLocalSynced = state.diapers.some((diaper) => diaper.synced);
    mergeDiapers(remoteDiapers);
    if (!deferRender) {
      saveState();
      render();
      setHint(`Google Sheets carregado: ${remoteDiapers.length} troca(s) encontrada(s).`);
    }
    return { count: remoteDiapers.length, changed: hadLocalSynced || Boolean(remoteDiapers.length) };
  } catch (error) {
    const message = `Nao consegui carregar as fraldas do Google Sheets: ${error.message}`;
    if (!deferRender) setHint(message);
    return { count: 0, changed: false, error: message };
  }
}

function sheetRecordToDiaper(record) {
  if (!record.id || !record.at) return null;
  const changedAt = new Date(record.at);
  if (Number.isNaN(changedAt.getTime())) return null;
  return {
    id: String(record.id),
    babyName: record.babyName || "",
    babyAge: Number(record.babyAge || 0),
    at: changedAt.toISOString(),
    type: diaperTypeKey(record.type),
    dayStart: normalizeTimeField(record.dayStart),
    synced: true
  };
}

async function loadSleepDiaryFromSheet(options = {}) {
  const { deferRender = false } = options;
  if (!SHEETS_WEB_APP_URL) return { count: 0, changed: false };

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listSleepDiary&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar diário do sono.");
    if (!Array.isArray(result.records)) {
      sleepDiarySheetSupport = false;
      return { count: 0, changed: false };
    }
    sleepDiarySheetSupport = true;

    const remoteEntries = (result.records || [])
      .map(sheetRecordToSleepDiary)
      .filter(Boolean);

    const hadLocalUnsynced = Object.values(state.sleepDiary || {}).some((entry) => entry && entry.synced === false);
    mergeSleepDiary(remoteEntries);
    if (!deferRender) {
      saveState();
      render();
      setHint(`Google Sheets carregado: ${remoteEntries.length} entrada(s) do diário encontrada(s).`);
    }
    return { count: remoteEntries.length, changed: hadLocalUnsynced || Boolean(remoteEntries.length) };
  } catch (error) {
    const message = `Nao consegui carregar o diario do sono do Google Sheets: ${error.message}`;
    if (!deferRender) setHint(message);
    return { count: 0, changed: false, error: message };
  }
}

function sheetRecordToSleepDiary(record) {
  if (!record.napId && !record.id) return null;
  const id = String(record.napId || record.id);
  return {
    id,
    sleepEndPlace: sleepEndPlaceKey(record.sleepEndPlace),
    crib: yesNoKey(record.crib),
    cribHelp: yesNoKey(record.cribHelp),
    wakeMood: wakeMoodKey(record.wakeMood),
    sleepLatency: Number.isFinite(Number(record.sleepLatency)) && Number(record.sleepLatency) > 0 ? String(Number(record.sleepLatency)) : "",
    helpTypes: helpTypesFromLabel(record.helpTypes),
    feedingBeforeNap: record.feedingBeforeNap || "",
    pacifier: yesNoKey(record.pacifier),
    pacifierWake: yesNoKey(record.pacifierWake),
    synced: true
  };
}

function sleepEndPlaceKey(value) {
  const text = String(value || "").toLowerCase();
  if (text === "berço (com ajuda)" || text === "berco (com ajuda)" || text === "crib-help") return "crib-help";
  if (text === "berço (sozinha)" || text === "berco (sozinha)" || text === "crib-alone") return "crib-alone";
  if (text === "berço" || text === "berco" || text === "crib" || text === "sim" || text === "yes") return "crib-help";
  if (text === "colo" || text === "lap" || text === "não" || text === "nao" || text === "no") return "lap";
  return "";
}

function wakeMoodKey(value) {
  const text = String(value || "").toLowerCase();
  if (text === "feliz" || text === "happy") return "happy";
  if (text === "calma" || text === "calm") return "calm";
  if (text === "irritada" || text === "upset") return "upset";
  if (text === "chorando" || text === "crying") return "crying";
  return "";
}

function helpTypesFromLabel(value) {
  if (Array.isArray(value)) return normalizeHelpTypes(value);
  const text = String(value || "").toLowerCase();
  if (!text) return [];
  const selected = [];
  if (text.includes("colo") || text.includes("lap")) selected.push("lap");
  if (text.includes("balanço") || text.includes("balanco") || text.includes("rocking")) selected.push("rocking");
  if (text.includes("mão no peito") || text.includes("mao no peito") || text.includes("chest-hand")) selected.push("chest-hand");
  if (text.includes("chupeta") || text.includes("pacifier")) selected.push("pacifier");
  if (text.includes("voz") || text.includes("voice")) selected.push("voice");
  if (text.includes("shhhh") || text.includes("shush")) selected.push("shush");
  return selected;
}

function yesNoKey(value) {
  const text = String(value || "").toLowerCase();
  if (text === "yes" || text === "sim") return "yes";
  if (text === "no" || text === "nao" || text === "não") return "no";
  return "";
}

function mergeNaps(remoteNaps) {
  const byId = new Map();
  state.naps
    .filter((nap) => !nap.synced)
    .forEach((nap) => byId.set(String(nap.id || napIdentity(nap)), nap));
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
  state.nights
    .filter((night) => !night.synced)
    .forEach((night) => byId.set(String(night.id || napIdentity(night)), night));
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
  state.feedings
    .filter((feeding) => !feeding.synced)
    .forEach((feeding) => byId.set(String(feeding.id || feedingIdentity(feeding)), feeding));
  remoteFeedings.forEach((feeding) => byId.set(String(feeding.id), feeding));
  state.feedings = dedupeFeedings(Array.from(byId.values()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 160);
  hydrateFeedingOptions();
}

function mergeDiapers(remoteDiapers) {
  const byId = new Map();
  state.diapers
    .filter((diaper) => !diaper.synced)
    .forEach((diaper) => byId.set(String(diaper.id || diaperIdentity(diaper)), diaper));
  remoteDiapers.forEach((diaper) => byId.set(String(diaper.id), diaper));
  state.diapers = dedupeDiapers(Array.from(byId.values()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 240);
}

function mergeSleepDiary(remoteEntries) {
  state.sleepDiary = state.sleepDiary || {};
  remoteEntries.forEach((entry) => {
    const current = state.sleepDiary[entry.id];
    if (current && current.synced === false) return;
    state.sleepDiary[entry.id] = {
      sleepEndPlace: entry.sleepEndPlace || legacySleepEndPlace(entry.crib),
      crib: entry.crib || "",
      cribHelp: entry.cribHelp || "",
      wakeMood: entry.wakeMood || "",
      sleepLatency: entry.sleepLatency || "",
      helpTypes: normalizeHelpTypes(entry.helpTypes),
      feedingBeforeNap: entry.feedingBeforeNap || "",
      pacifier: entry.pacifier || "",
      pacifierWake: entry.pacifierWake || "",
      synced: true
    };
  });
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
    note: recordType === "night" ? nightAwakeningsNote(nap) : napGoalNote(nap)
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

async function syncDiaperToSheet(diaper) {
  if (!SHEETS_WEB_APP_URL || !diaper) return;
  return syncDiapersToSheet([diaper], "Troca salva no aparelho. Enviando para o Google Sheets...");
}

async function syncPendingDiapersToSheet() {
  state.diapers = dedupeDiapers(state.diapers)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 240);
  saveState();
  const pending = state.diapers.filter((record) => !record.synced);
  if (!pending.length) return;
  await syncDiapersToSheet(pending, "Sincronizando fraldas pendentes com o Google Sheets...");
}

async function syncDiapersToSheet(diapers, statusMessage) {
  if (!SHEETS_WEB_APP_URL || !diapers.length) return;
  const supported = await ensureDiaperSheetSupport(true);
  if (!supported) {
    setHint("Troca salva no aparelho. Reimplante o Apps Script novo para criar/sincronizar a aba Fraldas.");
    return;
  }

  const records = diapers.map((diaper) => sheetPayloadForDiaper(diaper));
  const payload = {
    token: SHEETS_SHARED_TOKEN,
    action: records.length > 1 ? "bulkAppendDiapers" : "appendDiaper",
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
    if (!result.ok) throw new Error(result.error || "Falha ao gravar fralda.");

    const syncedIds = new Set([...(result.inserted || []), ...(result.skipped || [])].map(String));
    state.diapers = state.diapers.map((diaper) => (
      syncedIds.has(String(diaper.id || diaperIdentity(diaper))) ? { ...diaper, synced: true } : diaper
    ));
    saveState();
    setHint("Troca salva no aparelho e sincronizada com o Google Sheets.");
  } catch (error) {
    setHint(`Troca salva no aparelho, mas nao foi enviada ao Google Sheets: ${error.message}`);
  }
}

async function ensureDiaperSheetSupport(forceRetry = false) {
  if (diaperSheetSupport === true && !forceRetry) return true;
  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listDiapers&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    diaperSheetSupport = Boolean(result.ok && Array.isArray(result.records));
  } catch {
    if (!forceRetry) diaperSheetSupport = false;
    return false;
  }
  return diaperSheetSupport;
}

function sheetPayloadForDiaper(diaper) {
  const changedAt = new Date(diaper.at);
  const type = diaperTypeKey(diaper.type);
  return {
    id: diaper.id || diaperIdentity(diaper),
    babyName: diaper.babyName || state.babyName || "Bebê",
    babyAge: Number(diaper.babyAge || currentBabyAgeMonths() || 0),
    at: toLocalDateTimeValue(changedAt),
    type,
    typeLabel: diaperTypeLabel(type),
    hasPoop: diaperHasPoop({ type }) ? "Sim" : "Não",
    dayStart: normalizeTimeField(diaper.dayStart || state.dayStart)
  };
}

async function syncSleepDiaryEntryToSheet(napId) {
  if (!SHEETS_WEB_APP_URL || !napId) return;
  return syncSleepDiaryToSheet([napId], "Diário salvo no aparelho. Enviando para o Google Sheets...");
}

async function syncPendingSleepDiaryToSheet() {
  const pendingIds = Object.entries(state.sleepDiary || {})
    .filter(([, entry]) => entry && entry.synced === false)
    .map(([id]) => id);
  if (!pendingIds.length) return;
  await syncSleepDiaryToSheet(pendingIds, "Sincronizando diário do sono com o Google Sheets...");
}

async function syncSleepDiaryToSheet(napIds, statusMessage) {
  if (!SHEETS_WEB_APP_URL || !napIds.length) return;
  const supported = await ensureSleepDiarySheetSupport(true);
  if (!supported) {
    setHint("Diário salvo no aparelho. Reimplante o Apps Script novo para criar/sincronizar a aba DiarioSono.");
    return;
  }

  const records = napIds
    .map((napId) => sheetPayloadForSleepDiary(napId))
    .filter(Boolean);
  if (!records.length) return;

  const payload = {
    token: SHEETS_SHARED_TOKEN,
    action: records.length > 1 ? "bulkUpsertSleepDiary" : "upsertSleepDiary",
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
    if (!result.ok) throw new Error(result.error || "Falha ao gravar diário.");

    const syncedIds = new Set([...(result.inserted || []), ...(result.updated || []), ...(result.skipped || [])].map(String));
    syncedIds.forEach((id) => {
      if (state.sleepDiary[id]) state.sleepDiary[id] = { ...state.sleepDiary[id], synced: true };
    });
    saveState();
    setHint("Diário do sono sincronizado com o Google Sheets.");
  } catch (error) {
    setHint(`Diário salvo no aparelho, mas não foi enviado ao Google Sheets: ${error.message}`);
  }
}

async function ensureSleepDiarySheetSupport(forceRetry = false) {
  if (sleepDiarySheetSupport === true && !forceRetry) return true;
  try {
    const url = `${SHEETS_WEB_APP_URL}?action=listSleepDiary&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    sleepDiarySheetSupport = Boolean(result.ok && Array.isArray(result.records));
  } catch {
    if (!forceRetry) sleepDiarySheetSupport = false;
    return false;
  }
  return sleepDiarySheetSupport;
}

function sheetPayloadForSleepDiary(napId) {
  const entry = sleepDiaryEntry(napId);
  const nap = state.naps.find((item) => String(item.id || napIdentity(item)) === String(napId));
  if (!nap || !entry) return null;

  const orderedNaps = state.naps
    .filter((item) => recordDateInputValue(item) === recordDateInputValue(nap))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const napNumber = orderedNaps.findIndex((item) => String(item.id || napIdentity(item)) === String(napId)) + 1;
  const startedAt = new Date(nap.start);
  const endedAt = new Date(nap.end);

  return {
    id: napId,
    napId,
    babyName: nap.babyName || state.babyName || "Bebê",
    babyAge: Number(nap.babyAge || currentBabyAgeMonths() || 0),
    date: dateInputValue(startedAt),
    napNumber,
    start: toLocalDateTimeValue(startedAt),
    end: toLocalDateTimeValue(endedAt),
    duration: safeDuration(nap),
    wakeWindowUsed: wakeWindowUsedForNap(nap),
    wakeWindowUsedLabel: formatDuration(wakeWindowUsedForNap(nap)),
    sleepEndPlace: entry.sleepEndPlace || legacySleepEndPlace(entry.crib),
    sleepEndPlaceLabel: sleepEndPlaceLabel(entry.sleepEndPlace || legacySleepEndPlace(entry.crib)),
    cribHelp: entry.cribHelp || "",
    cribHelpLabel: yesNoLabel(entry.cribHelp),
    wakeMood: entry.wakeMood || "",
    wakeMoodLabel: wakeMoodLabel(entry.wakeMood),
    sleepLatency: Number(entry.sleepLatency) || "",
    helpTypes: normalizeHelpTypes(entry.helpTypes),
    helpTypesLabel: helpTypesLabel(entry.helpTypes),
    feedingBeforeNap: feedingBeforeNapLabel(nap),
    crib: entry.crib || "",
    cribLabel: yesNoLabel(entry.crib),
    pacifier: entry.pacifier || "",
    pacifierLabel: yesNoLabel(entry.pacifier),
    pacifierWake: entry.pacifierWake || "",
    pacifierWakeLabel: yesNoLabel(entry.pacifierWake)
  };
}

function yesNoLabel(value) {
  if (value === "yes") return "Sim";
  if (value === "no") return "Não";
  return "";
}

function sleepEndPlaceLabel(value) {
  if (value === "crib" || value === "crib-help") return "Berço (com ajuda)";
  if (value === "crib-alone") return "Berço (sozinha)";
  if (value === "lap") return "Colo";
  return "";
}

function wakeMoodLabel(value) {
  if (value === "happy") return "Feliz";
  if (value === "calm") return "Calma";
  if (value === "upset") return "Irritada";
  if (value === "crying") return "Chorando";
  return "";
}

function helpTypesLabel(value) {
  const labels = {
    lap: "colo",
    rocking: "balanço",
    "chest-hand": "mão no peito",
    pacifier: "chupeta",
    voice: "voz",
    shush: "shhhh"
  };
  return normalizeHelpTypes(value).map((item) => labels[item]).filter(Boolean).join(", ");
}

async function deleteNapFromSheet(id, options = {}) {
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
    if (!options.silent) setHint("Soneca removida do aparelho e do Google Sheets.");
  } catch (error) {
    if (!options.silent) setHint(`Soneca removida do aparelho, mas não foi removida do Google Sheets: ${error.message}`);
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

async function deleteDiaperFromSheet(id) {
  if (!SHEETS_WEB_APP_URL || !id) return;

  try {
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: SHEETS_SHARED_TOKEN,
        action: "deleteDiaper",
        id
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao remover fralda.");
    setHint("Troca removida do aparelho e do Google Sheets.");
  } catch (error) {
    setHint(`Troca removida do aparelho, mas nao foi removida do Google Sheets: ${error.message}`);
  }
}

function scheduleUpcomingNotifications() {
  clearNotificationTimers();
  if (!canNotify() || state.activeNapAttemptStart || state.activeNapStart || state.activeNightStart) return;
  const prediction = calculatePrediction();
  const night = calculateNightSuggestion(prediction);
  const now = nowMinutes();
  const minutesToWindow = minutesUntilReminder(prediction.start, now);
  const hasNapSlot = shouldSuggestNapBeforeNight(prediction) && !shouldSkipNextNapForNight(prediction, night);
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
  if (!hasNapSlot) {
    reminders.splice(0, 3);
  }
  reminders.forEach((reminder) => {
    applyFriendlyReminderCopy(reminder, prediction, night);
    scheduleReminder(reminder, now);
  });
  syncRemoteNotificationSchedule(reminders, now);
  const nextReminder = nextUpcomingReminder(reminders, now);
  const nextReminderDelay = nextReminder ? nextReminder.delay : null;
  updateNotificationHelp(hasNapSlot && minutesToWindow <= 15
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
  activeReminders.forEach(applyFriendlyActiveNapCopy);
  let nextDelay = null;
  activeReminders.forEach((item) => {
    const delay = started + item.minute * 60000 - Date.now();
    if (delay > 0) {
      nextDelay = nextDelay === null ? delay : Math.min(nextDelay, delay);
      notificationTimers.push(setTimeout(() => {
        markActiveNapNoticeSent(item.tag);
        notify("Soneca em andamento ☁️", item.body, item.tag);
      }, delay));
      return;
    }

    if (elapsedMinutes >= item.minute && elapsedMinutes <= item.minute + 10 && !wasActiveNapNoticeSent(item.tag)) {
      markActiveNapNoticeSent(item.tag);
      notify("Soneca em andamento ☁️", item.body, item.tag);
    }
  });
  syncRemoteNotificationScheduleAbsolute(activeReminders.map((item) => ({
    at: new Date(started + item.minute * 60000).toISOString(),
    title: "Soneca em andamento ☁️",
    body: item.body,
    tag: item.tag
  })));
  updateNotificationHelp(nextDelay === null
    ? "Avisos ligados para esta soneca. Os marcos de acompanhamento previstos já passaram."
    : `Avisos ligados para esta soneca. Próximo acompanhamento em ${formatDuration(nextDelay / 60000)}.`
  );
}

function applyFriendlyActiveNapCopy(reminder) {
  const name = babyDisplayName();
  const copies = {
    "soneca-ativa-30": `${name} est\u00e1 dormindo h\u00e1 30min ☁️ Observe se ela emenda outro ciclo.`,
    "soneca-ativa-45": `${name} chegou em 45min de soneca ✨ Essa faixa costuma ser transi\u00e7\u00e3o de ciclo.`,
    "soneca-ativa-90": `${name} dormiu 1h30. Boa soneca; vale observar o impacto no sono noturno 💞`
  };
  reminder.body = copies[reminder.tag] || reminder.body;
}

function applyFriendlyReminderCopy(reminder, prediction, night) {
  const name = babyDisplayName();
  const copies = {
    "soneca-janela-chegando": {
      title: "Janela do sono se aproximando… ☁️",
      body: `Faltam 15min para abrir. A janela vai at\u00e9 ${minutesToTime(prediction.end)} 🫩`
    },
    "soneca-janela-aberta": {
      title: "Janela de soneca aberta ☁️",
      body: `Janela aberta agora. Tempo at\u00e9 o fim: ${formatDuration(minutesBetweenClock(prediction.start, prediction.end))} 🫩`
    },
    "soneca-alvo": {
      title: "Sono chegando por aqui ✨",
      body: `${name} est\u00e1 perto do alvo da soneca. Observe os sinais.`
    },
    "soneca-noite-chegando": {
      title: "Sono noturno chegando 🌙",
      body: `${name} pode estar pronta para desacelerar. Previs\u00e3o: ${minutesToTime(night.start)} 💞`
    },
    "soneca-noite": {
      title: "Hora do soninho da noite 🌙",
      body: `${name} dormiu? Se sim, toque em Hora de dormir. Hora de descansar 💞`
    }
  };
  Object.assign(reminder, copies[reminder.tag] || {});
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
  const registration = await registerServiceWorker();
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

function customWakeWindowProfile(baseProfile, today = napsToday()) {
  const nextIndex = today.length + (state.activeNapStart ? 1 : 0) + 1;
  const samples = wakeWindowSamplesByNapIndex(nextIndex);
  if (!samples.length) return { ...baseProfile, custom: false, samples: 0 };

  const average = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
  const spread = samples.length >= 3 ? 20 : 15;
  return {
    ...baseProfile,
    min: clamp(average - spread, Math.max(30, baseProfile.min - 35), baseProfile.max + 30),
    target: clamp(average, Math.max(35, baseProfile.min - 20), baseProfile.max + 40),
    max: clamp(average + spread, baseProfile.min, baseProfile.max + 60),
    custom: true,
    samples: samples.length
  };
}

function wakeWindowSamplesByNapIndex(napIndex) {
  const byDay = new Map();
  state.naps.forEach((nap) => {
    const start = new Date(nap.start);
    const end = new Date(nap.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    const key = recordDateInputValue(nap);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(nap);
  });

  const samples = [];
  byDay.forEach((naps) => {
    const ordered = naps.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const nap = ordered[napIndex - 1];
    if (!nap) return;
    let windowMinutes = null;
    if (napIndex === 1) {
      const dayStart = safeTimeToMinutes(nap.dayStart || state.dayStart || DEFAULT_DAY_START, 7 * 60);
      const startMinutes = dateToDayMinutes(new Date(nap.start));
      windowMinutes = minutesBetweenClock(dayStart, startMinutes);
    } else {
      const previous = ordered[napIndex - 2];
      if (!previous) return;
      windowMinutes = Math.round((new Date(nap.start) - new Date(previous.end)) / 60000);
    }
    if (windowMinutes >= 35 && windowMinutes <= 360) samples.push(windowMinutes);
  });

  return samples.slice(-10);
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
  return latestNight ? nightDuration(latestNight) : 0;
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
  const napCount = today.length;
  const planned = plannedNapCount();
  const lastFeeding = latestPastFeeding();
  const feedingAge = lastFeeding ? formatFeedingAge(lastFeeding) : "";

  if (state.activeNapAttemptStart) {
    const startedAt = new Date(state.activeNapAttemptStart);
    const minutes = Number.isNaN(startedAt.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
    if (minutes >= 25) return `Ela ja esta tentando dormir ha ${formatDuration(minutes)}. Pode ser sinal de janela longa demais, desconforto ou que ainda precisa de ajuda para desacelerar.`;
    if (minutes >= 15) return `Tempo para adormecer em ${formatDuration(minutes)}. Observe se ela esta relaxando; se passar muito disso, essa janela pode estar no limite.`;
    return `Timer de adormecer ativo ha ${formatDuration(minutes)}. Quando ela dormir, toque em Dormiu para iniciar a soneca real.`;
  }

  if (state.activeNightStart && state.activeNightAwakeStart) {
    const awakeStart = new Date(state.activeNightAwakeStart);
    const awakeMinutes = Number.isNaN(awakeStart.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - awakeStart.getTime()) / 60000));
    return `${babyDisplayName()} acordou na madrugada. Registre a mamada se acontecer e toque em Voltou a dormir quando ela pegar no sono. Acordada h\u00e1 ${formatRingDuration(awakeMinutes)}.`;
  }

  if (state.activeNightStart) {
    const awakeMinutes = totalAwakeMinutes(state.activeNightAwakenings || []);
    return awakeMinutes
      ? `Sono noturno em curso. Ela j\u00e1 ficou acordada ${formatRingDuration(awakeMinutes)} nesta noite. Sem c\u00e1lculo de soneca at\u00e9 encerrar a noite.`
      : "Sono noturno em curso. Acompanhe apenas a noite at\u00e9 ela acordar de manh\u00e3.";
  }

  const patternInsight = assistantPatternInsight();
  if (patternInsight) return patternInsight;

  if (napCount >= planned) {
    const night = calculateNightSuggestion(prediction);
    if (shouldSuggestNapBeforeNight(prediction, today)) {
      return `${napCount} soneca${napCount === 1 ? "" : "s"} registrada${napCount === 1 ? "" : "s"} de ${planned} prevista${planned === 1 ? "" : "s"}, mas ainda cabe uma soneca extra antes da noite. Próxima janela provável entre ${minutesToTime(prediction.start)} e ${minutesToTime(prediction.end)}.`;
    }
    return `${napCount} soneca${napCount === 1 ? "" : "s"} registrada${napCount === 1 ? "" : "s"} de ${planned} prevista${planned === 1 ? "" : "s"}. Agora acompanhe sinais para o sono noturno por volta de ${minutesToTime(night.start)}.`;
  }

  if (prediction.profile?.custom) {
    return `Pelo hist\u00f3rico da ${babyDisplayName()}, a ${ordinalFeminine(napCount + 1)} soneca costuma acontecer entre ${formatDuration(prediction.minWindow)} e ${formatDuration(prediction.maxWindow)} depois que ela acorda. Baseado em ${prediction.profile.samples} registro${prediction.profile.samples === 1 ? "" : "s"} parecido${prediction.profile.samples === 1 ? "" : "s"}.`;
  }

  if (lastNap && safeDuration(lastNap) < 35) {
    return `A \u00faltima soneca foi curta (${safeDuration(lastNap)} min). A pr\u00f3xima janela pode precisar ser mais curta; observe bocejos, olhar parado e irrita\u00e7\u00e3o.`;
  }

  if (lastNap && safeDuration(lastNap) >= 90) {
    return `Boa soneca de ${formatDuration(safeDuration(lastNap))}. Ela pode sustentar um pouco melhor at\u00e9 a pr\u00f3xima janela, mantendo a previs\u00e3o atual.`;
  }

  if (lastFeeding && feedingAge && minutesSinceDate(lastFeeding.at) >= 150) {
    return `A \u00faltima mamada foi h\u00e1 ${feedingAge}. Se ela mostrar fome junto com sono, vale alimentar antes de tentar a soneca.`;
  }

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

function assistantPatternInsight() {
  const naps = state.naps
    .filter((nap) => !Number.isNaN(new Date(nap.start).getTime()) && !Number.isNaN(new Date(nap.end).getTime()))
    .slice()
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const daysWithNaps = new Set(naps.map((nap) => recordDateInputValue(nap)).filter(Boolean));
  if (daysWithNaps.size < 10) return "";

  return bestNapTimeInsight(naps)
    || lastWindowNightInsight()
    || dayStartNapQualityInsight()
    || "";
}

function bestNapTimeInsight(naps) {
  const buckets = new Map();
  naps.forEach((nap) => {
    const start = new Date(nap.start);
    const bucketStart = Math.floor(start.getHours() / 2) * 2;
    const key = `${String(bucketStart).padStart(2, "0")}h-${String(bucketStart + 2).padStart(2, "0")}h`;
    const entry = sleepDiaryEntry(napIdentity(nap));
    const mood = nap.mood || entry.wakeMood || "";
    const current = buckets.get(key) || { count: 0, total: 0, goodMood: 0 };
    current.count += 1;
    current.total += safeDuration(nap);
    if (["happy", "calm", "good", "bem humorado"].includes(String(mood).toLowerCase())) current.goodMood += 1;
    buckets.set(key, current);
  });

  const ranked = [...buckets.entries()]
    .filter(([, value]) => value.count >= 3)
    .map(([key, value]) => ({
      key,
      ...value,
      average: Math.round(value.total / value.count)
    }))
    .sort((a, b) => (b.average + b.goodMood * 5) - (a.average + a.goodMood * 5));
  const best = ranked[0];
  if (!best || best.average < 35) return "";
  return `${babyDisplayName()} costuma fazer as melhores sonecas entre ${best.key}: media de ${formatDuration(best.average)} em ${best.count} registros.`;
}

function lastWindowNightInsight() {
  const samples = nightWindowSamples();
  if (samples.length < 6) return "";

  const long = samples.filter((sample) => sample.lastWindow > 120);
  const regular = samples.filter((sample) => sample.lastWindow <= 120);
  if (long.length < 3 || regular.length < 3) return "";

  const avgLongWake = average(long.map((sample) => sample.nightWakeCount));
  const avgRegularWake = average(regular.map((sample) => sample.nightWakeCount));
  const avgLongSleep = average(long.map((sample) => sample.nightSleep));
  const avgRegularSleep = average(regular.map((sample) => sample.nightSleep));

  if (avgLongWake > avgRegularWake + 0.5) {
    return `Quando a ultima janela antes da noite passa de 2h, os despertares aumentam (${avgLongWake.toFixed(1).replace(".", ",")} contra ${avgRegularWake.toFixed(1).replace(".", ",")}).`;
  }
  if (avgLongSleep + 45 < avgRegularSleep) {
    return `Quando a ultima janela antes da noite passa de 2h, o sono noturno tende a encurtar cerca de ${formatDuration(avgRegularSleep - avgLongSleep)}.`;
  }
  return "";
}

function dayStartNapQualityInsight() {
  const days = reportDaysFromHistory(21).filter((day) => day.napCount && day.daySleep);
  if (days.length < 7) return "";

  const buckets = new Map();
  days.forEach((day) => {
    const startMinutes = safeTimeToMinutes(day.dayStart || state.dayStart || DEFAULT_DAY_START, 7 * 60);
    const hour = Math.floor(startMinutes / 60);
    const current = buckets.get(hour) || { count: 0, totalSleep: 0 };
    current.count += 1;
    current.totalSleep += day.daySleep;
    buckets.set(hour, current);
  });

  const ranked = [...buckets.entries()]
    .filter(([, value]) => value.count >= 2)
    .map(([hour, value]) => ({
      hour,
      count: value.count,
      average: Math.round(value.totalSleep / value.count)
    }))
    .sort((a, b) => b.average - a.average);
  const best = ranked[0];
  if (!best) return "";
  const other = ranked.slice(1);
  const otherAverage = other.length ? average(other.map((item) => item.average)) : 0;
  if (!otherAverage || best.average < otherAverage + 25) return "";
  return `Quando ela acorda perto de ${String(best.hour).padStart(2, "0")}h, as sonecas rendem mais: media de ${formatDuration(best.average)} no dia.`;
}

function nightWindowSamples() {
  return state.nights
    .map((night) => {
      const nightStart = new Date(night.start);
      const dayKey = dateInputValue(nightStart);
      const naps = state.naps.filter((nap) => recordDateInputValue(nap) === dayKey);
      const lastWindow = lastWakeWindowBeforeNightForDay(dayKey, naps, [night]);
      return {
        lastWindow,
        nightWakeCount: normalizeAwakenings(night.awakenings || []).length,
        nightSleep: nightDuration(night)
      };
    })
    .filter((sample) => sample.lastWindow > 0 && sample.nightSleep > 0);
}

function reportDaysFromHistory(daysBack = 21) {
  const today = new Date();
  const start = addDays(today, -daysBack + 1);
  const days = [];
  for (let index = 0; index < daysBack; index += 1) {
    const date = addDays(start, index);
    const key = dateInputValue(date);
    const naps = state.naps.filter((nap) => recordDateInputValue(nap) === key);
    const daySleep = naps.reduce((sum, nap) => sum + safeDuration(nap), 0);
    days.push({
      key,
      dayStart: naps[0]?.dayStart || state.dayStart,
      napCount: naps.length,
      daySleep
    });
  }
  return days;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(Number(value)));
  return filtered.length ? filtered.reduce((sum, value) => sum + Number(value), 0) / filtered.length : 0;
}

function estimateNightSleepMinutes(bedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30), morning = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60)) {
  const duration = bedtime <= morning ? morning - bedtime : 24 * 60 - bedtime + morning;
  return clamp(duration, 0, 13 * 60);
}

function napsToday() {
  return napsInCurrentDay();
}

function feedingsToday() {
  const cycleStart = currentCycleStartDate();
  const start = new Date(cycleStart.getTime() - CYCLE_START_GRACE_MINUTES * 60000);
  const end = state.activeNightStart ? new Date(state.activeNightStart) : new Date();

  return state.feedings.filter((feeding) => {
    const fedAt = new Date(feeding.at);
    return !Number.isNaN(fedAt.getTime()) && fedAt >= start && fedAt <= end;
  }).sort((a, b) => new Date(b.at) - new Date(a.at));
}

function feedingsInActiveNight() {
  if (!state.activeNightStart) return [];
  const start = new Date(state.activeNightStart);
  const end = new Date();
  return state.feedings.filter((feeding) => {
    const fedAt = new Date(feeding.at);
    return !Number.isNaN(fedAt.getTime()) && fedAt >= start && fedAt <= end;
  });
}

function diapersToday() {
  const cycleStart = currentCycleStartDate();
  const start = new Date(cycleStart.getTime() - CYCLE_START_GRACE_MINUTES * 60000);
  const end = state.activeNightStart ? new Date(state.activeNightStart) : new Date();

  return dedupeDiapers(state.diapers || []).filter((diaper) => {
    const changedAt = new Date(diaper.at);
    return !Number.isNaN(changedAt.getTime()) && changedAt >= start && changedAt <= end;
  }).sort((a, b) => new Date(b.at) - new Date(a.at));
}

function diapersInActiveNight() {
  if (!state.activeNightStart) return [];
  const start = new Date(state.activeNightStart);
  const end = new Date();
  return dedupeDiapers(state.diapers || []).filter((diaper) => {
    const changedAt = new Date(diaper.at);
    return !Number.isNaN(changedAt.getTime()) && changedAt >= start && changedAt <= end;
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

function hasPlannedNapSlot(today = napsToday()) {
  return today.length + (state.activeNapStart ? 1 : 0) < plannedNapCount();
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

function ringMarkerMinute(date) {
  const minutes = dateToDayMinutes(date);
  const deltaBeforeStart = currentRingStartMinutes - minutes;
  if (deltaBeforeStart > 0 && deltaBeforeStart <= CYCLE_START_GRACE_MINUTES) {
    return currentRingStartMinutes;
  }
  return minutes;
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
  const icon = markerIconFa(marker.type);
  const markerRadius = 8.4;

  if (marker.type === "next") {
    return `
      <g class="day-marker-group next" transform="translate(${point.x} ${point.y})">
        <circle class="marker-orb" cx="0" cy="0" r="${markerRadius}"></circle>
        <text class="marker-icon" x="0" y="1" text-anchor="middle">${icon}</text>
      </g>
      ${markerTimeText(marker.startLabel, marker.startAt, "next")}
      ${markerTimeText(marker.endLabel, marker.endAt, "next")}
    `;
  }

  if (marker.type === "day-start" || marker.type === "day-end") {
    const timePoint = pointOnCircle(marker.at, 102);
    return `
      <g class="day-marker-group ${marker.type}" ${marker.type === "day-end" ? 'role="button" tabindex="0"' : ""} transform="translate(${point.x} ${point.y})">
        <circle class="marker-orb" cx="0" cy="0" r="${markerRadius}"></circle>
        <text class="marker-icon" x="0" y="1" text-anchor="middle">${icon}</text>
      </g>
      <text class="marker-time ${marker.type}" x="${timePoint.x}" y="${timePoint.y + 9}" text-anchor="middle">${marker.label}</text>
    `;
  }

  return `
    <g class="day-marker-group ${marker.type}" ${markerAttributes(marker)} transform="translate(${point.x} ${point.y})">
      <circle class="marker-orb" cx="0" cy="0" r="${markerRadius}"></circle>
      <text class="marker-icon" x="0" y="1" text-anchor="middle">${icon}</text>
    </g>
  `;
}

function markerAttributes(marker) {
  if (!marker.id) return "";
  if (marker.type === "awake") return "";
  if (marker.type === "feed") {
    return `data-feeding-id="${marker.id}" role="button" tabindex="0"`;
  }
  return `data-nap-id="${marker.id}" data-nap-index="${marker.index || ""}" role="button" tabindex="0"`;
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

function markerIconFa(type) {
  const icons = {
    nap: "\uf0c2",
    next: "\uf0c2",
    feed: "\ue4c4",
    awake: "\uf186",
    "day-start": "\uf6c4",
    "day-end": "\uf6c3"
  };
  return icons[type] || "\uf111";
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

function normalizeSleepDiary(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([id, entry]) => [
    String(id),
    {
      sleepEndPlace: ["crib", "crib-help", "crib-alone", "lap"].includes(entry?.sleepEndPlace) ? sleepEndPlaceKey(entry.sleepEndPlace) : legacySleepEndPlace(entry?.crib),
      crib: entry?.crib === "yes" || entry?.crib === "no" ? entry.crib : "",
      cribHelp: entry?.cribHelp === "yes" || entry?.cribHelp === "no" ? entry.cribHelp : "",
      wakeMood: ["happy", "calm", "upset", "crying"].includes(entry?.wakeMood) ? entry.wakeMood : "",
      sleepLatency: Number.isFinite(Number(entry?.sleepLatency)) && Number(entry.sleepLatency) > 0 ? String(Number(entry.sleepLatency)) : "",
      helpTypes: normalizeHelpTypes(entry?.helpTypes),
      feedingBeforeNap: entry?.feedingBeforeNap || "",
      pacifier: entry?.pacifier === "yes" || entry?.pacifier === "no" ? entry.pacifier : "",
      pacifierWake: entry?.pacifierWake === "yes" || entry?.pacifierWake === "no" ? entry.pacifierWake : "",
      synced: entry?.synced === true
    }
  ]));
}

function normalizeHelpTypes(value) {
  const allowed = new Set(["lap", "rocking", "chest-hand", "pacifier", "voice", "shush"]);
  return (Array.isArray(value) ? value : helpTypesFromLabel(value)).filter((item, index, list) => (
    allowed.has(item) && list.indexOf(item) === index
  ));
}

function roundSvg(value) {
  return Math.round(value * 100) / 100;
}

function canNotify() {
  return "Notification" in window && Notification.permission === "granted";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.__sonecaControllerChangeBound) {
    window.__sonecaControllerChangeBound = true;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sessionStorage.getItem("soneca-sw-reloaded") === "1") return;
      sessionStorage.setItem("soneca-sw-reloaded", "1");
      window.location.reload();
    });
  }

  return navigator.serviceWorker.register("sw.js").then((registration) => {
    registration.update?.();
    return registration;
  }).catch(() => {
    updateNotificationHelp("Não consegui registrar o Service Worker. Avisos e modo offline podem falhar.");
    return null;
  });
}

function loadState() {
  try {
    const loaded = { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    loaded.dayStart = normalizeTimeField(loaded.dayStart) || DEFAULT_DAY_START;
    loaded.lastWake = normalizeTimeField(loaded.lastWake);
    loaded.bedtime = normalizeTimeField(loaded.bedtime) || defaultState.bedtime;
    loaded.plannedNapCount = clamp(Math.round(Number(loaded.plannedNapCount) || defaultState.plannedNapCount), 1, 8);
    loaded.activeNapAttemptStart = Number.isNaN(new Date(loaded.activeNapAttemptStart || "").getTime()) ? null : new Date(loaded.activeNapAttemptStart).toISOString();
    if (loaded.activeNapAttemptStart && Date.now() - new Date(loaded.activeNapAttemptStart).getTime() > ACTIVE_NAP_MAX_AGE_MS) {
      loaded.activeNapAttemptStart = null;
      loaded.activeNapResumeId = null;
    }
    loaded.activeNapResumeId = loaded.activeNapResumeId ? String(loaded.activeNapResumeId) : null;
    loaded.activeNightId = loaded.activeNightId ? String(loaded.activeNightId) : null;
    loaded.feedingOptions = { ...defaultState.feedingOptions, ...(loaded.feedingOptions || {}) };
    loaded.sleepDiary = normalizeSleepDiary(loaded.sleepDiary);
    loaded.activeNightAwakenings = normalizeAwakenings(loaded.activeNightAwakenings || []);
    loaded.babyBirthDate = normalizeDateInputValue(loaded.babyBirthDate);
    loaded.babyAge = Number.isFinite(Number(loaded.babyAge)) ? clamp(Number(loaded.babyAge), 0, 36) : defaultState.babyAge;
    if (loaded.babyBirthDate) {
      loaded.babyAge = ageMonthsFromBirthDate(loaded.babyBirthDate);
    }
    loaded.naps = (loaded.naps || []).map((nap) => {
      const duration = safeDuration(nap);
      const goalDuration = Number(nap.goalDuration) || 0;
      return {
        ...nap,
        id: nap.id || stableNapId(nap),
        dayStart: normalizeTimeField(nap.dayStart) || loaded.dayStart,
        bedtime: normalizeTimeField(nap.bedtime) || loaded.bedtime,
        lastWake: normalizeTimeField(nap.lastWake),
        babyAge: Number.isFinite(Number(nap.babyAge)) ? Number(nap.babyAge) : loaded.babyAge,
        duration,
        goalDuration,
        goalPercent: goalDuration ? napGoalPercent(duration, goalDuration) : Number(nap.goalPercent || 0),
        synced: Boolean(nap.synced)
      };
    });
    loaded.nights = (loaded.nights || []).map((night) => ({
      ...night,
      type: "night",
      id: night.id || stableNapId(night),
      dayStart: normalizeTimeField(night.dayStart) || loaded.dayStart,
      bedtime: normalizeTimeField(night.bedtime) || loaded.bedtime,
      lastWake: normalizeTimeField(night.lastWake),
      babyAge: Number.isFinite(Number(night.babyAge)) ? Number(night.babyAge) : loaded.babyAge,
      awakenings: normalizeAwakenings(night.awakenings || []),
      awakeDuration: totalAwakeMinutes(night.awakenings || []),
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
    loaded.diapers = dedupeDiapers((loaded.diapers || []).map((diaper) => ({
      ...diaper,
      id: diaper.id || `diaper-legacy-${Math.abs(hashString(diaperIdentity(diaper)))}`,
      at: diaper.at,
      type: diaperTypeKey(diaper.type),
      babyAge: Number.isFinite(Number(diaper.babyAge)) ? Number(diaper.babyAge) : loaded.babyAge,
      dayStart: normalizeTimeField(diaper.dayStart) || loaded.dayStart,
      synced: Boolean(diaper.synced)
    })).filter((diaper) => !Number.isNaN(new Date(diaper.at).getTime())))
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

function closeAllSheets(exceptSheet = null) {
  [
    els.installSheet,
    els.profileSheet,
    els.historySheet,
    els.diarySheet,
    els.activitiesSheet,
    els.reportSheet,
    els.moodSheet,
    els.startSheet,
    els.napStartSheet,
    els.nightTimeSheet,
    els.manualNapSheet,
    els.feedingSheet,
    els.diaperSheet
  ].forEach((sheet) => {
    if (sheet && sheet !== exceptSheet) {
      sheet.setAttribute("aria-hidden", "true");
    }
  });
  updateSheetOpenState();
}

function setSheetOpen(sheet, open) {
  if (!sheet) return;
  if (open) closeAllSheets(sheet);
  sheet.setAttribute("aria-hidden", open ? "false" : "true");
  updateSheetOpenState();
}

function updateSheetOpenState() {
  const hasOpenSheet = [
    els.installSheet,
    els.profileSheet,
    els.historySheet,
    els.diarySheet,
    els.activitiesSheet,
    els.reportSheet,
    els.moodSheet,
    els.startSheet,
    els.napStartSheet,
    els.nightTimeSheet,
    els.manualNapSheet,
    els.feedingSheet,
    els.diaperSheet
  ].some((sheet) => sheet && sheet.getAttribute("aria-hidden") === "false");
  document.body.classList.toggle("sheet-open", hasOpenSheet);
}

function toggleInstallSheet(open) {
  setSheetOpen(els.installSheet, open);
}

function toggleProfileSheet(open) {
  setSheetOpen(els.profileSheet, open);
}

function toggleHistorySheet(open) {
  setSheetOpen(els.historySheet, open);
  if (open) renderHistory();
}

function toggleDiarySheet(open) {
  setSheetOpen(els.diarySheet, open);
  if (open) renderSleepDiary();
}

function toggleActivitiesSheet(open) {
  setSheetOpen(els.activitiesSheet, open);
  if (open) renderActivities();
}

function toggleReportSheet(open) {
  setSheetOpen(els.reportSheet, open);
  if (open) {
    renderReport();
  }
}

function toggleMoodSheet(open) {
  if (open && !state.activeNapStart) return;
  setSheetOpen(els.moodSheet, open);
}

function toggleStartSheet(open) {
  if (open) toggleNapStartSheet(false);
  if (open) toggleNightTimeSheet(false);
  if (open && els.startInfoText) {
    els.startInfoText.textContent = "";
    els.startInfoText.hidden = true;
  }
  setSheetOpen(els.startSheet, open);
}

function toggleNapStartSheet(open) {
  if (open && els.napStartTime) {
    const attemptStartedAt = new Date(state.activeNapAttemptStart || "");
    els.napStartTime.value = !Number.isNaN(attemptStartedAt.getTime())
      ? toDateTimeLocalValue(attemptStartedAt).slice(0, 16)
      : "";
  }
  setSheetOpen(els.napStartSheet, open);
  renderNapAttemptControls();
}

function toggleNightTimeSheet(open) {
  setSheetOpen(els.nightTimeSheet, open);
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
  setSheetOpen(els.manualNapSheet, open);
}

function openFeedingSheet(manual = false) {
  renderFeedingTypeOptions();
  els.feedingTitle.textContent = manual ? "Adicionar mamada anterior" : "Registrar mamada";
  const fedAt = new Date();
  if (manual) fedAt.setMinutes(fedAt.getMinutes() - 60);
  els.feedingTime.value = manual ? toDateTimeLocalValue(fedAt) : "";
  els.feedingNote.value = "";
  selectFeedSide(selectedFeedSide || "left");
  updateFeedingSideVisibility();
  showFeedingError("");
  toggleFeedingSheet(true);
}

function toggleFeedingSheet(open) {
  setSheetOpen(els.feedingSheet, open);
}

function openDiaperSheet() {
  els.diaperTime.value = "";
  showDiaperError("");
  selectDiaperType(selectedDiaperType || "pee");
  toggleDiaperSheet(true);
}

function toggleDiaperSheet(open) {
  setSheetOpen(els.diaperSheet, open);
}

function handleDiaperTypeClick(event) {
  const button = event.target.closest("[data-diaper-type]");
  if (!button) return;
  selectDiaperType(button.dataset.diaperType);
}

function selectDiaperType(type) {
  selectedDiaperType = diaperTypeKey(type) || "pee";
  document.querySelectorAll("[data-diaper-type]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.diaperType === selectedDiaperType);
  });
}

function renderFeedingTypeOptions() {
  const current = els.feedingType.value;
  const options = availableFeedingTypes();
  els.feedingTypeGroup.innerHTML = options
    .map((option) => `
      <button class="side-option feed-type-option" type="button" data-feed-type="${option.value}">
        ${option.label}
      </button>
    `)
    .join("");
  selectFeedingType(options.some((option) => option.value === current) ? current : options[0].value);
}

function handleFeedingTypeClick(event) {
  const button = event.target.closest("[data-feed-type]");
  if (!button) return;
  selectFeedingType(button.dataset.feedType);
}

function selectFeedingType(type) {
  els.feedingType.value = type || "breast";
  document.querySelectorAll("[data-feed-type]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.feedType === els.feedingType.value);
  });
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
  const fedAt = els.feedingTime.value ? new Date(els.feedingTime.value) : new Date();
  if (Number.isNaN(fedAt.getTime())) {
    showFeedingError("Horario da mamada invalido.");
    els.saveFeeding.disabled = false;
    return;
  }

  if (fedAt > new Date()) {
    showFeedingError("O horario da mamada nao pode ser no futuro.");
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

function saveDiaper() {
  if (els.saveDiaper.disabled) return;
  els.saveDiaper.disabled = true;
  const changedAt = els.diaperTime.value ? new Date(els.diaperTime.value) : new Date();
  if (Number.isNaN(changedAt.getTime())) {
    showDiaperError("Horário da troca inválido.");
    els.saveDiaper.disabled = false;
    return;
  }

  if (changedAt > new Date()) {
    showDiaperError("O horário da troca não pode ser no futuro.");
    els.saveDiaper.disabled = false;
    return;
  }

  addDiaperRecord(createDiaperRecord(changedAt, selectedDiaperType));
  toggleDiaperSheet(false);
  els.saveDiaper.disabled = false;
  render();
}

function showDiaperError(message) {
  els.diaperError.textContent = message;
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

function diaperTypeKey(value) {
  const text = String(value || "").toLowerCase();
  const hasPee = text.includes("pee") || text.includes("xixi");
  const hasPoop = text.includes("poop") || text.includes("cocô") || text.includes("coco");
  if (text.includes("both") || (hasPee && hasPoop)) return "both";
  if (hasPoop) return "poop";
  return "pee";
}

function diaperTypeLabel(value) {
  const type = diaperTypeKey(value);
  if (type === "both") return "Xixi e cocô";
  if (type === "poop") return "Cocô";
  return "Xixi";
}

function diaperHasPoop(diaper) {
  return ["poop", "both"].includes(diaperTypeKey(diaper?.diaperType || diaper?.type || diaper));
}

function diaperIdentity(diaper) {
  return diaper.id || `${diaper.at}|${diaper.type || ""}`;
}

function diaperSignature(diaper) {
  const date = new Date(diaper.at);
  const minuteKey = Number.isNaN(date.getTime())
    ? String(diaper.at || "")
    : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  return [minuteKey, diaperTypeKey(diaper.type)].join("|");
}

function dedupeDiapers(diapers = []) {
  const bySignature = new Map();
  diapers.forEach((diaper) => {
    if (!diaper || Number.isNaN(new Date(diaper.at).getTime())) return;
    const normalized = {
      ...diaper,
      type: diaperTypeKey(diaper.type),
      id: diaper.id || `diaper-legacy-${Math.abs(hashString(diaperIdentity(diaper)))}`,
      synced: Boolean(diaper.synced)
    };
    const signature = diaperSignature(normalized);
    const current = bySignature.get(signature);
    if (!current || (!current.synced && normalized.synced)) {
      bySignature.set(signature, normalized);
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

function formatFeedingAge(feeding) {
  const fedAt = new Date(feeding.at).getTime();
  const minutes = Number.isFinite(fedAt)
    ? Math.max(0, Math.floor((Date.now() - fedAt) / 60000))
    : 0;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}h${String(rest).padStart(2, "0")} min`;
}

function minutesSinceDate(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.floor((Date.now() - time) / 60000)) : 0;
}

function activeNapGoalMinutes() {
  return napGoalMinutesForIndex(napsToday().length + 1);
}

function napGoalMinutesForIndex(napIndex) {
  const samples = napDurationSamplesByIndex(napIndex);
  if (samples.length) {
    const average = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
    return clamp(average, 35, 140);
  }

  const age = currentBabyAgeMonths();
  if (age <= 4) return 60;
  if (age <= 8) return 75;
  if (age <= 15) return napIndex === 1 ? 90 : 75;
  return 90;
}

function napDurationSamplesByIndex(napIndex) {
  const byDay = new Map();
  state.naps.forEach((nap) => {
    const start = new Date(nap.start);
    if (Number.isNaN(start.getTime())) return;
    const key = recordDateInputValue(nap);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(nap);
  });

  const samples = [];
  byDay.forEach((naps) => {
    const ordered = naps.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const nap = ordered[napIndex - 1];
    if (nap) {
      const duration = safeDuration(nap);
      if (duration >= 15 && duration <= 180) samples.push(duration);
    }
  });
  return samples.slice(-10);
}

function napIndexForStart(startedAt) {
  const key = dateInputValue(startedAt);
  return state.naps.filter((nap) => {
    const start = new Date(nap.start);
    return !Number.isNaN(start.getTime()) && dateInputValue(start) === key && start < startedAt;
  }).length + 1;
}

function napGoalPercent(duration, goal) {
  const safeGoal = Math.max(1, Math.round(Number(goal) || 1));
  return clamp(Math.round((Math.max(0, Number(duration) || 0) / safeGoal) * 100), 0, 150);
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

function parseDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
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

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
