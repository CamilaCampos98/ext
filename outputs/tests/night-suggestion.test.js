const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const suggestionSource = appSource.slice(
  appSource.indexOf("function recentWakeAfterSimilarNaps(lastNap, ageProfile) {"),
  appSource.indexOf("function shouldSkipNextNapForNight(")
);

function setup(now = 20 * 60 + 45) {
  const state = { bedtime: "19:30", dayStart: "15:35", naps: [], nights: [] };
  const context = {
    state,
    EVENING_ROUTINE_MINUTES: 55,
    currentBabyAgeMonths: () => 6,
    wakeWindowForAge: () => ({ min: 120, target: 150, max: 180 }),
    napsToday: () => state.naps.filter((nap) => nap.day === "today"),
    effectiveLastWakeMinutes: (today = state.naps.filter((nap) => nap.day === "today")) => today[0]?.endMinute ?? 15 * 60 + 35,
    safeDuration: (nap) => nap.duration,
    wakeWindowUsedForNap: (nap) => nap.previousWake || 0,
    sleepDiaryEntry: () => ({}),
    napIdentity: (nap) => nap.id,
    latestNightAwakeMinutes: () => 0,
    nightRoutineIsActive: () => false,
    plannedNapCount: () => 3,
    safeTimeToMinutes: (value) => {
      const [hour, minute] = value.split(":").map(Number);
      return hour * 60 + minute;
    },
    nowMinutes: () => now,
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    formatDuration: (minutes) => `${minutes}min`,
    minutesToTime: (minutes) => `${String(Math.floor((minutes % 1440) / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
  };
  vm.createContext(context);
  vm.runInContext(suggestionSource, context);
  const predict = () => context.calculateNightSuggestion({ profile: { min: 120, target: 150, max: 180 } });
  return { state, context, predict };
}

function eveningNap(duration = 30, previousWake = 280) {
  return {
    id: "evening",
    day: "today",
    start: "2026-10-09T20:15:00-03:00",
    end: "2026-10-09T20:45:00-03:00",
    endMinute: 20 * 60 + 45,
    duration,
    previousWake,
    mood: "neutral"
  };
}

test("encerrar uma soneca reinicia a vigília e recalcula a noite imediatamente", () => {
  const { state, predict } = setup();
  const before = predict();
  state.naps.unshift(eveningNap());
  const after = predict();

  assert.equal(before.start, 18 * 60 + 35);
  assert.equal(after.observeStart, 21 * 60 + 45);
  assert.equal(after.start, 21 * 60 + 50);
  assert.equal(after.routineEnd, 22 * 60 + 5);
  assert.equal(after.sleepStart, 22 * 60 + 15);
  assert.equal(after.sleepEnd, 22 * 60 + 45);
  assert.match(after.reason, /encerrada às 20:45/);
});

test("cansaço anterior antecipa a nova janela sem anulá-la", () => {
  const { state, predict } = setup();
  state.naps = [eveningNap(30, 0)];
  const rested = predict();
  state.naps = [eveningNap(30, 280)];
  const tired = predict();

  assert.ok(tired.start < rested.start);
  assert.ok(tired.start >= 20 * 60 + 45 + 60);
  assert.match(tired.reason, /vigília longa anterior/);
});

test("uma soneca comum não gera rotina 10 a 20 minutos depois", () => {
  for (const duration of [20, 30, 40, 60]) {
    const { state, predict } = setup();
    state.naps = [eveningNap(duration, 360)];
    const night = predict();
    assert.ok(night.start >= 20 * 60 + 45 + 60, `soneca de ${duration}min`);
  }
});

test("soneca tardia pode deslocar sono noturno além do antigo teto fixo", () => {
  const { state, predict } = setup();
  state.naps = [eveningNap()];
  const night = predict();

  assert.ok(night.sleepTime > 19 * 60 + 30 + 75);
  assert.ok(night.sleepStart > night.start);
  assert.ok(night.observeStart >= 20 * 60 + 45);
});

test("rotina após meia-noite mantém a contagem a partir da última soneca", () => {
  const { state, context, predict } = setup(23 * 60 + 30);
  state.naps = [{
    ...eveningNap(),
    start: "2026-10-09T23:00:00-03:00",
    end: "2026-10-09T23:30:00-03:00",
    endMinute: 23 * 60 + 30
  }];
  const night = predict();

  assert.ok(night.start > 24 * 60);
  assert.equal(context.minutesUntilNightRoutine(night, 23 * 60 + 30), night.start - (23 * 60 + 30));
  assert.equal(context.minutesUntilNightRoutine(night, 30), night.start - (24 * 60 + 30));
});

test("lembrete da rotina após meia-noite continua agendável", () => {
  const source = appSource.slice(
    appSource.indexOf("function minutesUntilToday(targetMinutes"),
    appSource.indexOf("function minutesUntilTodayOrNow(targetMinutes")
  );
  const context = { normalizeDayMinutes: (minutes) => ((minutes % 1440) + 1440) % 1440 };
  vm.createContext(context);
  vm.runInContext(source, context);

  assert.equal(context.minutesUntilPlannedTime(24 * 60 + 5, 23 * 60 + 30), 35);
  assert.equal(context.minutesUntilPlannedTime(24 * 60 + 5, 2), 3);
  assert.ok(Number.isNaN(context.minutesUntilPlannedTime(24 * 60 + 5, 10)));
});

test("histórico recente de sonecas semelhantes pesa mais que o antigo", () => {
  const { state, context } = setup();
  const oldNap = { start: "2026-09-01T19:00:00-03:00", end: "2026-09-01T19:30:00-03:00", duration: 30 };
  const recentNap = { start: "2026-10-08T19:00:00-03:00", end: "2026-10-08T19:30:00-03:00", duration: 30 };
  state.naps = [eveningNap(), recentNap, oldNap];
  state.nights = [
    { start: "2026-10-08T21:00:00-03:00" },
    { start: "2026-09-01T22:30:00-03:00" }
  ];

  const history = context.recentWakeAfterSimilarNaps(state.naps[0], { max: 180 });
  assert.equal(history.samples, 2);
  assert.ok(history.minutes < 135);
  assert.ok(history.minutes > 90);
});
