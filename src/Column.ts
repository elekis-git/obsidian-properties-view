import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf, Vault } from "obsidian";

export interface IColumn {
    // Propriétés
    app: App;
    vault: Vault;
    columnIndex: number;
    filter: string[];
    propertyName: string;
    columnId: string;
    cnt: number;
    visible: boolean;
    isSortedAsc: boolean;

    setV(a: boolean): void;
    getV(): boolean;
    applyV(rows: HTMLElement[]): void;

    setId(a: string): void;
    getId(): string;

    setPropertyName(a: string): void;
    getPropertyName(): string;

    getSortedAsc(): boolean;

    addCnt1(): void;
    getCnt(): number;
    setCnt(a: number): void;

    setStrType(a: string): void;
    getStrType(): string;

    setIndex(a: number): void;
    getIndex(): number;

    extractCells(rows: HTMLElement[]): HTMLElement[];
    fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null): void;

    createHref(elem: HTMLElement, fname: TFile | string): void;

    setFilter(a: string[]): void;
    getFilter(): string[];

    filterRows(rows: HTMLElement[]): void;
    getUniqDisplayValuesFiltered(rows: HTMLElement[]): any[];

    updateYamlProperty(filePath: string, prop: string, value: any, actiontype: string): Promise<void>;

    sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[];
}

export default abstract class Column implements IColumn {
    app: App;
    vault: any;
    columnIndex: number;
    filter: string[];
    propertyName: string;
    columnId: string;
    cnt: number;
    visible: boolean;
    isSortedAsc: boolean;

    constructor(pname: string, app: App) {
        this.app = app;
        this.vault = app.vault;
        this.columnIndex = -1;
        this.filter = [];
        this.propertyName = pname;
        this.columnId = "";
        this.cnt = 0;
        this.visible = true;
        this.isSortedAsc = true;
    }

    public extractCells(rows: HTMLElement[]): HTMLElement[] {
        let values: HTMLElement[] = [];
        rows.filter((r) => r.style.display == "").forEach((row) => {
            let cells = row.querySelectorAll("td");
            let cell = cells[this.getIndex()]; // Récupère la cellule à l'index spécifié
            if (cell) values.push(cell);
        });
        return values;
    }

    public applyV(rows: HTMLElement[]) {
        let cells = this.extractCells(rows);
        cells.forEach((c) => {
            if (this.getV()) c.style.display = "";
            else c.style.display = "none";
        });
    }


    abstract getUniqDisplayValuesFiltered(rows: HTMLElement[]): any[];
    abstract fillCell(cell: HTMLElement, file: any, prop: any, value: any): void;
    abstract filterRows(rows: HTMLElement[]): void;

    public addCnt1() {
        this.cnt++;
    }
    public setCnt(a: number) {
        this.cnt = a;
    }
    public getCnt(): number {
        return this.cnt;
    }

    public getSortedAsc(): boolean {
        return this.isSortedAsc;
    }

    public setId(a: string) {
        this.columnId = a;
    }
    public getId(): string {
        return this.columnId;
    }

    public setV(a: boolean) {
        this.visible = a;
    }

    public getV(): boolean {
        return this.visible;
    }

    public setPropertyName(a: string) {
        this.propertyName = a;
    }
    public getPropertyName(): string {
        return this.propertyName;
    }

    public setIndex(a: number) {
        this.columnIndex = a;
    }
    public getIndex(): number {
        return this.columnIndex;
    }

    public setStrType(a: string): void {}
    
    public getStrType(): string {
        return "";
    }

    public createHref(elem: HTMLElement, fname: TFile | string) {
        const fileLink = elem.createEl("a", {
            text: fname instanceof TFile ? fname.basename : fname,
            cls: "cm-underline",
            href: fname instanceof TFile ? fname.path : "/" + fname,
            attr: { tabindex: "-1" }
        });
        fileLink.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.app.workspace.openLinkText(fname instanceof TFile ? fname.path : "/" + fname, "", false);
        });
    }

    public setFilter(a: string[]) {
        this.filter = a;
    }
    public getFilter(): string[] {
        return this.filter;
    }

    async updateYamlProperty(
        filePath: string,
        prop: string,
        value: string | string[] | boolean | number | null,
        actiontype: string
    ) {
        const fileOrAbstract = this.vault.getAbstractFileByPath(filePath);
        if (!(fileOrAbstract instanceof TFile)) return;

        let fileContent = await this.vault.read(fileOrAbstract);
        const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
        let yamlContent = "{}";

        if (match) yamlContent = match[1];

        const yamlData = parseYaml(yamlContent);

        if (actiontype === "update") {
            if (yamlData[prop] == value) return;
            else yamlData[prop] = value;
        } else if (actiontype === "delete") {
            if (Array.isArray(yamlData[prop])) {
                yamlData[prop] = yamlData[prop].filter((item: any) => item !== value);
                if (yamlData[prop].length === 0) delete yamlData[prop];
            } else {
                delete yamlData[prop];
            }
        }
        const newYaml = stringifyYaml(yamlData);
        fileContent = match
            ? fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`)
            : `---\n${newYaml}---\n${fileContent}`;
        await this.vault.modify(fileOrAbstract, fileContent);
    }

    public sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[] {
        this.isSortedAsc = asc;
        return rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            return asc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        });
    }
}
