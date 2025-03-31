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
 
export default class IDColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }

    public isFiltering() {
        return false
    }


    public getStrType() {
        return "ID";
    }
    public sortRows(rows) {
        rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cA = parseInt(cellA);
            const cB = parseInt(cellB);
            return this.sortasc ? cA - cB : cB - cA;

        });
        return rows;
    }
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string){
        	cell.empty();
		      const input = cell.createEl("div", { text:currentValue });
    }
    
    
}