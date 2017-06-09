/* global describe, it */
import expect from 'expect.js';

import {
  d4Obj,
  timeseriesResultObj,
  d2ResultsObj,
  d3ResultsObj,
} from './fixtures';

import {
  filterObject,
  flattenNestedObjectToPath,
  formatSource,
  nestedObjectCumulative,
  reachableNodesOfKey,
  uniqueObjKeysAtDepth,
  hasDefinedValue,
} from '../../src/util';

import {
  transposeColsToRows,
} from '../../src/util/chart';

describe(`filterObject`, () => {
  it(`filters one value at lowest depth`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 1 ? value !== `red` : `false`);
    expect(arr).to.eql({
      bunnies: {
        US: {
          llama: { 'blue': 2 },
          aardvark: { 'blue': 16 },
        },
        Canada: {
          llama: { 'blue': 13 },
          aardvark: { 'blue': 5 },
        },
      },
      kittens: {
        US: {
          llama: { 'blue': 12 },
          aardvark: { 'blue': 6 },
        },
        Canada: {
          llama: { 'blue': 3 },
          aardvark: { 'blue': 15 },
        },
      },
    });
  });

  it(`filters all values at middle depth`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 3 ? ![`US`, `Canada`].includes(value) : `false`);
    expect(arr).to.be.empty();
  });

  it(`filters one value at top level`, () => {
    const arr = filterObject(d4Obj, (value, depth) => depth === 4 ? value !== `kittens` : `false`);
    expect(arr).to.eql({
      "bunnies": {
        "Canada": {
          "aardvark": {
            "blue": 5,
            "red": 1,
          },
          "llama": {
            "blue": 13,
            "red": 10,
          },
        },
        "US": {
          "aardvark": {
            "blue": 16,
            "red": 2,
          },
          "llama": {
            "blue": 2,
            "red": 3,
          },
        },
      },
    });
  });
});


describe(`flattenNestedObjectToPath`, () => {
  it(`convert 2d series object to segment values and paths`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series);
    expect(obj).to.eql({
      paths:{
        'Mac OS X Chrome':[`Mac OS X`, `Chrome`],
        'Mac OS X Firefox':[`Mac OS X`, `Firefox`],
        'Mac OS X Opera':[`Mac OS X`, `Opera`],
        'Mac OS X Safari':[`Mac OS X`, `Safari`],
        'Windows Chrome':[`Windows`, `Chrome`],
        'Windows Firefox':[`Windows`, `Firefox`],
        'Windows Opera':[`Windows`, `Opera`],
      },
      values:{
        'Mac OS X Chrome':{
          '1472626800000':1990,
          '1472630400000':2122,
          '1472634000000':2035,
        },
        'Mac OS X Firefox':{
          '1472626800000':56,
          '1472630400000':93,
          '1472634000000':82,
        },
        'Mac OS X Opera':{
          '1472626800000':0,
          '1472630400000':0,
          '1472634000000':0,
        },
        'Mac OS X Safari':{
          '1472626800000':329,
          '1472630400000':459,
          '1472634000000':579,
        },
        'Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        },
        'Windows Opera':{
          '1472626800000':1,
          '1472630400000':1,
          '1472634000000':3,
        },
      },
    });
  });

  it(`convert 2d series object to segment values and paths and flattens time values`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series, {flattenValues: true});
    expect(obj).to.eql({
      paths:{
        'Mac OS X Chrome':[`Mac OS X`, `Chrome`],
        'Mac OS X Firefox':[`Mac OS X`, `Firefox`],
        'Mac OS X Opera':[`Mac OS X`, `Opera`],
        'Mac OS X Safari':[`Mac OS X`, `Safari`],
        'Windows Chrome':[`Windows`, `Chrome`],
        'Windows Firefox':[`Windows`, `Firefox`],
        'Windows Opera':[`Windows`, `Opera`],
      },
      values:{
        'Mac OS X Chrome': 6147,
        'Mac OS X Firefox': 231,
        'Mac OS X Safari': 1367,
        'Windows Chrome': 3674,
        'Windows Firefox': 369,
        'Windows Opera': 5,
      },
    });
  });

  it(`convert 3d series object to segment values and paths`, () => {
    const obj = flattenNestedObjectToPath(d3ResultsObj.series);
    expect(obj).to.eql({
      'paths':{
        'Viewed Report Mac OS X Chrome':[`Viewed Report`, `Mac OS X`, `Chrome`],
        'Viewed Report Mac OS X Safari': [`Viewed Report`, `Mac OS X`, `Safari`],
        'Viewed Report Windows Chrome': [`Viewed Report`, `Windows`, `Chrome`],
        'Viewed Report Windows Firefox': [`Viewed Report`, `Windows`, `Firefox`],
        'Viewed Report Windows Opera': [`Viewed Report`, `Windows`, `Opera`],
        'Viewed Signup Linux Firefox': [`Viewed Signup`, `Linux`, `Firefox`],
        'Viewed Signup Linux Safari': [`Viewed Signup`, `Linux`, `Safari`],
        'Viewed Signup Windows Chrome': [`Viewed Signup`, `Windows`, `Chrome`],
        'Viewed Signup Windows Firefox': [`Viewed Signup`, `Windows`, `Firefox`],
      },
      'values':{
        'Viewed Report Mac OS X Chrome':{
          '1472626800000':1990,
          '1472630400000':2122,
          '1472634000000':2035,
        },
        'Viewed Report Mac OS X Safari':{
          '1472626800000':329,
          '1472630400000':459,
          '1472634000000':579,
        },
        'Viewed Report Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Viewed Report Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        },
        'Viewed Report Windows Opera':{
          '1472626800000':1,
          '1472630400000':1,
          '1472634000000':3,
        },
        'Viewed Signup Linux Firefox':{
          '1472626800000':56,
          '1472630400000':93,
          '1472634000000':82,
        },
        'Viewed Signup Linux Safari':{
          '1472626800000':0,
          '1472630400000':0,
          '1472634000000':0,
        },
        'Viewed Signup Windows Chrome':{
          '1472626800000':1300,
          '1472630400000':1212,
          '1472634000000':1162,
        },
        'Viewed Signup Windows Firefox':{
          '1472626800000':100,
          '1472630400000':131,
          '1472634000000':138,
        },
      },
    });
  });

  it(`convert 3d series object to segment values and paths and flattens time values`, () => {
    const obj = flattenNestedObjectToPath(d3ResultsObj.series, {flattenValues: true});
    expect(obj).to.eql({
      'paths':{
        'Viewed Report Mac OS X Chrome':[`Viewed Report`, `Mac OS X`, `Chrome`],
        'Viewed Report Mac OS X Safari': [`Viewed Report`, `Mac OS X`, `Safari`],
        'Viewed Report Windows Chrome': [`Viewed Report`, `Windows`, `Chrome`],
        'Viewed Report Windows Firefox': [`Viewed Report`, `Windows`, `Firefox`],
        'Viewed Report Windows Opera': [`Viewed Report`, `Windows`, `Opera`],
        'Viewed Signup Linux Firefox': [`Viewed Signup`, `Linux`, `Firefox`],
        'Viewed Signup Linux Safari': [`Viewed Signup`, `Linux`, `Safari`],
        'Viewed Signup Windows Chrome': [`Viewed Signup`, `Windows`, `Chrome`],
        'Viewed Signup Windows Firefox': [`Viewed Signup`, `Windows`, `Firefox`],
      },
      'values':{
        'Viewed Report Mac OS X Chrome': 6147,
        'Viewed Report Mac OS X Safari': 1367,
        'Viewed Report Windows Chrome': 3674,
        'Viewed Report Windows Firefox': 369,
        'Viewed Report Windows Opera': 5,
        'Viewed Signup Linux Firefox': 231,
        'Viewed Signup Windows Chrome': 3674,
        'Viewed Signup Windows Firefox': 369,
      },
    });
  });


  it(`handles a custom header formatting`, () => {
    const obj = flattenNestedObjectToPath(d2ResultsObj.series, {
      flattenValues: true,
      formatHeader: keys => keys.map((key, idx) => `${idx + 1}) ${key}`).join(`, `),
    });
    expect(obj).to.eql({
      paths: {
        '1) Mac OS X, 2) Chrome': [ `Mac OS X`, `Chrome` ],
        '1) Mac OS X, 2) Firefox': [ `Mac OS X`, `Firefox` ],
        '1) Mac OS X, 2) Opera': [ `Mac OS X`, `Opera` ],
        '1) Mac OS X, 2) Safari': [ `Mac OS X`, `Safari` ],
        '1) Windows, 2) Chrome': [ `Windows`, `Chrome` ],
        '1) Windows, 2) Firefox': [ `Windows`, `Firefox` ],
        '1) Windows, 2) Opera': [ `Windows`, `Opera` ],
      },
      values: {
        '1) Mac OS X, 2) Chrome': 6147,
        '1) Mac OS X, 2) Firefox': 231,
        '1) Mac OS X, 2) Safari': 1367,
        '1) Windows, 2) Chrome': 3674,
        '1) Windows, 2) Firefox': 369,
        '1) Windows, 2) Opera': 5,
      },
    });
  });
});

describe(`nestedObjectCumulative`, () => {
  it(`supports rolling sum on the leaf nodes`, () => {
    const arr = nestedObjectCumulative(timeseriesResultObj);
    expect(arr).to.eql({
      US: {
        '1464739200000': 8,
        '1464825600000': 10,
        '1464912000000': 12,
        '1464998400000': 20,
        '1465084800000': 34,
      },
      Canada: {
        '1464739200000': 6,
        '1464825600000': 9,
        '1464912000000': 12,
        '1464998400000': 24,
        '1465084800000': 30,
      },
    });
  });
});

describe(`uniqueObjKeysAtDepth`, () => {
  it(`produces unique keys for lowest depth`, () => {
    const arr = uniqueObjKeysAtDepth(d4Obj, 1);
    expect(arr).to.have.length(2);
    expect(arr).to.contain(`blue`, `red`);
  });

  it(`produces unique keys for top level`, () => {
    const arr = uniqueObjKeysAtDepth(d4Obj, 4);
    expect(arr).to.have.length(2);
    expect(arr).to.contain(`bunnies`, `kittens`);
  });
});


describe(`reachableNodesOfKey`, () => {
  it(`finds family for keys at lowest depth`, () => {
    const ancestorsOfChrome = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: [`Chrome`],
    });
    expect(ancestorsOfChrome).to.eql({
      '2': { Chrome: true },
      '3': { 'Mac OS X': true, Windows: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });

    const ancestorsOfSafari = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 2,
      keysToMatch: [`Safari`],
    });
    expect(ancestorsOfSafari).to.eql({
      '2': { Safari: true },
      '3': { 'Mac OS X': true, Linux: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });
  });

  it(`finds family at a center key depth`, () => {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 3,
      keysToMatch: [`Windows`],
    });
    expect(ancestorsOfWindows).to.eql({
      '2': { Chrome: true, Firefox: true, Opera: true },
      '3': { Windows: true },
      '4': { 'Viewed Report': true, 'Viewed Signup': true },
    });
  });

  it(`finds family at heighest key depth`, () => {
    const ancestorsOfWindows = reachableNodesOfKey({
      series: d3ResultsObj.series,
      depth: 4,
      keysToMatch: [`Viewed Report`],
    });
    expect(ancestorsOfWindows).to.eql({
      '2': { Chrome: true, Firefox: true, Opera: true, Safari: true },
      '3': { 'Mac OS X': true, Windows: true },
      '4': { 'Viewed Report': true },
    });
  });
});

describe(`transposeColsToRows`, () => {
  it(`throws when series is not a table`, () => {
    expect(() => {
      transposeColsToRows([`$browser`], {}, `Total number of`);
    }).to.throwError();
  });

  it(`transposes cols to rows`, () => {
    expect(transposeColsToRows(
      [`$browser`, `$city`],
      {
        Chrome: {
          Sydney: 10,
          London: 20,
        },
        Safari: {
          Sydney: 10,
          London: 20,
        },
      },
      `Total number of`
    )).to.eql({
      headers: [`$browser`, `$city`, `Total number of`],
      series: {
        Chrome: {
          Sydney: { 'Total number of': 10 },
          London: { 'Total number of': 20 },
        },
        Safari: {
          Sydney: { 'Total number of': 10 },
          London: { 'Total number of': 20 },
        },
      },
    });
  });
});

describe(`hasDefinedValue`, () => {
  it(`returns false for undefined, null and NaN`, () => {
    expect(hasDefinedValue(undefined)).to.be(false);
    expect(hasDefinedValue(null)).to.be(false);
    expect(hasDefinedValue(NaN)).to.be(false);
  });

  it(`returns true for 0, false and empty strings`, () => {
    expect(hasDefinedValue(0)).to.be(true);
    expect(hasDefinedValue(``)).to.be(true);
    expect(hasDefinedValue(false)).to.be(true);
  });

  it(`returns true for truthy values`, () => {
    expect(hasDefinedValue(true)).to.be(true);
    expect(hasDefinedValue(`☕`)).to.be(true);
    expect(hasDefinedValue(-1)).to.be(true);
    expect(hasDefinedValue(Number.POSITIVE_INFINITY)).to.be(true);
    expect(hasDefinedValue({})).to.be(true);
    expect(hasDefinedValue(Object.create(null))).to.be(true);
  });
});

describe(`formatSource`, () => {
  it(`works with various combinations of input params and sources`, () => {
    let singular, all, article, property; // input flags
    singular = all = article = property = true;

    expect(formatSource(`events`)).to.equal(`Events`);
    expect(formatSource(`events`, {})).to.equal(`Events`);
    expect(formatSource(`events`, {singular})).to.equal(`Event`);
    expect(formatSource(`events`, {all})).to.equal(`All Events`);
    expect(formatSource(`events`, {article})).to.equal(`An event`);
    expect(formatSource(`events`, {property})).to.equal(`Event properties`);
    expect(formatSource(`events`, {singular, all})).to.equal(`All Events`);
    expect(formatSource(`events`, {singular, article})).to.equal(`An event`);
    expect(formatSource(`events`, {singular, property})).to.equal(`Event property`);
    expect(formatSource(`events`, {all, article})).to.equal(`All Events`);
    expect(formatSource(`events`, {all, property})).to.equal(`All Event Properties`);
    expect(formatSource(`events`, {article, property})).to.equal(`An event property`);
    expect(formatSource(`events`, {property})).to.equal(`Event properties`);
    expect(formatSource(`events`, {singular, article, property})).to.equal(`An event property`);

    expect(formatSource(`people`)).to.equal(`People`);
    expect(formatSource(`people`, {})).to.equal(`People`);
    expect(formatSource(`people`, {singular})).to.equal(`People`);
    expect(formatSource(`people`, {all})).to.equal(`All People`);
    expect(formatSource(`people`, {article})).to.equal(`A people`);
    expect(formatSource(`people`, {property})).to.equal(`People properties`);
    expect(formatSource(`people`, {singular, all})).to.equal(`All People`);
    expect(formatSource(`people`, {singular, article})).to.equal(`A people`);
    expect(formatSource(`people`, {singular, property})).to.equal(`People property`);
    expect(formatSource(`people`, {all, article})).to.equal(`All People`);
    expect(formatSource(`people`, {all, property})).to.equal(`All People Properties`);
    expect(formatSource(`people`, {article, property})).to.equal(`A people property`);
    expect(formatSource(`people`, {property})).to.equal(`People properties`);
    expect(formatSource(`people`, {singular, article, property})).to.equal(`A people property`);

    expect(formatSource(`accounts`)).to.equal(`Accounts`);
    expect(formatSource(`accounts`, {})).to.equal(`Accounts`);
    expect(formatSource(`accounts`, {singular})).to.equal(`Account`);
    expect(formatSource(`accounts`, {all})).to.equal(`All Accounts`);
    expect(formatSource(`accounts`, {article})).to.equal(`An account`);
    expect(formatSource(`accounts`, {property})).to.equal(`Account properties`);
    expect(formatSource(`accounts`, {singular, all})).to.equal(`All Accounts`);
    expect(formatSource(`accounts`, {singular, article})).to.equal(`An account`);
    expect(formatSource(`accounts`, {singular, property})).to.equal(`Account property`);
    expect(formatSource(`accounts`, {all, article})).to.equal(`All Accounts`);
    expect(formatSource(`accounts`, {all, property})).to.equal(`All Account Properties`);
    expect(formatSource(`accounts`, {article, property})).to.equal(`An account property`);
    expect(formatSource(`accounts`, {property})).to.equal(`Account properties`);
    expect(formatSource(`accounts`, {singular, article, property})).to.equal(`An account property`);

    expect(formatSource(`contacts`)).to.equal(`Contacts`);
    expect(formatSource(`contacts`, {})).to.equal(`Contacts`);
    expect(formatSource(`contacts`, {singular})).to.equal(`Contact`);
    expect(formatSource(`contacts`, {all})).to.equal(`All Contacts`);
    expect(formatSource(`contacts`, {article})).to.equal(`A contact`);
    expect(formatSource(`contacts`, {property})).to.equal(`Contact properties`);
    expect(formatSource(`contacts`, {singular, all})).to.equal(`All Contacts`);
    expect(formatSource(`contacts`, {singular, article})).to.equal(`A contact`);
    expect(formatSource(`contacts`, {singular, property})).to.equal(`Contact property`);
    expect(formatSource(`contacts`, {all, article})).to.equal(`All Contacts`);
    expect(formatSource(`contacts`, {all, property})).to.equal(`All Contact Properties`);
    expect(formatSource(`contacts`, {article, property})).to.equal(`A contact property`);
    expect(formatSource(`contacts`, {property})).to.equal(`Contact properties`);
    expect(formatSource(`contacts`, {singular, article, property})).to.equal(`A contact property`);

    expect(formatSource(`leads`)).to.equal(`Leads`);
    expect(formatSource(`leads`, {})).to.equal(`Leads`);
    expect(formatSource(`leads`, {singular})).to.equal(`Lead`);
    expect(formatSource(`leads`, {all})).to.equal(`All Leads`);
    expect(formatSource(`leads`, {article})).to.equal(`A lead`);
    expect(formatSource(`leads`, {property})).to.equal(`Lead properties`);
    expect(formatSource(`leads`, {singular, all})).to.equal(`All Leads`);
    expect(formatSource(`leads`, {singular, article})).to.equal(`A lead`);
    expect(formatSource(`leads`, {singular, property})).to.equal(`Lead property`);
    expect(formatSource(`leads`, {all, article})).to.equal(`All Leads`);
    expect(formatSource(`leads`, {all, property})).to.equal(`All Lead Properties`);
    expect(formatSource(`leads`, {article, property})).to.equal(`A lead property`);
    expect(formatSource(`leads`, {property})).to.equal(`Lead properties`);
    expect(formatSource(`leads`, {singular, article, property})).to.equal(`A lead property`);

    expect(formatSource(`☕`)).to.equal(`☕`);
    expect(formatSource(`☕`, {})).to.equal(`☕`);
    expect(formatSource(`☕`, {singular})).to.equal(`☕`);
    expect(formatSource(`☕`, {all})).to.equal(`All ☕`);
    expect(formatSource(`☕`, {article})).to.equal(`A ☕`);
    expect(formatSource(`☕`, {property})).to.equal(`☕ properties`);
    expect(formatSource(`☕`, {singular, all})).to.equal(`All ☕`);
    expect(formatSource(`☕`, {singular, article})).to.equal(`A ☕`);
    expect(formatSource(`☕`, {singular, property})).to.equal(`☕ property`);
    expect(formatSource(`☕`, {all, article})).to.equal(`All ☕`);
    expect(formatSource(`☕`, {all, property})).to.equal(`All ☕ Properties`);
    expect(formatSource(`☕`, {article, property})).to.equal(`A ☕ property`);
    expect(formatSource(`☕`, {property})).to.equal(`☕ properties`);
    expect(formatSource(`☕`, {singular, article, property})).to.equal(`A ☕ property`);
  });

  it(`throws with non-string input`, () => {
    expect(() => formatSource()).to.throwError(`Invalid input: undefined`);
    expect(() => formatSource(null)).to.throwError(`Invalid input: null`);
    expect(() => formatSource(0)).to.throwError(`Invalid input: 0`);
    expect(() => formatSource([])).to.throwError(`Invalid input: []`);
    expect(() => formatSource({})).to.throwError(`Invalid input: {}`);
  });
});
