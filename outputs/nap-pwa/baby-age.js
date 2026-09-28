(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SonecaBabyAge = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function completedMonths(birthDate, asOf = new Date()) {
    const match = String(birthDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const birth = new Date(year, month - 1, day);
    const today = new Date(asOf);
    if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || Number.isNaN(today.getTime())) return null;
    if (birth > today) return 0;
    const months = (today.getFullYear() - year) * 12 + today.getMonth() - (month - 1) - (today.getDate() < day ? 1 : 0);
    return Math.max(0, months);
  }

  return { completedMonths };
});
