const test = require("node:test");
const assert = require("node:assert/strict");
const pumping = require("../nap-pwa/pumping-calculations.js");

test("calcula quatro mamadas e 600 ml para oito horas", () => {
  const now = new Date("2026-09-21T10:00:00-03:00");
  const feedings = [0, 120, 240].map((minutes, index) => ({
    at: new Date(now.getTime() - (index * 120 * 60000)).toISOString()
  }));
  const plan = pumping.calculatePlan({
    coverageHours: 8,
    mlPerFeeding: 150,
    initialStoredMl: 0,
    targetAt: "2026-09-25T10:00:00-03:00"
  }, [], feedings, now);
  assert.equal(plan.feedsNeeded, 4);
  assert.equal(plan.targetMl, 600);
  assert.equal(plan.dailyTargetMl, 150);
});

test("desconta estoque inicial e ordenhas registradas", () => {
  const plan = pumping.calculatePlan({
    coverageHours: 8,
    mlPerFeeding: 150,
    initialStoredMl: 100,
    startedAt: "2026-09-20T00:00:00-03:00",
    targetAt: "2026-09-23T10:00:00-03:00"
  }, [{ at: "2026-09-21T08:00:00-03:00", side: "left", amountMl: 80 }], [], "2026-09-21T10:00:00-03:00");
  assert.equal(plan.storedMl, 180);
  assert.equal(plan.remainingMl, 420);
  assert.equal(plan.dailyTargetMl, 210);
});

test("sugere o peito oposto ao da última mamada", () => {
  const side = pumping.suggestedSide([
    { at: "2026-09-21T09:00:00-03:00", type: "breast", side: "right" }
  ], [], { preferredSide: "left" });
  assert.equal(side, "left");
});

test("aprende o peito mais produtivo depois de três registros de cada lado", () => {
  const records = [40, 45, 50].map((amountMl, index) => ({ at: `2026-09-2${index + 1}T08:00:00-03:00`, side: "right", amountMl }))
    .concat([70, 75, 80].map((amountMl, index) => ({ at: `2026-09-2${index + 1}T09:00:00-03:00`, side: "left", amountMl })));
  assert.equal(pumping.productiveSide(records, "right"), "left");
});

test("distribui uma meta maior para o peito esquerdo de produção mais rápida", () => {
  assert.deepEqual(pumping.dailySideTargets({ dailyTargetMl: 150 }), { left: 105, right: 45, total: 150 });
});

test("aprende a proporção entre os peitos sem deixar de priorizar o esquerdo", () => {
  const targets = pumping.dailySideTargets({
    dailyTargetMl: 200,
    totals: { left: 240, leftSessions: 2, right: 160, rightSessions: 2 }
  });
  assert.deepEqual(targets, { left: 120, right: 80, total: 200 });
});

test("pausa a sugestão de estoque durante uma mamada recente", () => {
  const pause = pumping.recommendationPause([
    { at: "2026-09-21T20:45:00-03:00", type: "breast", side: "right" }
  ], [
    { at: "2026-09-21T20:00:00-03:00", side: "right", amountMl: 40 }
  ], "2026-09-21T20:49:00-03:00");
  assert.equal(pause.reason, "feeding");
  assert.equal(pause.record.side, "right");
});

test("pausa a sugestão depois de guardar leite recentemente", () => {
  const pause = pumping.recommendationPause([], [
    { at: "2026-09-21T20:00:00-03:00", side: "right", amountMl: 40 }
  ], "2026-09-21T20:49:00-03:00");
  assert.equal(pause.reason, "pumping");
});
