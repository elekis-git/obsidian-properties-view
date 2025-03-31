import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class BoolColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType() {
        return "Bool";
    }
    public sortRows(row) {
        return super.sortRows(row);
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string) {
        //console.log("addBooleanButton", filepath, prop, currentValue);
        cell.empty();

        const createCheckbox = (value: boolean | null) => {
            cell.empty();
            const checkbox = cell.createEl("input", { type: "checkbox" });
            // Maintenant vous pouvez définir la propriété `checked` séparément
            checkbox.checked = value ?? false;
            checkbox.setAttribute("filepath", file.path);
            checkbox.setAttribute("prop", prop);

            checkbox.addEventListener("change", async () => {
                const newValue = checkbox.checked; // true ou false selon l'état du checkbox
                const filep = checkbox.getAttribute("filepath")!;
                const propp = checkbox.getAttribute("prop")!;
                await this.updateYamlProperty(filep, propp, newValue, "update");
            });

            checkbox.addEventListener("blur", () => {
                // Aucune action spécifique au blur, mais c'est là au cas où
            });

            checkbox.focus();
        };

        if (currentValue == null) {
            // Si la valeur actuelle est null ou undefined, on attend un clic pour créer le checkbox
            cell.empty();
            cell.addEventListener("click", () => createCheckbox(null), { once: true });
        } else {
            createCheckbox(currentValue); // Crée la checkbox avec la valeur actuelle
        }
    }
}