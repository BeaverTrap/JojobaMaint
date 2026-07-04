export type StickerCategory = "mascot" | "status";

export type Sticker = {
  id: string;
  label: string;
  src: string;
  category: StickerCategory;
};

export const STICKERS: Sticker[] = [
  // ── Main mascots ──
  { id: "hardhat", label: "Hardhat quail", src: "/assets/Mascot_Hardhat.png", category: "mascot" },
  { id: "sunhat", label: "Sunhat quail", src: "/assets/Mascot_Sunhat.png", category: "mascot" },

  // ── Scene mascots ──
  { id: "tools", label: "Tools", src: "/assets/mascot/tools.png", category: "mascot" },
  { id: "welcome", label: "Welcome", src: "/assets/mascot/welcome.png", category: "mascot" },
  { id: "reading", label: "Reading", src: "/assets/mascot/reading.png", category: "mascot" },
  { id: "search", label: "Searching", src: "/assets/mascot/search.png", category: "mascot" },
  { id: "sleep", label: "Sleeping", src: "/assets/mascot/sleep.png", category: "mascot" },
  { id: "calendar", label: "Calendar", src: "/assets/mascot/calendar.png", category: "mascot" },
  { id: "map", label: "Map", src: "/assets/mascot/map.png", category: "mascot" },
  { id: "telescope", label: "Telescope", src: "/assets/mascot/telescope.png", category: "mascot" },
  { id: "water", label: "Water", src: "/assets/mascot/water.png", category: "mascot" },
  { id: "waterusage", label: "Water usage", src: "/assets/mascot/waterusage.png", category: "mascot" },
  { id: "pickup", label: "Pickup", src: "/assets/mascot/pickup.png", category: "mascot" },
  { id: "wastepickup", label: "Waste pickup", src: "/assets/mascot/wastepickup.png", category: "mascot" },
  { id: "blower", label: "Leaf blower", src: "/assets/mascot/blower.png", category: "mascot" },
  { id: "dig", label: "Digging", src: "/assets/mascot/dig_001.png", category: "mascot" },
  { id: "treeprune", label: "Tree pruning", src: "/assets/mascot/treeprune.png", category: "mascot" },
  { id: "ranger", label: "Ranger", src: "/assets/mascot/ranger.png", category: "mascot" },

  // ── Status art ──
  { id: "alert", label: "Alert", src: "/assets/status/alert.png", category: "status" },
  { id: "info", label: "Info", src: "/assets/status/info.png", category: "status" },
  { id: "planned", label: "Planned", src: "/assets/status/planned.png", category: "status" },
  { id: "all-clear", label: "All clear", src: "/assets/status/all-clear.png", category: "status" },
  { id: "power-ok", label: "Power OK", src: "/assets/status/power-ok.png", category: "status" },
  { id: "power-issue", label: "Power issue", src: "/assets/status/power-issue.png", category: "status" },
  { id: "water-ok", label: "Water OK", src: "/assets/status/water-ok.png", category: "status" },
  { id: "water-issue", label: "Water issue", src: "/assets/status/water-issue.png", category: "status" },
  { id: "laundry-ok", label: "Laundry OK", src: "/assets/status/laundry-ok.png", category: "status" },
  { id: "laundry-issue", label: "Laundry issue", src: "/assets/status/laundry-issue.png", category: "status" },
  { id: "bathroom-ok", label: "Bathroom OK", src: "/assets/status/bathroom-ok.png", category: "status" },
  { id: "bathroom-issue", label: "Bathroom issue", src: "/assets/status/bathroom-issue.png", category: "status" },
];

export const STICKER_CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: "mascot", label: "Mascots" },
  { id: "status", label: "Status" },
];
