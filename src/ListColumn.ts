import {
    App,
    MarkdownRenderer,
    TFile,
    parseYaml,
    stringifyYaml,
    ItemView,
    WorkspaceLeaf
} from "obsidian";

import Column from "./Column"


export default class ListColumn extends Column {
    constructor(pname:string, app:App) {
        super(pname, app);
    }

    public filterRows(rows:HTMLElement[]) {
        rows.forEach(row => {
		const cells = row.querySelectorAll("td");
		const cell = cells[this.getIndex()];
		row.style.display = "";

		let cellText: string[] = [];
		const listItems = cell.querySelectorAll("li");
		cellText = Array.from(listItems).map(li => li.textContent?.trim() || "");

		if (this.getFilter().length > 0) {
			let isMatch = false;
			for (const filterValue of this.getFilter()) {
				if (filterValue === "") {
					// Si le filtre contient une valeur vide, vérifier si cellText est vide
					if (cellText.length === 0 || (cellText.length === 1 && cellText[0] === "")) {
						isMatch = true;
						break;
					}
				} else {
					// Sinon, vérifier si le filtre est présent dans cellText
					if (cellText.some(item => item.toLowerCase().includes(filterValue.toLowerCase()))) {
						isMatch = true;
						break;
					}
				}
			}
			if (!isMatch) {
				row.style.display = "none";
			}
		}
	});
    }

    public getStrType():string {
        return "List";
    }
    public sortRows(rows:HTMLElement[]):HTMLElement[] {
        return super.sortRows(rows);
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object|null){
        cell.empty();
		cell.setAttribute("filepath", file.path);
		cell.setAttribute("prop", prop);
		const displayDiv = cell.createEl("div", { cls: "markdown-preview" });

		let cv = Array.isArray(value) ? value : [value];

		const list = displayDiv.createEl("ul", { cls: "properties-list-elekis" });

		cv.forEach((v) => {
			if (v == null) return;
			const listItem = list.createEl("li", { cls: "properties-list-item" });

			if (/^\[\[.*\]\]$/.test(v)) {
				const fileName = v.replace(/^\[\[|\]\]$/g, ""); // Nettoyer [[ ]]
				let tfile = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
				if (tfile == null) {
					this.createHref(listItem, fileName);
				} else {
					this.createHref(listItem, tfile);
				}
			} else {
				listItem.createEl("span", { text: v });
			}
		});
		const textarea = cell.createEl("textarea", {
				cls: "properties-markdown-textarea",
				text: cv.join("\n")
			});
		textarea.style.display = "none"
		
		cell.addEventListener("click", () => {
			displayDiv.style.display = "none";
			textarea.style.display = "block";
			textarea.focus();
		});
		
		textarea.addEventListener("blur", async () => {
				displayDiv.style.display = "block";
				textarea.style.display = "none";
				let tt = textarea.value.trim().split("\n").filter((v) => v !== "")
				await this.updateYamlProperty(file.path, prop,tt, "update");
				this.fillCell(cell, file, prop, tt);
			});
    }
}