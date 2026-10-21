const test = require("node:test");
const assert = require("node:assert/strict");
const menu = require("../nap-pwa/meal-menu.js");

test("a semana começa na segunda-feira e ingredientes repetidos são removidos", () => {
  assert.equal(menu.weekStart(new Date(2026, 9, 21)), "2026-10-19");
  assert.deepEqual(menu.ingredients("frango, Ovo; frango\n ovo"), ["frango", "Ovo"]);
});

test("almoço usa exatamente três legumes diferentes, uma proteína e um vegetal verde", () => {
  const plan = { weekStart: "2026-10-19", proteins: ["Frango", "Ovo"], grains: ["Arroz"], beans: ["Feijão"], vegetables: ["Cenoura", "Abóbora", "Chuchu", "Beterraba"], greens: ["Couve"] };
  const options = menu.suggestions(plan, new Date(2026, 9, 21));
  assert.equal(options.length, 3);
  assert.equal(new Set(options).size, 3);
  options.forEach((option) => {
    const parts = option.split(" + ");
    assert.equal(parts.length, 5);
    assert.equal(new Set(parts.slice(0, 3)).size, 3);
    parts.slice(0, 3).forEach((item) => assert.ok(plan.vegetables.includes(item)));
    assert.ok(plan.proteins.includes(parts[3]));
    assert.equal(parts[4], "Couve");
    assert.ok(!parts.includes("Arroz") && !parts.includes("Feijão"));
  });
  assert.deepEqual(menu.suggestions(plan, new Date(2026, 9, 26)), []);
});

test("não inventa combinações para completar três opções", () => {
  assert.deepEqual(menu.suggestions({ weekStart: "2026-10-19", proteins: ["Ovo"], greens: ["Couve"], vegetables: ["Cenoura", "Chuchu"] }, new Date(2026, 9, 21)), []);
  assert.deepEqual(menu.suggestions({ weekStart: "2026-10-19", proteins: ["Ovo"], greens: ["Couve"], vegetables: ["Cenoura", "Chuchu", "Abóbora"] }, new Date(2026, 9, 21)), ["Cenoura + Chuchu + Abóbora + Ovo + Couve"]);
  assert.deepEqual(menu.suggestions(null, new Date(2026, 9, 21)), []);
});

test("lanche usa frutas e alterna a prioridade marcada pela família entre os dias", () => {
  const plan = {
    weekStart: "2026-10-19", fruits: ["Pera", "Banana", "Mamão"], proteins: ["Ovo"],
    effects: { pera: "loosen", banana: "bind", "mamão": "loosen" }
  };
  assert.equal(menu.suggestions(plan, new Date(2026, 9, 19), "morningSnack")[0], "Pera");
  assert.equal(menu.suggestions(plan, new Date(2026, 9, 20), "morningSnack")[0], "Banana");
  assert.deepEqual(menu.suggestions(plan, new Date(2026, 9, 19), "afternoonSnack", { activeTypes: { afternoonSnack: true } }).length, 3);
  assert.deepEqual(menu.suggestions(plan, new Date(2026, 9, 19), "lunch"), []);
});

test("regras do perfil mudam quantidades, grupos e refeições ativas", () => {
  const plan = {
    weekStart: "2026-10-19", fruits: ["Pera", "Mamão"], proteins: ["Ovo"],
    vegetables: ["Abóbora", "Cenoura", "Chuchu"], greens: ["Couve"], grains: ["Arroz"], beans: ["Feijão"]
  };
  const day = new Date(2026, 9, 21);
  const rules = { counts: { vegetables: 2, proteins: 1, greens: 0, grains: 1, beans: 1, fruits: 2 },
    activeTypes: { morningSnack: true, lunch: true, afternoonSnack: true, dinner: true }, rotateEffects: false };
  const lunch = menu.suggestions(plan, day, "lunch", rules);
  assert.equal(lunch.length, 3);
  lunch.forEach((option) => {
    const parts = option.split(" + ");
    assert.equal(parts.length, 5);
    assert.ok(parts.includes("Arroz") && parts.includes("Feijão") && !parts.includes("Couve"));
  });
  assert.equal(menu.suggestions(plan, day, "dinner", rules).length, 3);
  assert.equal(menu.suggestions(plan, day, "afternoonSnack", rules)[0].split(" + ").length, 2);
  assert.deepEqual(menu.suggestions(plan, day, "dinner"), []);
});

test("almoço também prioriza a classificação alternada sem mudar sua composição", () => {
  const plan = {
    weekStart: "2026-10-19", proteins: ["Ovo"], greens: ["Couve"],
    vegetables: ["Abóbora", "Chuchu", "Cenoura", "Beterraba"],
    effects: { "abóbora": "loosen", chuchu: "loosen", cenoura: "bind", beterraba: "bind" }
  };
  const monday = menu.suggestions(plan, new Date(2026, 9, 19), "lunch")[0];
  const tuesday = menu.suggestions(plan, new Date(2026, 9, 20), "lunch")[0];
  assert.ok(monday.includes("Abóbora") && monday.includes("Chuchu"));
  assert.ok(tuesday.includes("Cenoura") && tuesday.includes("Beterraba"));
  assert.equal(monday.split(" + ").length, 5);
  assert.equal(tuesday.split(" + ").length, 5);
});
