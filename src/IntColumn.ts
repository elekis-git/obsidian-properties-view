import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class IntColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }

    public filterRows(rows) {
        rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            row.style.display = "";
            if (this.getFilter().length > 0) {
                const selectEl = cell?.querySelector("input") as HTMLSelectElement | null;
                if (selectEl) {
                    const cellValue = Number(selectEl.value);
                    const filterValues = this.getFilter().map((val: any) => Number(val));
                    if (!filterValues.includes(cellValue)) {
                        row.style.display = "none";
                    }
                } else {
                    row.style.display = "none";
                }
            }
        });
    }

    public getStrType() {
        return "Int";
    }

    public sortRows(rows) {
        rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex];
            const cellB = b.getElementsByTagName("td")[this.columnIndex];
            const selectA = cellA?.querySelector("select") as HTMLSelectElement | null;
            const selectB = cellB?.querySelector("select") as HTMLSelectElement | null;
            const isNumericA = selectA && !isNaN(parseInt(selectA.value));
            const isNumericB = selectB && !isNaN(parseInt(selectB.value));
            if (isNumericA && isNumericB) {
                const cA = parseInt(selectA!.value);
                const cB = parseInt(selectB!.value);
                return this.sortasc ? cA - cB : cB - cA;
            } else if (isNumericA) {
                return this.sortasc ? -1 : 1;
            } else if (isNumericB) {
                return this.sortasc ? 1 : -1;
            } else {
                return 0;
            }
        });
        return rows;
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string) {
        cell.empty();
        const createInput = (value: string | null) => {
            cell.empty();
            const input = cell.createEl("input", {
                type: "number",
                value: value ?? ""
            });
            input.setAttribute("filepath", file.path);
            input.setAttribute("prop", prop);
            input.step = "1";

            input.addEventListener("change", async () => {
                const newValue = input.value.trim();
                const filep = input.getAttribute("filepath")!;
                const propp = input.getAttribute("prop")!;
                if (newValue === "") {
                    cell.empty();
                    await this.updateYamlProperty(filep, propp, "", "delete");
                } else {
                    await this.updateYamlProperty(filep, propp, Number(newValue), "update");
                }
            });

            input.addEventListener("blur", () => {
                if (input.value.trim() === "") {
                    cell.empty();
                }
            });

            input.focus();
        };

        if (currentValue == null || currentValue === "") {
            cell.empty();
            cell.addEventListener("click", () => createInput(null), { once: true });
        } else {
            createInput(currentValue);
        }
    }
}
