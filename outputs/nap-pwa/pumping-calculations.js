(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PumpingCalculations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  function estimateFeedingInterval(feedings, fallbackMinutes = 120) {
    const dates = (feedings || [])
      .map((item) => new Date(item.at))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b)
      .slice(-15);
    const gaps = [];
    for (let index = 1; index < dates.length; index += 1) {
      const minutes = Math.round((dates[index] - dates[index - 1]) / 60000);
      if (minutes >= 45 && minutes <= 360) gaps.push(minutes);
    }
    if (gaps.length < 2) return clamp(fallbackMinutes, 60, 360);
    gaps.sort((a, b) => a - b);
    const middle = Math.floor(gaps.length / 2);
    return gaps.length % 2 ? gaps[middle] : Math.round((gaps[middle - 1] + gaps[middle]) / 2);
  }

  function pumpingTotals(records, startedAt) {
    const start = new Date(startedAt || 0).getTime();
    const totals = { left: 0, right: 0, both: 0, total: 0, leftSessions: 0, rightSessions: 0, bothSessions: 0 };
    (records || []).forEach((record) => {
      const at = new Date(record.at || 0).getTime();
      if (Number.isNaN(at) || at < start) return;
      const amount = Math.max(0, Number(record.amountMl) || 0);
      const side = ["left", "right", "both"].includes(record.side) ? record.side : "both";
      totals[side] += amount;
      totals[`${side}Sessions`] += 1;
      totals.total += amount;
    });
    return totals;
  }

  function productiveSide(records, preferredSide = "left", startedAt) {
    const totals = pumpingTotals(records, startedAt);
    if (totals.leftSessions >= 3 && totals.rightSessions >= 3) {
      const leftAverage = totals.left / totals.leftSessions;
      const rightAverage = totals.right / totals.rightSessions;
      if (Math.abs(leftAverage - rightAverage) >= 5) return leftAverage > rightAverage ? "left" : "right";
    }
    return preferredSide === "right" ? "right" : preferredSide === "both" ? "both" : "left";
  }

  function calculatePlan(plan, records, feedings, nowValue = new Date()) {
    const intervalMinutes = clamp(plan?.feedingIntervalMinutes || 120, 60, 360);
    const coverageHours = clamp(plan?.coverageHours || 8, 1, 24);
    const mlPerFeeding = clamp(plan?.mlPerFeeding || 150, 10, 500);
    const feedsNeeded = Math.max(1, Math.ceil((coverageHours * 60) / intervalMinutes));
    const targetMl = feedsNeeded * mlPerFeeding;
    const totals = pumpingTotals(records, plan?.startedAt);
    const storedMl = Math.max(0, Number(plan?.initialStoredMl) || 0) + totals.total;
    const remainingMl = Math.max(0, targetMl - storedMl);
    const now = new Date(nowValue);
    const targetAt = new Date(plan?.targetAt || "");
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const daysRemaining = Number.isNaN(targetAt.getTime())
      ? 1
      : Math.max(1, Math.round((Date.UTC(targetAt.getFullYear(), targetAt.getMonth(), targetAt.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000));
    const totalsBeforeToday = pumpingTotals((records || []).filter((record) => {
      const at = new Date(record.at || "");
      return !Number.isNaN(at.getTime()) && at < todayStart;
    }), plan?.startedAt);
    const storedBeforeToday = Math.max(0, Number(plan?.initialStoredMl) || 0) + totalsBeforeToday.total;
    const remainingAtDayStart = Math.max(0, targetMl - storedBeforeToday);
    return {
      intervalMinutes,
      coverageHours,
      mlPerFeeding,
      feedsNeeded,
      targetMl,
      storedMl,
      remainingMl,
      daysRemaining,
      dailyTargetMl: remainingMl ? Math.ceil(remainingAtDayStart / daysRemaining) : 0,
      progressPercent: targetMl ? Math.min(100, Math.round((storedMl / targetMl) * 100)) : 0,
      totals
    };
  }

  function suggestedSide(feedings, records, plan) {
    const recentBreast = (feedings || [])
      .filter((item) => item.type === "breast" && ["left", "right", "both"].includes(item.side))
      .sort((a, b) => new Date(b.at) - new Date(a.at))[0];
    if (recentBreast?.side === "left") return "right";
    if (recentBreast?.side === "right") return "left";
    return productiveSide(records, plan?.preferredSide, plan?.startedAt);
  }

  function dailySideTargets(planResult, leftShare) {
    const dailyTarget = Math.max(0, Math.round(Number(planResult?.dailyTargetMl) || 0));
    const totals = planResult?.totals || {};
    let calculatedShare = Number(leftShare);
    if (!Number.isFinite(calculatedShare)) {
      const leftSessions = Number(totals.leftSessions) || 0;
      const rightSessions = Number(totals.rightSessions) || 0;
      const leftAverage = leftSessions ? (Number(totals.left) || 0) / leftSessions : 0;
      const rightAverage = rightSessions ? (Number(totals.right) || 0) / rightSessions : 0;
      calculatedShare = leftSessions >= 2 && rightSessions >= 2 && leftAverage + rightAverage > 0
        ? leftAverage / (leftAverage + rightAverage)
        : 0.7;
    }
    const normalizedLeftShare = clamp(calculatedShare, 0.55, 0.85);
    const left = dailyTarget ? Math.ceil(dailyTarget * normalizedLeftShare) : 0;
    return { left, right: Math.max(0, dailyTarget - left), total: dailyTarget };
  }

  function recommendationPause(feedings, records, nowValue = new Date(), feedingPauseMinutes = 45, pumpingPauseMinutes = 90) {
    const availability = recommendationAvailability(feedings, records, nowValue, feedingPauseMinutes, pumpingPauseMinutes);
    if (availability.globalPause) return availability.globalPause;
    if (!availability.left.available && !availability.right.available) {
      return { reason: "both", waitMinutes: Math.min(availability.left.waitMinutes, availability.right.waitMinutes) };
    }
    return null;
  }

  function recommendationAvailability(feedings, records, nowValue = new Date(), feedingPauseMinutes = 45, sideRecoveryMinutes = 90) {
    const now = new Date(nowValue).getTime();
    const breastfeedings = (feedings || [])
      .filter((item) => item?.type === "breast" && ["left", "right", "both"].includes(item.side))
      .map((item) => ({ item, at: new Date(item.at || "").getTime(), type: "feeding" }))
      .filter(({ at }) => Number.isFinite(at) && at <= now);
    const pumpings = (records || [])
      .filter((item) => ["left", "right", "both"].includes(item?.side))
      .map((item) => ({ item, at: new Date(item.at || "").getTime(), type: "pumping" }))
      .filter(({ at }) => Number.isFinite(at) && at <= now);
    const latestBreastfeeding = breastfeedings.slice().sort((a, b) => b.at - a.at)[0];
    const feedingAgeMinutes = latestBreastfeeding ? (now - latestBreastfeeding.at) / 60000 : Infinity;
    const allowsSimultaneousPumping = Boolean(latestBreastfeeding?.item?.pumpOtherSide)
      && ["left", "right"].includes(latestBreastfeeding.item.side);
    const forecast = nextFeedingForecast(feedings, nowValue);
    const upcomingFeedingPause = forecast && forecast.minutesUntil >= -30 && forecast.minutesUntil <= 30;
    const globalPause = feedingAgeMinutes < feedingPauseMinutes && !allowsSimultaneousPumping
      ? {
          reason: "feeding",
          record: latestBreastfeeding.item,
          waitMinutes: Math.max(1, Math.ceil(feedingPauseMinutes - feedingAgeMinutes))
        }
      : upcomingFeedingPause
        ? { reason: "upcoming-feeding", waitMinutes: Math.max(1, forecast.minutesUntil), forecast }
        : null;

    function statusFor(side) {
      const latestUse = [...breastfeedings, ...pumpings]
        .filter(({ item }) => item.side === side || item.side === "both")
        .sort((a, b) => b.at - a.at)[0];
      const ageMinutes = latestUse ? (now - latestUse.at) / 60000 : Infinity;
      const sideWait = latestUse ? Math.max(0, Math.ceil(sideRecoveryMinutes - ageMinutes)) : 0;
      const reservedForFeeding = !globalPause
        && forecast?.nextSide === side
        && forecast.minutesUntil > 30
        && forecast.minutesUntil <= sideRecoveryMinutes;
      const reservationWait = reservedForFeeding ? Math.ceil(forecast.minutesUntil) : 0;
      const waitMinutes = Math.max(sideWait, reservationWait, globalPause?.waitMinutes || 0);
      return {
        available: waitMinutes === 0 && !reservedForFeeding,
        waitMinutes,
        reason: globalPause?.reason || (reservedForFeeding ? "upcoming-feeding" : sideWait ? latestUse.type : ""),
        record: latestUse?.item,
        reservedForFeeding
      };
    }

    return { globalPause, forecast, allowsSimultaneousPumping, left: statusFor("left"), right: statusFor("right") };
  }

  function nextFeedingForecast(feedings, nowValue = new Date(), fallbackMinutes = 120) {
    const now = new Date(nowValue).getTime();
    const validFeedings = (feedings || [])
      .map((item) => ({ item, at: new Date(item.at || "").getTime() }))
      .filter(({ at }) => Number.isFinite(at) && at <= now)
      .sort((a, b) => a.at - b.at);
    const latest = validFeedings[validFeedings.length - 1];
    if (!latest) return null;
    const intervalMinutes = estimateFeedingInterval(validFeedings.map(({ item }) => item), fallbackMinutes);
    const expectedAt = new Date(latest.at + intervalMinutes * 60000);
    const minutesUntil = Math.ceil((expectedAt.getTime() - now) / 60000);
    const nextSide = latest.item.type === "breast"
      ? latest.item.side === "left" ? "right" : latest.item.side === "right" ? "left" : ""
      : "";
    return { expectedAt, minutesUntil, intervalMinutes, nextSide, lastFeeding: latest.item };
  }

  function availableSuggestedSide(preferredSide, availability) {
    const preferred = preferredSide === "right" ? "right" : "left";
    if (availability?.[preferred]?.available) return preferred;
    const alternative = preferred === "left" ? "right" : "left";
    if (availability?.[alternative]?.available) return alternative;
    return "";
  }

  return { estimateFeedingInterval, pumpingTotals, productiveSide, calculatePlan, suggestedSide, dailySideTargets, recommendationPause, recommendationAvailability, availableSuggestedSide, nextFeedingForecast };
});
