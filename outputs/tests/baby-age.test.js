const test = require("node:test");
const assert = require("node:assert/strict");
const { completedMonths } = require("../nap-pwa/baby-age.js");

test("Lívia passa de 5 para 6 meses no dia 26/09/2026", () => {
  assert.equal(completedMonths("2026-03-26", "2026-09-25T12:00:00-03:00"), 5);
  assert.equal(completedMonths("2026-03-26", "2026-09-26T00:00:00-03:00"), 6);
  assert.equal(completedMonths("2026-03-26", "2026-09-28T12:00:00-03:00"), 6);
});

test("data inválida não produz idade silenciosamente", () => {
  assert.equal(completedMonths("2026-02-31", "2026-09-28T12:00:00-03:00"), null);
});
