/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  testMatch: [
    "**/?(*.)+(test).ts" // Cela va faire en sorte que Jest trouve tous les fichiers .test.ts
  ]
};
