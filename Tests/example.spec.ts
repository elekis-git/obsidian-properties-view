// example.spec.ts
import GlobalPropertiesPlugin from "../main";


// Polyfill pour TextEncoder et TextDecoder dans Node.js
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}


const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');


// example.spec.ts
describe('MyPlugin Tests', () => {

  it('should be able to execute test', () => {
    expect("hello").toBeTruthy();
  });
});

// this is necessary to conform the isolatedModules compiler option and can be removed as soon as an import is added
export {};