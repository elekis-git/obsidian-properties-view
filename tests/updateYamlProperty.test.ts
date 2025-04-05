import Column from '../src/Column';  
import { TFile, Vault } from 'obsidian';  
import fs from 'fs';  
import yaml from "js-yaml";

let dirTest = "./tests/testfiles/"


describe('Column', () => {
  let column: Column;
  let mockVault: any;

  
  async function testAddNewProp(filePath, prop, value) {
    await column.updateYamlProperty(filePath, prop, value, 'update');
    const modifyCallArgs = mockVault.modify.mock.calls[0]; 
    const modifyYamlContent = modifyCallArgs[1]; 
    const parsedModifyYaml = yaml.load(modifyYamlContent.match(/^---\n([\s\S]*?)\n---/)[1]);
    return parsedModifyYaml
  }
  
  beforeEach(() => {
    mockVault = new Vault();
    column = new Column("testProperty", { vault: mockVault } as any);
  });
    
  
  
  it('add new prop int type', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'newIntProp', 9);
    expect(resp).toHaveProperty('newIntProp', 9); 
    expect(typeof resp.newIntProp).toBe('number');
  });
  
  it('add new prop bool type', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'newBoolProp', true);
    expect(resp).toHaveProperty( 'newBoolProp', true);
    expect(typeof resp.newBoolProp).toBe('boolean');
  });
  
  it('add new prop string type', async () => { // les dates sont au format string.
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'newStringProp', "testsstring");
    expect(resp).toHaveProperty( 'newStringProp', "testsstring");
    expect(typeof resp.newStringProp).toBe('string');
  });
  
  it('add new prop list type', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'newListProp', ["1p","2p","3p"]);
    expect(resp).toHaveProperty( 'newListProp', ["1p","2p","3p"]);
    expect(Array.isArray(resp.newListProp)).toBe(true);  
  });
  
  it('update string prop', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'rating', 9);
    expect(resp).toHaveProperty('rating', 9); 
    expect(typeof resp.rating).toBe('number');
  });
  
  it('update bool prop', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'published', false);
    expect(resp).toHaveProperty( 'published', false);
    expect(typeof resp.published).toBe('boolean');
  });
  
  it('update string', async () => { // les dates sont au format string.
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'title', "testsstring");
    expect(resp).toHaveProperty( 'title', "testsstring");
    expect(typeof resp.title).toBe('string');
  });

  it('add new prop list type', async () => {
    const filePath = dirTest+'allValuesTypes.md';  
    let resp = await testAddNewProp(filePath, 'tags', ["1p","2p","3p"]);
    expect(resp).toHaveProperty( 'tags', ["1p","2p","3p"]);
    expect(Array.isArray(resp.tags)).toBe(true);  
  });
  

});
    
