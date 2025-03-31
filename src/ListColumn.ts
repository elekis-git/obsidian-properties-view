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
            if (this.getFilter().length > 0) {

                let cellText = cell ? cell.textContent!.trim() : "";
                cellText = cellText.toString();
                if (
                    !this.getFilter().some((filterValue: string) =>
                        cellText.toLowerCase().includes(filterValue.toString().toLowerCase())
                    )
                ) {
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

		let cv = Array.isArray(value) ? value : [value];

		const list = cell.createEl("ul", { cls: "properties-list-elekis" });

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

			const delbutton = listItem.createEl("button", {
				text: "-",
				cls: "properties-del-elekis-divprop-button",
				attr: { filepath: file.path, prop: prop, value: v }
			});

			delbutton.addEventListener("click", async (event) => {
				event.preventDefault();
				event.stopPropagation();
				const filep = delbutton.getAttribute("filepath")!;
				const propAttr = delbutton.getAttribute("prop")!;
				const valueAttr = delbutton.getAttribute("value")!;
				await this.updateYamlProperty(filep, propAttr, valueAttr, "delete");
				listItem.remove();
			});
		});

		cell.appendChild(list);

		cell.addEventListener("click", () => {
			if (cell.querySelector("textarea")) return;
			let markdownText = cv.join("\n");
			cell.empty();
			const textarea = cell.createEl("textarea", {
				cls: "properties-markdown-textarea",
				text: markdownText
			});
			textarea.focus();
			textarea.addEventListener("blur", async () => {
				const newValue = textarea.value
					.trim()
					.split("\n")
					.filter((v) => v !== "");
				cell.empty();
				await this.updateYamlProperty(file.path, prop, newValue, "update");
				this.fillCell(cell, file, prop, newValue);
			});
		});
    }
    
}