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

import Column from "./Column";
import BasedTextColumn from "./BasedTextColumn";

export default class TextColumn extends BasedTextColumn {
    constructor(pname: string, app: App) {
        super(pname, app);
    }
    public getStrType(): string {
        return "Text";
    }

    public sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[] {
        return super.sortRows(rows, asc);
    }

    public decodeEmojisInText(text: string): string {
        return text.replace(/emoji\/\/([0-9a-fA-F-]+)/g, (_, hexCodes) => {
            const unicodeChars = hexCodes.split("-").map((code: string) => String.fromCodePoint(parseInt(code, 16)));
            return unicodeChars.join("");
        });
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null) {
        cell.empty();
        let v2 = value != null ? String(value) : "";
        if (value == null) cell.classList.add("ptp-global-table-td-empty");
        else cell.classList.remove("ptp-global-table-td-empty");
        v2 = this.decodeEmojisInText(v2);
        const displayDiv = cell.createEl("div", { cls: "ptp-markdown-preview" });

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

        input.addEventListener("focus", () => {
            input.dataset.oldValue = input.value; // Stocke l'ancienne valeur
        });

        input.addEventListener("blur", async () => {
            value = input.value;
            let oldValue = input.dataset.oldValue; // Récupère l'ancienne valeur
            displayDiv.style.display = "block";
            input.style.display = "none";
            renderMarkdown();
            this.fillCell(cell, file, prop, value);
            if (oldValue !== value)
                await this.updateYamlProperty(file.path, prop, value == null ? "" : value.toString(), "update");
            
        });
        cell.appendChild(input);
    }
}
