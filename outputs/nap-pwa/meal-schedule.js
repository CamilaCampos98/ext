(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SonecaMealSchedule = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const mealTypes = ["morningSnack", "lunch", "afternoonSnack", "dinner"];
  const fallbackPosition = { morningSnack: 0.2, lunch: 0.45, afternoonSnack: 0.7, dinner: 0.9 };

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
    const dayLength = nightStart - dayStart;
    const active = mealTypes.filter((type) => options.activeTypes?.[type]);
    const targets = Object.fromEntries(active.map((type) => {
      const habitual = historicalTime(options.history, type, options.date);
      return [type, { habitual, base: habitual ?? Math.round(dayStart + dayLength * fallbackPosition[type]) }];
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
      const beforeFeeding = Math.max(base, now + 10, dayStart + 30, previous + 75);
      let time = Math.max(beforeFeeding, latestFeeding === undefined ? 0 : latestFeeding + 120);
      const movedForFeeding = time > beforeFeeding;
      let movedForSleep = false;
      for (const interval of blocked) {
        if (time >= interval.start - 20 && time <= interval.end + 10) {
          time = interval.end + 15;
          movedForSleep = true;
        }
      }
      if (time > nightStart - 25) return { type, status: "unavailable" };
      previous = time;
      return { type, status: "suggested", time, source: habitual === null ? "day" : "history",
        movedForSleep, movedForFeeding, movedForNow: time > base && !movedForSleep && !movedForFeeding };
    });
  }

  return { schedule, historicalTime, mealTypes };
});
