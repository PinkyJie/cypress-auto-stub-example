const fs = require('fs');
const wp = require('@cypress/webpack-preprocessor');

module.exports = on => {
  const options = {
    webpackOptions: require('../webpack.cypress.config'),
  };
  on('file:preprocessor', wp(options));
  on('task', {
    isFixtureExisted(filePath) {
      return fs.existsSync(filePath);
    },
  });
};
