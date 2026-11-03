const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../nap-pwa/google-apps-script.gs"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");

function makeSheet(rows) {
  return {
    rows,
    getLastRow: () => rows.length,
    getRange: (row, column, count, width) => ({
      getValues: () => rows.slice(row - 1, row - 1 + count)
        .map((cells) => cells.slice(column - 1, column - 1 + width)),
      setValues: (values) => values.forEach((cells, index) => { rows[row - 1 + index] = cells; })
    })
  };
}

test("Apps Script atualiza todas as linhas do mesmo ID em vez de ignorar a soneca editada", () => {
  const context = vm.createContext({ LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) } });
  vm.runInContext(script, context);
  const rows = [Array(18).fill(""),
    ["old", "nap-1", "Lívia", 7, "2026-11-03 12:57:00", "2026-11-03 14:00:00", 64],
    ["old", "nap-1", "Lívia", 7, "2026-11-03 12:57:00", "2026-11-03 14:00:00", 64],
    ["other", "nap-2", "Lívia", 7, "2026-11-03 15:43:00", "2026-11-03 16:22:00", 40]];
  const sheet = makeSheet(rows);
  const result = context.upsertNapRows(sheet, [{ id: "nap-1", babyName: "Lívia", babyAge: 7,
    start: "2026-11-03T12:57:00", end: "2026-11-03T13:25:00", duration: 28, type: "nap" }]);
  assert.equal(result.upsertSupported, true);
  assert.deepEqual(Array.from(result.updated), ["nap-1"]);
  assert.equal(rows[1][5], "2026-11-03T13:25:00");
  assert.equal(rows[2][5], "2026-11-03T13:25:00");
  assert.equal(rows[1][6], 28);
  assert.equal(rows[2][6], 28);
  assert.equal(rows[3][6], 40);
});

test("leitura da planilha não apaga uma edição local ainda pendente", () => {
  const state = { naps: [{ id: "nap-1", end: "2026-11-03T13:25:00Z", synced: false, needsUpsert: true }] };
  const context = vm.createContext({ state, napIdentity: (nap) => nap.id,
    applyLastWakeFromLatestNap: () => {}, applyProfileFromLatestNap: () => {} });
  vm.runInContext(app.slice(app.indexOf("function mergeNaps(remoteNaps) {"),
    app.indexOf("function mergeNights(remoteNights) {")), context);
  context.mergeNaps([{ id: "nap-1", end: "2026-11-03T14:00:00Z", synced: true }]);
  assert.equal(state.naps[0].end, "2026-11-03T13:25:00Z");
});

test("soneca corrigida volta da planilha com a meta e o percentual preservados", () => {
  const context = vm.createContext({
    safeDuration: (nap) => Number(nap.duration), normalizeTimeField: (value) => value || "",
    moodKeyFromLabel: () => "happy", napGoalPercent: (duration, goal) => Math.round(duration / goal * 100)
  });
  vm.runInContext(app.slice(app.indexOf("function sheetRecordToNap(record) {"),
    app.indexOf("function sheetRecordToNight(record) {")), context);
  const nap = context.sheetRecordToNap({ id: "nap-1", start: "2026-11-03T12:57:00Z",
    end: "2026-11-03T13:25:00Z", duration: 28,
    note: "Meta da soneca: 1h04 (44% atingido)" });
  assert.equal(nap.duration, 28);
  assert.equal(nap.goalDuration, 64);
  assert.equal(nap.goalPercent, 44);
});

async function syncWithResponse(result) {
  const state = { naps: [{ id: "nap-1", synced: false, needsUpsert: true }], nights: [] };
  let sentAction = "";
  const context = vm.createContext({ state, SHEETS_WEB_APP_URL: "https://example.invalid/exec",
    SHEETS_SHARED_TOKEN: "test", sheetPayloadForNap: (nap) => ({ id: nap.id }),
    napIdentity: (nap) => nap.id, setHint: () => {}, saveState: () => {},
    fetch: async (_, options) => { sentAction = JSON.parse(options.body).action; return { json: async () => result }; } });
  vm.runInContext(app.slice(app.indexOf("async function syncNapsToSheet(naps, statusMessage) {"),
    app.indexOf("function sheetPayloadForNap(nap) {")), context);
  const outcome = await context.syncNapsToSheet(state.naps, "Sincronizando...");
  return { state, sentAction, outcome };
}

test("resposta antiga que ignora o ID não confirma falsamente a edição", async () => {
  const { state, sentAction, outcome } = await syncWithResponse({ ok: true, skipped: ["nap-1"] });
  assert.equal(sentAction, "upsertNap");
  assert.equal(outcome.ok, false);
  assert.equal(state.naps[0].synced, false);
});

test("edição só sai da fila quando a planilha confirma a atualização", async () => {
  const { state, outcome } = await syncWithResponse({ ok: true, upsertSupported: true, updated: ["nap-1"] });
  assert.equal(outcome.ok, true);
  assert.equal(state.naps[0].synced, true);
  assert.equal(state.naps[0].needsUpsert, false);
});
