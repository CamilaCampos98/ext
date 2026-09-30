const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../nap-pwa/google-apps-script.gs"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(script, context);

function makeSheet() {
  const rows = [["Recebido em", "ID", "Bebê", "Horário", "Alimento", "Bebeu água"]];
  return {
    rows,
    getLastRow: () => rows.length,
    getRange: (row, column, count, width) => ({
      getValues: () => rows.slice(row - 1, row - 1 + count).map((cells) => cells.slice(column - 1, column - 1 + width)),
      setValues: (values) => values.forEach((cells, index) => { rows[row - 1 + index] = cells; })
    })
  };
}

test("salva alimento, horário e água sem duplicar o mesmo registro", () => {
  const sheet = makeSheet();
  const meal = { id: "meal-1", babyName: "Lívia", at: "2026-09-30T10:15:00", food: "Banana e abóbora", water: true };
  const first = context.appendMissingMealRows(sheet, [meal]);
  const second = context.appendMissingMealRows(sheet, [meal]);
  const loaded = context.listMealRows(sheet);

  assert.deepEqual(Array.from(first.inserted), ["meal-1"]);
  assert.deepEqual(Array.from(second.skipped), ["meal-1"]);
  assert.equal(sheet.rows.length, 2);
  assert.equal(loaded.records[0].food, "Banana e abóbora");
  assert.equal(loaded.records[0].water, true);
  assert.equal(loaded.records[0].at, "2026-09-30T10:15:00");
});

test("registra explicitamente quando não bebeu água", () => {
  const sheet = makeSheet();
  context.appendMissingMealRows(sheet, [{ id: "meal-2", at: "2026-09-30T12:00:00", food: "Batata", water: false }]);
  assert.equal(context.listMealRows(sheet).records[0].water, false);
});

test("sincronização mantém registro local pendente e incorpora o recebido", () => {
  const client = vm.createContext({ state: { meals: [{ id: "local", at: "2026-09-30T10:00:00Z", food: "Banana", water: false, synced: false }] } });
  vm.runInContext(app.slice(app.indexOf("function sheetRecordToMeal(record) {"), app.indexOf("async function loadDiapersFromSheet(options = {}) {")), client);
  vm.runInContext(app.slice(app.indexOf("function mergeMeals(remoteMeals) {"), app.indexOf("function mergeDiapers(remoteDiapers) {")), client);
  const remote = client.sheetRecordToMeal({ id: "remote", at: "2026-09-30T11:00:00Z", food: "Abóbora", water: "Sim" });
  client.mergeMeals([remote]);

  assert.equal(client.state.meals.length, 2);
  assert.equal(client.state.meals[0].food, "Abóbora");
  assert.equal(client.state.meals[0].water, true);
  assert.equal(client.state.meals[1].synced, false);
});

test("a concha mostra apenas a alimentação do ciclo atual", () => {
  const now = Date.now();
  const client = vm.createContext({
    state: {
      activeNightStart: null,
      meals: [
        { id: "today", at: new Date(now - 60 * 60 * 1000).toISOString() },
        { id: "old", at: new Date(now - 24 * 60 * 60 * 1000).toISOString() }
      ]
    },
    CYCLE_START_GRACE_MINUTES: 0,
    currentCycleStartDate: () => new Date(now - 2 * 60 * 60 * 1000)
  });
  vm.runInContext(app.slice(app.indexOf("function mealsToday() {"), app.indexOf("function pumpingIdentity(record) {")), client);

  assert.deepEqual(Array.from(client.mealsToday(), (meal) => meal.id), ["today"]);
});

test("alimentação pouco antes do sono continua visível na concha noturna", () => {
  const now = Date.now();
  const client = vm.createContext({
    state: {
      activeNightStart: new Date(now - 30 * 60 * 1000).toISOString(),
      meals: [{ id: "before-night", at: new Date(now - 60 * 60 * 1000).toISOString() }]
    },
    NIGHT_PRE_START_FEEDING_GRACE_MINUTES: 90,
    currentCycleStartDate: () => new Date(now - 3 * 60 * 60 * 1000)
  });
  vm.runInContext(app.slice(app.indexOf("function mealsInActiveNight() {"), app.indexOf("function pumpingsInActiveNight() {")), client);

  assert.deepEqual(Array.from(client.mealsInActiveNight(), (meal) => meal.id), ["before-night"]);
});

test("o ícone da concha abre os detalhes de alimento, horário e água", () => {
  const card = { innerHTML: "", hidden: true };
  const client = vm.createContext({ els: { napDetailCard: card }, timeLabel: () => "10:15" });
  vm.runInContext(app.slice(app.indexOf("function markerAttributes(marker) {"), app.indexOf("function markerTimeText(label, at, type) {")), client);
  vm.runInContext(app.slice(app.indexOf("function showMealDetailCard(meal) {"), app.indexOf("function showPumpingDetailCard(record) {")), client);
  vm.runInContext(app.slice(app.indexOf("function escapeHtml(value) {"), app.indexOf("function clamp(value, min, max) {")), client);

  assert.match(client.markerAttributes({ type: "meal", id: "meal-1" }), /data-meal-id="meal-1"/);
  client.showMealDetailCard({ at: "2026-09-30T10:15:00", food: "Banana <abóbora>", water: true });
  assert.equal(card.hidden, false);
  assert.match(card.innerHTML, /10:15 · Banana &lt;abóbora&gt;/);
  assert.match(card.innerHTML, /Bebeu água/);
});
