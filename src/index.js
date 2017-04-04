import 'mixpanel-common/components';
import 'mixpanel-common/widgets/add-to-dash';
import 'mixpanel-common/widgets/tag-selector';

import initInsights from './init';

initInsights().then(app => {
  const appContainer = document.getElementById(`mixpanel-application`);
  appContainer.innerHTML = ``;
  appContainer.appendChild(app);
});
