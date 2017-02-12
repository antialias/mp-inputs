import moment from 'moment';

export {
  getLearnStep,
  learnClasses,
  transitionLearn,
  finishLearn,
} from './learn';

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

export const MOMENT_TIME_FORMATTING = {
  'hour': `MMM D[,] ha`,
  'day': `ddd MMM Do YYYY`,
  'week': `MMM D`,
  'month': `MMM YYYY`,
  'quarter': `[Q]Q YYYY`,
  'year': `YYYY`,
};

export function epochToFormattedDate(epoch, unit, {displayRangeIfWeek=true}={}) {
  const timeFormat = MOMENT_TIME_FORMATTING[unit];
  const epochMoment = moment.utc(Number(epoch));
  if (displayRangeIfWeek && unit === `week`) {
    return `${epochMoment.format(timeFormat)} - ${epochMoment.add(6, `days`).format(timeFormat)}`;
  } else {
    return epochMoment.format(timeFormat);
  }
}

export function formatDateISO(date) {
  date = moment(date);
  return date.isValid() ? date.format().slice(0, 10) : null;
}

export function formatDateDisplay(date) {
  date = moment(date);
  return date.isValid() ? date.format(`MMM D, YYYY`) : ``;
}

const MIN_VALID_YEAR = 2002;

export function parseDate(dateString, {startOfDay=false, endOfDay=false}={}) {
  if (typeof dateString !== `string`) {
    return null;
  }

  const timestamp = Number(moment(dateString.replace(/[^\w\s-/.]/g, ``)));

  if (!Number.isInteger(timestamp)) {
    return null;
  }

  const date = new Date(timestamp);

  if (startOfDay) {
    date.setHours(0, 0, 0, 0);
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  // allow date strings like 1/12 to be parsed with year set to the current year
  if (MIN_VALID_YEAR && date.getFullYear() < MIN_VALID_YEAR) {
    date.setFullYear(new Date().getFullYear());
  }

  return date;
}

export function relativeToAbsoluteDate(relativeDateInt, unit) {
  return new Date(moment().subtract(relativeDateInt, `${unit}s`));
}

export function normalizeDates(...dates) {
  const now = new Date();
  return dates
    .map(parseDate)
    .filter(date => date)
    .map(date => date > now ? now : date)
    .map(date => date.getTime())
    .sort()
    .map(formatDateISO);
}

export function unitForDateRange(from, to) {
  const daysApart = moment(to).diff(moment(from), `days`) + 1;

  if (daysApart <= 4) {
    return `hour`;
  } else if (daysApart <= 31) {
    return `day`;
  } else if (daysApart <= 183) {
    return `week`;
  } else {
    return `month`;
  }
}
