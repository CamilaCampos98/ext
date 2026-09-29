const test = require("node:test");
const assert = require("node:assert/strict");
const StockPots = require("../nap-pwa/stock-pots.js");

const pot = (id, at, amountMl) => ({ id, at, amountMl });

test("cada ordenha vira um pote com validade de 15 dias", () => {
  const result = StockPots.calculate([pot("a", "2026-09-01T10:00:00Z", 80)], [], [], "2026-09-02T10:00:00Z");
  assert.equal(result.pots.length, 1);
  assert.equal(result.pots[0].expiresAt, new Date("2026-09-16T10:00:00Z").getTime());
  assert.equal(result.availableMl, 80);
});

test("unifica somente os potes escolhidos, soma os ml e herda a validade mais antiga", () => {
  const pumpings = [pot("a", "2026-09-01T10:00:00Z", 80), pot("b", "2026-09-03T10:00:00Z", 50), pot("c", "2026-09-04T10:00:00Z", 40)];
  const merges = [{ id: "m", sourceId: "b", targetId: "a", at: "2026-09-05T10:00:00Z" }];
  const result = StockPots.calculate(pumpings, merges, [], "2026-09-05T11:00:00Z");
  assert.equal(result.pots.length, 2);
  assert.equal(result.pots.find((item) => item.sourceIds.includes("a")).amountMl, 130);
  assert.equal(result.pots.find((item) => item.sourceIds.includes("a")).expiresAt, new Date("2026-09-16T10:00:00Z").getTime());
  assert.equal(result.pots.find((item) => item.sourceIds.includes("c")).amountMl, 40);
});

test("desconta o uso primeiro do pote que vence antes", () => {
  const pumpings = [pot("a", "2026-09-01T10:00:00Z", 80), pot("b", "2026-09-03T10:00:00Z", 50)];
  const uses = [{ at: "2026-09-04T10:00:00Z", amountMl: 90 }];
  const result = StockPots.calculate(pumpings, [], uses, "2026-09-04T11:00:00Z");
  assert.equal(result.pots.find((item) => item.id === "a").remainingMl, 0);
  assert.equal(result.pots.find((item) => item.id === "b").remainingMl, 40);
  assert.equal(result.availableMl, 40);
});

test("uso de 70 ml esvazia o pote de 50 ml e deixa 60 ml no de 80 ml", () => {
  const pumpings = [pot("primeiro", "2026-09-01T10:00:00Z", 50), pot("segundo", "2026-09-03T10:00:00Z", 80)];
  const uses = [{ at: "2026-09-04T10:00:00Z", amountMl: 70 }];
  const result = StockPots.calculate(pumpings, [], uses, "2026-09-04T11:00:00Z");
  assert.equal(result.pots.find((item) => item.id === "primeiro").remainingMl, 0);
  assert.equal(result.pots.find((item) => item.id === "segundo").remainingMl, 60);
  assert.equal(result.availableMl, 60);
});

test("permite unificar depois um terceiro pote sem duplicar leite", () => {
  const pumpings = [pot("a", "2026-09-01T10:00:00Z", 80), pot("b", "2026-09-03T10:00:00Z", 50), pot("c", "2026-09-04T10:00:00Z", 40)];
  const merges = [
    { sourceId: "a", targetId: "b", at: "2026-09-05T10:00:00Z" },
    { sourceId: "c", targetId: "b", at: "2026-09-05T11:00:00Z" }
  ];
  const result = StockPots.calculate(pumpings, merges, [], "2026-09-05T12:00:00Z");
  assert.equal(result.pots.length, 1);
  assert.equal(result.pots[0].amountMl, 170);
  assert.equal(result.availableMl, 170);
  assert.equal(result.pots[0].expiresAt, new Date("2026-09-16T10:00:00Z").getTime());
});

test("potes vencidos deixam de contar no saldo disponível", () => {
  const result = StockPots.calculate([pot("a", "2026-09-01T10:00:00Z", 80)], [], [], "2026-09-16T10:00:00Z");
  assert.equal(result.availableMl, 0);
  assert.equal(result.expiredMl, 80);
  assert.equal(result.pots[0].expired, true);
});

test("descarte em lote retira só os potes vencidos sem apagar as ordenhas", () => {
  const pumpings = [pot("a", "2026-09-01T10:00:00Z", 80), pot("b", "2026-09-18T10:00:00Z", 50)];
  const discards = [{ at: "2026-09-20T10:00:00Z", sourceIds: ["a"], amountMl: 80 }];
  const result = StockPots.calculate(pumpings, [], [], "2026-09-20T11:00:00Z", discards);
  assert.equal(result.pots.length, 2);
  assert.equal(result.pots.find((item) => item.id === "a").discarded, true);
  assert.equal(result.pots.find((item) => item.id === "b").discarded, false);
  assert.equal(result.expiredMl, 0);
  assert.equal(result.availableMl, 50);
});

test("descarte de pote unificado identifica todas as ordenhas de origem", () => {
  const pumpings = [pot("a", "2026-09-01T10:00:00Z", 80), pot("b", "2026-09-03T10:00:00Z", 50)];
  const merges = [{ sourceId: "a", targetId: "b", at: "2026-09-04T10:00:00Z" }];
  const discards = [{ at: "2026-09-20T10:00:00Z", sourceIds: ["a", "b"], amountMl: 130 }];
  const result = StockPots.calculate(pumpings, merges, [], "2026-09-20T11:00:00Z", discards);
  assert.equal(result.pots.length, 1);
  assert.equal(result.pots[0].discarded, true);
  assert.equal(result.expiredMl, 0);
});
