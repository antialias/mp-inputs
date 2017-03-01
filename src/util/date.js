import moment from 'moment';

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = MS_IN_HOUR * 24;
export const MS_BY_UNIT = {
  hour: MS_IN_HOUR,
  day: MS_IN_DAY,
  week: MS_IN_DAY * 7,
  month: MS_IN_DAY * 30,
  quarter: MS_IN_DAY * 90,
  year: MS_IN_DAY * 365,
};

const UNITS = {
  hour: `hour`,
  day: `day`,
  week: `week`,
  month: `month`,
  quarter: `quarter`,
  year: `year`,
};

const UNITS_ARRAY = [
  UNITS.hour,
  UNITS.day,
  UNITS.week,
  UNITS.month,
  UNITS.quarter,
  UNITS.year,
];

const PARSE_DATE_FORMATS = [
  `M D YY`,
  `M D YYYY`,
  `YY M D`,
  `YYYY M D`,
  `MMM D YY`,
  `MMM D YYYY`,
  `MMM Do YY`,
  `MMM Do YYYY`,
  `M D`,
];

const DISPLAY_DATE_FORMATS = {
  [UNITS.hour]: `MMM D[,] ha`,
  [UNITS.day]: `ddd, MMM Do`,
  [UNITS.week]: `MMM D`,
  [UNITS.month]: `MMM YYYY`,
  [UNITS.quarter]: `[Q]Q YYYY`,
  [UNITS.year]: `YYYY`,
};

/**
 * Parse a date string into a Date object (sets date time to start of day)
 * Strings that parse to a future date (i.e. "12/31") are moved to the most recent *past* instance of that date
 * @param {String} dateString - string to parse
 * @param {Boolean} endOfDay - optional; set date time to end of day
 * @returns {Date|null} - the Date object the input string parses to, or null if input is invalid
 */
export function parseDate(dateString, {iso=false, startOfDay=false, endOfDay=false}={}) {
  if (typeof dateString === `string`) {
    let date = null;

    if (iso) {
      date = moment.utc(new Date(dateString));
    } else {
      // replace all chars other than alphanumerics and spaces with a space
      // this allows strings like '"2017-02-02"' to be parsed correctly
      dateString = dateString.replace(/[^\w\s]+/g, ` `);
      date = moment(dateString, PARSE_DATE_FORMATS);
    }

    if (date.isValid()) {
      date = startOfDay ? date.startOf(UNITS.day) : date;
      date = endOfDay ? date.endOf(UNITS.day) : date;

      // make dates like "12/31" parse to the most recent past instance of that date unless it is for the end of today
      const now = moment();
      const isEndOfToday = endOfDay && date.isSame(now, `day`);

      date = (!isEndOfToday && date > now) ? date.subtract(1, `${UNITS.year}s`) : date;

      return new Date(date);
    }
  }

  return null;
}

/**
 * Convert a Date object or integer timestamp into a formatted date string
 * @param {Date|Integer} date - Date object or timestamp to format
 * @param {Boolean} iso - optional; format date to ISO-style string (YYYY-MM-DD)
 * @param {Boolean} utc - optional; treat input as a UTC date
 * @param {String} unit - optional; use the corresponding format for this unit from DISPLAY_DATE_FORMATS
 * @param {Object} customFormatting - optional; map of units to custom format strings to be used in place of DISPLAY_DATE_FORMATS
 * @param {displayRangeIfWeek} - optional; if unit is week format to range string across week (i.e. "Dec 1 - Dec 7")
 * @returns {String|null} - the string the input Date object formats to, or null if input is invalid
 */
export function formatDate(date, {iso=false, utc=false, unit=null, customFormatting={}, displayRangeIfWeek=true}={}) {
  if (date instanceof Date || Number.isInteger(date)) {
    date = utc ? moment.utc(Number(date)) : moment(Number(date));

    if (date.isValid()) {
      if (iso) {
        return date.format().slice(0, 10);
      }

      const format = customFormatting[unit] || DISPLAY_DATE_FORMATS[unit] || `MMM D, YYYY`;

      if (displayRangeIfWeek && unit === UNITS.week) {
        const from = date.format(format);
        const to = date.add(6, `${UNITS.day}s`).format(format);
        return `${from} - ${to}`;
      }

      return date.format(format);
    }
  }

  return null;
}

/**
 * Convert a "relative date" integer (i.e. 5 [days ago]) and a unit into an "absolute" Date object
 * @param {Integer} relativeDateInt - integer that (along with unit) represnts a time offfset from the current date
 * @param {String} unit - specifies the unit of time to multiply the relativeDateInt by to calculate the absolute date
 * @returns {Date|null} - the Date object the given relative date integer and unit resolve to, or null if input is invalid
 */
export function relativeToAbsoluteDate(relativeDateInt, unit) {
  if (Number.isInteger(relativeDateInt) && UNITS_ARRAY.includes(unit)) {
    return new Date(moment().subtract(relativeDateInt, `${unit}s`));
  }

  return null;
}

/**
 * Accepts a list of date strings and
 * - ensures none of them exceed the current moment
 * - sorts them in ascending order
 * - formats them as ISO date strings (YYYY-MM-DD)
 * @param {Array<String>} dates - list of date strings to normalize, can be any format that parseDate accepts
 * @returns {Array<String|null>} - list of ISO-formatted normalized date strings, or null if the corresponding input date was invalid
 */
export function normalizeDateStrings(...dates) {
  const now = new Date();
  return dates
    .map(parseDate)
    .filter(date => date)
    .map(date => date > now ? now : date)
    .map(date => date.getTime())
    .sort((a, b) => a - b)
    .map(date => formatDate(date, {iso: true}));
}

/**
 * Returns a unit string corresponding with the time delta between two Dates
 * @param {Date|Integer} from - the starting date of the range - can be Date or timestamp
 * @param {Date|Integer} to - the ending date of the range - can be Date or timestamp
 * @returns {String|null} - one of DATE_UNITS that the input range corresponds with, or null if the input was invalid
 */
export function dateRangeToUnit(from, to) {
  if (
    (from instanceof Date || Number.isInteger(from)) &&
    (to instanceof Date || Number.isInteger(to))
  ) {
    from = moment(from);
    to = moment(to);

    if (from.isValid() && to.isValid()) {
      const daysApart = to.diff(from, `${UNITS.day}s`) + 1;

      if (Number.isInteger(daysApart)) {
        if (daysApart <= 4) {
          return UNITS.hour;
        } else if (daysApart <= 31) {
          return UNITS.day;
        } else if (daysApart <= 183) {
          return UNITS.week;
        } else {
          return UNITS.month;
        }
      }
    }
  }

  return null;
}
