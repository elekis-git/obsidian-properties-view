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


export default class DirColumn extends TextColumn {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType() {
        return "DIR";
    }
    
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string){
        let p = "/" + file.path.substring(0, file.path.lastIndexOf("/"))
        super.fillCell(cell, file.path, prop,  p );
    }
    
}

