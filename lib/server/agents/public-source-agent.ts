import { JobFilters } from "@/lib/types";

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function isTorinoArea(location?: string) {
  const normalizedLocation = normalize(location ?? "");
  return !normalizedLocation || normalizedLocation.includes("torino") || normalizedLocation.includes("piemonte");
}

export function shouldIncludePublicSource(sourceId: string, filters: JobFilters) {
  if ((filters.sector ?? "all") === "privato") {
    return false;
  }

  switch (sourceId) {
    case "inpa":
      return true;
    case "comune-torino":
      return isTorinoArea(filters.location);
    case "citta-metropolitana-torino":
      return isTorinoArea(filters.location) && (filters.locationScope ?? "metro") === "metro";
    default:
      return false;
  }
}
