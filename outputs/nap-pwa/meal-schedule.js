(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SonecaMealSchedule = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const mealTypes = ["morningSnack", "lunch", "afternoonSnack", "dinner"];
  const wakeOffsets = { morningSnack: 120, lunch: 270, afternoonSnack: 540 };

  function clockMinutes(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getHours() * 60 + date.getMinutes();
  }

  function historicalTime(records, type, now) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const times = (records || []).filter((record) => record.mealType === type)
      .map((record) => ({ at: new Date(record.at), time: clockMinutes(record.at) }))
      .filter((record) => record.time !== null && record.at < today &&
        today - record.at <= 21 * 86400000)
      .sort((a, b) => b.at - a.at).slice(0, 7)
      .map((record) => record.time).sort((a, b) => a - b);
    if (times.length < 2) return null;
    const middle = Math.floor(times.length / 2);
    return times.length % 2 ? times[middle] : Math.round((times[middle - 1] + times[middle]) / 2);
  }

  function historicalWakeOffset(records, nights, type, now) {
    const wakeByDay = new Map((nights || []).map((night) => {
      const wake = new Date(night.end);
      return [Number.isNaN(wake.getTime()) ? "" : wake.toDateString(), clockMinutes(night.end)];
    }).filter(([day, time]) => day && time !== null));
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const offsets = (records || []).filter((record) => record.mealType === type)
      .map((record) => {
        const at = new Date(record.at);
        const wake = wakeByDay.get(at.toDateString());
        return { at, offset: wake === undefined ? null : clockMinutes(record.at) - wake };
      })
      .filter((record) => record.offset !== null && record.offset >= 0 && record.offset < 12 * 60 &&
        record.at < today && today - record.at <= 21 * 86400000)
      .sort((a, b) => b.at - a.at).slice(0, 7)
      .map((record) => record.offset).sort((a, b) => a - b);
    if (offsets.length < 2) return null;
    const middle = Math.floor(offsets.length / 2);
    return offsets.length % 2 ? offsets[middle] : Math.round((offsets[middle - 1] + offsets[middle]) / 2);
  }

  function schedule(options) {
    const now = Number(options.now);
    const dayStart = Number(options.dayStart);
    const nightStart = Number(options.nightStart);
    if (![now, dayStart, nightStart].every(Number.isFinite) || nightStart <= dayStart) return [];
    const blocked = (options.sleepIntervals || []).filter((interval) =>
      Number.isFinite(interval.start) && Number.isFinite(interval.end) && interval.end > interval.start)
      .sort((a, b) => a.start - b.start);
    const completed = options.completedMeals || [];
    const latestFeeding = (options.feedings || [])
      .map((feeding) => clockMinutes(feeding.at))
      .filter((time) => time !== null && time <= now)
      .sort((a, b) => b - a)[0];
    const active = mealTypes.filter((type) => options.activeTypes?.[type]);
    const targets = Object.fromEntries(active.map((type) => {
      const wakeOffset = historicalWakeOffset(options.history, options.wakeHistory, type, options.date);
      const habitual = wakeOffset === null && options.wakeHistory === undefined
        ? historicalTime(options.history, type, options.date) : null;
      const fallback = type === "dinner" ? nightStart - 90 : dayStart + wakeOffsets[type];
      const base = wakeOffset !== null ? dayStart + wakeOffset : habitual ?? fallback;
      return [type, { habitual: wakeOffset ?? habitual, base: type === "dinner" ? Math.min(base, nightStart - 90) : base }];
    }));
    let previous = dayStart - 90;

    return active.map((type, index) => {
      const done = completed.filter((meal) => meal.mealType === type)
        .map((meal) => ({ ...meal, time: clockMinutes(meal.at) }))
        .filter((meal) => meal.time !== null).sort((a, b) => b.time - a.time)[0];
      if (done) {
        previous = Math.max(previous, done.time);
        return { type, status: "done", time: done.time };
      }

      const { habitual, base } = targets[type];
      const laterCompleted = completed.some((meal) => active.slice(index + 1).includes(meal.mealType));
      const nextTarget = targets[active[index + 1]]?.base;
      if (laterCompleted || now >= (nextTarget ?? base + 180))
        return { type, status: "passed" };
      const latest = type === "morningSnack" ? 12 * 60
        : type === "lunch" ? Math.min(15 * 60 + 30, nightStart - 180)
        : type === "afternoonSnack" && active.includes("dinner") ? nightStart - 150
          : type === "dinner" ? nightStart - 45 : nightStart - 75;
      const target = type === "afternoonSnack" && active.includes("dinner")
        ? Math.min(base, latest - 15) : base;
      const earliest = Math.max(now + 10, dayStart + 30, previous + 75,
        latestFeeding === undefined ? 0 : latestFeeding + 120);
      let time = Math.max(target, earliest);
      const movedForFeeding = time > Math.max(target, now + 10, dayStart + 30, previous + 75);
      let movedForSleep = false;
      let sleepPlacement = null;
      for (const interval of blocked) {
        if (time >= interval.start - 20 && time <= interval.end + 10) {
          const beforeNap = interval.start - 35;
          const maxAdvance = type === "morningSnack" ? 45 : 90;
          const fitsBefore = beforeNap >= earliest && beforeNap >= target - maxAdvance &&
            !blocked.some((other) => beforeNap >= other.start - 20 && beforeNap <= other.end + 10);
          time = fitsBefore ? beforeNap : interval.end + 15;
          movedForSleep = true;
          sleepPlacement = fitsBefore ? "before" : "after";
        }
      }
      if (time >= latest) return { type, status: "unavailable" };
      previous = time;
      return { type, status: "suggested", time, source: habitual === null ? "day" : "history",
        movedForSleep, sleepPlacement, movedForFeeding,
        movedForNow: time > target && !movedForSleep && !movedForFeeding };
    });
  }

  return { schedule, historicalTime, mealTypes };
});
