const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const refreshSource = source.slice(
  source.indexOf("async function refreshBeforeTimerAction(options = {}) {"),
  source.indexOf("function scheduleActiveSessionReadRetry(")
);
const completionSource = source.slice(
  source.indexOf("async function completeNap(mood) {"),
  source.indexOf("function saveManualNap()")
);

test("encerramento aguarda a pausa compartilhada antes de calcular o sono efetivo", async () => {
  let resolveSharedSession;
  const sharedSession = new Promise((resolve) => { resolveSharedSession = resolve; });
  const saved = [];
  const state = {
    activeNapStart: "2026-10-02T13:44:00.000Z",
    activeNapResumeId: "merged",
    activeNapAwakeMinutes: 0,
    activeNapGoalDuration: 48,
    activeNightStart: null
  };
  const context = {
    state,
    SHEETS_WEB_APP_URL: "https://example.invalid/exec",
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ["2026-10-02T15:27:00.000Z"])); }
    },
    showActionLoading: () => {},
    hideActionLoading: () => {},
    setHint: () => {},
    loadActiveSessionFromSheet: async () => {
      await sharedSession;
      state.activeNapAwakeMinutes = 16;
      return { supported: true, session: { id: "merged", napAwakeMinutes: 16 } };
    },
    loadNapsFromSheet: async () => ({}),
    clearLocalActiveSessionIfCompleted: () => {},
    withTimeout: async (promise) => promise,
    activeNapAwakeMinutes: () => state.activeNapAwakeMinutes,
    newNapId: () => "new",
    createNapRecord: (start, end, mood, options) => ({
      id: options.id,
      duration: Math.round((end - start) / 60000) - options.awakeDuration
    }),
    rememberClosedActiveSession: () => {},
    clearNotificationTimers: () => {},
    saveState: () => {},
    addNapRecord: (nap) => saved.push(nap),
    completeActiveSessionInSheet: async () => ({ ok: true }),
    toggleMoodSheet: () => {},
    scheduleUpcomingNotifications: () => {},
    render: () => {}
  };
  vm.createContext(context);
  vm.runInContext(`${refreshSource}\n${completionSource}`, context);

  const completion = context.completeNap("");
  await Promise.resolve();
  assert.equal(saved.length, 0);

  resolveSharedSession();
  await completion;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].duration, 87);
});

test("não encerra sem conferir a sessão compartilhada", async () => {
  const saved = [];
  const hints = [];
  const state = {
    activeNapStart: "2026-10-02T13:44:00.000Z",
    activeNapResumeId: "merged",
    activeNapAwakeMinutes: 0,
    activeNightStart: null
  };
  const context = {
    state,
    SHEETS_WEB_APP_URL: "https://example.invalid/exec",
    showActionLoading: () => {},
    hideActionLoading: () => {},
    setHint: (message) => hints.push(message),
    loadActiveSessionFromSheet: async () => ({ supported: true, session: null, error: new Error("offline") }),
    withTimeout: async (promise) => promise,
    addNapRecord: (nap) => saved.push(nap)
  };
  vm.createContext(context);
  vm.runInContext(`${refreshSource}\n${completionSource}`, context);

  await context.completeNap("");
  assert.equal(saved.length, 0);
  assert.equal(state.activeNapResumeId, "merged");
  assert.match(hints[0], /conferir a pausa/);
});
