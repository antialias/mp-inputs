/* global APP_ENV */

const COUNTRIES = {
  AD: 'Andorra',
  AE: 'United Arab Emirates',
  AF: 'Afghanistan',
  AG: 'Antigua and Barbuda',
  AI: 'Anguilla',
  AL: 'Albania',
  AM: 'Armenia',
  AO: 'Angola',
  AQ: 'Antarctica',
  AR: 'Argentina',
  AS: 'American Samoa',
  AT: 'Austria',
  AU: 'Australia',
  AW: 'Aruba',
  AX: '\u00c5land Islands',
  AZ: 'Azerbaijan',
  BA: 'Bosnia and Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BF: 'Burkina Faso',
  BG: 'Bulgaria',
  BH: 'Bahrain',
  BI: 'Burundi',
  BJ: 'Benin',
  BL: 'Saint Barth\u00e9lemy',
  BM: 'Bermuda',
  BN: 'Brunei Darussalam',
  BO: 'Bolivia, Plurinational State of',
  BQ: 'Bonaire, Sint Eustatius and Saba',
  BR: 'Brazil',
  BS: 'Bahamas',
  BT: 'Bhutan',
  BV: 'Bouvet Island',
  BW: 'Botswana',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CC: 'Cocos (Keeling) Islands',
  CD: 'Congo, the Democratic Republic of the',
  CF: 'Central African Republic',
  CG: 'Congo',
  CH: 'Switzerland',
  CI: 'C\u00f4te d\'Ivoire',
  CK: 'Cook Islands',
  CL: 'Chile',
  CM: 'Cameroon',
  CN: 'China',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  CV: 'Cape Verde',
  CW: 'Cura\u00e7ao',
  CX: 'Christmas Island',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DE: 'Germany',
  DJ: 'Djibouti',
  DK: 'Denmark',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  DZ: 'Algeria',
  EC: 'Ecuador',
  EE: 'Estonia',
  EG: 'Egypt',
  EH: 'Western Sahara',
  ER: 'Eritrea',
  ES: 'Spain',
  ET: 'Ethiopia',
  FI: 'Finland',
  FJ: 'Fiji',
  FK: 'Falkland Islands (Malvinas)',
  FM: 'Micronesia, Federated States of',
  FO: 'Faroe Islands',
  FR: 'France',
  GA: 'Gabon',
  GB: 'United Kingdom',
  GD: 'Grenada',
  GE: 'Georgia',
  GF: 'French Guiana',
  GG: 'Guernsey',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GL: 'Greenland',
  GM: 'Gambia',
  GN: 'Guinea',
  GP: 'Guadeloupe',
  GQ: 'Equatorial Guinea',
  GR: 'Greece',
  GS: 'South Georgia and the South Sandwich Islands',
  GT: 'Guatemala',
  GU: 'Guam',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HK: 'Hong Kong',
  HM: 'Heard Island and McDonald Islands',
  HN: 'Honduras',
  HR: 'Croatia',
  HT: 'Haiti',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IM: 'Isle of Man',
  IN: 'India',
  IO: 'British Indian Ocean Territory',
  IQ: 'Iraq',
  IR: 'Iran, Islamic Republic of',
  IS: 'Iceland',
  IT: 'Italy',
  JE: 'Jersey',
  JM: 'Jamaica',
  JO: 'Jordan',
  JP: 'Japan',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KI: 'Kiribati',
  KM: 'Comoros',
  KN: 'Saint Kitts and Nevis',
  KP: 'Korea, Democratic People\'s Republic of',
  KR: 'Korea, Republic of',
  KW: 'Kuwait',
  KY: 'Cayman Islands',
  KZ: 'Kazakhstan',
  LA: 'Lao People\'s Democratic Republic',
  LB: 'Lebanon',
  LC: 'Saint Lucia',
  LI: 'Liechtenstein',
  LK: 'Sri Lanka',
  LR: 'Liberia',
  LS: 'Lesotho',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  LY: 'Libya',
  MA: 'Morocco',
  MC: 'Monaco',
  MD: 'Moldova, Republic of',
  ME: 'Montenegro',
  MF: 'Saint Martin (French part)',
  MG: 'Madagascar',
  MH: 'Marshall Islands',
  MK: 'Macedonia, the Former Yugoslav Republic of',
  ML: 'Mali',
  MM: 'Myanmar',
  MN: 'Mongolia',
  MO: 'Macao',
  MP: 'Northern Mariana Islands',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MS: 'Montserrat',
  MT: 'Malta',
  MU: 'Mauritius',
  MV: 'Maldives',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NC: 'New Caledonia',
  NE: 'Niger',
  NF: 'Norfolk Island',
  NG: 'Nigeria',
  NI: 'Nicaragua',
  NL: 'Netherlands',
  NO: 'Norway',
  NP: 'Nepal',
  NR: 'Nauru',
  NU: 'Niue',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PE: 'Peru',
  PF: 'French Polynesia',
  PG: 'Papua New Guinea',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PM: 'Saint Pierre and Miquelon',
  PN: 'Pitcairn',
  PR: 'Puerto Rico',
  PS: 'Palestine, State of',
  PT: 'Portugal',
  PW: 'Palau',
  PY: 'Paraguay',
  QA: 'Qatar',
  RE: 'R\u00e9union',
  RO: 'Romania',
  RS: 'Serbia',
  RU: 'Russian Federation',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SB: 'Solomon Islands',
  SC: 'Seychelles',
  SD: 'Sudan',
  SE: 'Sweden',
  SG: 'Singapore',
  SH: 'Saint Helena, Ascension and Tristan da Cunha',
  SI: 'Slovenia',
  SJ: 'Svalbard and Jan Mayen',
  SK: 'Slovakia',
  SL: 'Sierra Leone',
  SM: 'San Marino',
  SN: 'Senegal',
  SO: 'Somalia',
  SR: 'Suriname',
  SS: 'South Sudan',
  ST: 'Sao Tome and Principe',
  SV: 'El Salvador',
  SX: 'Sint Maarten (Dutch part)',
  SY: 'Syrian Arab Republic',
  SZ: 'Swaziland',
  TC: 'Turks and Caicos Islands',
  TD: 'Chad',
  TF: 'French Southern Territories',
  TG: 'Togo',
  TH: 'Thailand',
  TJ: 'Tajikistan',
  TK: 'Tokelau',
  TL: 'Timor-Leste',
  TM: 'Turkmenistan',
  TN: 'Tunisia',
  TO: 'Tonga',
  TR: 'Turkey',
  TT: 'Trinidad and Tobago',
  TV: 'Tuvalu',
  TW: 'Taiwan, Province of China',
  TZ: 'Tanzania, United Republic of',
  UA: 'Ukraine',
  UG: 'Uganda',
  UM: 'United States Minor Outlying Islands',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VA: 'Holy See (Vatican City State)',
  VC: 'Saint Vincent and the Grenadines',
  VE: 'Venezuela, Bolivarian Republic of',
  VG: 'Virgin Islands, British',
  VI: 'Virgin Islands, U.S.',
  VN: 'Viet Nam',
  VU: 'Vanuatu',
  WF: 'Wallis and Futuna',
  WS: 'Samoa',
  YE: 'Yemen',
  YT: 'Mayotte',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

const EVENTS = {
  $campaign_delivery: 'Notification Sent',
  $campaign_open: 'Notification Opened',
  $campaign_bounced: 'Notification Bounced',
  $campaign_marked_spam: 'Notification Marked Spam',
  $experiment_started: 'Experiment Started',
  $show_survey: 'Show Survey',
  $top_events: 'Your Top Events',
};

const PROPERTIES = {
  $answer_count: 'Answer Count',
  $app_build_number: '$app_build_number',
  $app_release: 'App Release',
  $app_version: 'App Version',
  $app_version_string: '$app_version_string',
  $bluetooth_enabled: 'Bluetooth Enabled',
  $bluetooth_version: 'Bluetooth Version',
  $brand: 'Brand',
  $browser: 'Browser',
  $browser_version: 'Browser Version',
  $carrier: 'Carrier',
  $city: 'City',
  $current_url: 'Current URL',
  $experiments: 'Experiments',
  $device: 'Device',
  $duration: 'Duration',
  $from_binding: 'From Binding',
  $google_play_services: 'Google Play Services',
  $has_nfc: 'Has NFC',
  $has_telephone: 'Has Telephone',
  $import: 'Import',
  $initial_referrer: 'Initial Referrer',
  $initial_referring_domain: 'Initial Referring Domain',
  $ios_ifa: 'iOS IFA',
  $lib_version: 'Library Version',
  $manufacturer: 'Manufacturer',
  $model: 'Model',
  $os: 'Operating System',
  $os_version: 'OS Version',
  $radio: 'Radio',
  $referrer: 'Referrer',
  $referring_domain: 'Referring Domain',
  $region: 'Region',
  $screen_dpi: 'Screen DPI',
  $screen_height: 'Screen Height',
  $screen_width: 'Screen Width',
  $search_engine: 'Search Engine',
  $survey_shown: 'Survey Shown',
  $watch_model: 'Watch Model',
  $wifi: 'Wifi',
  campaign_id: 'Campaign',
  collection_id: 'Collection ID',
  message_id: 'Message ID',
  message_subtype: 'Message Subtype',
  message_type: 'Message Type',
  mp_country_code: 'Country',
  mp_device_model: 'Device Model',
  mp_keyword: 'Search Keyword',
  mp_lib: 'Mixpanel Library',
  survey_id: 'Survey ID',
  utm_campaign: 'UTM Campaign',
  utm_content: 'UTM Content',
  utm_medium: 'UTM Medium',
  utm_source: 'UTM Source',
  utm_term: 'UTM Term',

  // the following are no longer used but
  // should be included for historical reasons
  mp_browser: 'Browser',
  mp_page: 'Page View',
  mp_platform: 'Platform',
  mp_referrer: 'Referrer',
};

export function extend() {
  return Object.assign(...[{}, ...Array.prototype.slice.call(arguments)]);
}

export function replaceIndex(array, index, value) {
  return [...array.slice(0, index), value, ...array.slice(index + 1)];
}

export function removeIndex(array, index) {
  if (index >= 0 && index < array.length) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
  } else {
    return array;
  }
}

export function removeValue(array, value) {
  return removeIndex(array, array.indexOf(value));
}

export function capitalize(string) {
  return string && string.charAt(0).toUpperCase() + string.slice(1);
}

export function commaizeNumber(number, no_conversion) {
  switch (typeof number) {
    case 'number':
      if (isNaN(number)) {
        return number;
      }
      number = number.toString();
      break;
    case 'string':
      // noop
      break;
    default:
      return number;
  }

  let neg = false;
  if (number[0] === '-') {
    neg = true;
    number = number.slice(1);
  }

  // Parse main number
  let split = number.split('.');
  let commaized = no_conversion ? split[0] : parseInt(split[0] || 0, 10).toString();

  if (commaized.length) {
    commaized = commaized.split('').reverse().join('');
    commaized = commaized.match(/.{1,3}/g).join(',');
    commaized = commaized.split('').reverse().join('');
  }

  if (split[1]) {
    // Add decimals, if applicable
    commaized += '.' + split[1];
  }

  if (neg) {
    commaized = '-' + commaized;
  }

  return commaized;
}

export function abbreviateNumber(number, precision) {
  number = parseFloat(number);
  precision = (precision === undefined) ? 1 : precision;

  let large_numbers = [
    [Math.pow(10, 15), 'Q'],
    [Math.pow(10, 12), 'T'],
    [Math.pow(10, 9), 'B'],
    [Math.pow(10, 6), 'M'],
    [Math.pow(10, 3), 'K'],
  ];
  let suffix = '';

  for (let i = 0; i < large_numbers.length; i++) {
    let bignum = large_numbers[i][0];
    let letter = large_numbers[i][1];

    if (Math.abs(number) >= bignum) {
      number /= bignum;
      suffix = letter;
      break;
    }
  }

  let is_negative = number < 0;
  let fixed = number.toFixed(precision).split('.');
  let formatted = commaizeNumber(Math.abs(parseInt(fixed[0], 10)));

  if (fixed[1] && parseInt(fixed[1], 10) !== 0) {
    formatted += '.' + fixed[1];
  }

  return (is_negative ? '-' : '') + formatted + suffix;
}

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
    var parts = property.slice(1).split('_');
    return [capitalize(parts[0]), ...parts.slice(1)].join(' ');
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
  const country = COUNTRIES[value.toUpperCase()];
  if (country) {
    return country;
  }
  return value;
}

export function isDateString(string) {
  return !!string.match(/^\d\d\d\d-\d\d-\d\d( \d\d:\d\d:\d\d)?$/);
}

export function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  let context = canvas.getContext('2d');
  context.font = font;

  return context.measureText(text).width;
}

// get the ideal "distance" between ticks for a given range
// results in a value like 5, 10, 25, 50, 100, 250, 500, etc.
export function getTickDistance(max, min=0, targetNumTicks=10) {
  let distance = 5;
  while ((max - min) / distance > targetNumTicks) {
    distance *= Number.isInteger(Math.log10(distance)) ? 2.5 : 2;
  }
  return distance;
}

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

export const debug = {
  log:   getLogger('log'),
  info:  getLogger('info'),
  warn:  getLogger('warn'),
  error: getLogger('error'),
};
