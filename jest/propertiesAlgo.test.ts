import { GlobalPropertiesView } from "../src/propTable";
import { TFile, Vault, App } from "obsidian";
import fs from "fs";
import yaml from "js-yaml";
import IColumn from "../src/Column";
import TextColumn from "../src/TextColumn";
import ListColumn from "../src/ListColumn";
import BoolColumn from "../src/BoolColumn";
import DateTimeColumn from "../src/DateTimeColumn";
import IntColumn from "../src/IntColumn";
let dirTest = "./tests/files";

describe("PropertyAlgo", () => {
  let gpv: GlobalPropertiesView;
  let mockVault: any;
  let mockApp: any;
  let propertyMap: Map<string, IColumn | null>;

  beforeEach(() => {
    mockApp = new Vault();
    mockApp = new App();
    gpv = new GlobalPropertiesView(mockApp, null);
    propertyMap= new Map();
  });

  //private detectPropertyType(key: string, value: any, propertyMap: Map<string, IColumn | null>): IColumn | null {
  
  it("null with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", null, propertyMap);
    expect(col).toBeNull();
  });

  it("Text with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", "textValue", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);
  });

    it("List with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", ["L1","L2","L3"], propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);
  });
  
    it("Bool with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", true, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(BoolColumn);
  });
  
      it("Date with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", "2025-03-05", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(DateTimeColumn);
  });

  it("DateTime with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", "2025-03-05T08:02:56", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(DateTimeColumn);
  });

  
      it("Int with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", 52, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);
  });

  
});
