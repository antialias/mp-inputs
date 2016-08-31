import expect from 'expect.js';

import { d2ResultsObj } from './fixtures';

import Legend from '../src/models/legend';

describe('Legend', function() {
  beforeEach(function() {
    this.legend = new Legend({});
  });

  context('with default values', function() {
    beforeEach(function() {
      this.legend.updateLegendData(d2ResultsObj);
    });

    it('only expands the first series', function() {
      expect(this.legend.seriesShowing).to.eql(['all', 'hidden']);
    });

    it('sets the first 48 keys with highest numerical value to true', function() {
      expect(this.legend.data[0].seriesName).to.eql('$browser');
      expect(this.legend.data[0].seriesData).to.eql({
        Chrome: true,
        Safari: true,
        Firefox: true,
        Opera: true,
      });
    });

    it('orders from highest numerical value to lowest', function() {
      this.legend.buildColorMap();
      expect(this.legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
        Firefox: 3,
        Opera: 4,
      });
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

  context('with a showLimit of 2', function() {
    beforeEach(function(){
      this.legend.updateLegendData(d2ResultsObj, true, 2);
      this.legend.buildColorMap();
    });

    it('sets the two highest numerical values to the default state', function() {
      expect(this.legend.data[0].seriesName).to.eql('$browser');
      expect(this.legend.data[0].seriesData).to.eql({
        Chrome: true,
        Safari: true,
        Firefox: false,
        Opera: false,
      });
    });

    it('gives color numbers to showing values', function() {
      expect(this.legend.colorMap).to.eql({
        Chrome: 1,
        Safari: 2,
      });
    });
  });
});
