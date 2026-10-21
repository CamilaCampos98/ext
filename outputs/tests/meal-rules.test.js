const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../nap-pwa/google-apps-script.gs"), "utf8");
const context = vm.createContext({ LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) } });
vm.runInContext(source, context);

function sheet() {
  const rows = [["Bebê", "Regras (JSON)", "Atualizado em"]];
  return {
    rows,
    getLastRow: () => rows.length,
    appendRow: (row) => rows.push(row),
    getRange: (row, column, count) => ({
      getValues: () => rows.slice(row - 1, row - 1 + count),
      setValues: (values) => { rows[row - 1] = values[0]; }
    })
  };
}

test("regras permanentes são editadas sem duplicar o perfil e preservam a semana", () => {
  const tab = sheet();
  const rules = {
    activeTypes: { morningSnack: true, lunch: true, afternoonSnack: false, dinner: false },
    counts: { vegetables: 3, proteins: 1, greens: 1, grains: 0, beans: 0, fruits: 1 },
    rotateEffects: true, mondayEffect: "loosen"
  };
  assert.equal(context.saveMealRules(tab, { babyName: "Lívia", rules }).rules.counts.vegetables, 3);
  assert.equal(context.getMealRules(tab, "Lívia").rules.activeTypes.dinner, false);
  context.saveMealRules(tab, { babyName: "Lívia", rules: { ...rules, activeTypes: { ...rules.activeTypes, dinner: true } } });
  assert.equal(tab.rows.length, 2);
  assert.equal(context.getMealRules(tab, "Lívia").rules.activeTypes.dinner, true);
  assert.equal(context.getMealRules(tab, "Outro bebê").rules, null);
});
