export function upsellOptions({resourceType=null, upsellType=null, customerType=null, cap=null}={}) {
  const UPSELL_OPTIONS = {
    events: {
      integrate: {
        upsellTitle: `We haven\'t recieved any events from you.`,
        upsellText: {
          linkText: `Integrate`,
          closingText: ` events to start tracking your users\' actions.`,
        },
        upsellLink: `/report/setup/quick`,
      },
      upsell: {
        converted: {
          upsellTitle: `We haven\'t received payment for your latest invoice.`,
          upsellText: {
            linkText: `Contact our Support team`,
            closingText: ` to regain access to your People data.`,
          },
          upsellLink: `mailto:support@mixpanel.com`,
        },
        free: {
          upsellTitle: `You\'ve exceeded your limit of ` + cap + ` free monthly data points.`,
          upsellText: {
            linkText: `Upgrade`,
            closingText: ` your plan to regain access to your event data.`,
          },
          upsellLink: `/pricing/#engagement`,
        },
      },
    },
    people: {
      integrate: {
        upsellTitle: `You don\'t have any People profiles.`,
        upsellText: {
          linkText: `Integrate`,
          closingText: ` People to learn more about your users.`,
        },
        upsellLink: `/report/setup/people`,
      },
      upsell: {
        converted: {
          upsellTitle: `We haven\'t received payment for your latest invoice.`,
          upsellText: {
            linkText: `Contact our Support team`,
            closingText: ` to regain access to your data.`,
          },
          upsellLink: `mailto:support@mixpanel.com`,
        },
        free: {
          upsellTitle: `You\'ve exceeded your limit of ` + cap + ` free People profiles.`,
          upsellText: {
            linkText: `Upgrade`,
            closingText: ` your plan to regain access to your data.`,
          },
          upsellLink: `/pricing/#people`,
        },
      },
    },
  };

  let options = UPSELL_OPTIONS[resourceType][upsellType];
  if (upsellType === `upsell`) {
    options = options[customerType];
  }
  return options;
}
