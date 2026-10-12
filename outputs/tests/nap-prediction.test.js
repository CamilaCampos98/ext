const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const predictionSource = appSource.slice(
  appSource.indexOf("function calculatePrediction() {"),
  appSource.indexOf("function pumpingPlanResult() {")
);

function predict(today, previousNap, overrides = {}) {
  const context = {
    state: { naps: [previousNap], bedtime: "19:30" },
    currentBabyAgeMonths: () => 6,
    wakeWindowForAge: () => ({ min: 120, target: 150, max: 180 }),
    napsToday: () => today,
    sleepInLast24Hours: () => 12 * 60,
    safeTimeToMinutes: (value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    },
    effectiveLastWakeMinutes: () => 7 * 60,
    customWakeWindowProfile: (profile) => ({ ...profile, custom: false }),
    averageRecentWakeWindow: () => null,
    expectedDailySleep: () => ({ min: 12, max: 16 }),
    latestNightAwakeMinutes: () => 0,
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    nowMinutes: () => 7 * 60
  };
  Object.assign(context, overrides);
  vm.runInNewContext(`${predictionSource}\nresult = calculatePrediction();`, context);
  return context.result;
}

test("a primeira soneca não herda o ajuste da última soneca de ontem", () => {
  const previousNap = { duration: 12 };
  const prediction = predict([], previousNap);

  assert.equal(prediction.minWindow, 120);
  assert.equal(prediction.targetWindow, 150);
  assert.equal(prediction.adjustmentReasons.length, 0);
});

test("uma soneca curta do ciclo atual ainda ajusta a próxima janela", () => {
  const todayNap = { duration: 12 };
  const prediction = predict([todayNap], { duration: 180 });

  assert.equal(prediction.minWindow, 100);
  assert.equal(prediction.targetWindow, 130);
  assert.equal(prediction.adjustmentReasons.length, 1);
});

test("cansaço acumulado não encurta em excesso uma janela sustentada pelo histórico recente", () => {
  const prediction = predict([{ duration: 20 }], { duration: 20 }, {
    customWakeWindowProfile: (profile) => ({
      ...profile, min: 125, target: 150, max: 185, recentUpper: 160, custom: true, samples: 5
    }),
    sleepInLast24Hours: () => 11 * 60,
    latestNightAwakeMinutes: () => 70,
    nowMinutes: () => 7 * 60 + 130
  });

  assert.equal(prediction.adjustment, -20);
  assert.ok(prediction.end - prediction.lastWakeMinutes >= 170);
  assert.ok(prediction.end > 7 * 60 + 130, "2h10 de vigília ainda não ultrapassa a janela personalizada");
});

test("janela personalizada aprende com as sonecas recentes, não com as mais antigas", () => {
  const source = appSource.slice(
    appSource.indexOf("function customWakeWindowProfile("),
    appSource.indexOf("function sleepInLast24Hours()")
  );
  const naps = [];
  for (let daysAgo = 0; daysAgo < 12; daysAgo += 1) {
    const firstEnd = new Date();
    firstEnd.setHours(10, 0, 0, 0);
    firstEnd.setDate(firstEnd.getDate() - daysAgo);
    const dayKey = `dia-${daysAgo}`;
    naps.push({ dayKey, start: new Date(firstEnd.getTime() - 30 * 60000).toISOString(), end: firstEnd.toISOString() });
    const secondStart = new Date(firstEnd.getTime() + (daysAgo < 5 ? 155 : 90) * 60000);
    naps.push({ dayKey, start: secondStart.toISOString(), end: new Date(secondStart.getTime() + 30 * 60000).toISOString() });
  }
  naps.sort((a, b) => new Date(b.end) - new Date(a.end));
  const context = {
    state: { naps, activeNapStart: null, dayStart: "07:00" },
    napsToday: () => [{}],
    recordDateInputValue: (nap) => nap.dayKey,
    safeTimeToMinutes: () => 7 * 60,
    dateToDayMinutes: () => 0,
    minutesBetweenClock: () => 0,
    DEFAULT_DAY_START: "07:00",
    clamp: (value, min, max) => Math.min(max, Math.max(min, value))
  };
  vm.runInNewContext(`${source}\nsamples = wakeWindowSamplesByNapIndex(2); profile = customWakeWindowProfile({ min: 120, target: 150, max: 180 });`, context);

  assert.equal(context.samples[0], 155);
  assert.equal(context.samples.length, 7);
  assert.ok(context.profile.target >= 145, "as últimas vigílias acima de 2h puxam a previsão para mais tarde");
  assert.ok(context.profile.max >= 170);
});

function plannedMarkers({ suggested = true, now = 16 * 60, nightStart = 18 * 60 + 5 } = {}) {
  const source = appSource.slice(
    appSource.indexOf("function plannedNapMarkers(prediction, today, night) {"),
    appSource.indexOf("function plannedNapOverlapsCompleted(")
  );
  const context = {
    state: { activeNapStart: null, activeNightStart: null },
    NIGHT_ROUTINE_NAP_CUTOFF_MINUTES: 60,
    NIGHT_ROUTINE_TRANSITION_MINUTES: 30,
    nightRoutineIsActive: () => false,
    minutesBetweenClock: (start, end) => end - start,
    nowMinutes: () => now,
    lateRescueNapPlan: () => null,
    plannedNapCount: () => 5,
    shouldSuggestNapBeforeNight: () => suggested,
    shouldSkipNextNapForNight: () => false
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const result = context.plannedNapMarkers(
    { start: 16 * 60 + 30, end: 17 * 60 },
    [{}, {}],
    { start: nightStart }
  );
  return Array.from(result);
}

test("concha não mostra soneca perto demais da rotina noturna", () => {
  const markers = plannedMarkers();

  assert.ok(markers.length > 0, "mantém soneca anterior que ainda cabe");
  assert.ok(markers.every((marker) => marker.end <= 17 * 60 + 35));
  assert.ok(markers.every((marker) => marker.target < 17 * 60 + 45));
});

test("concha não desenha quinta soneca quando o assistente prioriza a noite", () => {
  assert.equal(plannedMarkers({ suggested: false }).length, 0);
});
