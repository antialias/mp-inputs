export function extend() {
  return Object.assign(...[{}, ...Array.prototype.slice.call(arguments)]);
}

export function replaceAtIndex(array, index, value) {
  return [...array.slice(0, index), value, ...array.slice(index + 1)];
}

export function removeAtIndex(array, index) {
  if (index >= 0 && index < array.length) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
  } else {
    return array;
  }
}

export function capitalize(string) {
  return string && string.charAt(0).toUpperCase() + string.slice(1);
}

export function renameEvent(event) {
  var mapping = {
    '$campaign_delivery': 'Notification Sent',
    '$campaign_open': 'Notification Opened',
    '$campaign_bounced': 'Notification Bounced',
    '$campaign_marked_spam': 'Notification Marked Spam',
    '$experiment_started': 'Experiment Started',
    '$show_survey': 'Show Survey',
    '$top_events': 'Your Top Events'
  };

  if (mapping.hasOwnProperty(event)) {
    return mapping[event];
  }

  return event;
}

export function renameProperty(property) {
  var mapping = {
    '$answer_count': 'Answer Count',
    '$app_build_number': '$app_build_number',
    '$app_release': 'App Release',
    '$app_version': 'App Version',
    '$app_version_string': '$app_version_string',
    '$bluetooth_enabled': 'Bluetooth Enabled',
    '$bluetooth_version': 'Bluetooth Version',
    '$brand': 'Brand',
    '$browser': 'Browser',
    '$browser_version': 'Browser Version',
    '$carrier': 'Carrier',
    '$city': 'City',
    '$current_url': 'Current URL',
    '$experiments': 'Experiments',
    '$device': 'Device',
    '$duration': 'Duration',
    '$from_binding': 'From Binding',
    '$google_play_services': 'Google Play Services',
    '$has_nfc': 'Has NFC',
    '$has_telephone': 'Has Telephone',
    '$import': 'Import',
    '$initial_referrer': 'Initial Referrer',
    '$initial_referring_domain': 'Initial Referring Domain',
    '$ios_ifa': 'iOS IFA',
    '$lib_version': 'Library Version',
    '$manufacturer': 'Manufacturer',
    '$model': 'Model',
    '$os': 'Operating System',
    '$os_version': 'OS Version',
    '$radio': 'Radio',
    '$referrer': 'Referrer',
    '$referring_domain': 'Referring Domain',
    '$region': 'Region',
    '$screen_dpi': 'Screen DPI',
    '$screen_height': 'Screen Height',
    '$screen_width': 'Screen Width',
    '$search_engine': 'Search Engine',
    '$survey_shown': 'Survey Shown',
    '$watch_model': 'Watch Model',
    '$wifi': 'Wifi',
    'campaign_id': 'Campaign',
    'collection_id': 'Collection ID',
    'message_id': 'Message ID',
    'message_subtype': 'Message Subtype',
    'message_type': 'Message Type',
    'mp_country_code': 'Country',
    'mp_device_model': 'Device Model',
    'mp_keyword': 'Search Keyword',
    'mp_lib': 'Mixpanel Library',
    'survey_id': 'Survey ID',
    'utm_campaign': 'UTM Campaign',
    'utm_content': 'UTM Content',
    'utm_medium': 'UTM Medium',
    'utm_source': 'UTM Source',
    'utm_term': 'UTM Term',

    // the following are no longer used but
    // should be included for historical reasons
    'mp_browser': 'Browser',
    'mp_page': 'Page View',
    'mp_platform': 'Platform',
    'mp_referrer': 'Referrer'
  };

  if (mapping.hasOwnProperty(property)) {
    return mapping[property];
  }

  // default conversion for all properties starting with '$'
  if (property[0] === '$' && property.length > 1) {
    var parts = _.map(property.substr(1).split('_'), _.capitalize);
    return parts.join(' ');
  }

  return property;
};


