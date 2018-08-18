const wp = require('@cypress/webpack-preprocessor');

module.exports = on => {
  const options = {
    webpackOptions: require('../webpack.cypress.config'),
  };
  on('file:preprocessor', wp(options));
};
