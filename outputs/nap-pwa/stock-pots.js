(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StockPots = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SHELF_LIFE_MS = 15 * 24 * 60 * 60 * 1000;

  function calculate(pumpings = [], merges = [], uses = [], nowValue = new Date(), discards = []) {
    const now = new Date(nowValue).getTime();
    const pots = new Map();
    (pumpings || []).forEach((record) => {
      const extractedAt = new Date(record.at).getTime();
      const amountMl = Math.round(Number(record.amountMl) || 0);
      if (!record.id || !Number.isFinite(extractedAt) || extractedAt > now || amountMl < 1) return;
      pots.set(String(record.id), { id: String(record.id), sourceIds: [String(record.id)], extractedAt, expiresAt: extractedAt + SHELF_LIFE_MS, amountMl, remainingMl: amountMl });
    });
    const parent = new Map([...pots.keys()].map((id) => [id, id]));
    function rootOf(id) {
      if (!parent.has(id)) return null;
      const parentId = parent.get(id);
      if (parentId === id) return id;
      const rootId = rootOf(parentId);
      parent.set(id, rootId);
      return rootId;
    }
    (merges || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((merge) => {
      if (new Date(merge.at).getTime() > now) return;
      const sourceRoot = rootOf(String(merge.sourceId));
      const targetRoot = rootOf(String(merge.targetId));
      if (sourceRoot && targetRoot && sourceRoot !== targetRoot) parent.set(sourceRoot, targetRoot);
    });
    const grouped = new Map();
    pots.forEach((pot) => {
      const rootId = rootOf(pot.id);
      if (!grouped.has(rootId)) grouped.set(rootId, { id: rootId, sourceIds: [], extractedAt: pot.extractedAt, expiresAt: pot.expiresAt, amountMl: 0, remainingMl: 0 });
      const group = grouped.get(rootId);
      group.sourceIds.push(pot.id);
      group.extractedAt = Math.min(group.extractedAt, pot.extractedAt);
      group.expiresAt = Math.min(group.expiresAt, pot.expiresAt);
      group.amountMl += pot.amountMl;
      group.remainingMl += pot.amountMl;
    });
    const allPots = [...grouped.values()];
    let unallocatedUseMl = 0;
    (uses || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((use) => {
      const usedAt = new Date(use.at).getTime();
      if (!Number.isFinite(usedAt) || usedAt > now) return;
      let amount = Math.max(0, Math.round(Number(use.amountMl) || 0));
      allPots.filter((pot) => pot.extractedAt <= usedAt && pot.expiresAt > usedAt && pot.remainingMl > 0)
        .sort((a, b) => a.expiresAt - b.expiresAt)
        .forEach((pot) => {
          const taken = Math.min(amount, pot.remainingMl);
          pot.remainingMl -= taken;
          amount -= taken;
        });
      unallocatedUseMl += amount;
    });
    const discardedIds = new Set((discards || []).filter((discard) => new Date(discard.at).getTime() <= now)
      .flatMap((discard) => Array.isArray(discard.sourceIds) ? discard.sourceIds.map(String) : []));
    allPots.forEach((pot) => {
      pot.expired = pot.expiresAt <= now;
      pot.discarded = pot.expired && pot.sourceIds.some((id) => discardedIds.has(id));
    });
    allPots.sort((a, b) => a.expired - b.expired || a.expiresAt - b.expiresAt);
    return {
      pots: allPots,
      availableMl: allPots.filter((pot) => !pot.expired).reduce((sum, pot) => sum + pot.remainingMl, 0),
      expiredMl: allPots.filter((pot) => pot.expired && !pot.discarded).reduce((sum, pot) => sum + pot.remainingMl, 0),
      unallocatedUseMl
    };
  }

  return { calculate, SHELF_LIFE_MS };
});
