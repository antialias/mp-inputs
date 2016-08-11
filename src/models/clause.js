import moment from 'moment';

import { extend } from 'mixpanel-common/util';
import { debug } from 'mixpanel-common/report/util';

export class Clause {
  constructor(attrs={}) {
    this.paneIndex = attrs.paneIndex || 0;
  }

  static create(sectionType, attrs) {
    switch (sectionType) {
      case 'show': return new ShowClause(attrs);
      case 'group': return new GroupClause(attrs);
      case 'filter': return new FilterClause(attrs);
      case 'time': return new TimeClause(attrs);
    }
  }

  get attrs() {
    return {
      paneIndex: this.paneIndex,
    };
  }

  extend(attrs) {
    return this.validate(Clause.create(this.TYPE, extend(this.attrs, attrs)));
  }

  serialize() {
    return this.attrs;
  }

  get valid() {
    return typeof this.paneIndex === 'number' && this.paneIndex >= 0;
  }

  validate(newClause) {
    const valid = newClause.valid;

    if (!valid) {
      debug.warn(`${this.TYPE} clause invalid:`, newClause);
    }

    return newClause;
  }
}
Clause.RESOURCE_TYPES = Clause.prototype.RESOURCE_TYPES = ['all', 'events', 'people'];

export class EventsPropertiesClause extends Clause {
  constructor(attrs={}) {
    super(...arguments);
    this.value = attrs.value || null;
    this.resourceType = attrs.resourceType || Clause.RESOURCE_TYPES[0];
    this.search = attrs.search || '';
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
      typeof this.search === 'string'
    );
  }
}

export class ShowClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);
    this.math = attrs.math || 'total';
    this.value = this.value || null;
  }

  get attrs() {
    const { math } = this;
    return extend(super.attrs, {math});
  }

  get valid() {
    return super.valid && this.MATH_TYPES.indexOf(this.math) !== -1;
  }
}
ShowClause.TYPE = ShowClause.prototype.TYPE = 'show';
ShowClause.TOP_EVENTS = ShowClause.prototype.TOP_EVENTS = {
  name: '$top_events',
  custom: false,
};
ShowClause.ALL_EVENTS = ShowClause.prototype.ALL_EVENTS = {
  name: '$all_events',
  custom: false,
};
ShowClause.MATH_TYPES = ShowClause.prototype.MATH_TYPES = [
  'total', 'unique', 'average', 'sum', 'median',
];

const PROPERTY_TYPES = [
  'string', 'number', 'datetime', 'boolean', 'list',
];
export class GroupClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);

    this.filterType = attrs.filterType || GroupClause.FILTER_TYPES[0];
  }

  get valid() {
    return super.valid &&
      this.FILTER_TYPES.indexOf(this.filterType) !== -1;
  }

  get attrs() {
    return extend(super.attrs, {filterType: this.filterType});
  }
}
GroupClause.prototype.TYPE = 'group';
GroupClause.FILTER_TYPES = GroupClause.prototype.FILTER_TYPES = PROPERTY_TYPES;

// Time constants
const HOURS = 'last 96 hours';
const WEEK = 'last week';
const MONTH = 'last 30 days';
const QUARTER = 'last quarter';
const YEAR = 'last 12 months';
const CUSTOM = 'Custom date range ...';
const RANGES = {
  HOURS, WEEK, MONTH, QUARTER, YEAR, CUSTOM,
};
const RANGE_CHOICES = [
  HOURS, WEEK, MONTH, QUARTER, YEAR, CUSTOM,
];
const UNIT_CHOICES = [
  'hour', 'day', 'week', 'month', 'quarter', 'year',
];
const RANGE_TO_VALUE_AND_UNIT = {
  [RANGES.HOURS]:   {value: 96, unit: 'hour' },
  [RANGES.WEEK]:    {value: 7,  unit: 'day'  },
  [RANGES.MONTH]:   {value: 30, unit: 'day'  },
  [RANGES.QUARTER]: {value: 12, unit: 'week' },
  [RANGES.YEAR]:    {value: 12, unit: 'month'},
};
const UNIT_AND_VALUE_TO_RANGE = {
  hour: {
    96: RANGES.HOURS,
  },
  day: {
    7: RANGES.WEEK,
    30: RANGES.MONTH,
  },
  week: {
    12: RANGES.QUARTER,
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
     * - unit must be one of TimeClause.UNIT_CHOICES
     * - value must exist
     * - value must be either a single entry OR an array of entries
     * - entries in value must be numbers OR Dates
     * - numbers in value must be greater than 0
     * - Dates in value must occur before now
     */
    return (
      this.UNIT_CHOICES.indexOf(this.unit) !== -1 &&
      this.value &&
      (
        (typeof this.value === 'number' && this.value > 0) ||
        (this.value instanceof Date && this.value < new Date()) ||
        (
          Array.isArray(this.value) &&
          this.value.length === 2 &&
          (
            (
              (typeof this.value[0] === 'string' && moment.utc(this.value[0]).isBefore(moment.utc())) &&
              (typeof this.value[1] === 'string' && moment.utc(this.value[1]).isBefore(moment.utc()))
            )
            ||
            (
              (typeof this.value[0] === 'number' && this.value[0] > 0) &&
              (typeof this.value[1] === 'number' && this.value[1] > 0)
            )
            ||
            (
              (this.value instanceof Date && this.value < new Date()) &&
              (this.value instanceof Date && this.value < new Date())
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
TimeClause.RANGE_CHOICES = RANGE_CHOICES;
TimeClause.RANGES = TimeClause.prototype.RANGES = RANGES;
TimeClause.TYPE = TimeClause.prototype.TYPE = 'time';
TimeClause.UNIT_CHOICES = TimeClause.prototype.UNIT_CHOICES = UNIT_CHOICES;

export class FilterClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);

    this.filterType = attrs.filterType || FilterClause.FILTER_TYPES[0];

    const filterOperatorChoices = FilterClause.FILTER_OPERATORS[this.filterType];
    if (filterOperatorChoices.indexOf(attrs.filterOperator) !== -1) {
      this.filterOperator = attrs.filterOperator;
    } else {
      this.filterOperator = filterOperatorChoices[0];
    }

    this.filterValue = attrs.filterValue || null;
    this.filterSearch = attrs.filterSearch || null;
    this.filterDateUnit = attrs.filterDateUnit || TimeClause.UNIT_CHOICES[0];

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

  get valid() {
    return super.valid &&
      this.FILTER_TYPES.indexOf(this.filterType) !== -1 &&
      this.FILTER_OPERATORS[this.filterType].indexOf(this.filterOperator) !== -1;
  }

  get filterOperatorIsSetOrNotSet() {
    return this.filterOperator === 'is set' || this.filterOperator === 'is not set';
  }

  get isEditingFilterOperator() {
    return this.editing === 'filterOperator';
  }

  get isEditingFilterDateUnit() {
    return this.editing === 'filterDateUnit';
  }
}
FilterClause.TYPE = FilterClause.prototype.TYPE = 'filter';
FilterClause.FILTER_OPERATORS = FilterClause.prototype.FILTER_OPERATORS = {
  string: [
    'equals',
    'does not equal',
    'contains',
    'does not contain',
    'is set',
    'is not set',
  ],
  number: [
    'is between',
    'is equal to',
    'is less than',
    'is greater than',
  ],
  datetime: [
    'was less than',
    'was more than',
    'was on',
    'was between',
  ],
  boolean: [
    'is true',
    'is false',
  ],
  list: [
    'contains',
    'does not contain',
  ],
};
FilterClause.FILTER_TYPES = FilterClause.prototype.FILTER_TYPES = PROPERTY_TYPES;
