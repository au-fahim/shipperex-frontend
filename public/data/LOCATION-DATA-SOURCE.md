# Location data attribution

`country-city-catalog.json` is a static, normalized extract of country and city
names from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database).
The upstream project reports 250 countries and more than 153,000 city, town,
and district records. The source data is licensed under the
[Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/).

Attribution: Data by Countries States Cities Database —
https://github.com/dr5hn/countries-states-cities-database

The catalog is provided as an offline JSON file; selecting a country filters
its preloaded city names locally. For a country with no city records in the
source, its listed capital is used when available. Uninhabited territories may
have no city choices. The data is community-maintained and should not be
treated as an authoritative geographic validation source.

Tokelau's documented settlements are included from the
[Tokelau Government villages list](https://www.tokelau.org.nz/About%2BUs/Villages.html),
because the upstream city table does not include them.
