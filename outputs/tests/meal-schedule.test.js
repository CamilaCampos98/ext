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

test("antecipa o lanche quando há espaço antes da soneca", () => {
  const result = MealSchedule.schedule({ ...base, sleepIntervals: [{ start: 9 * 60, end: 10 * 60 + 20 }] });
  assert.equal(result[0].time, 8 * 60 + 25);
  assert.equal(result[0].movedForSleep, true);
});

test("mamada às 09h deixa o lanche para 11h sem substituir a mamada", () => {
  const result = MealSchedule.schedule({ ...base, now: 9 * 60,
    feedings: [{ at: "2026-11-03T09:00:00" }] });
  assert.equal(result[0].time, 11 * 60);
  assert.equal(result[0].movedForFeeding, true);
  assert.equal(result[1].status, "suggested");
});

test("soneca entre a mamada e o lanche mantém a sugestão fora da janela de sono", () => {
  const result = MealSchedule.schedule({ ...base, now: 9 * 60,
    feedings: [{ at: "2026-11-03T09:00:00" }],
    sleepIntervals: [{ start: 10 * 60 + 30, end: 11 * 60 + 20 }] });
  assert.equal(result[0].time, 11 * 60 + 35);
  assert.equal(result[0].movedForSleep, true);
});

test("janela de soneca logo após o horário sugerido também desloca a refeição", () => {
  const result = MealSchedule.schedule({ ...base, now: 9 * 60,
    feedings: [{ at: "2026-11-03T09:00:00" }],
    sleepIntervals: [{ start: 11 * 60 + 10, end: 11 * 60 + 40 }] });
  assert.equal(result[0].time, 11 * 60 + 55);
});

test("lanche da manhã cabe antes da soneca em vez de ser empurrado para a tarde", () => {
  const result = MealSchedule.schedule({ ...base, now: 8 * 60 + 35,
    dayStart: 8 * 60 + 24, nightStart: 18 * 60 + 5,
    activeTypes: { morningSnack: true, lunch: true, afternoonSnack: true, dinner: true },
    sleepIntervals: [
      { start: 10 * 60 + 30, end: 11 * 60 + 30 },
      { start: 12 * 60, end: 13 * 60 + 25 }
    ] });
  assert.equal(result[0].status, "suggested");
  assert.equal(result[0].time, 9 * 60 + 55);
  assert.equal(result[0].movedForSleep, true);
  assert.equal(result[0].sleepPlacement, "before");
});

test("soneca antecipada desloca o lanche para depois sem jogá-lo à tarde", () => {
  const result = MealSchedule.schedule({ ...base, now: 8 * 60 + 35,
    dayStart: 8 * 60 + 24, nightStart: 18 * 60 + 5,
    sleepIntervals: [{ start: 10 * 60, end: 11 * 60 + 30 }] });
  assert.equal(result[0].time, 11 * 60 + 45);
  assert.equal(result[0].sleepPlacement, "after");
});

test("histórico acompanha o despertar em vez de repetir o relógio de outro dia", () => {
  const history = [
    { mealType: "morningSnack", at: "2026-11-01T09:00:00" },
    { mealType: "morningSnack", at: "2026-11-02T09:30:00" }
  ];
  const wakeHistory = [
    { end: "2026-11-01T07:00:00" },
    { end: "2026-11-02T07:30:00" }
  ];
  const result = MealSchedule.schedule({ ...base, dayStart: 8 * 60 + 24,
    history, wakeHistory });
  assert.equal(result[0].time, 10 * 60 + 24);
  assert.equal(result[0].source, "history");
});

test("sem histórico pareado, a referência segue o despertar atual", () => {
  const history = [
    { mealType: "morningSnack", at: "2026-11-01T09:00:00" },
    { mealType: "morningSnack", at: "2026-11-02T09:30:00" }
  ];
  const result = MealSchedule.schedule({ ...base, dayStart: 8 * 60 + 24,
    history, wakeHistory: [] });
  assert.equal(result[0].time, 10 * 60 + 24);
  assert.equal(result[0].source, "day");
});

test("rotina de referência muda com o despertar sem empurrar o jantar além da noite", () => {
  const fourMeals = { morningSnack: true, lunch: true, afternoonSnack: true, dinner: true };
  const early = MealSchedule.schedule({ ...base, dayStart: 7 * 60,
    nightStart: 19 * 60 + 15, activeTypes: fourMeals });
  const later = MealSchedule.schedule({ ...base, dayStart: 8 * 60,
    nightStart: 19 * 60 + 15, activeTypes: fourMeals });
  assert.deepEqual(early.map((meal) => meal.time), [9 * 60, 11 * 60 + 30, 16 * 60, 17 * 60 + 45]);
  assert.equal(later[0].time, 10 * 60);
  assert.equal(later[1].time, 12 * 60 + 30);
  assert.ok(later[3].time < 19 * 60 + 15 - 45);
});

test("três sonecas curtas redistribuem as refeições sem invadir o sono", () => {
  const sleepIntervals = [
    { start: 10 * 60, end: 11 * 60 + 30 },
    { start: 13 * 60, end: 13 * 60 + 40 },
    { start: 15 * 60 + 43, end: 16 * 60 + 22 }
  ];
  const result = MealSchedule.schedule({ ...base, now: 8 * 60 + 35,
    dayStart: 8 * 60 + 24, nightStart: 18 * 60 + 5,
    activeTypes: { morningSnack: true, lunch: true, afternoonSnack: true, dinner: true },
    sleepIntervals });
  assert.deepEqual(result.map((meal) => meal.time), [11 * 60 + 45, 13 * 60 + 55,
    15 * 60 + 20, 16 * 60 + 35]);
  assert.ok(result.every((meal) => meal.status === "suggested" &&
    sleepIntervals.every((nap) => meal.time < nap.start - 20 || meal.time > nap.end + 10)));
});

test("não sugere lanche da manhã à tarde se não houver espaço antes da soneca", () => {
  const result = MealSchedule.schedule({ ...base, now: 9 * 60,
    feedings: [{ at: "2026-11-03T09:00:00" }],
    sleepIntervals: [{ start: 10 * 60 + 15, end: 13 * 60 + 25 }] });
  assert.equal(result[0].status, "unavailable");
  assert.equal(result[1].status, "suggested");
});

test("mamada recente não altera o horário de refeição já registrada", () => {
  const result = MealSchedule.schedule({ ...base, now: 12 * 60,
    completedMeals: [{ mealType: "morningSnack", at: "2026-11-03T10:00:00" }],
    feedings: [{ at: "2026-11-03T11:30:00" }] });
  assert.equal(result[0].status, "done");
  assert.equal(result[0].time, 10 * 60);
  assert.ok(result[1].time >= 13 * 60 + 30);
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
