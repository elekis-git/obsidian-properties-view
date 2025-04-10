import {
    App,
    MarkdownRenderer,
    TFile,
    parseYaml,
    stringifyYaml,
    ItemView,
    WorkspaceLeaf,
    Vault,
} from "obsidian";

export interface IColumn {
    // Propriétés
    app: App;
    vault: Vault; 
    columnIndex: number;
    filter: string[];
    propertyName: string;
    columnId: string;
    cnt : number;

    setId(a: string): void;
    getId(): string;

    setPropertyName(a: string): void;
    getPropertyName(): string;

    addCnt1():void;
    getCnt():number;
    setCnt(a:number):void;
    
    setStrType(a:string):void
    getStrType():string
    
    setIndex(a: number): void;
    getIndex(): number;

    fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object|null): void;

    createHref(elem: HTMLElement, fname: TFile | string): void;

    setFilter(a: string[]): void;
    getFilter(): string[];

    filterRows(rows: HTMLElement[]): void;

    updateYamlProperty(filePath: string, prop: string, value: any, actiontype: string): Promise<void>;

    sortRows(rows: HTMLElement[], asc:boolean): HTMLElement[];
	
}

export default class Column implements IColumn {
 
    app: App;
    vault: any;
    columnIndex: number;
    filter: string[];
    propertyName: string;
    columnId: string;
    cnt : number;
    
    constructor(pname: string, app: App) {
        this.app = app;
        this.vault = app.vault;
        this.columnIndex = -1
        this.filter = []
        this.propertyName = pname
        this.columnId = ""
        this.cnt = 0;
    }

    public addCnt1(){this.cnt++;}
    public setCnt(a:number){this.cnt = a;}
    public getCnt():number{return this.cnt}
    
    public setId(a:string) {
        this.columnId = a;
    }
    public getId():string {
        return this.columnId;
    }

    public setPropertyName(a:string) {
        this.propertyName = a;
    }
    public getPropertyName():string {
        return this.propertyName;
    }


    public setIndex(a:number) {
        this.columnIndex = a
    };
    public getIndex(): number {
        return this.columnIndex
    };
    
    public setStrType(a:string):void{}
    public getStrType():string {return "";}



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

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null){}

    
    public setFilter(a:string[]) {
        this.filter = a
    };
    public getFilter():string[] {
        return this.filter
    };

    public filterRows(rows : HTMLElement[]) {
        rows.forEach(row => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            if (this.getFilter().length > 0) {
                if (!this.getFilter().includes(cell?.textContent?.trim() ?? "")) {
                    row.style.display = "none";
                }
            }
        });
    }


    async updateYamlProperty(filePath: string, prop: string, value: string|string[]|boolean|number|null, actiontype: string) {
        const fileOrAbstract = this.vault.getAbstractFileByPath(filePath);
        if (!(fileOrAbstract instanceof TFile)) return;

        let fileContent = await this.vault.read(fileOrAbstract);
        const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
        let yamlContent = "{}";

        if (match) yamlContent = match[1];

        const yamlData = parseYaml(yamlContent);

        if (actiontype === "update") {
                yamlData[prop]= value;
        } else if (actiontype === "delete") {
            if (Array.isArray(yamlData[prop])) {
                yamlData[prop] = yamlData[prop].filter((item: any) => item !== value);
                if (yamlData[prop].length === 0) delete yamlData[prop];
            } else {
                delete yamlData[prop];
            }
        } 
        const newYaml = stringifyYaml(yamlData);
        fileContent = match ?
            fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`) :
            `---\n${newYaml}---\n${fileContent}`;
        await this.vault.modify(fileOrAbstract, fileContent);
    }

    public sortRows(rows  : HTMLElement[], asc:boolean): HTMLElement[] {
        return rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            console.log("->",cellA, cellB, cellA.localeCompare(cellB), cellB.localeCompare(cellA));
            return asc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        });
    }
}
