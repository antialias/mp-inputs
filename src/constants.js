export const IS_WITHIN_MP_PLATFORM_IFRAME = (
  window.parent &&
  window.parent.mixpanel &&
  window.parent !== window
);

export const SCREEN_MAIN = 'main';

export const BUILDER_SECTION_SHOW = 'showSection';
export const BUILDER_SECTION_GROUP = 'groupSection';
export const BUILDER_SECTION_TIME = 'timeSection';
export const BUILDER_SECTION_FILTER = 'filterSection';
export const BUILDER_SECTION_TYPES = {
  BUILDER_SECTION_SHOW,
  BUILDER_SECTION_GROUP,
  BUILDER_SECTION_TIME,
  BUILDER_SECTION_FILTER,
};

export const RESOURCE_EVENTS = 'events';
export const RESOURCE_PEOPLE = 'people';
export const RESOURCE_TYPES = {
  RESOURCE_EVENTS,
  RESOURCE_PEOPLE,
};

export const RESOURCE_VALUE_ALL = 'all';

export const MATH_TOTAL = 'total';
export const MATH_UNIQUE = 'unique';
export const MATH_AVERAGE = 'average';
export const MATH_TYPES = {
  MATH_TOTAL,
  MATH_UNIQUE,
  MATH_AVERAGE,
};

export const TIME_UNIT_HOUR = 'hour';
export const TIME_UNIT_DAY = 'day';
export const TIME_UNIT_WEEK = 'week';
export const TIME_UNIT_MONTH = 'month';
export const TIME_UNIT_QUARTER = 'quarter';
export const TIME_UNIT_YEAR = 'year';
export const TIME_UNIT_TYPES = {
  TIME_UNIT_HOUR,
  TIME_UNIT_DAY,
  TIME_UNIT_WEEK,
  TIME_UNIT_MONTH,
  TIME_UNIT_QUARTER,
  TIME_UNIT_YEAR,
};
