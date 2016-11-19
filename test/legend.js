import expect from 'expect.js';

import { d2ResultsObj } from './fixtures';

import Legend from '../src/models/legend';

describe('Legend', function() {
  context('with default values', function() {
    beforeEach(function() {
      this.legend = new Legend({});
      this.legend.updateLegendData(d2ResultsObj);
    });

    it('only expands the first series', function() {
      expect(this.legend.seriesShowing).to.eql(['all', 'hidden']);
    });

    it('sets the first 24 keys with highest numerical value to true', function() {
      expect(this.legend.data[0].seriesName).to.eql('$browser');
      expect(this.legend.data[0].seriesData).to.eql({
        Chrome: true,
        Safari: true,
        Firefox: true,
        Opera: true,
      });
      expect(this.legend.data[0].flattenedData).to.eql({
        'Mac OS X Chrome': true,
        'Windows Chrome': true,
        'Mac OS X Safari': true,
        'Windows Firefox': true,
        'Mac OS X Firefox': true,
        'Windows Opera': true,
      });
    });

    it('creates flattened data for the first segment', function() {
      expect(this.legend.data[0].flattenedDataPaths).to.eql({
        'Mac OS X Chrome': [ 'Mac OS X', 'Chrome' ],
        'Mac OS X Firefox': [ 'Mac OS X', 'Firefox' ],
        'Mac OS X Safari': [ 'Mac OS X', 'Safari' ],
        'Windows Chrome': [ 'Windows', 'Chrome' ],
        'Windows Firefox': [ 'Windows', 'Firefox' ],
        'Windows Opera': [ 'Windows', 'Opera' ],
      });
      expect(this.legend.data[0].flattenedDataSortedKeys).to.eql([
        'Mac OS X Chrome',
        'Windows Chrome',
        'Mac OS X Safari',
        'Windows Firefox',
        'Mac OS X Firefox',
        'Windows Opera',
      ]);
    });

    it('orders from highest numerical value to lowest for series data', function() {
      this.legend.buildColorMap();
      expect(this.legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
        Firefox: 3,
        Opera: 4,
      });
    });

    it('orders from highest numerical value to lowest for flattened data', function() {
      expect(this.legend.getColorForSeries('Mac OS X Chrome', true)).to.eql(1);
      expect(this.legend.getColorForSeries('Mac OS X Firefox', true)).to.eql(5);
      expect(this.legend.getColorForSeries('Mac OS X Safari', true)).to.eql(3);
    });

    it('repeats after running out of numbers', function() {
      this.legend.buildColorMap(2);
      expect(this.legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
        Firefox: 1,
        Opera: 2,
      });
    });
  });
});
