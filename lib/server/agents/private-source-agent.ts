import { JobFilters } from "@/lib/types";

export function shouldIncludePrivateSource(sourceId: string, filters: JobFilters) {
  if ((filters.sector ?? "all") === "pubblico") {
    return false;
  }

  switch (sourceId) {
    case "csi-piemonte":
    case "greenhouse-private-boards":
    case "lever-private-boards":
    case "smartrecruiters-private-boards":
      return true;
    default:
      return false;
  }
}
