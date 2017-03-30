import 'mixpanel-common/components';
import initInsights from './init';

initInsights().then(app => {
  const appContainer = document.getElementById(`mixpanel-application`);
  appContainer.innerHTML = ``;
  appContainer.appendChild(app);
});
