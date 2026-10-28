const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");

function loadFunction(startName, endName, context) {
  const asyncEnd = appSource.indexOf(`async function ${endName}(`);
  const end = asyncEnd >= 0 ? asyncEnd : appSource.indexOf(`function ${endName}(`);
  const source = appSource.slice(appSource.indexOf(`function ${startName}(`), end);
  vm.runInNewContext(`${source}\nresult = ${startName};`, context);
  return context.result;
}

test("sincronizador mostra a data da soneca antiga recebida hoje", () => {
  const context = {
    timeLabel: (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  };
  const detail = loadFunction("syncRecordTimeDetail", "syncSingleTimeDetail", context);

  assert.equal(detail("2026-10-04T14:16:00", "2026-10-04T14:58:00"), "04/10/2026 · 14:16–14:58");
  assert.equal(detail("2026-10-27T20:18:00", "2026-10-28T08:37:00"), "27/10/2026 20:18 – 28/10/2026 08:37");
});

test("aviso de sincronização já salvo recebe a data sem precisar importar novamente", () => {
  const display = loadFunction("syncChangeDisplayDetail", "sharedRecordSnapshot", {});

  assert.equal(display({ type: "nap", at: "2026-10-04T14:16:00", detail: "14:16–14:58" }), "04/10/2026 · 14:16–14:58");
  assert.equal(display({ type: "nap", at: "2026-10-04T14:16:00", detail: "04/10/2026 · 14:16–14:58" }), "04/10/2026 · 14:16–14:58");
});

test("planilha registra rotina em vez de janela descartada antes da noite", () => {
  const context = {
    minutesToTime: (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`,
    lateRescueNapPlan: () => null,
    shouldKeepLateNapVisible: () => false,
    shouldSuggestNapBeforeNight: () => false
  };
  const nextWindow = loadFunction("nextWindowForSheet", "syncFeedingToSheet", context);
  const prediction = { start: 17 * 60 + 10, end: 17 * 60 + 27 };
  const night = { start: 17 * 60 + 35 };

  assert.equal(nextWindow(prediction, night, [], "nap"), "Sem nova soneca · rotina 17:35");
  assert.equal(nextWindow(prediction, night, [], "night"), "17:10 - 17:27");
  context.shouldSuggestNapBeforeNight = () => true;
  assert.equal(nextWindow(prediction, night, [], "nap"), "17:10 - 17:27");
  context.lateRescueNapPlan = () => ({ start: 17 * 60 + 10, end: 17 * 60 + 25 });
  assert.equal(nextWindow(prediction, night, [], "nap"), "17:10 - 17:25");
});
