export function upsellOptions({resourceType=null, upsellType=null, customerType=null, cap=null}={}) {
  const UPSELL_OPTIONS = {
    events: {
      alert: {
        free: {
          upsellTitle: `We haven\'t received any events from you.`,
          upsellText: {
            linkText: `Integrate Events`,
            closingText: ` to start tracking your users\' actions.`,
          },
          upsellLink: `/report/setup/quick`,
        },
        converted: {
          upsellTitle: `We haven\'t received payment for your latest invoice.`,
          upsellText: {
            linkText: `Contact our Support team`,
            closingText: ` to regain access to your People data.`,
          },
          upsellLink: `mailto:support@mixpanel.com`,
        },
      },
      upsell: {
        upsellTitle: `You\'ve exceeded your limit of ` + cap + ` free monthly data points.`,
        upsellText: {
          linkText: `Upgrade your plan`,
          closingText: ` to regain access to your event data.`,
        },
        upsellLink: `/pricing/#engagement`,
      },
    },
    people: {
      alert: {
        free: {
          upsellTitle: `You don\'t have any People profiles.`,
          upsellText: {
            linkText: `Integrate People`,
            closingText: ` to learn more about your users.`,
          },
          upsellLink: `/report/setup/people`,
        },
        converted: {
          upsellTitle: `We haven\'t received payment for your latest invoice.`,
          upsellText: {
            linkText: `Contact our Support team`,
            closingText: ` to regain access to your data.`,
          },
          upsellLink: `mailto:support@mixpanel.com`,
        },
      },
      upsell: {
        upsellTitle: `You\'ve exceeded your limit of ` + cap + ` free People profiles.`,
        upsellText: {
          linkText: `Upgrade your plan`,
          closingText: ` to regain access to your data.`,
        },
        upsellLink: `/pricing/#people`,
      },
    },
  };

  let options = UPSELL_OPTIONS[resourceType][upsellType];
  if (upsellType === `alert`) {
    options = options[customerType];
  }
  options.upsellType = upsellType;
  return options;
}
