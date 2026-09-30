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
