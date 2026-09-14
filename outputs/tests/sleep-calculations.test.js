const test = require("node:test");
const assert = require("node:assert/strict");
const sleep = require("../nap-pwa/sleep-calculations.js");

test("preserva a duração noturna líquida salva", () => {
  const night = {
    start: "2026-09-10T19:00:00-03:00",
    end: "2026-09-11T07:03:00-03:00",
    duration: 597
  };

  assert.equal(sleep.effectiveNightMinutes(night), 597);
  assert.equal(sleep.nightAwakeMinutes(night), 126);
});

test("desconta despertares sobrepostos apenas uma vez", () => {
  const night = {
    start: "2026-09-10T20:00:00-03:00",
    end: "2026-09-11T08:00:00-03:00",
    awakenings: [
      { start: "2026-09-11T01:00:00-03:00", end: "2026-09-11T01:30:00-03:00" },
      { start: "2026-09-11T01:20:00-03:00", end: "2026-09-11T01:50:00-03:00" }
    ]
  };

  assert.equal(sleep.totalAwakeningMinutes(night.awakenings), 50);
  assert.equal(sleep.effectiveNightMinutes(night), 670);
});

test("lê o tempo acordada da observação da planilha", () => {
  const night = {
    start: "2026-09-10T19:00:00-03:00",
    end: "2026-09-11T07:03:00-03:00",
    note: "Acordada na noite: 2h06 (23:10-23:40)"
  };

  assert.equal(sleep.nightAwakeMinutes(night), 126);
  assert.equal(sleep.effectiveNightMinutes(night), 597);
});

test("soma 9h57 de noite com 3h56 de dia", () => {
  assert.equal(sleep.totalEffectiveSleep(236, 597), 833);
});
