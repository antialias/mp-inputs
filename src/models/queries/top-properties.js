import {extend, sorted} from 'mixpanel-common/util';
import {renameProperty} from 'mixpanel-common/report/util';

import BaseQuery from './base';
import QueryCache from './query-cache';
import {DATASETS, SOURCE_DETAILS} from '../constants';
import {PROPERTY_TYPES} from '../clause.js';

const BLACKLISTED_PROPERTIES = [
  `$transactions`, // transactions a special obj property used only for the Revenue report
];

class BaseTopPropertiesQuery extends BaseQuery {
  buildParams() {
    return {limit: 1500};
  }

  processResults(results) {
    const properties = Object.keys(results).map(name => {
      const {count, type} = results[name];
      return {count, type, name, resourceType: this.resourceType};
    }).filter(prop =>
      PROPERTY_TYPES.includes(prop.type) &&
      !BLACKLISTED_PROPERTIES.includes(prop.name)
    );
    // TODO: cassie investigate if we should be filtering these out or handling them better later

    return sorted(properties, {
      transform: prop => renameProperty(prop.name).toLowerCase(),
    });
  }
}

export class TopEventPropertiesQuery extends BaseTopPropertiesQuery {
  buildQuery(state) {
    const event = state.event;
    return event ? {event} : {};
  }

  buildUrl() {
    return `api/2.0/events/properties/toptypes`;
  }

  buildParams() {
    const params = super.buildParams();
    const event = this.query.event;

    return event ? extend(params, {event}) : params;
  }

  get resourceType() {
    return `events`;
  }
}

export class TopPeoplePropertiesQuery extends BaseTopPropertiesQuery {
  constructor(apiAttrs, options={}) {
    super(apiAttrs, options);

    // TODO @evnp - remove once we have multiple people tables on backend
    this.profileTypePropertiesCache = new QueryCache();
    // TODO @evnp END
  }

  build(state, options={}) {
    super.build(state, options);

    // TODO @evnp - remove once we have multiple people tables on backend
    const dataset = this.query.dataset;
    const profileTypes = dataset && DATASETS[dataset] && DATASETS[dataset].profileTypes;
    if (profileTypes) {
      this.profileTypePropertiesPromises = profileTypes.map(profileType => {
        const {apiHost, apiSecret, projectID} = this;
        const query = new ProfileTypePropertiesQuery({apiHost, apiSecret, projectID});
        const cache = this.profileTypePropertiesCache;
        const cacheKey = query.build({profileType}, {dataset}).query;
        const cachedResult = cache.get(cacheKey);

        if (cachedResult) {
          return cachedResult;
        } else {
          return query.run().then(properties => cache.set(cacheKey, properties));
        }
      });
    }
    // TODO @evnp END

    return this;
  }

  buildUrl() {
    return `api/2.0/engage/properties`;
  }

  processResults(response) {
    const properties = super.processResults(response.results);

    // TODO @evnp - remove once we have multiple people tables on backend
    const dataset = this.query.dataset && DATASETS[this.query.dataset];
    if (dataset && dataset.profileTypes) {
      return new Promise(resolve => {
        const promises = this.profileTypePropertiesPromises
          .map(promise => promise.catch(err => err));

        Promise.all(promises).then(profileTypePropertyLists => {
          // build map of properties to their profile types
          const propertyProfileTypes = {};
          profileTypePropertyLists.forEach((profileTypePropertyList, index) => {
            if (Array.isArray(profileTypePropertyList)) {
              const profileType = dataset.profileTypes[index];
              profileTypePropertyList.forEach(property => {
                propertyProfileTypes[property] = (
                  propertyProfileTypes[property] || []
                ).concat([profileType]);
              });
            }
          });

          properties.forEach(property => {
            const profileTypes = propertyProfileTypes[property.name];
            if (profileTypes) {
              property.profileTypes = profileTypes;
            }
          });

          resolve(properties);
        });
      });
    }
    // TODO @evnp END

    return properties;
  }

  get resourceType() {
    return `people`;
  }
}

// TODO @evnp - remove once we have multiple people tables on backend
export class ProfileTypePropertiesQuery extends BaseQuery {
  buildUrl() {
    return `api/2.0/engage`;
  }

  buildQuery(state) {
    const profileType = state.profileType;
    return profileType ? {profileType} : {};
  }

  buildParams() {
    const table = SOURCE_DETAILS[this.query.profileType].table;
    return {
      limit: 1,
      where: `properties["Table"] == "${table}"`,
    };
  }

  processResults(response) {
    const profile = response.results[0];
    const properties = profile && profile.$properties;

    return properties ? Object.keys(properties) : [];
  }

  get resourceType() {
    return `people`;
  }
}
// TODO @evnp END
