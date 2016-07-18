import expect from 'expect.js';

import { nestedObjectToNestedArray } from '../src/irb-app/irb-result/chart-util';

describe('nestedObjectToNestedArray', function() {
  const simpleObj = {
    llama: 5,
    wombat: 8,
  };

  const defaultSortConfig = {
    sortBy: 'value',
    sortOrder: 'desc',
  };

  it('nests arrays to the same depth as the object', function() {
    let arr = nestedObjectToNestedArray(simpleObj, defaultSortConfig);
    expect(arr).to.be.an('array');
    expect(arr).to.have.length(2);
    expect(arr[1]).to.be.an('object');
    expect(arr[1].label).to.be.a('string');
    expect(arr[1].value).to.be.a('number');
  });

  it('supports sorting by the final value descending', function() {
    let arr = nestedObjectToNestedArray(simpleObj, defaultSortConfig);
    expect(arr[0]).to.eql({label: 'wombat', value: 8});
    expect(arr[1]).to.eql({label: 'llama', value: 5});
  });

  it('supports sorting by the final value ascending', function() {
    let arr = nestedObjectToNestedArray(simpleObj, {
      sortBy: 'value',
      sortOrder: 'asc',
    });
    expect(arr[0]).to.eql({label: 'llama', value: 5});
    expect(arr[1]).to.eql({label: 'wombat', value: 8});
  });
});
