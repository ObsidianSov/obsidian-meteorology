// Meteorological Knowledge Layer — structured variable definitions,
// separated from rendering so any tier/future feature can pull from
// one source of truth instead of hardcoded strings scattered in the UI.

const KNOWLEDGE_BASE = {
  temperature: {
    name: "Air Temperature",
    unit: "°C",
    definition: "The measure of how hot or cold the air is, based on the average energy of air molecules.",
    standardHeight: "2 meters above ground",
    instrument: "Thermometer / thermistor",
    studentExplanation: "Measured at head height in a shaded, ventilated shelter so sunlight doesn't heat the sensor directly.",
    advancedNote: "WMO standard observation height: 1.25-2.0m AGL (WMO-No. 8 guide)."
  },
  apparentTemperature: {
    name: "Apparent Temperature (Feels Like)",
    unit: "°C",
    definition: "An estimate of how the temperature actually feels to the human body, accounting for humidity and wind.",
    studentExplanation: "Feels like accounts for humidity and wind, so it can feel different from the actual air temperature.",
    advancedNote: "Computed via a heat index or wind chill model depending on conditions."
  },
  humidity: {
    name: "Relative Humidity",
    unit: "%",
    definition: "The amount of water vapor in the air, as a percentage of the maximum the air could hold at that temperature.",
    studentExplanation: "Above 60% in Katsina's heat means sweat evaporates slower, so it feels hotter than the number alone suggests.",
    advancedNote: "RH = (actual vapor pressure / saturation vapor pressure) x 100."
  },
  windSpeed: {
    name: "Wind Speed",
    unit: "km/h",
    standardHeight: "10 meters above ground",
    definition: "The speed at which air is moving horizontally.",
    studentExplanation: "Measured 10 meters above ground — the international standard height for comparing wind readings anywhere in the world.",
    advancedNote: "WMO standard anemometer height: 10m AGL over open terrain."
  },
  precipitation: {
    name: "Precipitation",
    unit: "mm",
    definition: "The depth of liquid water that would accumulate on a flat surface from rain, in millimeters.",
    studentExplanation: "1mm of rain = 1 liter of water per square meter of ground.",
    advancedNote: "Measured via tipping-bucket or weighing rain gauge; 1mm = 1 L/m²."
  },
  pressure: {
    name: "Surface Pressure",
    unit: "hPa",
    definition: "Atmospheric pressure at the station's elevation.",
    studentExplanation: "Falling pressure often signals an approaching weather change.",
    advancedNote: "Station-level pressure shown here, not reduced to sea level (not QNH)."
  }
};

function getExplanation(key, tier) {
  const entry = KNOWLEDGE_BASE[key];
  if (!entry) return "";
  if (tier === "student") {
    return entry.studentExplanation || entry.definition || "";
  }
  return entry.advancedNote || entry.definition || "";
}

function getVariableInfo(key) {
  return KNOWLEDGE_BASE[key] || null;
}

if (typeof module !== "undefined") {
  module.exports = { KNOWLEDGE_BASE, getExplanation, getVariableInfo };
}
