import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class BoolColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }
    public getStrType() {
        return "Bool";
    }
    public sortRows(row: HTMLElement[]): HTMLElement[] {
        return super.sortRows(row);
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null): void {
        cell.empty();

        const createCheckbox = (v: string): void => {
            cell.empty();
            const checkbox = cell.createEl("input", { type: "checkbox" });
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
        }
        else if (value == null) {
            createCheckbox("N");
        } else createCheckbox(Boolean(value) ? "T" : "F"); // Crée la checkbox avec la valeur actuelle
    }
}
