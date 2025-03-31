import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class BoolColumn extends Column {
    constructor(pname : string , app: App) {
        super(pname, app);
    }
    public getStrType() {
        return "Bool";
    }
    public sortRows(row : HTMLElement[]) : HTMLElement[] {
        return super.sortRows(row);
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null):void {
        cell.empty();
        
        const createCheckbox = (v: boolean | null): void => {
            cell.empty();
            const checkbox = cell.createEl("input", { type: "checkbox" });
            // Maintenant vous pouvez définir la propriété `checked` séparément
            checkbox.checked = v ?? false;
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

//            checkbox.focus();
        };

        if (value === null) {
            // Si la valeur actuelle est null ou undefined, on attend un clic pour créer le checkbox
            cell.empty();
            cell.addEventListener("click", () => createCheckbox(null), { once: true });
        } else {
            createCheckbox(Boolean(value)); // Crée la checkbox avec la valeur actuelle
        }
    }
}