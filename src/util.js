/* global APP_ENV */

// IRB-specific utils

import * as dataUtil from './mp-common/data-util';
import * as mpUtil from './mp-common/mp-util';

const IRBUtil = {
  debug: {
    log:   getLogger('log'),
    info:  getLogger('info'),
    warn:  getLogger('warn'),
    error: getLogger('error'),
  },

  getTextWidth(text, font) {
    const canvas = this._canvas || (this._canvas = document.createElement('canvas'));
    let context = canvas.getContext('2d');
    context.font = font;

    return context.measureText(text).width;
  },
};

// TODO epurcer - replace this with a more general-purpose tool like https://www.npmjs.com/package/debug
function getLogger(level) {
  return function () {
    if (APP_ENV === 'development') {
      /* eslint-disable no-console */
      console[level](...arguments);
      /* eslint-enable no-console */
    }
  };
}

export const debug = IRBUtil.debug;
export default Object.assign({},
  IRBUtil,
  dataUtil,
  mpUtil
);
