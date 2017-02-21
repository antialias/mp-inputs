import initIRB from '../../src/init';

const raf = () => new Promise(requestAnimationFrame);

describe(`fully integrated irb-app`, function() {
  let app;

  beforeEach(async function() {
    app = await initIRB();
    app.apiSecret = `test_secret`;
    document.body.innerHTML = ``;
    document.body.appendChild(app);
    await raf();
  });

  it(`renders main sections`, function() {
    for (const section of [`irb-header`, `irb-builder`, `irb-result`, `irb-reports`]) {
      expect(app.querySelector(section)).to.be.ok;
    }
  });
});
