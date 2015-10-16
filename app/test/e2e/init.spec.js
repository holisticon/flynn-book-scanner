var util = require('./helper/prepare.helper.spec.js');

describe('init', function () {

  beforeEach(function () {
    util.loadApp(browser);
  });

  it('should save settings', function () {
    element(by.xpath('//*[@data-qa="inputSettingsOwner"]')).sendKeys('Holisticon AG');
    util.waitForLoader(browser);
    element(by.xpath('//*[@data-qa="saveSettingsGeneral"]')).click();
  });
});
