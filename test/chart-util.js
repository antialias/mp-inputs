import expect from 'expect.js';

import { nestedObjectToNestedArray } from '../src/irb-app/irb-result/chart-util';

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
