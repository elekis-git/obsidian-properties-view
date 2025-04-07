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
    propertyMap = new Map();
  });

  //private detectPropertyType(key: string, value: any, propertyMap: Map<string, IColumn | null>): IColumn | null {

  it("null with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", null, propertyMap);
    expect(col).toBeNull();

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", 52, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", "fdk", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", true, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(BoolColumn);

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", "2525-25-05", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(DateTimeColumn);

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", ["dd", "ddd", "oziuer"], propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);
  });

  it("Text with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", "textValue", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);

    let txtC = new TextColumn("k5", { vault: mockVault } as any);

    propertyMap.set("key_test", txtC);
    col = gpv.detectPropertyType("key_test", ["fdsfs", "fdsf", "fsdf"], propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtC);
    col = gpv.detectPropertyType("key_test", true, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);

  //  not working -> should work when have time. 
    propertyMap.set("key_test", txtC);
    col = gpv.detectPropertyType("key_test", "2025-03-05T08:02:56", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);

    propertyMap.set("key_test", txtC);
    col = gpv.detectPropertyType("key_test", "2025-03-05", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);

    propertyMap.set("key_test", txtC);
    col = gpv.detectPropertyType("key_test", null, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(TextColumn);
  });

  it("List with empty Map ", async () => {
    let col = gpv.detectPropertyType("key_test", ["L1", "L2", "L3"], propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    let txtL = new ListColumn("k5", { vault: mockVault } as any);
    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", ["fdsfs", "fdsf", "fsdf"], propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", null, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", "sfdsf", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", true, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", "2025-03-05T08:02:56", propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(ListColumn);

    propertyMap.set("key_test", txtL);
    col = gpv.detectPropertyType("key_test", "2025-03-05", propertyMap);
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
    let col;
    col = gpv.detectPropertyType("key_test", 52, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);

    propertyMap.set("key_test", null);
    col = gpv.detectPropertyType("key_test", 52, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);

    propertyMap.set("key_test", new IntColumn("k5", { vault: mockVault } as any));
    col = gpv.detectPropertyType("key_test", 52, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);

    propertyMap.set("key_test", new IntColumn("k5", { vault: mockVault } as any));
    col = gpv.detectPropertyType("key_test", null, propertyMap);
    expect(col).not.toBeNull();
    expect(col).toBeInstanceOf(IntColumn);
  });
});
