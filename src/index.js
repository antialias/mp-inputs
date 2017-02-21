import initInsights from './init';

initInsights().then(Insights => {
  const appContainer = document.getElementById(`mixpanel-application`);
  appContainer.innerHTML = ``;
  appContainer.appendChild(Insights);
});
