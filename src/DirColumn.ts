import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";
import TextColumn from "./TextColumn";
import BasedTextColumn from "./BasedTextColumn";

export default class DirColumn extends BasedTextColumn {
    constructor(pname: string, app: App) {
        super(pname, app);
    }
    public static getStrType(): string {
        return "DIR";
    }
    public isFiltering(): boolean {
        return false;
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null) {
        let p = "/" + file.path.substring(0, file.path.lastIndexOf("/"));
        cell.createEl("div", { text: p });
    }
}
