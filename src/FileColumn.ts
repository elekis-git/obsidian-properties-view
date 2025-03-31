
import {
    App,
    MarkdownRenderer,
    TFile,
    parseYaml,
    stringifyYaml,
    ItemView,
    WorkspaceLeaf
} from "obsidian";

import Column from "./Column"
import TextColumn from "./TextColumn"

export default class FileColumn extends TextColumn {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType() {
        return "FILE";
    }
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string){
        this.createHref(cell, file.path);
    }
    
}
