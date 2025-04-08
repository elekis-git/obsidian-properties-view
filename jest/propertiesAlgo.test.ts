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


  const testCases = [
    { value: null,                    expected: null },
    { value: 52,                      expected: IntColumn },
    { value: "text",                  expected: TextColumn },
    { value: true,                    expected: BoolColumn },
    { value: "2025-03-05",            expected: DateTimeColumn },
    { value: "2025-03-05T08:02:56",   expected: DateTimeColumn },
    { value: ["item1", "item2"],      expected: ListColumn }
  ];

  testCases.forEach(({ value, expected }) => {
    it(`detects ${expected ? expected.name : "null"} for value: ${JSON.stringify(value)}`, () => {
      let col = gpv.detectPropertyType("key_test", value, propertyMap);
      if (expected === null) {
        expect(col).toBeNull();
      } else {
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
      }
    });
  });
  
  it("Text followed by ...", async () => {    
    const txtC = new TextColumn("k5", { vault: mockVault } as any);
    const testCases = [
        { value: null,                      expected: TextColumn },
        { value: ["fdsfs", "fdsf", "fsdf"], expected: ListColumn },
        { value: true,                      expected: TextColumn },
        { value: false,                     expected: TextColumn },
        { value: "2025-03-05T08:02:56",     expected: TextColumn },
        { value: "2025-03-05",              expected: TextColumn },
        { value: null,                      expected: TextColumn }
    ];

    testCases.forEach(({ value, expected }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
    });
  });

  it("List followed by ...", async () => {    
    const txtC = new ListColumn("LR", { vault: mockVault } as any);
    const testCases = [
        { value: null,                      expected: ListColumn },
        { value: ["fdsfs", "fdsf", "fsdf"], expected: ListColumn },
        { value: true,                      expected: ListColumn },
        { value: false,                     expected: ListColumn },
        { value: "2025-03-05T08:02:56",     expected: ListColumn },
        { value: "2025-03-05",              expected: ListColumn },
        { value: null,                      expected: ListColumn }
    ];

    testCases.forEach(({ value, expected }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
    });
  });

  it("Bool followed by", async () => {    
    const txtC = new BoolColumn("LR", { vault: mockVault } as any);
    const testCases = [
        { value: null,                      expected: BoolColumn },
        { value: ["fdsfs", "fdsf", "fsdf"], expected: ListColumn },
        { value: true,                      expected: BoolColumn },
        { value: false,                     expected: BoolColumn },
        { value: "2025-03-05T08:02:56",     expected: TextColumn },
        { value: "2025-03-05",              expected: TextColumn },
        { value: null,                      expected: BoolColumn }
    ];
    testCases.forEach(({ value, expected }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
    });
  });
  
  it("Date followed by ...", async () => {    
    const txtC = new DateTimeColumn("LR", { vault: mockVault } as any);
    const testCases = [
        { value: null,                        expected:   DateTimeColumn, type : "date" },
        { value: ["fdsfs", "fdsf", "fsdf"],   expected:   ListColumn},
        { value: true,                        expected:   TextColumn},
        { value: false,                       expected:   TextColumn},
        { value: "2025-03-05T08:02:56",       expected:   DateTimeColumn, type : "datetime-local" },
        { value: "2025-03-05",                expected:   DateTimeColumn, type : "date" },
        { value: null,                        expected:   DateTimeColumn}
    ];
    testCases.forEach(({ value, expected, type }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
       if (type)
          expect(col.getDType()).toBe(type);
    });
  });
  
    it("DateTime followed by ...", async () => {    
    const txtC = new DateTimeColumn("LR", { vault: mockVault } as any, "datetime-local");
    const testCases = [
        { value: null,                        expected:   DateTimeColumn, type : "datetime-local" },
        { value: ["fdsfs", "fdsf", "fsdf"],   expected:   ListColumn},
        { value: true,                        expected:   TextColumn},
        { value: false,                       expected:   TextColumn},
        { value: "2025-03-05T08:02:56",       expected:   DateTimeColumn, type : "datetime-local" },
        { value: "2025-03-05",                expected:   DateTimeColumn, type : "datetime-local" }
    ];
    testCases.forEach(({ value, expected, type }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
        if (type)
          expect(col.getDType()).toBe(type);
    });
  });
  
    it("Int followed by ...", async () => {    
    const txtC = new IntColumn("LR", { vault: mockVault } as any);
    const testCases = [
        { value: null,                        expected:   IntColumn},
        { value: ["fdsfs", "fdsf", "fsdf"],   expected:   ListColumn},
        { value: true,                        expected:   TextColumn},
        { value: false,                       expected:   TextColumn},
        { value: "2025-03-05T08:02:56",       expected:   TextColumn},
        { value: "2025-03-05",                expected:   TextColumn},
        { value: null,                        expected:   IntColumn}
    ];
    testCases.forEach(({ value, expected }) => {
        propertyMap.set("key_test", txtC);
        const col = gpv.detectPropertyType("key_test", value, propertyMap);
        expect(col).not.toBeNull();
        expect(col).toBeInstanceOf(expected);
    });
  });
});
