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
    
    static counter:number=0
    
    constructor(pname:string, app:App) {
        super(pname, app);
		IDColumn.counter +=0;
    }

    public isFiltering():boolean {
        return false
    }


    public getStrType():string {
        return "ID";
    }
    public sortRows(rows : HTMLElement[]) : HTMLElement[] {
        rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cA = parseInt(cellA);
            const cB = parseInt(cellB);
            return this.sortasc ? cA - cB : cB - cA;

        });
        return rows;
    }
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null):void{
        	cell.empty();
        IDColumn.counter +=1;
		  const input = cell.createEl("div", { text: IDColumn.counter.toString() });
    }
    
    
}