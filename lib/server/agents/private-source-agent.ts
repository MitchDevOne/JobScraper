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
    case "torino-private-careers":
    case "torino-foundations-network":
    case "torino-third-sector-network":
    case "torino-neighborhood-houses-network":
    case "torino-museums-network":
    case "torino-education-associations-network":
    case "torino-education-network":
    case "torino-ngo-network":
    case "torino-incubators-network":
    case "torino-finance-network":
    case "torino-fintech-network":
    case "torino-insurance-network":
    case "torino-ict-network":
    case "torino-biotech-network":
    case "torino-automotive-network":
    case "torino-aerospace-network":
      return true;
    default:
      return false;
  }
}
