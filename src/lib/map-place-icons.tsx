"use client";

import {
  FaTools,
  FaIndustry,
  FaGolfBall,
  FaPalette,
  FaFlask,
  FaBullseye,
  FaTrash,
} from "react-icons/fa";
import {
  MdLocalFlorist,
  MdScience,
  MdPalette,
  MdWater,
  MdDirectionsBoat,
  MdSportsTennis,
  MdExitToApp,
  MdPets,
  MdDelete,
  MdPlace,
  MdLocalLaundryService,
  MdWbSunny,
} from "react-icons/md";
import { GiWaterTank } from "react-icons/gi";

export type PlaceIconName =
  | "FaTools"
  | "FaIndustry"
  | "FaGolfBall"
  | "FaPalette"
  | "FaFlask"
  | "FaBullseye"
  | "FaTrash"
  | "MdLocalFlorist"
  | "MdScience"
  | "MdPalette"
  | "MdWater"
  | "MdDirectionsBoat"
  | "MdSportsTennis"
  | "MdExitToApp"
  | "MdPets"
  | "MdDelete"
  | "MdPlace"
  | "MdLocalLaundryService"
  | "MdWbSunny"
  | "GiWaterTank";

export type PlaceMarkerColor =
  | "gray"
  | "slate"
  | "amber"
  | "orange"
  | "green"
  | "emerald"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "pink"
  | "red";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FaTools,
  FaIndustry,
  FaGolfBall,
  FaPalette,
  FaFlask,
  FaBullseye,
  FaTrash,
  MdLocalFlorist,
  MdScience,
  MdPalette,
  MdWater,
  MdDirectionsBoat,
  MdSportsTennis,
  MdExitToApp,
  MdPets,
  MdDelete,
  MdPlace,
  MdLocalLaundryService,
  MdWbSunny,
  GiWaterTank,
};

export const DEFAULT_PLACE_ICON = "MdPlace";

export const PLACE_ICON_OPTIONS: { value: PlaceIconName; label: string }[] = [
  { value: "MdPlace", label: "Generic place" },
  { value: "MdWbSunny", label: "Weather / sun" },
  { value: "FaTools", label: "Tools / shop" },
  { value: "FaIndustry", label: "Metal / industry" },
  { value: "MdLocalFlorist", label: "Garden" },
  { value: "FaGolfBall", label: "Golf" },
  { value: "MdScience", label: "Glass / science" },
  { value: "MdPalette", label: "Art studio" },
  { value: "FaFlask", label: "Pottery" },
  { value: "MdWater", label: "Pond / water" },
  { value: "MdDirectionsBoat", label: "Dock / boat" },
  { value: "MdSportsTennis", label: "Courts" },
  { value: "MdExitToApp", label: "Exit" },
  { value: "FaBullseye", label: "Range" },
  { value: "MdPets", label: "Dog run" },
  { value: "MdDelete", label: "Dumpster" },
  { value: "MdLocalLaundryService", label: "Laundry" },
  { value: "GiWaterTank", label: "Water tank" },
];

export const PLACE_COLOR_OPTIONS: {
  value: PlaceMarkerColor;
  label: string;
  swatchClass: string;
}[] = [
  { value: "gray", label: "Gray", swatchClass: "bg-gray-600" },
  { value: "slate", label: "Slate", swatchClass: "bg-slate-600" },
  { value: "amber", label: "Amber", swatchClass: "bg-amber-600" },
  { value: "orange", label: "Orange", swatchClass: "bg-orange-500" },
  { value: "green", label: "Green", swatchClass: "bg-green-600" },
  { value: "emerald", label: "Emerald", swatchClass: "bg-emerald-600" },
  { value: "cyan", label: "Cyan", swatchClass: "bg-cyan-600" },
  { value: "sky", label: "Sky", swatchClass: "bg-sky-600" },
  { value: "blue", label: "Blue", swatchClass: "bg-blue-600" },
  { value: "indigo", label: "Indigo", swatchClass: "bg-indigo-600" },
  { value: "pink", label: "Pink", swatchClass: "bg-pink-600" },
  { value: "red", label: "Red", swatchClass: "bg-red-600" },
];

export function getPlaceIcon(name: string) {
  return iconMap[name] ?? iconMap[DEFAULT_PLACE_ICON] ?? MdPlace;
}

/** Tailwind classes for place marker bg + text by icon (default when no custom color). */
const iconColorMap: Record<string, string> = {
  FaTools: "bg-amber-700 text-white",
  FaIndustry: "bg-slate-600 text-white",
  MdLocalFlorist: "bg-green-600 text-white",
  FaGolfBall: "bg-emerald-600 text-white",
  MdScience: "bg-indigo-600 text-white",
  MdPalette: "bg-pink-600 text-white",
  FaFlask: "bg-amber-600 text-white",
  MdWater: "bg-cyan-600 text-white",
  MdDirectionsBoat: "bg-blue-600 text-white",
  MdSportsTennis: "bg-orange-500 text-white",
  MdExitToApp: "bg-red-600 text-white",
  FaBullseye: "bg-red-700 text-white",
  MdPets: "bg-amber-600 text-white",
  MdDelete: "bg-slate-500 text-white",
  MdLocalLaundryService: "bg-blue-500 text-white",
  MdPlace: "bg-gray-600 text-white",
  MdWbSunny: "bg-amber-500 text-white",
  GiWaterTank: "bg-sky-600 text-white",
};

const placeColorClasses: Record<PlaceMarkerColor, string> = {
  gray: "bg-gray-600 text-white",
  slate: "bg-slate-600 text-white",
  amber: "bg-amber-600 text-white",
  orange: "bg-orange-500 text-white",
  green: "bg-green-600 text-white",
  emerald: "bg-emerald-600 text-white",
  cyan: "bg-cyan-600 text-white",
  sky: "bg-sky-600 text-white",
  blue: "bg-blue-600 text-white",
  indigo: "bg-indigo-600 text-white",
  pink: "bg-pink-600 text-white",
  red: "bg-red-600 text-white",
};

export function getPlaceColor(iconName: string): string {
  return iconColorMap[iconName ?? ""] ?? iconColorMap[DEFAULT_PLACE_ICON] ?? "bg-gray-600 text-white";
}

export function getPlaceMarkerClasses(place: {
  icon?: string;
  color?: PlaceMarkerColor;
}): string {
  if (place.color) {
    return placeColorClasses[place.color];
  }
  return getPlaceColor(place.icon ?? DEFAULT_PLACE_ICON);
}

export function getPlaceColorSwatchClass(color: PlaceMarkerColor): string {
  return PLACE_COLOR_OPTIONS.find((opt) => opt.value === color)?.swatchClass ?? "bg-gray-600";
}

/** Default icon for each place name (used when adding new places). */
export const PLACE_ICON_DEFAULTS: Record<string, PlaceIconName> = {
  "Wood Shop": "FaTools",
  "Metal Shop": "FaIndustry",
  "Garden & Greenhouse": "MdLocalFlorist",
  "Golf Range": "FaGolfBall",
  "Glassworks": "MdScience",
  "Art Studio": "MdPalette",
  "Pottery Studio": "FaFlask",
  "Pond 1": "MdWater",
  "Pond 2": "MdWater",
  "Pond 3": "MdWater",
  "Pond 4": "MdWater",
  "Pond 5": "MdWater",
  "Pond 6": "MdWater",
  "Dock & Water Wheel": "MdDirectionsBoat",
  "Pickel Ball Courts": "MdSportsTennis",
  "Emergency Exit": "MdExitToApp",
  "Air Gun Range": "FaBullseye",
  "Dog Run 1": "MdPets",
  "Dog Run 2": "MdPets",
  "Dumpster 1": "MdDelete",
  "Dumpster 2": "MdDelete",
  "Dumpster 3": "MdDelete",
  "Dumpster 4": "MdDelete",
  "Dumpster 5": "MdDelete",
  "Dumpster 6": "MdDelete",
  "West Laundry": "MdLocalLaundryService",
  "East Laundry": "MdLocalLaundryService",
  "Boondocks Laundry": "MdLocalLaundryService",
  "Two Tanks": "GiWaterTank",
  "Water Tank 3": "GiWaterTank",
  "Oak Grove": "GiWaterTank",
};
