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
      expect(arr[0]).to.eql({label: 'aardvark', value: 8});
      expect(arr[1]).to.eql({label: 'llama', value: 5});
    });

    it('supports sorting by the final value ascending', function() {
      const arr = nestedObjectToNestedArray(simpleObj, {
        sortBy: 'value',
        sortOrder: 'asc',
      });
      expect(arr[0]).to.eql({label: 'llama', value: 5});
      expect(arr[1]).to.eql({label: 'aardvark', value: 8});
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
      expect(arr[0]).to.eql({label: 'aardvark', value: 8});
      expect(arr[1]).to.eql({label: 'llama', value: 5});
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
      expect(arr[0]).to.eql({label: 'llama', value: 5});
      expect(arr[1]).to.eql({label: 'aardvark', value: 8});
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
      expect(arr[0]).to.eql({label: 'llama', value: 5});
      expect(arr[1]).to.eql({label: 'aardvark', value: 8});
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
      expect(arr[0]).to.eql({label: 'aardvark', value: 8});
      expect(arr[1]).to.eql({label: 'llama', value: 5});
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
        aardvark: 7,
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

      expect(arr[1].value).to.be.an('array');
      expect(arr[1].value[1]).to.be.an('object');
      expect(arr[1].value[1].label).to.be.a('string');
      expect(arr[1].value[1].value).to.be.a('number');
    });
  });
});
