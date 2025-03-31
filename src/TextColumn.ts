import {
    App,
    MarkdownRenderer,
    TFile,
    parseYaml,
    stringifyYaml,
    ItemView,
    WorkspaceLeaf,
    MarkdownView
} from "obsidian";

import Column from "./Column"

export default class TextColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType() {
        return "Text";
    }

    public sortRows(rows) {
        return super.sortRows(rows);
    }

    public filterRows(rows) {
        rows.forEach(row => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            if (this.getFilter().length > 0) {
                const cellText = cell ? cell.textContent!.trim() : "";
                const match = this.getFilter().some((filterValue: string) =>
                    cellText.toLowerCase().includes(filterValue.toString().toLowerCase().replace("[[", "").replace("]]", "")));
                if (!match) row.style.display = "none";
            }
        });
    }
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: string[] | string){
        let v2 = value != null ? String(value) : "";
		const displayDiv = cell.createEl("div", { cls: "markdown-preview" });

		const renderMarkdown = () => {
			displayDiv.empty();
			// Utilisation de "this" (la vue qui est un Component) au lieu de this.app
            
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            MarkdownRenderer.renderMarkdown(v2, displayDiv, file.path, view ?? null);

			const links = displayDiv.querySelectorAll("a");
			links.forEach((link) => {
				link.addEventListener("click", (event) => {
					event.preventDefault();
					const targetPath = link.getAttribute("href");
					if (targetPath) {
						this.app.workspace.openLinkText(targetPath, "", true);
					}
				});
			});
		};

		renderMarkdown();

		const input = cell.createEl("input", { type: "text", cls: "markdown-input" });
		input.value = v2;
		input.style.display = "none";

		cell.addEventListener("click", () => {
			displayDiv.style.display = "none";
			input.style.display = "block";
			input.focus();
		});

		input.addEventListener("blur", async () => {
			value = input.value;
			displayDiv.style.display = "block";
			input.style.display = "none";
			await this.updateYamlProperty(path, prop, value, "update");
			renderMarkdown();
		});

		cell.appendChild(input);
    }
    
    
    
}