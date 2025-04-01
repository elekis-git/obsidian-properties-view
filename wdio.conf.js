import * as path from "path";

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.e2e.ts'],
  maxInstances: 1,

  capabilities: [{
    browserName: 'chrome',  // Essayez de remplacer 'obsidian' par 'chrome' pour les tests
    'goog:chromeOptions': {
      binary: 'C:\Users\a596566\AppData\Local\Programs\Obsidian\Obsidian.exe',
      args: ['--no-sandbox', '--disable-infobars']
    }
  }],

  framework: 'mocha',
  services: [],
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  cacheDir: path.resolve(".obsidian-cache"),

  logLevel: "warn",
};