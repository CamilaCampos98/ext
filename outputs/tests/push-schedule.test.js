const test = require("node:test");
const assert = require("node:assert/strict");
const { pushTimerKey, withoutSchedule } = require("../push-schedule.js");

test("lembretes iguais de aparelhos diferentes têm timers distintos", () => {
  assert.notEqual(pushTimerKey("https://iphone", "soneca-ativa-30", 100), pushTimerKey("https://android", "soneca-ativa-30", 100));
});

test("entregar lembrete de um aparelho mantém o do outro", () => {
  const schedules = [
    { endpoint: "iphone", id: "soneca-ativa-30", at: 100 },
    { endpoint: "android", id: "soneca-ativa-30", at: 100 },
    { endpoint: "iphone", id: "soneca-ativa-45", at: 100 }
  ];
  assert.deepEqual(withoutSchedule(schedules, "iphone", "soneca-ativa-30", 100), schedules.slice(1));
});

test("envio antigo não apaga lembrete reagendado no mesmo aparelho", () => {
  const schedules = [
    { endpoint: "iphone", id: "soneca-alvo", at: 100 },
    { endpoint: "iphone", id: "soneca-alvo", at: 200 }
  ];
  assert.deepEqual(withoutSchedule(schedules, "iphone", "soneca-alvo", 100), schedules.slice(1));
});
