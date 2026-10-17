# Rainy-season onset: method

Implemented in `rainfall_onset.js`. Status: experimental until validated against
station data (Milestone 4).

## Criterion

Sivakumar (1988), *Agricultural and Forest Meteorology* 42(4): 295-305. As reported by
later West African studies, onset is the first date, from 1 May, on which:

1. at least **20 mm** of rain falls over **3 consecutive days**, and
2. no dry sequence **longer than 7 days** occurs in the **following 30 days**.

Condition 2 filters out "false starts": early rain that does not sustain the season.

Source note: the wording above was checked against several independent papers that
quote the criterion (a Mali agroclimatic study, an IRD abstract on Niger, and a
Chilean journal paper on onset definitions). The original 1988 paper has not been read
directly by this project. Do this before citing the method in a report.

## Choices the criterion does not fix

| Choice | Value used | Why |
|---|---|---|
| Dry day | under 1.0 mm | common convention; sources differ (0.1 mm is also used) |
| Onset date | first wet day (1.0 mm or more) of the triggering 3-day window | a window can start on a dry day, which would report the onset early |
| 30-day check | starts the day after the 3-day window | "the following 30 days" |
| Search start | 1 May, exact day computed per year (leap-safe) | the criterion |
| Dry spell limit | up to 7 days allowed, 8 or more is a false start | "longer than 7 days"; some papers write "7 or more", so results can differ slightly |

## Missing data

Missing days are never treated as dry or as wet. Each year gets one of three statuses:

- **detected**: an onset was found and could be confirmed.
- **none**: data are adequate and no valid onset exists that year.
- **insufficient data**: missing days stop us from deciding. This happens when
  (a) missing days could hide a dry spell in the 30-day check,
  (b) fewer than 30 days of data remain after the rain event, or
  (c) a missing day inside the search period means we cannot prove the onset
  found is really the first one.

Rain totals in the trigger window are a lower bound, so a window that reaches 20 mm
with some missing days still counts.

## Known limits

- NASA POWER precipitation is a gridded estimate, not a station record, so onset
  dates are estimates for the grid cell around the chosen location.
- Other onset definitions exist (for example 25 mm over 5 days, or different
  dry-spell lengths used in some Nigerian studies). Results are not comparable
  across definitions.
- Cessation of the rains is not implemented yet.
- Changes in step 3: earlier versions searched from 1 March and allowed 10 dry
  days, and could report the onset 1 to 2 days early. Onset values will therefore
  differ from earlier versions.
