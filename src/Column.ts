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


import { App, TFile } from "obsidian";

export interface IColumn {
    // Propriétés
    app: App;
    vault: Vault; 
    sortasc: boolean;
    columnIndex: number;
    filter: string;
    propertyName: string;
    columnId: string;

    // Méthodes
    isFiltering(): boolean;

    setId(a: string): void;
    getId(): string;

    setPropertyName(a: string): void;
    getPropertyName(): string;

    setSortAsc(a: boolean): void;
    getSortAsc(): boolean;

    setIndex(a: number): void;
    getIndex(): number;

    fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string): void;

    createHref(elem: HTMLElement, fname: TFile | string): void;

    setFilter(a: string): void;
    getFilter(): string;

    filterRows(rows: HTMLElement[]): void;

    updateYamlProperty(filePath: string, prop: string, value: any, actiontype: string): Promise<void>;

    sortRows(rows: HTMLElement[]): HTMLElement[];
}



export default class Column implements IColumn {

    app: App;
    vault: any;
    sortasc: boolean;
    columnIndex: number;
    filter: string;
    propertyName: string;
    columnId: string;
    
    constructor(pname: string, app: App) {
        this.app = app;
        this.vault = app.vault;
        this.sortasc = false;
        this.columnIndex = -1
        this.filter = ""
        this.propertyName = pname
        this.columnId = ""
    }
    public isFiltering() {
        return true
    }

    public setId(a) {
        this.columnId = a;
    }
    public getId() {
        return this.columnId;
    }

    public setPropertyName(a) {
        this.propertyName = a;
    }
    public getPropertyName() {
        return this.propertyName;
    }

    public setSortAsc(a) {
        this.sortasc = a;
    }
    public getSortAsc() {
        return this.sortasc;
    }

    public setIndex(a) {
        this.columnIndex = a
    };
    public getIndex() {
        return this.columnIndex
    };
    
    public fillCell(cell: HTMLElement, file: TFile, prop: string, currentValue: string[] | string){
        
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

    
    
    public setFilter(a) {
        this.filter = a
    };
    public getFilter() {
        return this.filter
    };

    public filterRows(rows) {
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


    async updateYamlProperty(filePath: string, prop: string, value: any, actiontype: string) {
        //console.log("updateYAMLPROPERTY", filePath, prop, value, actiontype);
        const fileOrAbstract = this.vault.getAbstractFileByPath(filePath);
        // Vérifier que c'est bien un fichier
        if (!(fileOrAbstract instanceof TFile)) return;

        let fileContent = await this.vault.read(fileOrAbstract);
        const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
        let yamlContent = "{}";

        if (match) yamlContent = match[1];

        const yamlData = parseYaml(yamlContent);

        if (actiontype === "update") {
            if (!value || (Array.isArray(value) && value.length === 0) || value === "") {
                delete yamlData[prop];
            } else {
                yamlData[prop] = value;
            }
        } else if (actiontype === "delete") {
            if (Array.isArray(yamlData[prop])) {
                yamlData[prop] = yamlData[prop].filter((item: any) => item !== value);
                if (yamlData[prop].length === 0) delete yamlData[prop];
            } else {
                delete yamlData[prop];
            }
        } else if (actiontype === "addingtolist") {
            if (!Array.isArray(yamlData[prop])) {
                yamlData[prop] = value.length > 0 ? [...new Set(value)] : undefined;
            } else {
                yamlData[prop] = [...new Set([...yamlData[prop], ...value])];
            }
            if (!yamlData[prop] || yamlData[prop].length === 0) {
                delete yamlData[prop];
            }
        }
        const newYaml = stringifyYaml(yamlData);
        fileContent = match ?
            fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`) :
            `---\n${newYaml}---\n${fileContent}`;

        //console.log("Updated YAML:", newYaml);
        await this.vault.modify(fileOrAbstract, fileContent);
    }

    public sortRows(rows) {
        return rows.sort((a, b) => {
            console.log(this.columnIndex);
            console.log(a, b.getElementsByTagName("td")[this.columnIndex]);
            const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
            return this.sortasc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        });
    }
}
