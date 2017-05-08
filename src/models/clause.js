import { extend, pick } from 'mixpanel-common/util';
import { debug } from 'mixpanel-common/report/util';

const TYPE_FORMAT_NAME = {
  'show': `Compare`,
  'group': `Group by`,
  'filter': `Filter`,
  'time': `Time`,
};

const TIME_UNITS = {
  HOUR: `hour`,
  DAY: `day`,
  WEEK: `week`,
  MONTH: `month`,
  QUARTER: `quarter`,
  YEAR: `year`,
};

const TIME_UNIT_LIST = [
  TIME_UNITS.HOUR, TIME_UNITS.DAY, TIME_UNITS.WEEK, TIME_UNITS.MONTH, TIME_UNITS.QUARTER, TIME_UNITS.YEAR,
];

export class Clause {
  static create(sectionType, attrs, customEvents={}) {
    switch (sectionType) {
      case `show`: return new ShowClause(attrs, customEvents);
      case `group`: return new GroupClause(attrs);
      case `filter`: return new FilterClause(attrs);
      case `time`: return new TimeClause(attrs);
    }
  }

  get attrs() {
    return {};
  }

  extend(attrs) {
    return this.validate(Clause.create(this.TYPE, extend(this.attrs, attrs)));
  }

  formattedType() {
    return TYPE_FORMAT_NAME[this.TYPE];
  }

  serialize() {
    return this.attrs;
  }

  toUrlData() {
    return this.attrs;
  }

  get valid() {
    return true;
  }

  validate(newClause) {
    const valid = newClause.valid;

    if (!valid) {
      debug.warn(`${this.TYPE} clause invalid:`, newClause);
    }

    return newClause;
  }
}
Clause.RESOURCE_TYPE_ALL = Clause.prototype.RESOURCE_TYPES = `all`;
Clause.RESOURCE_TYPE_EVENTS = Clause.prototype.RESOURCE_TYPES = `events`;
Clause.RESOURCE_TYPE_PEOPLE = Clause.prototype.RESOURCE_TYPES = `people`;
Clause.RESOURCE_TYPES = Clause.prototype.RESOURCE_TYPES = [
  Clause.RESOURCE_TYPE_ALL,
  Clause.RESOURCE_TYPE_EVENTS,
  Clause.RESOURCE_TYPE_PEOPLE,
];

export class EventsPropertiesClause extends Clause {
  constructor(attrs={}) {
    super(...arguments);
    this.value = attrs.value || null;
    this.resourceType = attrs.resourceType || Clause.RESOURCE_TYPES[0];
    this.search = attrs.search || ``;
  }

  get attrs() {
    const { value, resourceType, search } = this;
    return extend(super.attrs, {value, resourceType, search});
  }

  get valid() {
    return (
      super.valid &&
      !!this.value &&
      this.RESOURCE_TYPES.indexOf(this.resourceType) !== -1 &&
      typeof this.search === `string`
    );
  }

  toUrlData() {
    return pick(this.attrs, [`value`, `resourceType`]);
  }
}

export class ShowClause extends EventsPropertiesClause {
  constructor(attrs={}, customEventsIdMap={}) {
    super(...arguments);
    this.math = attrs.math || `total`;
    this.property = attrs.property || null;

    if (this.resourceType === Clause.RESOURCE_TYPE_EVENTS) {
      if (this.value && this.value.custom) {
        // If this is a custom event, pull latest data from the custom events cache
        // in case it has been modified since the last time the report was saved.
        this.value = extend(this.value, customEventsIdMap[this.value.id]);
      }
    }
  }

  get attrs() {
    const {math, property} = this;
    return extend(super.attrs, {math, property});
  }

  get valid() {
    return super.valid && this.MATH_TYPES.indexOf(this.math) !== -1;
  }

  toUrlData() {
    const conditionalAttrs = {math: this.math};
    const valueWhitelist = [`name`, `resourceType`];
    if (this.value && this.value.custom) {
      valueWhitelist.push(`custom`);
    }
    conditionalAttrs[`value`] = pick((this.value || {}), valueWhitelist);
    if (this.property) {
      conditionalAttrs[`property`] = this.property;
    }

    return extend(super.toUrlData(), conditionalAttrs);
  }
}
ShowClause.TYPE = ShowClause.prototype.TYPE = `show`;
ShowClause.TOP_EVENTS = ShowClause.prototype.TOP_EVENTS = {
  name: `$top_events`,
  custom: false,
  resourceType: `events`,
};
ShowClause.ALL_EVENTS = ShowClause.prototype.ALL_EVENTS = {
  name: `$all_events`,
  custom: false,
  resourceType: `events`,
};
ShowClause.ALL_PEOPLE = ShowClause.prototype.ALL_PEOPLE = {
  name: `$all_people`,
  resourceType: `people`,
};
ShowClause.SPECIAL_EVENTS = ShowClause.prototype.SPECIAL_EVENTS = [
  ShowClause.TOP_EVENTS,
  ShowClause.ALL_EVENTS,
  ShowClause.ALL_PEOPLE,
];
ShowClause.MATH_TYPE_TOTAL = ShowClause.prototype.MATH_TYPE_TOTAL = `total`;
ShowClause.MATH_TYPE_UNIQUE = ShowClause.prototype.MATH_TYPE_UNIQUE = `unique`;
ShowClause.MATH_TYPE_AVERAGE = ShowClause.prototype.MATH_TYPE_AVERAGE = `average`;
ShowClause.MATH_TYPE_MEDIAN = ShowClause.prototype.MATH_TYPE_MEDIAN = `median`;
ShowClause.MATH_TYPE_MIN = ShowClause.prototype.MATH_TYPE_MIN = `min`;
ShowClause.MATH_TYPE_MAX = ShowClause.prototype.MATH_TYPE_MAX = `max`;
ShowClause.MATH_TYPES = ShowClause.prototype.MATH_TYPES = [
  ShowClause.MATH_TYPE_TOTAL,
  ShowClause.MATH_TYPE_UNIQUE,
  ShowClause.MATH_TYPE_AVERAGE,
  ShowClause.MATH_TYPE_MEDIAN,
  ShowClause.MATH_TYPE_MIN,
  ShowClause.MATH_TYPE_MAX,
];

export const PROPERTY_TYPES = [
  `string`, `number`, `datetime`, `boolean`, `list`,
];
export class GroupClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);
    this.filterType = attrs.filterType || GroupClause.FILTER_TYPES[0];
    this.propertyType = attrs.propertyType || null;
    this.typeCast = attrs.typeCast || null;
    this.unit = attrs.unit || null;
    this.editing = attrs.editing || null;
    if (this.isDatetimeProperty && !this.editing && !this.unit) {
      this.unit = TIME_UNITS.DAY;
    }
  }

  get valid() {
    const validIfDatetime = this.isDatetimeProperty ? TIME_UNIT_LIST.includes(this.unit) : true;
    return super.valid &&
      this.FILTER_TYPES.indexOf(this.filterType) !== -1 &&
      this.PROPERTY_TYPES.includes(this.propertyType) &&
      validIfDatetime;
  }

  get attrs() {
    return extend(super.attrs, {
      filterType: this.filterType,
      propertyType: this.propertyType,
      typeCast: this.typeCast,
      unit: this.unit,
    });
  }

  toUrlData() {
    const conditionalAttrs = {propertyType: this.propertyType};
    if (this.isDatetimeProperty) {
      conditionalAttrs.unit = this.unit || TIME_UNITS.DAY;
    }
    if (this.typeCast) {
      conditionalAttrs.typeCast = this.typeCast;
    }
    return extend(super.toUrlData(), conditionalAttrs);
  }

  get isDatetimeProperty() {
    const realType = this.typeCast || this.propertyType;
    return realType === `datetime`;
  }
}
GroupClause.TYPE = GroupClause.prototype.TYPE = `group`;
GroupClause.EVENT_DATE = GroupClause.prototype.EVENT_DATE = {
  name: `$date`,
  type: `datetime`,
  resourceType: `events`,
};
GroupClause.SPECIAL_PROPERTIES = GroupClause.prototype.SPECIAL_PROPERTIES = [
  GroupClause.EVENT_DATE,
];
GroupClause.FILTER_TYPES = GroupClause.prototype.FILTER_TYPES = PROPERTY_TYPES;
GroupClause.PROPERTY_TYPES = GroupClause.prototype.PROPERTY_TYPES = PROPERTY_TYPES;
GroupClause.PROPERTY_TYPECASTS = GroupClause.prototype.PROPERTY_TYPECASTS = [`string`, `number`, `boolean`];

// Time constants
const RANGES = {
  HOURS: `Last 96 hours`,
  MONTH: `Last 30 days`,
  WEEKS: `Last 24 weeks`,
  QUARTER: `Last 4 quarters`,
  YEAR: `Last 12 months`,
  CUSTOM: `Choose a date range...`,
};
const RANGE_LIST = [
  RANGES.HOURS, RANGES.MONTH, RANGES.WEEKS, RANGES.YEAR, RANGES.QUARTER, RANGES.CUSTOM,
];
const RANGE_TO_VALUE_AND_UNIT = {
  [RANGES.HOURS]:   {value: 96, unit: TIME_UNITS.HOUR},
  [RANGES.MONTH]:   {value: 30, unit: TIME_UNITS.DAY},
  [RANGES.WEEKS]:   {value: 24, unit: TIME_UNITS.WEEK},
  [RANGES.QUARTER]: {value: 4,  unit: TIME_UNITS.QUARTER},
  [RANGES.YEAR]:    {value: 12, unit: TIME_UNITS.MONTH},
};
const UNIT_AND_VALUE_TO_RANGE = {
  hour: {
    96: RANGES.HOURS,
  },
  day: {
    30: RANGES.MONTH,
  },
  week: {
    24: RANGES.WEEKS,
  },
  quarter: {
    4: RANGES.QUARTER,
  },
  month: {
    12: RANGES.YEAR,
  },
};

export class TimeClause extends Clause {
  constructor(attrs={}) {
    super(...arguments);

    if (attrs.range) {
      let { unit, value } = TimeClause.rangeToUnitValue(attrs.range);

      this.unit = unit;
      this.value = value;
    } else {
      this.unit = attrs.unit;
      this.value = attrs.value;
    }
  }

  get attrs() {
    const { unit, value } = this;
    return {unit, value};
  }

  get valid() {
    /* conditions:
     * - unit must be one of TimeClause.TIME_UNIT_LIST
     * - value must exist
     * - value must be either a single entry OR an array of entries
     * - entries in value must be numbers OR Dates
     * - numbers in value must be greater than 0
     */
    return (
      this.TIME_UNIT_LIST.indexOf(this.unit) !== -1 &&
      this.value &&
      (
        (typeof this.value === `number` && this.value > 0) ||
        (this.value instanceof Date) ||
        (
          Array.isArray(this.value) &&
          this.value.length === 2 &&
          (
            (
              (typeof this.value[0] === `string` && typeof this.value[1] === `string`)
            )
            ||
            (
              (typeof this.value[0] === `number` && this.value[0] > 0) &&
              (typeof this.value[1] === `number` && this.value[1] > 0)
            )
            ||
            (
              (this.value[0] instanceof Date && this.value[1] instanceof Date)
            )
          )
        )
      )
    );
  }

  get range() {
    return TimeClause.unitValueToRange(this.unit, this.value);
  }

  static rangeToUnitValue(range) {
    return RANGE_TO_VALUE_AND_UNIT[range] || {};
  }

  static unitValueToRange(unit, value) {
    const unitVals = UNIT_AND_VALUE_TO_RANGE[unit];
    return (unitVals && unitVals[value]) || null;
  }
}
TimeClause.TYPE = TimeClause.prototype.TYPE = `time`;
TimeClause.RANGES = TimeClause.prototype.RANGES = RANGES;
TimeClause.RANGE_LIST = TimeClause.prototype.RANGE_LIST = RANGE_LIST;
TimeClause.TIME_UNITS = TimeClause.prototype.TIME_UNITS = TIME_UNITS;
TimeClause.TIME_UNIT_LIST = TimeClause.prototype.TIME_UNIT_LIST = TIME_UNIT_LIST;
TimeClause.RANGE_TO_VALUE_AND_UNIT = TimeClause.prototype.RANGE_TO_VALUE_AND_UNIT = RANGE_TO_VALUE_AND_UNIT;
TimeClause.UNIT_AND_VALUE_TO_RANGE = TimeClause.prototype.UNIT_AND_VALUE_TO_RANGE = UNIT_AND_VALUE_TO_RANGE;

export class FilterClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);

    this.filterType = attrs.filterType || FilterClause.FILTER_TYPES[0];
    this.filterValue = (attrs.filterValue === 0 || attrs.filterValue) ? attrs.filterValue : null;
    this.filterSearch = attrs.filterSearch || null;
    this.filterDateUnit = attrs.filterDateUnit || TimeClause.TIME_UNIT_LIST[0];

    const filterOperators = FilterClause.FILTER_OPERATORS[this.filterType];
    this.filterOperator = filterOperators.includes(attrs.filterOperator) ? attrs.filterOperator : filterOperators[0];

    this.editing = attrs.editing || null;
  }

  get attrs() {
    const {
      filterType,
      filterOperator,
      filterValue,
      filterSearch,
      filterDateUnit,
      editing,
    } = this;

    return extend(super.attrs, {
      filterType,
      filterOperator,
      filterValue,
      filterSearch,
      filterDateUnit,
      editing,
    });
  }

  toUrlData() {
    const filterAttrs = pick(this.attrs, [
      `filterType`,
      `filterOperator`,
      `filterValue`,
      `filterDateUnit`,
    ]);
    return extend(super.toUrlData(), filterAttrs);
  }

  get valid() {
    const isDatetime = this.filterType === `datetime`;
    const isFilterTypeValid = this.FILTER_TYPES.includes(this.filterType);
    const isFilterOperatorValid = this.FILTER_OPERATORS[this.filterType].includes(this.filterOperator);
    const isFilterOperatorTimeRange = isDatetime && TimeClause.RANGE_LIST.includes(this.filterOperator);

    return super.valid && isFilterTypeValid && (isFilterOperatorValid || isFilterOperatorTimeRange);
  }

  get filterOperatorIsSetOrNotSet() {
    return this.filterOperator === `is set` || this.filterOperator === `is not set`;
  }

  get isEditingFilterOperator() {
    return this.editing === `filterOperator`;
  }

  get isEditingFilterDateUnit() {
    return this.editing === `filterDateUnit`;
  }
}
FilterClause.TYPE = FilterClause.prototype.TYPE = `filter`;
FilterClause.FILTER_OPERATORS = FilterClause.prototype.FILTER_OPERATORS = {
  string: [
    `contains`,
    `does not contain`,
    `equals`,
    `does not equal`,
    `is set`,
    `is not set`,
  ],
  number: [
    `is between`,
    `is greater than`,
    `is less than`,
    `is equal to`,
  ],
  datetime: [
    `was on`,
    `was between`,
    `was less than`,
    `was more than`,
    `was before`,
    `was after`,
    `was in the`,
  ],
  boolean: [
    `is true`,
    `is false`,
  ],
  list: [
    `contains`,
    `does not contain`,
  ],
};
FilterClause.FILTER_TYPES = FilterClause.prototype.FILTER_TYPES = PROPERTY_TYPES;
