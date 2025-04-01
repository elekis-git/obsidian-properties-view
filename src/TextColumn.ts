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
    constructor(pname:string, app:App) {
        super(pname, app);
    }
    public getStrType():string {
        return "Text";
    }

    public sortRows(rows : HTMLElement[]):HTMLElement[] {
        return super.sortRows(rows);
    }

    public filterRows(rows: HTMLElement[]) {
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
    
    public decodeEmojisInText(text: string): string {
    return text.replace(/emoji\/\/([0-9a-fA-F-]+)/g, (_, hexCodes) => {
        const unicodeChars = hexCodes.split("-").map( (code:string) => String.fromCodePoint(parseInt(code, 16)));
        return unicodeChars.join("");
    });
}
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null){
		cell.empty();
        let v2 = value != null ? String(value) : "";
        v2 = this.decodeEmojisInText(v2);
		const displayDiv = cell.createEl("div", { cls: "markdown-preview" });

		const renderMarkdown = () => {
			displayDiv.empty();
            
            //@ts-ignore
            MarkdownRenderer.renderMarkdown(v2, displayDiv, file.path, null);

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
			await this.updateYamlProperty(file.path, prop, value, "update");
			renderMarkdown();
			this.fillCell(cell, file, prop, value);
		});
		cell.appendChild(input);
    }
}