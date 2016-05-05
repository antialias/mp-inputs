import { extend, debug } from '../util';

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
    const { paneIndex } = this;
    return {paneIndex};
  }

  get valid() {
    return typeof this.paneIndex === 'number' && this.paneIndex >= 0;
  }

  validate(newClause) {
    const valid = newClause.valid;

    if (!valid) {
      debug.warn(`${this.TYPE} clause invalid:`, newClause);
    }

    return valid ? newClause : this;
  }

  extend(attrs) {
    return this.validate(Clause.create(this.TYPE, extend(this.attrs, attrs)));
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
ShowClause.TOP_EVENTS = ShowClause.prototype.TOP_EVENTS = '$top_events';
ShowClause.MATH_TYPES = ShowClause.prototype.MATH_TYPES = [
  'total', 'unique', 'average', 'sum', 'median',
];

export class GroupClause extends EventsPropertiesClause {}
GroupClause.prototype.TYPE = 'group';

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
      this.UNIT_CHOICES.indexOf(this.unit) !== -1
      &&
      this.value
      &&
      (
        (typeof this.value === 'number' && this.value > 0)
        ||
        (this.value instanceof Date && this.value < new Date())
        ||
        (
          Array.isArray(this.value)
          &&
          this.value.length === 2
          &&
          (
            (
              (typeof this.value[0] === 'number' && this.value[0] > 0)
              &&
              (typeof this.value[1] === 'number' && this.value[1] > 0)
            )
            ||
            (
              (this.value instanceof Date && this.value < new Date())
              &&
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
    let value = {
      [TimeClause.RANGES.HOURS]: 96,
      [TimeClause.RANGES.WEEK]: 7,
      [TimeClause.RANGES.MONTH]: 30,
      [TimeClause.RANGES.QUARTER]: 120,
      [TimeClause.RANGES.YEAR]: 365,
    }[range];

    let unit = 'day';
    if (range === TimeClause.RANGES.HOURS) {
      unit = 'hour';
    }

    return {value, unit};
  }

  static unitValueToRange(unit, value) {
    if (unit === 'hour' && value === 96) {
      return TimeClause.RANGES.HOURS;
    } else if (unit === 'day') {
      if (value === 7) {
        return TimeClause.RANGES.WEEK;
      } else if (value === 30) {
        return TimeClause.RANGES.MONTH;
      } else if (value === 120) {
        return TimeClause.RANGES.QUARTER;
      } else if (value === 365) {
        return TimeClause.RANGES.YEAR;
      }
    }
    return null;
  }
}
TimeClause.TYPE = TimeClause.prototype.TYPE = 'time';
TimeClause.UNIT_CHOICES = TimeClause.prototype.UNIT_CHOICES = [
  'hour', 'day', 'week', 'month', 'quarter', 'year',
];
const HOURS = 'last 96 hours';
const WEEK = 'last week';
const MONTH = 'last 30 days';
const QUARTER = 'last quarter';
const YEAR = 'last 12 months';
const CUSTOM = 'Custom date range ...';
TimeClause.RANGES = TimeClause.prototype.RANGES = {
  HOURS, WEEK, MONTH, QUARTER, YEAR, CUSTOM,
};
TimeClause.RANGE_CHOICES = [
  HOURS, WEEK, MONTH, QUARTER, YEAR, CUSTOM,
];

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
FilterClause.FILTER_TYPES = FilterClause.prototype.FILTER_TYPES = [
  'string', 'number', 'datetime', 'boolean', 'list',
];
