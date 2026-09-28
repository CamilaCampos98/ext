function pushTimerKey(endpoint, id, at) {
  return JSON.stringify([endpoint, id, at]);
}

function withoutSchedule(schedules, endpoint, id, at) {
  return schedules.filter((item) => item.endpoint !== endpoint || item.id !== id || item.at !== at);
}

module.exports = { pushTimerKey, withoutSchedule };
