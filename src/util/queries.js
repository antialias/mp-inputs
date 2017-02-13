import {
  parseDate,
  MS_BY_UNIT,
} from './index';

export function toArbSelectorPropertyToken(resourceType, property) {
  return `${resourceType === `events` ? `properties` : `user`}["${property}"]`;
}

export function isFilterValid(filter) {
  if (!filter.value) {
    return false;
  }

  const isSetOrBoolean = [`is set`, `is not set`, `is true`, `is false`].includes(filter.filterOperator);
  const isBetween = [`is between`, `was between`].includes(filter.filterOperator);
  const isRelativeDate = filter.filterType === `datetime` &&
    [`was more than`, `was less than`, `was in`].includes(filter.filterOperator);

  // filter must have a value UNLESS it is set or boolean
  if (!isSetOrBoolean && !filter.filterValue) {
    return false;
  }

  // between filter must have a value of length 2 with both entries present
  if (isBetween && (
    !filter.filterValue ||
    filter.filterValue.length !== 2 ||
    typeof filter.filterValue[0] === `undefined` ||
    typeof filter.filterValue[1]  === `undefined`
  )) {
    return false;
  }

  // relative date filter must have a value and a unit
  if (isRelativeDate && (!filter.filterValue || !filter.filterDateUnit)) {
    return false;
  }

  return true;
}

export function filterToArbSelectorString(filter) {
  let property = filter.value;
  const type = filter.filterType;
  const operator = filter.filterOperator;
  let value = filter.filterValue;
  const dateUnit = filter.filterDateUnit;

  property = `(${toArbSelectorPropertyToken(filter.resourceType, property)})`;

  if (typeof value === `string`) {
    value = `"${value}"`;
  } else if (Array.isArray(value)) {
    value = value.map(val => typeof val === `string` ? `"${val}"` : val);
  }

  switch (type) {
    case `string`:
      if (operator === `equals` || operator === `does not equal`) {
        if (!Array.isArray(value)) {
          value = [value];
        }
      }
      switch (operator) {
        case `equals`           : return `(` + value.map(val => `(${property} == ${val})`).join(` or `) + `)`;
        case `does not equal`   : return `(` + value.map(val => `(${property} != ${val})`).join(` and `) + `)`;
        case `contains`         : return `(${value} in ${property})`;
        case `does not contain` : return `(not ${value} in ${property})`;
        case `is set`           : return `(defined ${property})`;
        case `is not set`       : return `(not defined ${property})`;
      }
      break;
    case `number`:
      switch (operator) {
        case `is between`      : return `((${property} > ${value[0]}) and (${property} < ${value[1]}))`;
        case `is equal to`     : return `(${property} == ${value})`;
        case `is less than`    : return `(${property} < ${value})`;
        case `is greater than` : return `(${property} > ${value})`;
      }
      break;
    case `datetime`: {
      const unitsAgo = units => new Date().getTime() - (units * MS_BY_UNIT[dateUnit]);
      const startOfDay = date => parseDate(date, {startOfDay: true}).getTime();
      const endOfDay = date => parseDate(date, {endOfDay: true}).getTime();

      const lessRecentlyThan = timestamp => `(${property} < datetime(${timestamp}))`;
      const moreRecentlyThan = timestamp => `(${property} > datetime(${timestamp}))`;
      const between = (from, to) =>
        `((${property} >= datetime(${startOfDay(from)})) and (${property} <= datetime(${endOfDay(to)})))`;

      switch (operator) {
        case `was in the`:
        case `was more than` : return moreRecentlyThan(unitsAgo(value));
        case `was less than` : return lessRecentlyThan(unitsAgo(value));
        case `was before`    : return lessRecentlyThan(startOfDay(value));
        case `was after`     : return moreRecentlyThan(endOfDay(value));
        case `was on`        : return between(value, value);
        case `was between`   : return between(...value);
      }
      break;
    }
    case `boolean`:
      switch (operator) {
        case `is true`  : return `(boolean(${property}) == true)`;
        case `is false` : return `(boolean(${property}) == false)`;
      }
      break;
    case `list`:
      switch (operator) {
        case `contains`         : return `(${value} in list(${property}))`;
        case `does not contain` : return `(not ${value} in list(${property}))`;
      }
      break;
  }
}
