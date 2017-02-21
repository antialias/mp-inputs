import initIRB from '../../src/init';

describe(`fully integrated irb-app`, function() {
  let app;

  beforeEach(function(done) {
    initIRB().then(IRB => {
      app = IRB;
      app.apiSecret = `test_secret`;
      document.body.innerHTML = ``;
      document.body.appendChild(app);
      requestAnimationFrame(() => done());
    });
  });

  it(`renders main sections`, function() {
    for (const section of [`irb-header`, `irb-builder`, `irb-result`, `irb-reports`]) {
      expect(app.querySelector(section)).to.be.ok;
    }
  });
});
