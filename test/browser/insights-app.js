import initInsights from '../../src/init';

const raf = () => new Promise(requestAnimationFrame);

describe(`fully integrated insights-app`, function() {
  let app;

  beforeEach(async function() {
    app = await initInsights();
    app.apiSecret = `test_secret`;
    document.body.innerHTML = ``;
    document.body.appendChild(app);
    await raf();
  });

  it(`renders main sections`, function() {
    for (const section of [`insights-header`, `insights-builder`, `insights-result`, `insights-reports`]) {
      expect(app.querySelector(section)).to.be.ok;
    }
  });
});
