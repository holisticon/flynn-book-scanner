var util = util || {};// jshint ignore:line

util.waitForLoader = function (browser) {
  browser.wait(function () {
    // return a boolean here. Wait for spinner to be gone.
    return !browser.isElementPresent(by.css('.backdrop'));
  }, 5000).thenCatch(function (e) {
    // ignore exception
  });

  browser.wait(function () {
    // return a boolean here. Wait for spinner to be gone.
    return !browser.isElementPresent(by.css(".loading-container"));
  }, 5000).thenCatch(function (e) {
    // ignore exception
  });
};


util.loadApp = function (browser) {
  util.waitForLoader(browser);
};

module.exports = util;
