# Obsidian Meteorology

A live weather intelligence dashboard built for the Department of
Meteorology at Umaru Musa Yar'adua University (UMYU), Katsina —
with the goal of being genuinely useful across every level: newly
admitted students, coursework at every year, lecturers, and
eventually NiMET field staff.

**Status: early MVP (v0.1).** Live current conditions and 7-day
forecast are working and verified. Historical climate analysis is
the next feature under active development.

## Why this exists

Meteorology students and staff typically rely on generic weather
apps or manually checking NiMET bulletins. There is no existing
tool in the department that brings live conditions, historical
climate trends, and role-appropriate detail into one place. This
project aims to be that tool — and, longer term, a foundation for
real climate-security research applied to the Sahel region.

## Current features (v0.1)

- **Live current conditions** — temperature, humidity, wind,
  precipitation, pressure — for any location, sourced from
  [Open-Meteo](https://open-meteo.com) (free, no API key, CC BY 4.0)
- **7-day forecast**
- **Three role-based views on the same data:**
  - **Student** — plain-language explanations alongside every metric
  - **Advanced** — raw data tables for lecturers and researchers
  - **NiMET-style** — dense, professional synoptic layout
- **Location switcher** — Katsina by default, with other Nigerian
  cities selectable
- Zero backend, zero install — a single HTML file that runs
  directly in any browser

## Roadmap

- [ ] Historical climate data layer (NASA POWER, 1981–present:
      temperature, rainfall) for Katsina
- [ ] Trend analysis on historical data — rainfall onset timing,
      year-over-year variability — as a first concrete step toward
      the Computational Science / Climate & Security in the Sahel
      thesis
- [ ] Data export (CSV) for coursework and research use
- [ ] Reach out to NiMET Katsina with a working prototype to
      explore a real data partnership
- [ ] User accounts / saved preferences (would require a real
      backend at that point)

## Tech

Currently a single static HTML/CSS/JS file — no build step, no
dependencies, no server. Deployable for free on GitHub Pages,
Vercel, or Netlify.

## Data sources & attribution

- Current conditions & forecast: [Open-Meteo](https://open-meteo.com)
  — CC BY 4.0
- Historical climate data (planned): [NASA POWER](https://power.larc.nasa.gov)
  — CC BY 4.0

## Author

Built by Ahmad Suleiman (Obsidian), B.Sc. Meteorology student,
UMYU Katsina, as an independent department project toward SIWES
defense.
