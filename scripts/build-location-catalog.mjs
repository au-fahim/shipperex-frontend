import { readFileSync, writeFileSync } from "node:fs";

const [, , countriesPath, citiesPath, outputPath] = process.argv;

if (!countriesPath || !citiesPath || !outputPath) {
  throw new Error(
    "Usage: node scripts/build-location-catalog.mjs countries.json cities.json output.json",
  );
}

const countries = JSON.parse(readFileSync(countriesPath, "utf8"));
const cityRecords = JSON.parse(readFileSync(citiesPath, "utf8"));
const cityNames = new Map(
  countries.map((country) => [country.iso2.toUpperCase(), new Map()]),
);

for (const record of cityRecords) {
  const code = record.country_code?.toUpperCase();
  const name = record.name?.trim().replace(/\s+/g, " ");
  const countryCities = cityNames.get(code);
  if (!countryCities || !name) continue;

  const key = name.toLocaleLowerCase();
  if (!countryCities.has(key)) countryCities.set(key, name);
}

// The upstream city table omits some small inhabited territories. Keep their
// catalog useful by including the upstream country record's capital when no
// city names were supplied for that country.
for (const country of countries) {
  const countryCities = cityNames.get(country.iso2.toUpperCase());
  const capital = country.capital?.trim().replace(/\s+/g, " ");
  if (countryCities && countryCities.size === 0 && capital) {
    countryCities.set(capital.toLocaleLowerCase(), capital);
  }
}

// The upstream tables do not list Tokelau's villages as city records. Include
// its documented settlements so a country selection still has usable choices.
const tokelauSettlements = [
  "Atafu",
  "Fale, Fakaofo",
  "Fenuafala",
  "Fale, Nukunonu",
  "Motuhaga",
];
const tokelauCities = cityNames.get("TK");
if (tokelauCities?.size === 0) {
  for (const settlement of tokelauSettlements) {
    tokelauCities.set(settlement.toLocaleLowerCase(), settlement);
  }
}

const countryList = countries
  .map((country) => ({
    name: country.name,
    iso2Code: country.iso2.toUpperCase(),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const citiesByCountry = Object.fromEntries(
  [...cityNames.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, values]) => [
      code,
      [...values.values()].sort((left, right) => left.localeCompare(right)),
    ]),
);

writeFileSync(
  outputPath,
  `${JSON.stringify({
    source: "Countries States Cities Database",
    sourceUrl: "https://github.com/dr5hn/countries-states-cities-database",
    supplementalSources: [
      "https://www.tokelau.org.nz/About%2BUs/Villages.html",
    ],
    license: "ODbL-1.0",
    countries: countryList,
    citiesByCountry,
  })}\n`,
);

console.log(
  `Wrote ${countryList.length} countries and ${cityRecords.length} city records to ${outputPath}`,
);
