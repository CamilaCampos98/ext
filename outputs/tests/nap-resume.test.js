const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const resumeSource = source.slice(
  source.indexOf("async function continueNapFromRecord(napKey) {"),
  source.indexOf("function showNightDetailCard() {")
);
const editSource = source.slice(
  source.indexOf("async function saveNapDetailEdits(napKey) {"),
  source.indexOf("function showNapEditError(napKey, message) {")
);

function setup(writeSucceeds = true) {
  const events = [];
  const errors = [];
  const nap = {
    id: "previous",
    start: "2026-10-02T10:44:00-03:00",
    end: "2026-10-02T11:28:00-03:00",
    duration: 44,
    goalDuration: 60
  };
  const state = {
    naps: [nap],
    activeNapStart: "2026-10-02T11:44:00-03:00",
    activeNapResumeId: "current",
    activeNapAwakeMinutes: 0,
    activeNapGoalDuration: 62,
    activeNightStart: null,
    babyName: "Lívia"
  };
  const context = {
    state,
    SHEETS_WEB_APP_URL: "https://example.invalid/exec",
    SHEETS_SHARED_TOKEN: "test",
    activeSessionWriteGeneration: 0,
    pendingLocalActiveSession: null,
    confirmedSharedSession: null,
    sharedSessionChecked: false,
    sharedSessionCheckFailed: false,
    refreshBeforeTimerAction: async () => {},
    napIdentity: (item) => item.id,
    newNapId: () => "merged",
    activeNapAwakeMinutes: () => state.activeNapAwakeMinutes,
    activeNapGoalMinutes: () => 62,
    currentBabyAgeMonths: () => 6,
    toLocalDateTimeValue: (date) => new Date(date).toISOString().slice(0, 16),
    activeSessionSignature: (session) => [session.id, session.start, session.napAwakeMinutes, session.napGoalDuration].join("|"),
    safeDuration: (item) => item.duration,
    showActionLoading: () => {},
    hideActionLoading: () => {},
    showNapEditError: (_, message) => errors.push(message),
    setHint: () => {},
    rememberClosedActiveSession: () => {},
    clearNotificationTimers: () => {},
    hideNapDetailCard: () => {},
    saveState: () => {},
    scheduleActiveNapNotifications: () => {},
    render: () => {},
    formatDuration: (minutes) => `${minutes} min`,
    deleteNapFromSheet: async () => { events.push("delete"); return { ok: true }; },
    fetch: async (_, options) => {
      events.push("write");
      if (!writeSucceeds) throw new Error("offline");
      const payload = JSON.parse(options.body);
      return { json: async () => ({ ok: true, session: payload }) };
    }
  };
  vm.createContext(context);
  vm.runInContext(resumeSource, context);
  return { context, state, events, errors };
}

test("junta a soneca anterior à ativa e desconta os 16 minutos acordada", async () => {
  const { context, state, events, errors } = setup();
  await context.continueNapFromRecord("previous");

  assert.deepEqual(events, ["write", "delete"]);
  assert.equal(state.activeNapResumeId, "merged");
  assert.equal(state.activeNapStart, "2026-10-02T13:44:00.000Z");
  assert.equal(state.activeNapAwakeMinutes, 16);
  assert.equal(state.naps.length, 0);
  assert.deepEqual(errors, []);
});

test("mantém a soneca anterior quando o novo timer não é confirmado", async () => {
  const { context, state, events, errors } = setup(false);
  await context.continueNapFromRecord("previous");

  assert.deepEqual(events, ["write"]);
  assert.equal(state.activeNapResumeId, "current");
  assert.equal(state.naps.length, 1);
  assert.match(errors[0], /Não consegui juntar/);
});

test("recupera o tempo acordada de uma soneca carregada da planilha", () => {
  const { context } = setup();
  assert.equal(context.napAwakeMinutesFromRecord({
    start: "2026-10-02T10:44:00-03:00",
    end: "2026-10-02T11:36:00-03:00",
    duration: 44
  }), 8);
});

test("permite corrigir o fim da soneca anterior enquanto outra está ativa", async () => {
  const events = [];
  const errors = [];
  const state = {
    activeNapStart: "2026-10-02T14:44:00.000Z",
    activeNapResumeId: "current",
    activeNightStart: null,
    naps: [{
      id: "previous",
      start: "2026-10-02T13:44:00.000Z",
      end: "2026-10-02T14:36:00.000Z",
      duration: 52,
      mood: "calma",
      synced: true
    }]
  };
  const context = {
    state,
    refreshBeforeTimerAction: async () => {},
    napIdentity: (item) => item.id,
    napDetailField: (kind) => ({ value: kind === "start" ? "2026-10-02T10:44:00-03:00" : "2026-10-02T11:28:00-03:00" }),
    showNapEditError: (_, message) => errors.push(message),
    createNapRecord: (start, end, mood, options) => ({ id: options.id, start: start.toISOString(), end: end.toISOString(), mood }),
    stableNapId: (item) => item.id,
    napAwakeMinutesFromRecord: () => 0,
    currentBabyAgeMonths: () => 6,
    applyLastWakeFromLatestNap: () => {},
    saveState: () => {},
    render: () => {},
    setHint: () => {},
    syncNapToSheet: async () => events.push("upsert")
  };
  vm.createContext(context);
  vm.runInContext(editSource, context);
  await context.saveNapDetailEdits("previous");

  assert.deepEqual(errors, []);
  assert.deepEqual(events, ["upsert"]);
  assert.equal(state.naps[0].end, "2026-10-02T14:28:00.000Z");
  assert.equal(state.activeNapResumeId, "current");
});
