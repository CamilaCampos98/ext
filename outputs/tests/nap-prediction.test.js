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

function predict(today, previousNap) {
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
