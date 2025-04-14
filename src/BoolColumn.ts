import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class BoolColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }
    public getStrType() {
        return "Bool";
    }
    public sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[] {
        return rows.sort((a, b) => {
            // Récupère les cases à cocher (checkbox) dans les cellules
            const cellA = a.getElementsByTagName("td")[this.columnIndex];
            const cellB = b.getElementsByTagName("td")[this.columnIndex];

            const checkboxA = cellA?.querySelector("input[type='checkbox']") as HTMLInputElement | null;
            const checkboxB = cellB?.querySelector("input[type='checkbox']") as HTMLInputElement | null;

            if (checkboxA && checkboxB) {
                const valueA = checkboxA.checked;
                const valueB = checkboxB.checked;
                if (valueA === valueB) {
                    return 0; // Si les valeurs sont identiques, ne change pas l'ordre
                }
                return asc ? (valueA ? -1 : 1) : valueA ? 1 : -1;
            }
            return 0; // Si une des checkboxes est manquante, on ne trie pas
        });
    }
    
    
    public filterRows(rows: HTMLElement[]) {
        rows.forEach((row) => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            if (this.getFilter().length > 0) {
                const selectEl = cell?.querySelector("input") as HTMLInputElement | null;
                if (
                    !this.getFilter()
                        .map((a) => a.toString())
                        .includes(selectEl ? selectEl.checked.toString() : "")
                ) {
                    row.style.display = "none";
                }
            }
        });
    }

    public getUniqDisplayValuesFiltered(rows: HTMLElement[]) {return [true,false, ""]}
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null): void {
        cell.empty();
        const createCheckbox = (v: string): void => {
            cell.empty();
            const checkbox = cell.createEl("input", { type: "checkbox" });
            cell.classList.remove("ptp-global-table-td-empty");
            0;
            if (v === "N") {
                //bad, should be (-) like in obsidian.
                checkbox.checked = false;
            } else checkbox.checked = v === "T";
            checkbox.setAttribute("filepath", file.path);
            checkbox.setAttribute("prop", prop);

            checkbox.addEventListener("change", async () => {
                const newValue = checkbox.checked; // true ou false selon l'état du checkbox
                checkbox.style.backgroundColor = "";
                const filep = checkbox.getAttribute("filepath")!;
                const propp = checkbox.getAttribute("prop")!;
                await this.updateYamlProperty(filep, propp, newValue, "update");
            });
        };

        if (value === undefined) {
            cell.addEventListener("click", () => createCheckbox("F"), { once: true });
            cell.classList.add("ptp-global-table-td-empty");
        } else if (value == null) {
            createCheckbox("N");
        } else createCheckbox(Boolean(value) ? "T" : "F"); // Crée la checkbox avec la valeur actuelle
    }
}
