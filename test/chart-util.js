import expect from 'expect.js';

import { nestedObjectToNestedArray } from '../src/irb-app/irb-result/chart-util';

describe('nestedObjectToNestedArray', function() {
  const simpleObj = {
    llama: 5,
    wombat: 8,
  };

  // expected = [
  //   {
  //     label: 'wombat',
  //     value: 8,
  //   },
  //   {
  //     label: 'llama',
  //     value: 5,
  //   },
  // ];

  it('nests arrays to the same depth as the object', function() {
    let arr = nestedObjectToNestedArray(simpleObj);
    expect(arr).to.be.an('array');
    expect(arr).to.have.length(2);
    expect(arr[1]).to.be.an('object');
    expect(arr[1].label).to.be.a('string');
    expect(arr[1].value).to.be.a('number');
  });
});
