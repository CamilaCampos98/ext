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
