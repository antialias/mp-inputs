import expect from 'expect.js';

import { d2ResultsObj } from './fixtures';

import Legend from '../src/models/legend';

describe('Legend', function() {
  context('with default values', function() {
    const legend = new Legend({});
    legend.updateLegendData(d2ResultsObj);

    it('only expand first series', function() {
      expect(legend.seriesShowing).to.eql(['all', 'hidden']);
    });

    it('first 48 keys default to true', function() {
      expect(legend.data[0].seriesName).to.eql('$browser');
      expect(legend.data[0].seriesData).to.eql({
        Chrome: true,
        Safari: true,
        Firefox: true,
        Opera: true,
      });
    });

    it('orders series values', function() {
      legend.buildColorMap();
      expect(legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
        Firefox: 3,
        Opera: 4,
      });
    });

    it('repeats after running out of numbers', function() {
      legend.buildColorMap(2);
      expect(legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
        Firefox: 1,
        Opera: 2,
      });
    });
  });

  context('with limited default values', function() {
    const legend = new Legend({});
    legend.updateLegendData(d2ResultsObj, true, 2);
    legend.buildColorMap();

    it('first 2 keys default to true', function() {
      expect(legend.data[0].seriesName).to.eql('$browser');
      expect(legend.data[0].seriesData).to.eql({
        Chrome: true,
        Safari: true,
        Firefox: false,
        Opera: false,
      });
    });

    it('only give numbers to showing values', function() {
      expect(legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
      });
    });
  });
});
