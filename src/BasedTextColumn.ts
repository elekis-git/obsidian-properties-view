import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default abstract class BasedTextColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }

    abstract fillCell(cell: HTMLElement, file: any, prop: any, value: any): void;
    
    
    public getUniqDisplayValues(rows: HTMLElement[]):any[] {
        let values: string[] = [];
        rows.forEach((row) => {
            if (row.style.display === "") {
                let cells = row.querySelectorAll("td");
                let targetCell = cells[this.getIndex()];
                if (targetCell) {
                    let input = targetCell.querySelector("input");
                    if (input && input.value != "") {
                        values.push(input.value); // Ajoute uniquement des valeurs uniques
                    }
                }
            }
        });
        values.push("");
        return [...new Set(values)];
    }

    public filterRows(rows: HTMLElement[]) {
        rows.forEach((row) => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            let filT = this.getFilter();
            if (filT.length > 0) {
                const cellText = cell ? cell.textContent!.trim() : "";
                const match = filT.some((filterValue: string) => {
                    if (filterValue == "") return cellText == "";
                    return cellText
                        .toLowerCase()
                        .includes(filterValue.toString().toLowerCase().replace("[[", "").replace("]]", ""));
                });
                if (!match) row.style.display = "none";
            }
        });
    }
}
