// mixpanel-specific utils

import { capitalize } from './data-util';
import { COUNTRIES, EVENTS, PROPERTIES } from './mp-constants';

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
