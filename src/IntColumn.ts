import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class IntColumn extends Column {
    
    constructor(pname:string, app:App) {
        super(pname, app);
    }

    public filterRows(rows : HTMLElement[]) {
        rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            row.style.display = "";
            if (this.getFilter().length > 0) {
                const selectEl = cell?.querySelector("input") as HTMLSelectElement | null;	
				if(this.getFilter().includes('') && selectEl == null)return;	
				else if(selectEl == null) row.style.display = "none";	
				else{					
					const cellValue = Number(selectEl.value);
					let filtemp = this.getFilter().filter((item, index) => item !== "");
					const filterValues = filtemp.map((val: any) => Number(val));
					if (!filterValues.includes(cellValue)){
						row.style.display = "none";		
					}					
				}
			}
        });
    }
	

    public getStrType():string {
        return "Int";
    }

    public sortRows(rows : HTMLElement[]) : HTMLElement[] {
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

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value:Object|null) {
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
        };

        if (value == null || value === "" || value === null) {
            cell.empty();
            cell.addEventListener("click", () => createInput(null), { once: true });
        } else {
            createInput((value as string));
        }
    }
}
