import type { ValveRecord } from "@/lib/google-valves";

export type ValveSearchResults = {
  valves: ValveRecord[];
  zones: string[];
  lots: string[];
  primaryZones: string[];
  singleValveLookup: boolean;
};

export function naturalSort(a: string, b: string): number {
  const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
  const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

export function normalizeZone(str: string): string {
  const lower = str.toLowerCase().trim();
  const numMatch = lower.match(/(?:zone\s+)?(\d+)/) || lower.match(/z(\d+)/);
  return numMatch ? `z${numMatch[1]}` : lower;
}

export function computeValveSearchResults(
  valves: ValveRecord[],
  searchQuery: string,
): ValveSearchResults {
  if (!searchQuery.trim()) {
    return {
      valves: [],
      zones: [],
      lots: [],
      primaryZones: [],
      singleValveLookup: false,
    };
  }

  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();
  const matchingValves: ValveRecord[] = [];
  const matchingZones = new Set<string>();
  const matchingLots = new Set<string>();
  const foundValveIds = new Set<string>();
  const foundZones = new Set<string>();
  const foundLots = new Set<string>();
  const primaryZones = new Set<string>();

  for (const valve of valves) {
    if (valve.valveId.toLowerCase() === queryLower) {
      foundValveIds.add(valve.valveId);
      matchingValves.push(valve);
      for (const z of valve.zones) {
        foundZones.add(z);
        primaryZones.add(z);
      }
      for (const l of valve.lots) foundLots.add(l);
    }

    const normalizedQueryZone = normalizeZone(query);
    for (const zone of valve.zones) {
      if (normalizeZone(zone) === normalizedQueryZone) {
        foundZones.add(zone);
        matchingZones.add(zone);
        primaryZones.add(zone);
      }
    }

    for (const lot of valve.lots) {
      if (lot.toLowerCase() === queryLower) {
        foundLots.add(lot);
        matchingLots.add(lot);
      }
    }

    if (
      valve.location.toLowerCase().includes(queryLower) ||
      valve.locationNotes.toLowerCase().includes(queryLower) ||
      valve.function.toLowerCase().includes(queryLower)
    ) {
      matchingValves.push(valve);
    }
  }

  if (foundValveIds.size > 0 || foundZones.size > 0 || foundLots.size > 0) {
    for (const valve of valves) {
      if (foundValveIds.has(valve.valveId)) continue;
      const sharesZone = valve.zones.some((z) => foundZones.has(z));
      const sharesLot = valve.lots.some((l) => foundLots.has(l));
      if (sharesZone || sharesLot) matchingValves.push(valve);
    }
  }

  const uniqueValves = Array.from(
    new Map(matchingValves.map((v) => [v.valveId, v])).values(),
  );

  return {
    valves: uniqueValves,
    zones: Array.from(matchingZones),
    lots: Array.from(matchingLots),
    primaryZones: Array.from(primaryZones),
    singleValveLookup: foundValveIds.size === 1,
  };
}

export type ShutoffAnalysis = {
  zonesInScope: string[];
  completelyShutOffZones: string[];
  affectedZones: string[];
  affectedLots: string[];
  valvesByZone: { zone: string; valves: string[] }[];
};

export function analyzeShutoff(params: {
  allValves: ValveRecord[];
  searchResults: ValveSearchResults;
  zonesForSearchedLot: string[];
  lotsForSearchedZone: string[];
}): ShutoffAnalysis {
  const { allValves, searchResults, zonesForSearchedLot, lotsForSearchedZone } =
    params;

  if (searchResults.valves.length === 0) {
    return {
      zonesInScope: [],
      completelyShutOffZones: [],
      affectedZones: [],
      affectedLots: [],
      valvesByZone: [],
    };
  }

  const allZones = new Set<string>();
  const valveIds = new Set(searchResults.valves.map((v) => v.valveId));

  for (const valve of searchResults.valves) {
    for (const zone of valve.zones) allZones.add(zone);
  }

  const zonesInScope: string[] =
    searchResults.primaryZones.length > 0
      ? [...searchResults.primaryZones].sort(naturalSort)
      : zonesForSearchedLot.length > 0
        ? [...zonesForSearchedLot].sort(naturalSort)
        : Array.from(allZones).sort(naturalSort);

  const completelyShutOffZones = new Set<string>();
  const affectedZones = new Set<string>();
  const hasMultipleValves = valveIds.size > 1;

  for (const zone of zonesInScope) {
    const valvesForZone = allValves.filter((valve) =>
      valve.zones.includes(zone),
    );
    const allValvesClosed = valvesForZone.every((valve) =>
      valveIds.has(valve.valveId),
    );
    if (hasMultipleValves && allValvesClosed && valvesForZone.length > 0) {
      completelyShutOffZones.add(zone);
    } else if (valvesForZone.some((valve) => valveIds.has(valve.valveId))) {
      affectedZones.add(zone);
    }
  }

  const lotsInScope = new Set<string>();
  for (const valve of searchResults.valves) {
    const valveServesScope = valve.zones.some((z) => zonesInScope.includes(z));
    if (valveServesScope) {
      for (const lot of valve.lots) lotsInScope.add(lot);
    }
  }

  let affectedLotsArray = Array.from(lotsInScope);
  if (lotsForSearchedZone.length > 0) {
    const lotsInZoneSet = new Set(
      lotsForSearchedZone.map((l) => l.toLowerCase()),
    );
    affectedLotsArray = affectedLotsArray.filter(
      (lot) => !lotsInZoneSet.has(lot.toLowerCase()),
    );
  }
  affectedLotsArray.sort(naturalSort);

  const valvesByZone = zonesInScope.map((zone) => ({
    zone,
    valves: searchResults.valves
      .filter((v) => v.zones.includes(zone))
      .map((v) => v.valveId)
      .sort(naturalSort),
  }));

  return {
    zonesInScope,
    completelyShutOffZones: Array.from(completelyShutOffZones).sort(naturalSort),
    affectedZones: Array.from(affectedZones).sort(naturalSort),
    affectedLots: affectedLotsArray,
    valvesByZone,
  };
}

export function uniqueSortedZones(valves: ValveRecord[]): string[] {
  return Array.from(new Set(valves.flatMap((v) => v.zones).filter(Boolean))).sort(
    naturalSort,
  );
}

export function uniqueSortedValveIds(valves: ValveRecord[]): string[] {
  return Array.from(new Map(valves.map((v) => [v.valveId, v])).values())
    .map((v) => v.valveId)
    .sort(naturalSort);
}

export function buildLotZoneMap(
  valves: ValveRecord[],
): Record<string, string[]> {
  const lotToZones: Record<string, string[]> = {};
  for (const valve of valves) {
    for (const zone of valve.zones) {
      for (const lot of valve.lots) {
        if (!lotToZones[lot]) lotToZones[lot] = [];
        if (!lotToZones[lot].includes(zone)) lotToZones[lot].push(zone);
      }
    }
  }
  return lotToZones;
}
