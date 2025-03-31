/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "js", "json"]
};
