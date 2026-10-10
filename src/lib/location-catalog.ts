export type LocationCountry = {
  name: string;
  iso2Code: string;
};

export type LocationCatalog = {
  source: string;
  sourceUrl: string;
  supplementalSources?: string[];
  license: string;
  countries: LocationCountry[];
  citiesByCountry: Record<string, string[]>;
};

export async function fetchLocationCatalog(): Promise<LocationCatalog> {
  const response = await fetch("/data/country-city-catalog.json", {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error("The country and city list could not be loaded.");
  }
  return response.json() as Promise<LocationCatalog>;
}
