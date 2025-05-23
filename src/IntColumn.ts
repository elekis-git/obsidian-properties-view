import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class IntColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }

    public filterRows(rows: HTMLElement[]) {
        rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            row.style.display = "";
            if (this.getFilter().length > 0) {
                const selectEl = cell?.querySelector("input") as HTMLSelectElement | null;
                if (this.getFilter().includes("") && selectEl?.value == "") row.style.display = "";
                else if (selectEl?.value == "") row.style.display = "none";
                else {
                    const cellValue = Number(selectEl?.value);
                    let filtemp = this.getFilter().filter((item, index) => item !== "");
                    const filterValues = filtemp.map((val: any) => Number(val));
                    if (!filterValues.includes(cellValue)) {
                        row.style.display = "none";
                    }
                }
            }
        });
    }

    public getUniqDisplayValuesFiltered(rows: HTMLElement[]): any[] {
        let values: (number|string)[] = [];
        let cells = this.extractCells(rows);
        cells.forEach((cell) => {
            let input = cell.querySelector("input");
            if (input && input.value != "") {
                let value = Number(input.value);
                if (isNaN(value)){return;}
                if (this.getFilter().length == 0) values.push(value);
                else if ( this.getFilter().map(a => Number(a)).includes(value)) values.push(value);
            }
            else{values.push("")};
        });
        return [...new Set(values)];
    }

    public getStrType(): string {
        return "Int";
    }

    public sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[] {
        this.isSortedAsc = asc; 
        rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex];
            const cellB = b.getElementsByTagName("td")[this.columnIndex];
            const selectA = cellA?.querySelector("input") as HTMLSelectElement | null;
            const selectB = cellB?.querySelector("input") as HTMLSelectElement | null;
            const isNumericA = selectA && !isNaN(parseInt(selectA.value));
            const isNumericB = selectB && !isNaN(parseInt(selectB.value));
            if (isNumericA && isNumericB) {
                const cA = parseInt(selectA!.value);
                const cB = parseInt(selectB!.value);
                return asc ? cA - cB : cB - cA;
            } else if (isNumericA) {
                return asc ? -1 : 1;
            } else if (isNumericB) {
                return asc ? 1 : -1;
            } else {
                return 0;
            }
        });
        return rows;
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null) {
        cell.empty();
        const input = cell.createEl("input", { type: "number" });
        if (value == null || value == undefined || value.toString() == "") {
            input.style.display = "none";
            cell.classList.add("ptp-global-table-td-empty");
        } else {
            input.value = Number(value).toString();
        }
        input.setAttribute("filepath", file.path);
        input.setAttribute("prop", prop);
        input.step = "1";
        input.addEventListener("change", async () => {
            const newValue = input.value.trim();
            const filep = input.getAttribute("filepath")!;
            const propp = input.getAttribute("prop")!;
            if (newValue === "") {
                await this.updateYamlProperty(filep, propp, "", "delete");
                cell.classList.add("ptp-global-table-td-empty");
            } else {
                await this.updateYamlProperty(filep, propp, Number(newValue), "update");
                cell.classList.remove("ptp-global-table-td-empty");
                input.style.display = "none";
            }
        });

        cell.addEventListener("click", () => {
            cell.classList.remove("ptp-global-table-td-empty");
            input.style.display = "block";
            input.focus();
        });

        input.addEventListener("focus", () => {
            input.dataset.oldValue = input.value; // Stocke l'ancienne valeur
        });

        input.addEventListener("blur", async () => {
            let v = input.value;
            let oldValue = input.dataset.oldValue; // Récupère l'ancienne valeur
            input.style.display = "none";
            this.fillCell(cell, file, prop, v);
            if (v !== oldValue) await this.updateYamlProperty(file.path, prop, v === "" ? null : Number(v), "update");
        });
    }
}
