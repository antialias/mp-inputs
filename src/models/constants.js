export const DATASET_MIXPANEL = `mixpanel`;
export const DATASET_SALESFORCE = `salesforce`;
export const DATASETS = {
  [DATASET_MIXPANEL]: {
    displayName: `Mixpanel`,
    description: `Product usage, customers, etc.`,
  },
  salesforce: {
    displayName: `Salesforce`,
    description: `Customer relations, sales, etc.`,
    profileTypes: [
      `people`,
    ],
  },
  [DATASET_SALESFORCE]: {
    displayName: `Salesforce`,
    description: `Customer relations, sales e.t.c`,
    profileTypes: [
      `accounts`,
      `contacts`,
      `leads`,
    ],
  },
};
