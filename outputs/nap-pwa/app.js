const STORAGE_KEY = "soneca-pwa-state-v1";
const CIRCLE_LENGTH = 314;
const PUSH_PUBLIC_KEY = "";
const PUSH_SUBSCRIBE_ENDPOINT = "";
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx7j5ou2awvZ6qgMuiv1bDemwCpn3u2NwsG2i5ei4IfbIyuEOxKtJzNHD__kQVwnkRbow/exec";
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
  dayStart: DEFAULT_DAY_START,
  lastWake: "",
  bedtime: "19:30",
  activeNapStart: null,
  naps: []
};

let state = loadState();
let notificationTimers = [];

const els = {
  nextWindow: document.querySelector("#nextWindow"),
  nextHint: document.querySelector("#nextHint"),
  daySegments: document.querySelector("#daySegments"),
  dayNowHand: document.querySelector("#dayNowHand"),
  dayCenterTime: document.querySelector("#dayCenterTime"),
  dayCenterLabel: document.querySelector("#dayCenterLabel"),
  dayLegend: document.querySelector("#dayLegend"),
  bedtimeSuggestion: document.querySelector("#bedtimeSuggestion"),
  bedtimeReason: document.querySelector("#bedtimeReason"),
  sleepPressureRing: document.querySelector("#sleepPressureRing"),
  sleepPressure: document.querySelector("#sleepPressure"),
  napStatus: document.querySelector("#napStatus"),
  notificationState: document.querySelector("#notificationState"),
  timer: document.querySelector("#timer"),
  currentStart: document.querySelector("#currentStart"),
  currentEnd: document.querySelector("#currentEnd"),
  currentMood: document.querySelector("#currentMood"),
  startNap: document.querySelector("#startNap"),
  endNap: document.querySelector("#endNap"),
  openManualNap: document.querySelector("#openManualNap"),
  activeNapHint: document.querySelector("#activeNapHint"),
  babyName: document.querySelector("#babyName"),
  babyAge: document.querySelector("#babyAge"),
  dayStart: document.querySelector("#dayStart"),
  lastWake: document.querySelector("#lastWake"),
  bedtime: document.querySelector("#bedtime"),
  profileName: document.querySelector("#profileName"),
  profileMeta: document.querySelector("#profileMeta"),
  profileCardName: document.querySelector("#profileCardName"),
  profileCardMeta: document.querySelector("#profileCardMeta"),
  wakeWindowUsed: document.querySelector("#wakeWindowUsed"),
  sleep24h: document.querySelector("#sleep24h"),
  napCount: document.querySelector("#napCount"),
  notificationHelpText: document.querySelector("#notificationHelpText"),
  history: document.querySelector("#history"),
  requestNotifications: document.querySelector("#requestNotifications"),
  clearHistory: document.querySelector("#clearHistory"),
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
  saveManualNap: document.querySelector("#saveManualNap"),
  manualNapError: document.querySelector("#manualNapError")
};

let manualMood = "";

init();

function init() {
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
  els.babyName.value = state.babyName;
  els.babyAge.value = state.babyAge;
  els.dayStart.value = state.dayStart || DEFAULT_DAY_START;
  els.lastWake.value = state.lastWake || minutesToTime(nowMinutes());
  els.bedtime.value = state.bedtime;
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
    els.babyAge.addEventListener(eventName, updateProfile);
    els.dayStart.addEventListener(eventName, updateProfile);
    els.lastWake.addEventListener(eventName, updateProfile);
    els.bedtime.addEventListener(eventName, updateProfile);
  });

  els.startNap.addEventListener("click", startNap);
  els.endNap.addEventListener("click", () => toggleMoodSheet(true));
  els.openManualNap.addEventListener("click", openManualNapSheet);
  els.requestNotifications.addEventListener("click", requestNotificationPermission);
  els.clearHistory.addEventListener("click", clearHistory);
  els.installHelp.addEventListener("click", () => toggleInstallSheet(true));
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
  els.installSheet.addEventListener("click", (event) => {
    if (event.target === els.installSheet) toggleInstallSheet(false);
  });
  els.moodSheet.addEventListener("click", (event) => {
    if (event.target === els.moodSheet) toggleMoodSheet(false);
  });
  els.manualNapSheet.addEventListener("click", (event) => {
    if (event.target === els.manualNapSheet) toggleManualNapSheet(false);
  });
  els.history.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-nap]");
    if (button) removeNapRecord(button.dataset.deleteNap);
  });
}

function updateProfile() {
  state.babyName = els.babyName.value.trim();
  state.babyAge = clamp(Number(els.babyAge.value || 0), 0, 36);
  state.dayStart = els.dayStart.value;
  state.lastWake = els.lastWake.value;
  state.bedtime = els.bedtime.value;
  saveState();
  scheduleUpcomingNotifications();
  render();
}

function startNap() {
  if (state.activeNapStart) return;
  state.activeNapStart = new Date().toISOString();
  saveState();
  scheduleActiveNapNotifications();
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
    showManualError("Informe início e fim da soneca.");
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

  if ((endedAt - startedAt) / 60000 > 240) {
    showManualError("Confira os horários: a soneca ficou maior que 4 horas.");
    return;
  }

  const nap = createNapRecord(startedAt, endedAt, manualMood);
  addNapRecord(nap);
  toggleManualNapSheet(false);
  render();
}

function createNapRecord(startedAt, endedAt, mood) {
  return {
    id: `${startedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    babyName: state.babyName || "",
    babyAge: state.babyAge,
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

function addNapRecord(nap) {
  state.naps.unshift(nap);
  state.naps.sort((a, b) => new Date(b.end) - new Date(a.end));
  state.naps = state.naps.slice(0, 80);
  const latestWake = new Date(state.naps[0].end);
  state.lastWake = minutesToTime(latestWake.getHours() * 60 + latestWake.getMinutes());
  els.lastWake.value = state.lastWake;
  nap.babyName = state.babyName || "";
  nap.babyAge = state.babyAge;
  nap.dayStart = state.dayStart;
  nap.bedtime = state.bedtime;
  nap.lastWake = state.lastWake;
  saveState();
  syncNapToSheet(nap);
}

function removeNapRecord(napKey) {
  const nap = state.naps.find((item) => napIdentity(item) === napKey);
  state.naps = state.naps.filter((item) => napIdentity(item) !== napKey);

  if (state.naps.length) {
    const latestWake = new Date(state.naps[0].end);
    state.lastWake = minutesToTime(latestWake.getHours() * 60 + latestWake.getMinutes());
  } else {
    state.lastWake = minutesToTime(nowMinutes());
  }

  els.lastWake.value = state.lastWake;
  saveState();
  if (nap && nap.id) deleteNapFromSheet(nap.id);
  render();
}

function clearHistory() {
  state.naps = [];
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
    notify("Avisos ativados", pushResult.ok ? "Push configurado para este aparelho." : "Permissão concedida para avisos locais enquanto o app puder rodar.");
    updateNotificationHelp(pushResult.message);
    scheduleUpcomingNotifications();
    scheduleActiveNapNotifications();
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
}

function renderProfile() {
  const name = state.babyName || "Bebê";
  const age = Number.isFinite(Number(state.babyAge)) ? clamp(Number(state.babyAge), 0, 36) : 0;
  const ageLabel = `${age} ${age === 1 ? "mês" : "meses"}`;
  const dayStart = state.dayStart || state.lastWake || "--:--";

  els.profileName.textContent = name;
  els.profileMeta.textContent = ageLabel;
  els.profileCardName.textContent = name;
  els.profileCardMeta.textContent = `${ageLabel} · dia iniciado às ${dayStart}`;
}

function calculatePrediction() {
  const age = Number.isFinite(Number(state.babyAge)) ? clamp(Number(state.babyAge), 0, 36) : 0;
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
    els.nextWindow.textContent = "Soneca em andamento";
    els.nextHint.textContent = "O próximo cálculo será atualizado quando a soneca for encerrada.";
    return;
  }

  if (nowMinutes() > prediction.end) {
    const name = state.babyName || "bebê";
    els.nextWindow.textContent = "Janela aberta";
    els.nextHint.textContent = `${name} já passou do alvo provável. Observe sinais de sono e ajuste o próximo registro ao encerrar.`;
    return;
  }

  els.nextWindow.textContent = `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`;
  const target = minutesToTime(prediction.target);
  const name = state.babyName || "bebê";
  els.nextHint.textContent = `Alvo provável para ${name}: perto de ${target}. Ajustado por idade, última soneca e sono nas últimas 24h.`;
}

function renderDayPlanner(prediction) {
  const now = nowMinutes();
  const night = calculateNightSuggestion(prediction);
  const today = napsToday();
  const segments = [];

  today.forEach((nap) => {
    segments.push({
      type: "nap",
      start: dateToDayMinutes(new Date(nap.start)),
      end: dateToDayMinutes(new Date(nap.end))
    });
  });

  if (state.activeNapStart) {
    segments.push({
      type: "nap",
      start: dateToDayMinutes(new Date(state.activeNapStart)),
      end: now
    });
  } else {
    segments.push({
      type: "next",
      start: prediction.start,
      end: prediction.end
    });
  }

  segments.push({
    type: "night",
    start: night.start,
    end: night.start + 120
  });

  els.daySegments.innerHTML = segments
    .filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end))
    .map((segment) => arcPath(segment.start, Math.max(segment.start + 6, segment.end), segment.type))
    .join("");

  const nowPoint = pointOnCircle(now, 92);
  els.dayNowHand.setAttribute("x2", String(nowPoint.x));
  els.dayNowHand.setAttribute("y2", String(nowPoint.y));
  els.dayCenterTime.textContent = minutesToTime(now);
  els.dayCenterLabel.textContent = `${today.length} soneca${today.length === 1 ? "" : "s"}`;
  els.bedtimeSuggestion.textContent = minutesToTime(night.start);
  els.bedtimeReason.textContent = night.reason;
  els.dayLegend.innerHTML = `
    <span class="legend-item"><i class="legend-dot nap"></i>Sonecas</span>
    <span class="legend-item"><i class="legend-dot next"></i>Próxima</span>
    <span class="legend-item"><i class="legend-dot night"></i>Noite</span>
  `;
}

function calculateNightSuggestion(prediction) {
  const profile = prediction.profile;
  const today = napsToday();
  const lastNap = today[0];
  const lastWake = effectiveLastWakeMinutes(today);
  const plannedBedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const finalWakeWindow = clamp(profile.target + 35, profile.min + 20, profile.max + 35);
  const napSleepToday = today.reduce((sum, nap) => sum + safeDuration(nap), 0);
  const expectedNaps = expectedNapCount(profile.naps);

  let adjustment = 0;
  if (lastNap && lastNap.duration < 35) adjustment -= 25;
  if (napSleepToday < 90 && state.babyAge >= 4) adjustment -= 20;
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
  els.startNap.disabled = active;
  els.endNap.disabled = !active;
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
  els.sleep24h.textContent = formatDuration(prediction.sleep24);
  els.napCount.textContent = String(napsToday().length);
}

function renderHistory() {
  if (!state.naps.length) {
    els.history.innerHTML = `<li><span>Nenhum registro ainda</span><strong>-</strong></li>`;
    return;
  }
  els.history.innerHTML = state.naps.slice(0, 10).map((nap) => {
    const start = new Date(nap.start);
    const end = new Date(nap.end);
    return `<li><div><span>${dateLabel(start)}</span><div class="history-times"><b>${timeLabel(start)} - ${timeLabel(end)}</b><b>${formatDuration(safeDuration(nap))}</b></div></div><div class="history-actions"><div class="history-mood">${moodLabel(nap.mood)}</div><button class="delete-nap" data-delete-nap="${napIdentity(nap)}" aria-label="Excluir soneca" title="Excluir soneca">×</button></div></li>`;
  }).join("");
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

async function syncPendingNapsToSheet() {
  const pending = state.naps.filter((nap) => !nap.synced);
  if (!pending.length) return;
  await syncNapsToSheet(pending, "Sincronizando sonecas pendentes com o Google Sheets...");
}

async function syncFromSheetThenPending() {
  await loadNapsFromSheet();
  await syncPendingNapsToSheet();
}

async function loadNapsFromSheet() {
  if (!SHEETS_WEB_APP_URL) return;

  try {
    const url = `${SHEETS_WEB_APP_URL}?action=list&token=${encodeURIComponent(SHEETS_SHARED_TOKEN)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Falha ao carregar planilha.");

    const remoteNaps = (result.records || [])
      .map(sheetRecordToNap)
      .filter(Boolean);

    if (!remoteNaps.length) return;

    mergeNaps(remoteNaps);
    saveState();
    render();
    setHint(`Google Sheets carregado: ${remoteNaps.length} registro(s) encontrados.`);
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
    babyName: record.babyName || "",
    babyAge: Number(record.babyAge || 0),
    dayStart: record.dayStart || "",
    bedtime: record.bedtime || "",
    lastWake: record.lastWake || "",
    start: startedAt.toISOString(),
    end: endedAt.toISOString(),
    duration: safeDuration({ ...record, start: startedAt.toISOString(), end: endedAt.toISOString() }),
    mood: moodKeyFromLabel(record.mood),
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
    const latestWake = new Date(state.naps[0].end);
    state.lastWake = minutesToTime(latestWake.getHours() * 60 + latestWake.getMinutes());
    applyProfileFromLatestNap();
  }
}

function applyProfileFromLatestNap() {
  const latest = state.naps[0];
  if (!latest) return;

  if (latest.babyName) state.babyName = latest.babyName;
  if (Number(latest.babyAge) > 0) state.babyAge = clamp(Number(latest.babyAge), 0, 36);
  if (latest.dayStart) state.dayStart = latest.dayStart;
  if (latest.bedtime) state.bedtime = latest.bedtime;

  els.babyName.value = state.babyName;
  els.babyAge.value = state.babyAge;
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
  const babyName = nap.babyName || state.babyName || "Bebê";
  const babyAge = Number(nap.babyAge || state.babyAge || 0);
  const dayStart = nap.dayStart || state.dayStart || state.lastWake;
  const bedtime = nap.bedtime || state.bedtime;
  const lastWake = state.lastWake || nap.lastWake;
  const payload = {
    id: nap.id || napIdentity(nap),
    babyName,
    babyAge,
    dayStart,
    start: new Date(nap.start).toISOString(),
    end: new Date(nap.end).toISOString(),
    duration: safeDuration(nap),
    mood: moodLabel(nap.mood),
    lastWake,
    bedtime,
    sleep24: prediction.sleep24,
    napCount: napsToday().length,
    wakeWindow: `${formatDuration(prediction.minWindow)} - ${formatDuration(prediction.maxWindow)}`,
    nextWindow: `${minutesToTime(prediction.start)} - ${minutesToTime(prediction.end)}`,
    nightSuggestion: minutesToTime(night.start),
    note: ""
  };
  return payload;
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

function scheduleUpcomingNotifications() {
  clearNotificationTimers();
  if (!canNotify() || state.activeNapStart) return;
  const prediction = calculatePrediction();
  const now = nowMinutes();
  const reminders = [
    { at: prediction.start - 15, title: "Janela chegando", body: `Próxima soneca provável entre ${minutesToTime(prediction.start)} e ${minutesToTime(prediction.end)}.` },
    { at: prediction.target, title: "Hora provável da soneca", body: "A pressão de sono está perto do alvo calculado." }
  ];
  reminders.forEach((reminder) => {
    const delay = (reminder.at - now) * 60000;
    if (delay > 0 && delay < 12 * 60 * 60000) {
      notificationTimers.push(setTimeout(() => notify(reminder.title, reminder.body), delay));
    }
  });
}

function scheduleActiveNapNotifications() {
  if (!canNotify() || !state.activeNapStart) return;
  const started = new Date(state.activeNapStart).getTime();
  [
    { minute: 30, body: "Soneca há 30 minutos. Observe se vai emendar o próximo ciclo." },
    { minute: 45, body: "Soneca há 45 minutos. Muitos bebês mudam de ciclo nessa faixa." },
    { minute: 90, body: "Soneca há 1h30. Vale observar a rotina do resto do dia." }
  ].forEach((item) => {
    const delay = started + item.minute * 60000 - Date.now();
    if (delay > 0) {
      notificationTimers.push(setTimeout(() => notify("Soneca em andamento", item.body), delay));
    }
  });
}

function clearNotificationTimers() {
  notificationTimers.forEach((timer) => clearTimeout(timer));
  notificationTimers = [];
}

function notify(title, body) {
  if (!canNotify()) return;
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "notify", title, body });
    return;
  }
  new Notification(title, { body, icon: "icon.svg" });
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
  if (!PUSH_PUBLIC_KEY || !PUSH_SUBSCRIBE_ENDPOINT) {
    return {
      ok: false,
      message: "Permissão OK. Para push real com o app fechado, falta backend Web Push: chave VAPID pública e endpoint para salvar a assinatura deste iPhone."
    };
  }

  const registration = await ensureServiceWorkerReady();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUSH_PUBLIC_KEY)
  });

  const response = await fetch(PUSH_SUBSCRIBE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });

  if (!response.ok) {
    return { ok: false, message: "Permissão OK, mas o backend não aceitou a assinatura push deste aparelho." };
  }

  return { ok: true, message: "Push real ativado para este aparelho. O servidor já pode enviar avisos com o app fechado." };
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
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
  const dayStart = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60);
  const bedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const napSleep = napsInCurrentDay().reduce((sum, nap) => sum + safeDuration(nap), 0);
  return clamp(napSleep + estimateNightSleepMinutes(bedtime, dayStart), 0, 24 * 60);
}

function estimateNightSleepMinutes(bedtime = safeTimeToMinutes(state.bedtime, 19 * 60 + 30), morning = safeTimeToMinutes(state.dayStart || state.lastWake, 7 * 60)) {
  const duration = bedtime <= morning ? morning - bedtime : 24 * 60 - bedtime + morning;
  return clamp(duration, 0, 13 * 60);
}

function napsToday() {
  return napsInCurrentDay();
}

function napsInCurrentDay() {
  const operationalNaps = operationalDayNaps();
  if (operationalNaps.length) return operationalNaps;

  const calendarNaps = calendarDayNaps();
  return calendarNaps.length ? calendarNaps : operationalNaps;
}

function operationalDayNaps() {
  const now = new Date();
  const startMinutes = safeTimeToMinutes(state.dayStart, 7 * 60);
  const start = new Date(now);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  const bedtimeMinutes = safeTimeToMinutes(state.bedtime, 19 * 60 + 30);
  const end = new Date(start);
  end.setHours(Math.floor(bedtimeMinutes / 60), bedtimeMinutes % 60, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);

  return state.naps.filter((nap) => {
    const napStart = new Date(nap.start);
    return !Number.isNaN(napStart.getTime()) && napStart >= start && napStart <= end;
  });
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

function dateToDayMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function arcPath(startMinutes, endMinutes, type) {
  const start = normalizeDayMinutes(startMinutes);
  let end = normalizeDayMinutes(endMinutes);
  if (end <= start) end += 24 * 60;

  const startPoint = pointOnCircle(start, 92);
  const endPoint = pointOnCircle(end, 92);
  const largeArc = end - start > 12 * 60 ? 1 : 0;

  return `<path class="day-ring-segment ${type}" d="M ${startPoint.x} ${startPoint.y} A 92 92 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}"></path>`;
}

function pointOnCircle(minutes, radius) {
  const angle = (normalizeDayMinutes(minutes) / (24 * 60)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: roundSvg(120 + Math.cos(angle) * radius),
    y: roundSvg(120 + Math.sin(angle) * radius)
  };
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
    loaded.dayStart = loaded.dayStart || DEFAULT_DAY_START;
    loaded.babyAge = Number.isFinite(Number(loaded.babyAge)) ? clamp(Number(loaded.babyAge), 0, 36) : defaultState.babyAge;
    loaded.naps = (loaded.naps || []).map((nap) => ({
      ...nap,
      id: nap.id || stableNapId(nap),
      dayStart: nap.dayStart || loaded.dayStart,
      babyAge: Number.isFinite(Number(nap.babyAge)) ? Number(nap.babyAge) : loaded.babyAge,
      duration: safeDuration(nap),
      synced: Boolean(nap.synced)
    }));
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

function toggleMoodSheet(open) {
  if (open && !state.activeNapStart) return;
  els.moodSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function openManualNapSheet() {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 60000);
  els.manualStart.value = toDateTimeLocalValue(start);
  els.manualEnd.value = toDateTimeLocalValue(end);
  showManualError("");
  selectManualMood("");
  toggleManualNapSheet(true);
}

function toggleManualNapSheet(open) {
  els.manualNapSheet.setAttribute("aria-hidden", open ? "false" : "true");
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

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function safeTimeToMinutes(value, fallback) {
  if (typeof value !== "string" || !value.includes(":")) return fallback;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  return clamp(hours * 60 + minutes, 0, 23 * 60 + 59);
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

function dateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--/--";
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
