/// <reference types="cypress" />

import * as fs from 'fs';

module.exports = (on) => {
  on('task', {
    isFileExisted(filePath: string): boolean {
      return fs.existsSync(filePath);
    },
  });
};
