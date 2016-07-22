import expect from 'expect.js';

import {
  nestedObjectToNestedArray,
  nestedObjectToBarChartData,
  nestedObjectToTableData,
} from '../src/irb-app/irb-result/chart-util';

const d2Obj = {
  US: {
    llama: 5,
    aardvark: 8,
  },
  Canada: {
    llama: 13,
    aardvark: 6,
  },
  Mexico: {
    llama: 35,
    aardvark: 7,
  },
};

describe('nestedObjectToTableData', function() {
  it('sorts by group sums', function() {
    const arr = nestedObjectToTableData(d2Obj, {
      sortGroup: 0,
      sortOrder: 'desc',
    });
    expect(arr).to.eql([
      [{value: 'Mexico', sum: 42}, {'aardvark': 7, 'llama': 35}],
      [{value: 'Canada', sum: 19}, {'aardvark': 6, 'llama': 13}],
      [{value: 'US',     sum: 13}, {'aardvark': 8, 'llama': 5 }],
    ]);
  });

  it('sorts by individual values', function() {
    const arr = nestedObjectToTableData(d2Obj, {
      sortGroup: 1,
      sortColumn: 'aardvark',
      sortOrder: 'asc',
    });
    expect(arr).to.eql([
      [{value: 'Canada', sum: 19}, {'aardvark': 6, 'llama': 13}],
      [{value: 'Mexico', sum: 42}, {'aardvark': 7, 'llama': 35}],
      [{value: 'US',     sum: 13}, {'aardvark': 8, 'llama': 5 }],
    ]);
  });
});

describe('nestedObjectToBarChartData', function() {
  it('flattens a simple object', function() {
    const arr = nestedObjectToBarChartData({
      llama: 5,
      aardvark: 8,
    }, {
      sortBy: 'value',
      sortOrder: 'desc',
    });
    expect(arr).to.eql([
      [['aardvark', 'llama'], [8, 5]],
    ]);
  });

  it('flattens a nested object sorted by column', function() {
    const arr = nestedObjectToBarChartData(d2Obj, {
      sortBy: 'column',
      colSortAttrs: [
        {
          sortBy: 'value',
          sortOrder: 'asc',
        },
        {
          sortBy: 'value',
          sortOrder: 'desc',
        },
      ],
    });
    expect(arr).to.eql([
      [{value: 'US',     sum: 13}, ['aardvark', 'llama'], [8,  5]],
      [{value: 'Canada', sum: 19}, ['llama', 'aardvark'], [13, 6]],
      [{value: 'Mexico', sum: 42}, ['llama', 'aardvark'], [35, 7]],
    ]);
  });

  it('flattens a nested object sorted by final value', function() {
    const arr = nestedObjectToBarChartData(d2Obj, {
      sortBy: 'value',
      sortOrder: 'desc',
    });
    expect(arr).to.eql([
      [{value: 'Mexico', sum: 35}, ['llama'],    [35]],
      [{value: 'Canada', sum: 13}, ['llama'],    [13]],
      [{value: 'US',     sum: 8 }, ['aardvark'], [8] ],
      [{value: 'Mexico', sum: 7 }, ['aardvark'], [7] ],
      [{value: 'Canada', sum: 6 }, ['aardvark'], [6] ],
      [{value: 'US',     sum: 5 }, ['llama'],    [5] ],
    ]);
  });

  it('flattens a deeply nested object', function() {
    const arr = nestedObjectToBarChartData({
      US: {
        llama: {
          red: 3,
          blue: 2,
        },
        aardvark: {
          red: 2,
          blue: 6,
        },
      },
      Canada: {
        llama: {
          red: 10,
          blue: 3,
        },
        aardvark: {
          red: 1,
          blue: 5,
        },
      },
    }, {
      sortBy: 'column',
      colSortAttrs: [
        {
          sortBy: 'value',
          sortOrder: 'asc',
        },
        {
          sortBy: 'value',
          sortOrder: 'desc',
        },
        {
          sortBy: 'label',
          sortOrder: 'asc',
        },
      ],
    });
    expect(arr).to.eql([
      [{value: 'US',     sum: 13, rowSpan: 2}, {value: 'aardvark', sum: 8 }, ['blue', 'red'], [6, 2 ]],
      [null,                                   {value: 'llama',    sum: 5 }, ['blue', 'red'], [2, 3 ]],
      [{value: 'Canada', sum: 19, rowSpan: 2}, {value: 'llama',    sum: 13}, ['blue', 'red'], [3, 10]],
      [null,                                   {value: 'aardvark', sum: 6 }, ['blue', 'red'], [5, 1 ]],
    ]);
  });

  it('flattens a depth-4 nested object', function() {
    const arr = nestedObjectToBarChartData({
      bunnies: {
        US: {
          llama: {
            red: 3,
            blue: 2,
          },
          aardvark: {
            red: 2,
            blue: 6,
          },
        },
        Canada: {
          llama: {
            red: 10,
            blue: 3,
          },
          aardvark: {
            red: 1,
            blue: 5,
          },
        },
      },
      kittens: {
        US: {
          llama: {
            red: 3,
            blue: 2,
          },
          aardvark: {
            red: 2,
            blue: 6,
          },
        },
        Canada: {
          llama: {
            red: 10,
            blue: 3,
          },
          aardvark: {
            red: 1,
            blue: 5,
          },
        },
      },
    }, {
      sortBy: 'column',
      colSortAttrs: [
        {
          sortBy: 'label',
          sortOrder: 'desc',
        },
        {
          sortBy: 'value',
          sortOrder: 'asc',
        },
        {
          sortBy: 'value',
          sortOrder: 'desc',
        },
        {
          sortBy: 'label',
          sortOrder: 'asc',
        },
      ],
    });
    expect(arr).to.eql([
      [{value: 'kittens', sum: 32, rowSpan: 4}, {value: 'US',     sum: 13, rowSpan: 2}, {value: 'aardvark', sum: 8 }, ['blue', 'red'], [6, 2 ]],
      [null,                                    null,                                   {value: 'llama',    sum: 5 }, ['blue', 'red'], [2, 3 ]],
      [null,                                    {value: 'Canada', sum: 19, rowSpan: 2}, {value: 'llama',    sum: 13}, ['blue', 'red'], [3, 10]],
      [null,                                    null,                                   {value: 'aardvark', sum: 6 }, ['blue', 'red'], [5, 1 ]],
      [{value: 'bunnies', sum: 32, rowSpan: 4}, {value: 'US',     sum: 13, rowSpan: 2}, {value: 'aardvark', sum: 8 }, ['blue', 'red'], [6, 2 ]],
      [null,                                    null,                                   {value: 'llama',    sum: 5 }, ['blue', 'red'], [2, 3 ]],
      [null,                                    {value: 'Canada', sum: 19, rowSpan: 2}, {value: 'llama',    sum: 13}, ['blue', 'red'], [3, 10]],
      [null,                                    null,                                   {value: 'aardvark', sum: 6 }, ['blue', 'red'], [5, 1 ]],
    ]);
  });
});

describe('nestedObjectToNestedArray', function() {
  context('with a simple (depth 1) object', function() {
    const simpleObj = {
      llama: 5,
      aardvark: 8,
    };

    it('nests arrays to the same depth as the object', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'value',
        sortOrder: 'desc',
      });
      expect(arr).to.be.an('array');
      expect(arr).to.have.length(2);
      expect(arr[1]).to.be.an('object');
      expect(arr[1].label).to.be.a('string');
      expect(arr[1].value).to.be.a('number');
    });

    it('supports sorting by the final value descending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'value',
        sortOrder: 'desc',
      });
      expect(arr).to.eql([
        {label: 'aardvark', value: 8},
        {label: 'llama',    value: 5},
      ]);
    });

    it('supports sorting by the final value ascending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'value',
        sortOrder: 'asc',
      });
      expect(arr).to.eql([
        {label: 'llama',    value: 5},
        {label: 'aardvark', value: 8},
      ]);
    });

    it('supports sorting by column value descending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {label: 'aardvark', value: 8},
        {label: 'llama',    value: 5},
      ]);
    });

    it('supports sorting by column value ascending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'asc',
          },
        ],
      });
      expect(arr).to.eql([
        {label: 'llama',    value: 5},
        {label: 'aardvark', value: 8},
      ]);
    });

    it('supports sorting by column label descending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'label',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {label: 'llama',    value: 5},
        {label: 'aardvark', value: 8},
      ]);
    });

    it('supports sorting by column label ascending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'label',
            sortOrder: 'asc',
          },
        ],
      });
      expect(arr).to.eql([
        {label: 'aardvark', value: 8},
        {label: 'llama',    value: 5},
      ]);
    });
  });

  context('with depth 2', function() {
    const d2Obj = {
      US: {
        llama: 5,
        aardvark: 8,
      },
      Canada: {
        llama: 13,
        aardvark: 6,
      },
      Mexico: {
        llama: 35,
        aardvark: 7,
      },
    };

    it('nests arrays to the same depth as the object', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      });

      expect(arr).to.be.an('array');
      expect(arr).to.have.length(3);
      expect(arr[1]).to.be.an('object');
      expect(arr[1].label).to.be.a('string');

      expect(arr[1].children).to.be.an('array');
      expect(arr[1].children[1]).to.be.an('object');
      expect(arr[1].children[1].label).to.be.a('string');
      expect(arr[1].children[1].value).to.be.a('number');
    });

    it('supports sorting on multiple columns', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'label',
            sortOrder: 'desc',
          },
          {
            sortBy: 'label',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {
          label: 'US',
          value: 13,
          children: [
            {label: 'llama',    value: 5},
            {label: 'aardvark', value: 8},
          ],
        },
        {
          label: 'Mexico',
          value: 42,
          children: [
            {label: 'llama',    value: 35},
            {label: 'aardvark', value: 7},
          ],
        },
        {
          label: 'Canada',
          value: 19,
          children: [
            {label: 'llama',    value: 13},
            {label: 'aardvark', value: 6},
          ],
        },
      ]);
    });

    it('supports different sorts for different columns', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'label',
            sortOrder: 'asc',
          },
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {
          label: 'Canada',
          value: 19,
          children: [
            {label: 'llama',    value: 13},
            {label: 'aardvark', value: 6},
          ],
        },
        {
          label: 'Mexico',
          value: 42,
          children: [
            {label: 'llama',    value: 35},
            {label: 'aardvark', value: 7},
          ],
        },
        {
          label: 'US',
          value: 13,
          children: [
            {label: 'aardvark', value: 8},
            {label: 'llama',    value: 5},
          ],
        },
      ]);
    });

    it('uses sums for sorting by value on nested groups', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {
          label: 'Mexico',
          value: 42,
          children: [
            {label: 'llama',    value: 35},
            {label: 'aardvark', value: 7},
          ],
        },
        {
          label: 'Canada',
          value: 19,
          children: [
            {label: 'llama',    value: 13},
            {label: 'aardvark', value: 6},
          ],
        },
        {
          label: 'US',
          value: 13,
          children: [
            {label: 'aardvark', value: 8},
            {label: 'llama',    value: 5},
          ],
        },
      ]);
    });

    it('supports different sort orders together with sums', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'asc',
          },
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      });
      expect(arr).to.eql([
        {
          label: 'US',
          value: 13,
          children: [
            {label: 'aardvark', value: 8},
            {label: 'llama',    value: 5},
          ],
        },
        {
          label: 'Canada',
          value: 19,
          children: [
            {label: 'llama',    value: 13},
            {label: 'aardvark', value: 6},
          ],
        },
        {
          label: 'Mexico',
          value: 42,
          children: [
            {label: 'llama',    value: 35},
            {label: 'aardvark', value: 7},
          ],
        },
      ]);
    });

    it('supports sorting by final value descending', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'value',
        sortOrder: 'desc',
      });
      expect(arr).to.eql([
        {label: 'Mexico', value: 35, children: [{label: 'llama',    value: 35}]},
        {label: 'Canada', value: 13, children: [{label: 'llama',    value: 13}]},
        {label: 'US',     value: 8,  children: [{label: 'aardvark', value: 8 }]},
        {label: 'Mexico', value: 7,  children: [{label: 'aardvark', value: 7 }]},
        {label: 'Canada', value: 6,  children: [{label: 'aardvark', value: 6 }]},
        {label: 'US',     value: 5,  children: [{label: 'llama',    value: 5 }]},
      ]);
    });

    it('supports sorting by final value ascending', function() {
      const arr = nestedObjectToNestedArray(d2Obj, {
        sortBy: 'value',
        sortOrder: 'asc',
      });
      expect(arr).to.eql([
        {label: 'US',     value: 5,  children: [{label: 'llama',    value: 5 }]},
        {label: 'Canada', value: 6,  children: [{label: 'aardvark', value: 6 }]},
        {label: 'Mexico', value: 7,  children: [{label: 'aardvark', value: 7 }]},
        {label: 'US',     value: 8,  children: [{label: 'aardvark', value: 8 }]},
        {label: 'Canada', value: 13, children: [{label: 'llama',    value: 13}]},
        {label: 'Mexico', value: 35, children: [{label: 'llama',    value: 35}]},
      ]);
    });
  });
});
