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
