/* global DEBUG_LOG */

// mixpanel-specific report utils

import { capitalize, extend } from '../data-util';
import { COUNTRIES, EVENTS, PROPERTIES } from './constants';

// TODO epurcer - replace this with a more general-purpose tool like https://www.npmjs.com/package/debug
function getLogger(level) {
  if (typeof DEBUG_LOG !== 'undefined' && DEBUG_LOG) {
    /* eslint-disable no-console */
    return function() { console[level](...arguments); };
    /* eslint-enable no-console */
  } else {
    return function() {};
  }
}
export const debug = ['log', 'info', 'warn', 'error', 'critical'].reduce((ret, level) =>
  extend(ret, {[level]: getLogger(level)}), {});

export function renameEvent(event) {
  if (EVENTS.hasOwnProperty(event)) {
    return EVENTS[event];
  }

  return event;
}

export function renameProperty(property) {
  const remappedProperty = PROPERTIES[property];
  if (remappedProperty) {
    return remappedProperty;
  }

  // default conversion for all properties starting with '$'
  if (property && property.length > 1 && property[0] === '$') {
    return property
      .slice(1)
      .split('_')
      .map(capitalize)
      .join(' ');
  }

  return property;
}

export function renamePropertyType(type) {
  return {
    number: 'Integer',
    datetime: 'Date',
    boolean: 'True/False',
  }[type] || capitalize(type);
}

export function renamePropertyValue(value) {
  const country = COUNTRIES[String(value).toUpperCase()];
  if (country) {
    return country;
  }
  return value;
}
