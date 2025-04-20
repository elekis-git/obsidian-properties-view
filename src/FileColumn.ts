import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";
import TextColumn from "./TextColumn";
import BasedTextColumn from "./BasedTextColumn";


export default class FileColumn extends BasedTextColumn {
    showBOTF : boolean; 
    
    public getUniqDisplayValuesFiltered(rows: HTMLElement[]): any[] {
        let a = super.getUniqDisplayValuesBasedOnSelector(rows, "a");
        return a.filter((b) => b != "");
    }

    constructor(pname: string, app: App, showBeginningOfTheFile:boolean) {
        super(pname, app);
        this.showBOTF =showBeginningOfTheFile;
    }
    public getStrType(): string {
        return "FILE";
    }

    public async fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: Object | null): Promise<void> {    
        this.createHref(cell, file);
        let brleng=500;
        if (this.showBOTF) {
            try {
                let content = await this.app.vault.read(file);
                // Enlève le front matter s'il existe
                if (content.startsWith("---")) {
                    const endFrontMatter = content.indexOf("---", 3);
                    if (endFrontMatter !== -1) {
                        content = content.slice(endFrontMatter + 3).trimStart();
                    }
                }

                // Cherche le premier paragraphe non vide
                const paragraphs = content
                    .split(/\r?\n\r?\n/)
                    .map((p) => p.trim())
                    .filter((p) => p.length > 0);
                if (paragraphs.length > 0) {
                    let preview = paragraphs[0];
                    if (preview.length > brleng) {
                        // Coupe proprement à 500 caractères sans casser un mot
                        const trimmed = preview.slice(0, brleng);
                        preview = trimmed.slice(0, trimmed.lastIndexOf(" ")) + "…";
                    }

                    cell.createEl("div", {
                        cls: "ptp-text-preview",
                        text: preview
                    });
                }
            } catch (err) {
                console.error("Error reading file preview:", err);
            }
        }
    }
}
