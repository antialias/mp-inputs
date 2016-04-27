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
  'total', 'unique', 'average', 'sum', 'median'
];

export class GroupClause extends EventsPropertiesClause {}
GroupClause.prototype.TYPE = 'group';

export class FilterClause extends EventsPropertiesClause {
  constructor(attrs={}) {
    super(...arguments);

    this.filterType = attrs.filterType || 'string';

    const filterOperatorChoices = FilterClause.FILTER_OPERATORS[this.filterType];
    if (filterOperatorChoices.indexOf(attrs.filterOperator) !== -1) {
      this.filterOperator = attrs.filterOperator;
    } else {
      this.filterOperator = filterOperatorChoices[0];
    }
    this.editingFilterOperator = !!attrs.editingFilterOperator;

    this.filterValue = attrs.filterValue || null;

    this.filterBetweenStart = attrs.filterBetweenStart || null;
    this.filterBetweenEnd = attrs.filterBetweenEnd || null;
    this.editingFilterBetweenStart = !!attrs.editingFilterBetweenStart;
    this.editingFilterBetweenEnd = !!attrs.editingFilterBetweenEnd;

    this.filterUnit = attrs.filterUnit || null;
    this.editingFilterUnit = !!attrs.editingFilterUnit;
  }

  get attrs() {
    const {
      filterType,
      filterOperator,
      editingFilterOperator,
      filterValue,
      filterBetweenStart,
      filterBewteenEnd,
      editingFilterBetweenStart,
      editingFilterBetweenEnd,
      filterUnit,
      editingFilterUnit,
    } = this;

    return extend(super.attrs, {
      filterType,
      filterOperator,
      editingFilterOperator,
      filterValue,
      filterBetweenStart,
      filterBewteenEnd,
      editingFilterBetweenStart,
      editingFilterBetweenEnd,
      filterUnit,
      editingFilterUnit,
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

export class TimeClause extends Clause {
  constructor(attrs={}) {
    super(...arguments);

    let to = new Date();
    let from = new Date();
    from.setHours(to.getHours() - 96);

    this.unit = attrs.unit || 'hour';
    this.from = attrs.from || from;
    this.to = attrs.to || to;
  }

  get attrs() {
    const { unit, from, to } = this;
    return {unit, from, to};
  }

  get valid() {
    return this.UNIT_TYPES.indexOf(this.unit) !== -1 &&
      this.to instanceof Date && this.from instanceof Date;
  }
}
TimeClause.TYPE = TimeClause.prototype.TYPE = 'time';
TimeClause.UNIT_TYPES = TimeClause.prototype.UNIT_TYPES = [
  'hour', 'day', 'week', 'month', 'quarter', 'year'
];
