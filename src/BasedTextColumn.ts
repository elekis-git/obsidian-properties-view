import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default abstract class BasedTextColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }

    abstract fillCell(cell: HTMLElement, file: any, prop: any, value: any): void;

    public getUniqDisplayValuesBasedOnSelector(rows: HTMLElement[], sQuerry: string): any[] {
        console.log("getUniq");
        let values: (string | null)[] = [];
        let cells = this.extractCells(rows);
        cells.forEach((cell) => {
            let input = cell.querySelector(sQuerry);
            if (input) {
                if (
                    (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) &&
                    input.value.trim() !== ""
                ) {
                    values.push(input.value.trim());
                    console.log("dd", input.value);
                } else if (input.textContent?.trim() !== "") {
                    values.push(input.textContent?.trim() || "");
                    console.log("=>", input.textContent);
                } else {
                    values.push("");
                }
            } else {
                values.push("");
            }
        });
        //        values.push("");
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
