const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../nap-pwa/app.js"), "utf8");
const previewSource = source.slice(
  source.indexOf("function updateNapDetailPreview(event) {"),
  source.indexOf("async function saveNapDetailEdits(napKey) {")
);

function setup(endValue) {
  const startInput = { value: "2026-11-03T12:57", dataset: { napEditStart: "nap-1" } };
  const endInput = { value: endValue };
  const range = { textContent: "" };
  const goalLabel = { textContent: "", dataset: { napPreviewGoal: "64" } };
  const durationLabel = { textContent: "" };
  const fields = {
    "[data-nap-edit-start]": startInput,
    "[data-nap-edit-end]": endInput,
    "[data-nap-preview-range]": range,
    "[data-nap-preview-goal]": goalLabel,
    "[data-nap-preview-duration]": durationLabel
  };
  const context = {
    els: { napDetailCard: { querySelector: (selector) => fields[selector] } },
    state: { naps: [{ id: "nap-1", awakeDuration: 5 }] },
    napIdentity: (nap) => nap.id,
    napAwakeMinutesFromRecord: (nap) => nap.awakeDuration,
    formatDuration: (minutes) => `${minutes} min`,
    timeLabel: (date) => date.toTimeString().slice(0, 5),
    napGoalPercent: (duration, goal) => Math.round(duration / goal * 100)
  };
  vm.createContext(context);
  vm.runInContext(previewSource, context);
  return { context, startInput, range, goalLabel, durationLabel };
}

test("editar o fim recalcula horário, duração líquida e percentual antes de salvar", () => {
  const { context, startInput, range, goalLabel, durationLabel } = setup("2026-11-03T13:25");
  context.updateNapDetailPreview({ target: { matches: () => true } });
  assert.equal(range.textContent, "Soneca: 12:57 - 13:25");
  assert.equal(durationLabel.textContent, "Duração: 23 min");
  assert.equal(goalLabel.textContent, "Meta: 64 min · 36% atingido");
  assert.equal(startInput.value, "2026-11-03T12:57");
});

test("horários inválidos não deixam a duração anterior aparecendo", () => {
  const { context, range, goalLabel, durationLabel } = setup("2026-11-03T12:50");
  context.updateNapDetailPreview({ target: { matches: () => true } });
  assert.equal(range.textContent, "Soneca: confira início e fim");
  assert.equal(durationLabel.textContent, "Duração: --");
  assert.equal(goalLabel.textContent, "Meta: 64 min · confira os horários");
});
