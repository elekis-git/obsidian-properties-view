// __mocks__/obsidian.ts

import fs from 'fs'; 
import yaml from "js-yaml";



export const parseYaml = jest.fn((s) => {return yaml.load(s); });                                         
export const stringifyYaml = jest.fn((obj) => yaml.dump(obj));

export class Vault {
    getAbstractFileByPath = jest.fn().mockImplementation((path: string) => {return new TFile(path); });
    read = jest.fn().mockImplementation((f: TFile) => { return fs.promises.readFile(f.path, 'utf8'); });
    modify = jest.fn();
}

export class App {
  vault: Vault;
  constructor() { this.vault = new Vault(); }
}

export class TFile {
  constructor(public path: string) {}
}


export class ItemView {
  app: App
  constructor() { this.app = new App(); }
}
export class Modal {}
export class Notice {}
export class Plugin {
  loadData() {}
  saveData() {}
  addRibbonIcon() {
    return { addClass: () => {} };
  }
  addStatusBarItem() {
    return { setText: () => {} };
  }
  addCommand() {}
  addSettingTab() {}
  registerDomEvent() {}
  registerInterval() {}
}



export class MarkdownView {}
export class Editor {}

class HTMLElement {
  constructor() {
    this.style = { display: "" };
    this.children = [];
    this.attributes = {};
  }

  appendChild(child) {
    this.children.push(child);
  }

  querySelectorAll(selector) {
    const result = [];
    this.children.forEach(child => {
      if (child.matchesSelector(selector)) {
        result.push(child);
      }
    });
    return result;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  matchesSelector(selector) {
    // Simple simulation, only supports "td" and input/select for simplicity.
    const tagName = selector.replace(/^[^a-zA-Z]*/, '');
    return this.constructor.name.toLowerCase() === tagName;
  }
}

class HTMLInputElement extends HTMLElement{}

