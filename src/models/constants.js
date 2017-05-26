export const DATASET_MIXPANEL = `mixpanel`;
export const DATASET_SALESFORCE = `salesforce`;
export const DATASETS = {
  [DATASET_MIXPANEL]: {
    displayName: `Mixpanel`,
  },
  [DATASET_SALESFORCE]: {
    displayName: `Salesforce`,
    entities: [
      `accounts`,
      `contacts`,
      `leads`,
    ],
  },
};
