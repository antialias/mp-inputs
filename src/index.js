import initIRB from './init';

initIRB().then(IRB => {
  const appContainer = document.getElementById(`mixpanel-application`);
  appContainer.innerHTML = ``;
  appContainer.appendChild(IRB);
});
