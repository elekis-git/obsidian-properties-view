
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

export default class FileColumn extends Column {
    constructor(pname:string, app:App) {
        super(pname, app);
    }
    public getStrType():string {
        return "FILE";
    }
     public isFiltering():boolean {
        return false
    }
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: Object|null):void{
        this.createHref(cell, file);
    }
    
}
