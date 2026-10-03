const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const resumeSource = source.slice(
  source.indexOf("async function resumeClosedNightSleep() {"),
  source.indexOf("function lastClosedNightForResume()")
);
const remoteSource = source.slice(
  source.indexOf("function applyRemoteActiveSession(session) {"),
  source.indexOf("function isStaleActiveSession(session) {")
) + source.slice(
  source.indexOf("function activeNightConflictsWithCurrentCycle(session) {"),
  source.indexOf("function activeSessionStartDate(session) {")
);

function setup(deleteSucceeds = true, syncRejects = false) {
  const events = [];
  const hints = [];
  const previousNight = {
    id: "previous",
    start: "2026-10-01T22:34:00.000Z",
    end: "2026-10-02T09:30:00.000Z",
    awakenings: []
  };
  const closedNight = {
    id: "current",
    start: "2026-10-02T21:53:00.000Z",
    end: "2026-10-03T10:00:00.000Z",
    awakenings: []
  };
  const state = {
    activeNapStart: null,
    activeNightStart: null,
    activeNightId: null,
    nights: [closedNight, previousNight],
    cycleStartAt: closedNight.end
  };
  const context = {
    state,
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ["2026-10-03T10:33:00.000Z"])); }
      static now() { return new Date("2026-10-03T10:33:00.000Z").getTime(); }
    },
    lastClosedNightForResume: () => closedNight,
    newNightId: () => "new",
    mergeAwakenings: (...groups) => groups.flat(),
    napIdentity: (item) => item.id,
    forgetClosedActiveSession: () => events.push("forget"),
    rememberClosedActiveSession: () => events.push("remember"),
    saveState: () => events.push("save"),
    deleteNapFromSheet: async () => {
      events.push("delete");
      return { ok: deleteSucceeds, deleted: deleteSucceeds };
    },
    syncActiveSessionToSheet: async () => {
      events.push("sync");
      if (syncRejects) state.activeNightStart = null;
    },
    syncNightToSheet: async () => events.push("restore"),
    scheduleActiveSessionWriteRetry: () => {},
    setHint: (message) => hints.push(message),
    render: () => {
      events.push("render");
      context.reconcileInvalidResumedNight();
    }
  };
  vm.createContext(context);
  vm.runInContext(resumeSource, context);
  return { context, state, events, hints, closedNight };
}

test("continuar noite preserva o timer e desconta os 33 minutos acordada", async () => {
  const { context, state, events } = setup();
  await context.resumeClosedNightSleep();

  assert.equal(state.activeNightId, "current");
  assert.equal(state.activeNightStart, "2026-10-02T21:53:00.000Z");
  assert.equal(state.cycleStartAt, "2026-10-02T09:30:00.000Z");
  assert.deepEqual(JSON.parse(JSON.stringify(state.activeNightAwakenings)), [{
    start: "2026-10-03T10:00:00.000Z",
    end: "2026-10-03T10:33:00.000Z"
  }]);
  assert.deepEqual(events, ["delete", "forget", "save", "sync", "render"]);
});

test("não remove a noite local se não conseguir remover o registro remoto", async () => {
  const { context, state, events, hints, closedNight } = setup(false);
  await context.resumeClosedNightSleep();

  assert.equal(state.activeNightStart, null);
  assert.equal(state.nights[0], closedNight);
  assert.deepEqual(events, ["delete"]);
  assert.match(hints[0], /registro anterior foi preservado/);
});

test("restaura a noite concluída se a reabertura compartilhada for rejeitada", async () => {
  const { context, state, events, hints, closedNight } = setup(true, true);
  await context.resumeClosedNightSleep();

  assert.equal(state.activeNightStart, null);
  assert.equal(state.nights[0], closedNight);
  assert.equal(state.cycleStartAt, closedNight.end);
  assert.deepEqual(events, ["delete", "forget", "save", "sync", "remember", "save", "restore", "render"]);
  assert.match(hints.at(-1), /Mantive o registro/);
});

test("outro aparelho aceita a noite reaberta e troca a soneca ativa pelo timer noturno", () => {
  const state = {
    activeNapStart: "2026-10-03T10:33:00.000Z",
    activeNapResumeId: "nap-today",
    activeNightStart: null,
    activeNightId: null,
    nights: [
      { id: "night-today", end: "2026-10-03T10:00:00.000Z" },
      { id: "night-yesterday", end: "2026-10-02T09:30:00.000Z" }
    ],
    cycleStartAt: "2026-10-03T10:00:00.000Z"
  };
  const session = {
    id: "night-today",
    type: "night",
    start: "2026-10-02T21:53:00.000Z",
    awakenings: [{ start: "2026-10-03T10:00:00.000Z", end: "2026-10-03T10:33:00.000Z" }]
  };
  const context = {
    state,
    activeSessionStartDate: (item) => new Date(item.start),
    activeSessionStartWasCorrected: () => false,
    isStaleActiveSession: () => false,
    wasRecentlyClosedActiveSession: () => false,
    shouldKeepPendingLocalActiveSession: () => false,
    napIdentity: (item) => item.id,
    timeLabel: () => "18:53",
    rememberSyncChanges: () => {},
    normalizeAwakenings: (items) => items,
    validNightAwakeStart: () => null,
    clearNotificationTimers: () => {},
    syncRemoteNotificationScheduleAbsolute: () => {},
    saveState: () => {},
    scheduleActiveNightNotifications: () => {},
    hydrateForm: () => {},
    render: () => {},
    Date
  };
  vm.createContext(context);
  vm.runInContext(remoteSource, context);

  assert.equal(context.activeNightConflictsWithCurrentCycle({ ...session, awakenings: [] }), true);
  assert.equal(context.activeNightConflictsWithCurrentCycle(session), false);
  context.applyRemoteActiveSession(session);
  assert.equal(state.activeNapStart, null);
  assert.equal(state.activeNightId, "night-today");
  assert.equal(state.cycleStartAt, "2026-10-02T09:30:00.000Z");
  assert.deepEqual(state.nights.map((night) => night.id), ["night-yesterday"]);
});
