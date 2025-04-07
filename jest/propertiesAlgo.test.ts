import {GlobalPropertiesView} from "../src/propTable";
import { TFile, Vault } from "obsidian";
import fs from "fs";
import yaml from "js-yaml";

let dirTest = "./tests/files";

describe("PropertyAlgo", () => {
  let gpv : GlobalPropertiesView;
  let mockVault: any;

  beforeEach(() => {
    mockVault = new Vault();
    gpv = new GlobalPropertiesView(null, null);
  });

  it("test ", async () => {
    gpv.detectPropertyType();
  });
});
