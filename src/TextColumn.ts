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

    public getUniqDisplayValuesFiltered(rows: HTMLElement[]): any[] {
        return super.getUniqDisplayValuesBasedOnSelector(rows, "input");
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
        cell.style.position = "relative";

        let v2 = value != null ? String(value) : "";
        if (value == null) cell.classList.add("ptp-global-table-td-empty");
        else cell.classList.remove("ptp-global-table-td-empty");
        v2 = this.decodeEmojisInText(v2);
        const displayDiv = cell.createEl("div", { cls: "ptp-text-preview" });

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

        const input = cell.createEl("input", { type: "text", cls: "ptp-text-preview" });
        input.value = v2;
        input.style.display = "none";
        cell.appendChild(input);

        const suggestionBox = createDiv({ cls: "ptp-suggestion-box" });
        suggestionBox.style.display = "none";
        cell.appendChild(suggestionBox);

        const context: {
            currentIndex: number;
            matches: TFile[];
            suggestMenu: HTMLDivElement | null;
            suggestionBox: HTMLDivElement;
        } = {
            currentIndex: -1,
            matches: [],
            suggestMenu: null,
            suggestionBox
        };

        input.addEventListener("input", () => this.onInput(input, context));
        input.addEventListener("keydown", (e) => this.onKeydown(e, input, context));

        cell.addEventListener("dblclick", () => {
            displayDiv.style.display = "none";
            input.style.display = "block";
            input.focus();
        });

        input.addEventListener("focus", () => {
            input.dataset.oldValue = input.value;
        });

        input.addEventListener("blur", async () => {
            value = input.value;
            const oldValue = input.dataset.oldValue;
            displayDiv.style.display = "block";
            input.style.display = "none";
            suggestionBox.style.display = "none";
            this.renderMarkdownToDiv(displayDiv, String(value), file);
            this.fillCell(cell, file, prop, value);
            if (oldValue !== value)
                await this.updateYamlProperty(file.path, prop, value == null ? "" : value.toString(), "update");
        });
    }
}
