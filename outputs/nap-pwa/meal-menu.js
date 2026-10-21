(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SonecaMealMenu = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const groups = ["proteins", "grains", "beans", "vegetables", "greens", "fruits"];
  const mealTypes = ["morningSnack", "lunch", "afternoonSnack", "dinner"];
  const defaultRules = {
    activeTypes: { morningSnack: true, lunch: true, afternoonSnack: false, dinner: false },
    counts: { vegetables: 3, proteins: 1, greens: 1, grains: 0, beans: 0, fruits: 1 },
    rotateEffects: true,
    mondayEffect: "loosen"
  };

  function normalizeRules(value = {}) {
    const source = value || {};
    const activeTypes = {};
    mealTypes.forEach((type) => { activeTypes[type] = source.activeTypes?.[type] === undefined
      ? defaultRules.activeTypes[type] : Boolean(source.activeTypes[type]); });
    const counts = {};
    Object.keys(defaultRules.counts).forEach((group) => {
      const number = Number(source.counts?.[group]);
      counts[group] = source.counts?.[group] === undefined || !Number.isFinite(number)
        ? defaultRules.counts[group] : Math.max(0, Math.min(5, Math.floor(number)));
    });
    return {
      activeTypes, counts,
      rotateEffects: source.rotateEffects !== false,
      mondayEffect: source.mondayEffect === "bind" ? "bind" : "loosen"
    };
  }

  function ingredientKey(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
  }

  function weekStart(value = new Date()) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (date.getDay() + 6) % 7);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function ingredients(value) {
    const entries = Array.isArray(value) ? value : String(value || "").split(/[,;\n]+/);
    const seen = new Set();
    return entries.map((entry) => String(entry).trim().replace(/\s+/g, " "))
      .filter((entry) => {
        const key = entry.toLocaleLowerCase("pt-BR");
        if (!entry || entry.length > 50 || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 20);
  }

  function normalize(plan = {}) {
    plan = plan || {};
    const normalized = { weekStart: String(plan.weekStart || ""), updatedAt: String(plan.updatedAt || "") };
    groups.forEach((group) => { normalized[group] = ingredients(plan[group]); });
    normalized.effects = {};
    const effects = plan.effects && typeof plan.effects === "object" ? plan.effects : {};
    groups.forEach((group) => normalized[group].forEach((item) => {
      const effect = effects[ingredientKey(item)];
      normalized.effects[ingredientKey(item)] = ["bind", "loosen"].includes(effect) ? effect : "neutral";
    }));
    return normalized;
  }

  function preferredEffect(day = new Date(), rules = defaultRules) {
    const date = new Date(day);
    const start = new Date(`${weekStart(date)}T00:00:00`);
    const dayNumber = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000;
    const first = normalizeRules(rules).mondayEffect;
    return dayNumber % 2 === 0 ? first : first === "loosen" ? "bind" : "loosen";
  }

  function combinations(items, count) {
    if (count === 0) return [[]];
    if (count > items.length) return [];
    const output = [];
    function add(start, selected) {
      if (selected.length === count) { output.push(selected.slice()); return; }
      for (let index = start; index <= items.length - (count - selected.length); index += 1) {
        selected.push(items[index]);
        add(index + 1, selected);
        selected.pop();
      }
    }
    add(0, []);
    return output;
  }

  function greatestCommonDivisor(first, second) {
    while (second) [first, second] = [second, first % second];
    return first;
  }

  function suggestions(plan, day = new Date(), mealType = "lunch", rawRules = defaultRules) {
    const normalized = normalize(plan);
    if (normalized.weekStart !== weekStart(day)) return [];
    if (!mealTypes.includes(mealType)) return [];
    const rules = normalizeRules(rawRules);
    if (!rules.activeTypes[mealType]) return [];
    const snack = mealType === "morningSnack" || mealType === "afternoonSnack";
    const requiredGroups = snack ? ["fruits"] : ["vegetables", "proteins", "greens", "grains", "beans"];
    const selections = requiredGroups.filter((group) => rules.counts[group] > 0)
      .map((group) => combinations(normalized[group], rules.counts[group]));
    if (!selections.length || selections.some((choices) => !choices.length)) return [];
    const count = selections.reduce((total, choices) => total * BigInt(choices.length), 1n);
    const mealDay = new Date(day);
    const [year, month, date] = normalized.weekStart.split("-").map(Number);
    const dayIndex = Math.round((Date.UTC(mealDay.getFullYear(), mealDay.getMonth(), mealDay.getDate()) - Date.UTC(year, month - 1, date)) / 86400000);
    const preferred = preferredEffect(day, rules);
    const buckets = { preferred: [], neutral: [], other: [] };
    const start = BigInt(Math.abs(dayIndex * 7 + (mealType === "afternoonSnack" || mealType === "dinner" ? 3 : 0))) % count;
    let step = count > 5000n ? count / 4999n + 1n : 1n;
    while (greatestCommonDivisor(step, count) !== 1n) step += 1n;
    const limit = Number(count < 5000n ? count : 5000n);
    for (let offset = 0; offset < limit; offset += 1) {
      let position = (start + BigInt(offset) * step) % count;
      const choice = [];
      selections.forEach((options) => {
        const width = BigInt(options.length);
        choice.push(...options[Number(position % width)]);
        position /= width;
      });
      if (new Set(choice.map(ingredientKey)).size !== choice.length) continue;
      const balance = choice.reduce((total, item) => total + (normalized.effects[ingredientKey(item)] === "loosen" ? 1
        : normalized.effects[ingredientKey(item)] === "bind" ? -1 : 0), 0);
      const effect = balance > 0 ? "loosen" : balance < 0 ? "bind" : "neutral";
      const bucket = rules.rotateEffects && effect === preferred ? buckets.preferred
        : effect === "neutral" || !rules.rotateEffects ? buckets.neutral : buckets.other;
      if (bucket.length < 3) bucket.push(choice.join(" + "));
      if (rules.rotateEffects ? buckets.preferred.length >= 3 : buckets.neutral.length >= 3) break;
    }
    return [...buckets.preferred, ...buckets.neutral, ...buckets.other].slice(0, 3);
  }

  return { weekStart, ingredients, normalize, suggestions, ingredientKey, mealTypes, preferredEffect, normalizeRules, defaultRules };
});
