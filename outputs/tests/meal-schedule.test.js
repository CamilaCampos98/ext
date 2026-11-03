const test = require("node:test");
const assert = require("node:assert/strict");
const MealSchedule = require("../nap-pwa/meal-schedule.js");

const day = new Date("2026-11-03T08:00:00");
const activeTypes = { morningSnack: true, lunch: true, afternoonSnack: false, dinner: false };
const base = { date: day, now: 8 * 60, dayStart: 7 * 60, nightStart: 18 * 60 + 30,
  activeTypes, completedMeals: [], history: [], sleepIntervals: [] };

test("mostra somente refeições ativas e distribui horários quando não há histórico", () => {
  const result = MealSchedule.schedule(base);
  assert.deepEqual(result.map((item) => item.type), ["morningSnack", "lunch"]);
  assert.equal(result[0].source, "day");
  assert.ok(result[0].time < result[1].time);
});

test("histórico recente orienta o horário habitual", () => {
  const result = MealSchedule.schedule({ ...base, history: [
    { mealType: "morningSnack", at: "2026-11-01T10:00:00" },
    { mealType: "morningSnack", at: "2026-11-02T10:30:00" }
  ] });
  assert.equal(result[0].time, 10 * 60 + 15);
  assert.equal(result[0].source, "history");
});

test("refeição registrada aparece como feita e não é sugerida de novo", () => {
  const result = MealSchedule.schedule({ ...base, now: 11 * 60, completedMeals: [
    { mealType: "morningSnack", at: "2026-11-03T09:40:00" }
  ] });
  assert.equal(result[0].status, "done");
  assert.equal(result[0].time, 9 * 60 + 40);
  assert.equal(result[1].status, "suggested");
});

test("desloca o horário que coincide com uma soneca para depois dela", () => {
  const result = MealSchedule.schedule({ ...base, sleepIntervals: [{ start: 9 * 60, end: 10 * 60 + 20 }] });
  assert.equal(result[0].time, 10 * 60 + 35);
  assert.equal(result[0].movedForSleep, true);
});

test("recalcula horários atrasados sem invadir a rotina noturna", () => {
  const late = MealSchedule.schedule({ ...base, now: 11 * 60 });
  assert.ok(late[0].time >= 11 * 60 + 10);
  const tooLate = MealSchedule.schedule({ ...base, now: 18 * 60,
    activeTypes: { morningSnack: false, lunch: false, afternoonSnack: false, dinner: true } });
  assert.equal(tooLate[0].status, "unavailable");
});

test("não sugere lanche da manhã depois do almoço nem reabre horário antigo", () => {
  const afterLunch = MealSchedule.schedule({ ...base, now: 13 * 60, completedMeals: [
    { mealType: "lunch", at: "2026-11-03T12:15:00" }
  ] });
  assert.equal(afterLunch[0].status, "passed");
  assert.equal(afterLunch[1].status, "done");
});

test("lanche da tarde e jantar aparecem quando são ativados", () => {
  const result = MealSchedule.schedule({ ...base, activeTypes: {
    ...activeTypes, afternoonSnack: true, dinner: true
  } });
  assert.deepEqual(result.map((item) => item.type), MealSchedule.mealTypes);
});
