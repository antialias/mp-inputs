import commonCSS from '!!style!css?camelCase!stylus!../../../../stylesheets/common.styl';

import { extend } from '../../../../util';

const axisOptions = {
  endOnTick: true,
  lineWidth: 1,
  lineColor: commonCSS.grey150,
  minPadding: 0,
  maxPadding: 0,
  startOnTick: true,
};

export const HIGHCHART_OPTIONS = {
  chart: {
    backgroundColor: `rgba(255,255,255,0)`,
    borderRadius: 0,
    events: {},
    marginTop: 0,
    marginRight: 0,
    marginBottom: null,
    marginLeft: null,
    spacingBottom: 30,
    spacingLeft: 28,
    style: {
      fontFamily: `"Helvetica Neue", helvetica, sans-serif`,
      fontSize: `12px`,
    },
    type: `line`,
    zoomType: `x`,
  },
  colors: [
    commonCSS.segmentColor1,
    commonCSS.segmentColor2,
    commonCSS.segmentColor3,
    commonCSS.segmentColor4,
    commonCSS.segmentColor5,
    commonCSS.segmentColor6,
    commonCSS.segmentColor7,
    commonCSS.segmentColor8,
  ],
  credits: {
    enabled: false,
  },
  legend: {
    enabled: false,
  },
  loading: {
    labelStyle: {
      color: `transparent`,
    },
  },
  global: {
    useUTC: false,
  },
  plotOptions: {
    line: {
      incompleteStyle: {
        'stroke-dasharray': `3,5`,
      },
      lineWidth: 3,
      marker: {
        hover: {
          enabled: true,
        },
        lineColor: `#fff`,
        lineWidth: 2,
        radius: 5,
        symbol: `circle`,
      },
      shadow: false,
      states: {
        hover: {
          lineWidth: 4,
          lineWidthPlus: 0,
        },
      },
      turboThreshold: 0,
    },
    series: {
      animation: {
        duration: 300,
      },
      cursor: `pointer`,
      fillOpacity: 1,
      marker: {
        enabled: null,
        hover: {
          enabled: true,
        },
        lineWidth: 2,
        symbol: `circle`,
      },
      shadow: false,
      stacking: null,
    },
  },
  title: {
    text: null,
  },

  tooltip: {
    backgroundColor: `#fff`,
    borderWidth: 0,
    shadow: false,
    useHTML: true,
  },
  xAxis: extend(axisOptions, {
    dateTimeLabelFormats: {
      day: `%b %e`,
    },
    endOnTick: false,
    labels: {
      style: {
        color: `#868ea3`,
      },
      y: 18,
    },
    maxPadding: 0.017,
    minPadding: 0.017,
    startOnTick: false,
    tickmarkPlacement: `on`,
    tickPosition: `outside`,
  }),
  yAxis: extend(axisOptions, {
    allowDecimals: true,
    gridLineColor: `#e6e8eb`,
    gridLineDashStyle: `shortDash`,
    labels: {
      style: {
        fontWeight: `bold`,
        color: `#868ea3`,
      },
      x: -20,
    },
    min: 0,
    minPadding: 0,
    title: {
      text: null,
    },
    showFirstLabel: false,
    showLastLabel: false,
  }),
};
