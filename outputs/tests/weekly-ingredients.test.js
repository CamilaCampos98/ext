const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../nap-pwa/google-apps-script.gs"), "utf8");
const context = vm.createContext({ LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) } });
vm.runInContext(script, context);

function sheet() {
  const rows = [["Semana", "Bebê", "Proteínas", "Grãos e tubérculos", "Feijões e leguminosas", "Legumes", "Atualizado em", "Frutas", "Classificação intestinal", "Vegetais verdes"]];
  return {
    rows,
    getLastRow: () => rows.length,
    appendRow: (row) => rows.push(row),
    getRange: (row, col, count) => ({
      getValues: () => rows.slice(row - 1, row - 1 + count),
      setValues: (values) => { rows[row - 1] = values[0]; }
    })
  };
}

test("ingredientes semanais são compartilhados e editados sem duplicar a semana", () => {
  const tab = sheet();
  const plan = { weekStart: "2026-10-19", babyName: "Lívia", fruits: ["Pera"], proteins: ["Frango"], grains: ["Arroz"], beans: ["Feijão"], vegetables: ["Cenoura", "Chuchu", "Abóbora"], greens: ["Couve"], effects: { pera: "loosen", frango: "neutral" } };
  assert.equal(context.saveWeeklyIngredients(tab, plan).plan.proteins[0], "Frango");
  assert.equal(context.getWeeklyIngredients(tab, plan.weekStart, plan.babyName).plan.fruits[0], "Pera");
  assert.equal(context.getWeeklyIngredients(tab, plan.weekStart, plan.babyName).plan.greens[0], "Couve");
  assert.equal(context.getWeeklyIngredients(tab, plan.weekStart, plan.babyName).plan.effects.pera, "loosen");
  assert.equal(tab.rows[1][0], "W2026-10-19");
  context.saveWeeklyIngredients(tab, { ...plan, proteins: ["Ovo"] });
  assert.equal(tab.rows.length, 2);
  assert.equal(context.getWeeklyIngredients(tab, plan.weekStart, plan.babyName).plan.proteins[0], "Ovo");
  assert.equal(context.getWeeklyIngredients(tab, "2026-10-26", plan.babyName).plan, null);
});
