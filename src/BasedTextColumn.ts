import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class BasedTextColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }

    public filterRows(rows: HTMLElement[]) {
        rows.forEach((row) => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            if (this.getFilter().length > 0) {
                const cellText = cell ? cell.textContent!.trim() : "";
                const match = this.getFilter().some((filterValue: string) => {
                    return cellText
                        .toLowerCase()
                        .includes(filterValue.toString().toLowerCase().replace("[[", "").replace("]]", ""));
                });
                if (!match) row.style.display = "none";
            }
        });
    }
}
