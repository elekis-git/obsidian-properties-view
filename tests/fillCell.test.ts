import IntColumn from '../src/IntColumn';  
import Column from '../src/Column';  
import { TFile, Vault, App, mockCell } from 'obsidian';  
import fs from 'fs';  
import yaml from "js-yaml";
import { JSDOM } from "jsdom";

let dirTest = "./tests/testfiles/"

import { IntColumn } from "./IntColumn"; // Importer la classe

describe('IntColumn fillCell', () => {
  let col: IColumn;
  let file: TFile;
  let prop: string;
  let value: Object | null;
  let mockApp: any;

  beforeEach(() => {
    file = { path: './tests/testfiles/example.md', name: 'example.md' } as TFile;
    prop = 'newIntProp';
    value = 9;
    mockApp = new App();
  });

  it('aaaa', async () => {
    col = new IntColumn("testProperty", mockApp);
    await col.fillCell(mockCell, file, prop, value);


  });
});
