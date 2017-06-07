export const DATASET_MIXPANEL = `mixpanel`;
export const DATASET_SALESFORCE = `salesforce`;
export const DATASETS = {
  [DATASET_MIXPANEL]: {
    displayName: `Mixpanel`,
    description: `Product usage, customers, etc.`,
  },
  [DATASET_SALESFORCE]: {
    displayName: `Salesforce`,
    description: `Customer relations, sales, etc.`,
    profileTypes: [
      `accounts`,
      `contacts`,
      `leads`,
    ],
  },
};
export const SOURCE_DETAILS = {
  events: {
    'all': `All Events`,
    'property': `event property`,
    'a property': `an event property`,
    'properties': `event properties`,
  },
  people: {
    'all': `All People`,
    'property': `people property`,
    'a property': `a people property`,
    'properties': `people properties`,
  },
  accounts: {
    'table': `Account`,
    'all': `All Accounts`,
    'property': `account property`,
    'a property': `an account property`,
    'properties': `account properties`,
  },
  contacts: {
    'table': `Contact`,
    'all': `All Contacts`,
    'property': `contact property`,
    'a property': `a contact property`,
    'properties': `contact properties`,
  },
  leads: {
    'table': `Lead`,
    'all': `All Leads`,
    'property': `lead property`,
    'a property': `a lead property`,
    'properties': `lead properties`,
  },
};
