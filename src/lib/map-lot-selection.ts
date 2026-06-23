/** Shift/Ctrl multi-select for map editor sidebar and marker lists. */
export function applyListSelection(
  ids: string[],
  id: string,
  prevSelected: ReadonlySet<string>,
  lastIndex: number | null,
  modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
): { selected: Set<string>; lastIndex: number | null } {
  const index = ids.indexOf(id);
  if (index < 0) {
    return { selected: new Set(prevSelected), lastIndex };
  }

  if (modifiers.shiftKey && lastIndex != null) {
    const start = Math.min(lastIndex, index);
    const end = Math.max(lastIndex, index);
    const next = new Set(prevSelected);
    for (let i = start; i <= end; i += 1) {
      next.add(ids[i]!);
    }
    return { selected: next, lastIndex: index };
  }

  if (modifiers.ctrlKey || modifiers.metaKey) {
    const next = new Set(prevSelected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return { selected: next, lastIndex: index };
  }

  return { selected: new Set([id]), lastIndex: index };
}

/** @deprecated Use applyListSelection */
export const applyLotListSelection = applyListSelection;

export function sortLotIds(ids: Iterable<string>): string[] {
  return Array.from(ids).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}
