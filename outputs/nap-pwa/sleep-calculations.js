(function exposeSleepCalculations(root, factory) {
  const calculations = factory();
  if (typeof module === "object" && module.exports) module.exports = calculations;
  if (root) root.SonecaSleepCalculations = calculations;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSleepCalculations() {
  const MAX_NIGHT_MINUTES = 16 * 60;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function elapsedMinutes(startValue, endValue) {
    const start = new Date(startValue).getTime();
    const end = new Date(endValue).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    return Math.round((end - start) / 60000);
  }

  function normalizeAwakenings(awakenings = []) {
    const ranges = awakenings
      .map((item) => {
        const start = new Date(item?.start);
        const end = new Date(item?.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
        return { start, end };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const merged = [];
    ranges.forEach((range) => {
      const last = merged[merged.length - 1];
      if (last && range.start <= last.end) {
        if (range.end > last.end) last.end = range.end;
        return;
      }
      merged.push({ start: range.start, end: range.end });
    });
    return merged;
  }

  function totalAwakeningMinutes(awakenings = []) {
    return normalizeAwakenings(awakenings).reduce((total, range) => (
      total + Math.max(1, Math.round((range.end - range.start) / 60000))
    ), 0);
  }

  function awakeMinutesFromNote(note) {
    const match = String(note || "").match(/Acordada na noite:\s*(?:(\d+)h)?\s*(?:(\d+)\s*(?:min)?)?/i);
    if (!match) return 0;
    return (Number(match[1] || 0) * 60) + Number(match[2] || 0);
  }

  function nightAwakeMinutes(night, knownElapsedMinutes = null) {
    const explicit = Number(night?.awakeDuration);
    if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);

    const awakenings = totalAwakeningMinutes(night?.awakenings || []);
    if (awakenings > 0) return awakenings;

    const fromNote = awakeMinutesFromNote(night?.note);
    if (fromNote > 0) return fromNote;

    const elapsed = Number.isFinite(knownElapsedMinutes)
      ? knownElapsedMinutes
      : elapsedMinutes(night?.start, night?.end);
    const recordedDuration = Number(night?.duration);
    if (elapsed > 0 && Number.isFinite(recordedDuration) && recordedDuration > 0 && recordedDuration < elapsed) {
      return Math.max(0, elapsed - Math.round(recordedDuration));
    }
    return 0;
  }

  function effectiveNightMinutes(night) {
    const elapsed = elapsedMinutes(night?.start, night?.end);
    if (!elapsed) return 0;

    const recordedDuration = Number(night?.duration);
    if (Number.isFinite(recordedDuration) && recordedDuration > 0 && recordedDuration <= elapsed) {
      return clamp(Math.round(recordedDuration), 0, MAX_NIGHT_MINUTES);
    }

    return clamp(elapsed - nightAwakeMinutes(night, elapsed), 0, MAX_NIGHT_MINUTES);
  }

  function totalEffectiveSleep(daySleepMinutes, nightSleepMinutes) {
    const day = Math.max(0, Math.round(Number(daySleepMinutes) || 0));
    const night = Math.max(0, Math.round(Number(nightSleepMinutes) || 0));
    return day + night;
  }

  return {
    awakeMinutesFromNote,
    effectiveNightMinutes,
    nightAwakeMinutes,
    totalAwakeningMinutes,
    totalEffectiveSleep
  };
});
