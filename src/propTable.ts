import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";
import { ViewStateResult } from "obsidian";

import { FilterModal } from "src/filterModal";

import FileColumn from "./FileColumn";
import DirColumn from "./DirColumn";
import TextColumn from "./TextColumn";

import BoolColumn from "./BoolColumn";
import DateTimeColumn from "./DateTimeColumn";

import Column, { IColumn } from "./Column";

import IDColumn from "./IDColumn";
import ListColumn from "./ListColumn";
import IntColumn from "./IntColumn";

export class GlobalPropertiesView extends ItemView {
	fileProperties: any[] = [];
	public static GLOBAL_PROPERTIES_VIEW = "glbVeID";
	private table: HTMLElement | null = null;
	private propColStart = 3;
	private scale = 1;
	private columnsMapping: IColumn[] = [];
	private folderPath: string = "/";
	private tablecreated = false;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	public rebuildTheView() {
		this.tablecreated = false;
		this.createTablePropView();
	}
	
	public refreshView() {
		this.createTablePropView();
	}

	getViewType() {
		return GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW;
	}

	getIcon() {
		return "wrench";
	}

	getDisplayText() {
		return this.folderPath;
	}

	getFolderPath(): string {
		return this.folderPath;
	}

	async setState(state: any, result: ViewStateResult): Promise<void> {
		console.log("setState");
		if (state.folderPath) {
			this.folderPath = state.folderPath;
		}
		await super.setState(state, result);
	}

	getState(): any {
		console.log("getState");
		const state = { folderPath: this.folderPath };
		return state;
	}

	createTablePropView() {
		if (this.tablecreated == true) return;
		this.tablecreated = true;
		console.log("createTablePropView");
		const { contentEl } = this;
		contentEl.empty();
		contentEl.classList.add("ptp-global-container");
		const title = contentEl.createEl("h1", {
			text: "Properties of " + this.folderPath,
			cls: "ptp-h1-title"
		});
	
	const buttonR = contentEl.createEl("a", {
		text: "🔄", 
		attr: { href: "#" },
		cls: "refresh-button"
	});
    buttonR.addEventListener("click", async (event) => {
        event.preventDefault();		
        await this.rebuildTheView();
    });
		
    const button = contentEl.createEl("a", {
        text: "create new file",
        cls: "create-file-button",
        attr: { href: "#" }
    });
    button.addEventListener("click", async (event) => {
        event.preventDefault();
        await this.createFileWithProperties();
    });
    contentEl.appendChild(button);
		
		
		IDColumn.counter = 0;
		this.columnsMapping = this.buildFileProperties();
		this.table = contentEl.createEl("table", { cls: "ptp-global-table" });	
		this.buildTableHeader();
		this.buildTableBody();
		this.addZoomFeature();
		contentEl.scrollTop = 0;
	}

	
	
	async onOpen() {
		console.log("onOpen");
	}

	private detectPropertyType(key: string, value: any, propertyMap: Map<string, IColumn|null>): IColumn | null {
		const isDate = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}$/.test(value);
		};
		const isDateTime = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
		};
		
		const existingV = propertyMap.get(key);
		
		const isNumeric = (val: any) => !isNaN(val);
		if (value == null || value === "") {
			if (existingV == null) return null;
		}
		if (propertyMap.get(key) instanceof ListColumn) return new ListColumn(key, this.app);

		if (Array.isArray(value)) {
			return new ListColumn(key, this.app);
		} else if (typeof value === "string") {
			if (isDateTime(value)) return new DateTimeColumn(key, this.app, "DateTime");
			if (isDate(value)) return new DateTimeColumn(key, this.app, "Date");
			return new TextColumn(key, this.app);
		} else if (typeof value === "number" || (typeof value !== "boolean" && isNumeric(value))) {
			return existingV == null ? new IntColumn(key, this.app) : existingV;
		} else if (typeof value === "boolean") {
			return existingV == null ? new BoolColumn(key, this.app) : existingV;
		}
		return new TextColumn(key, this.app);
	}

	private buildFileProperties(): IColumn[] {
		const files = this.app.vault.getMarkdownFiles().filter((file) => file.parent?.path.startsWith(this.folderPath));
		const propertyMap: Map<string, IColumn|null> = new Map();
		this.fileProperties = [];

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				const props: any = {};
				for (const key in cache.frontmatter) {
					const value = cache.frontmatter[key];
					const detectedType = this.detectPropertyType(key, value, propertyMap);
//					console.log("detectPropertyType", key, value, detectedType);
					propertyMap.set(key, detectedType);
					if (detectedType != null) detectedType.addCnt1();
					props[key] = value;
				}
				this.fileProperties.push({ file, props });
			} else {
				this.fileProperties.push({ file, props: {} });
			}
		}
		propertyMap.forEach((value : IColumn|null, key : string) => {
			if (value === null) {
				propertyMap.set(key, new TextColumn(key, this.app)); // Remplace la valeur null par la valeur par défaut
			}
		});
		console.log(propertyMap);

		let tmp = Array.from(new Set(Array.from(propertyMap.values())));
		return tmp.filter((col): col is IColumn => col !== null).sort((a, b) => b.getCnt() - a.getCnt()); // Tri en fonction de getCnt()

	}

	private buildTableHeader() {
		if (!this.table) return;
		const thead = this.table.createEl("thead", { cls: "ptp-th-container" });
		const headerRow = thead.createEl("tr");

		this.columnsMapping.unshift(new FileColumn("Fichier", this.app));
		this.columnsMapping.unshift(new DirColumn("Dossier", this.app));
		this.columnsMapping.unshift(new IDColumn("⇅", this.app));

		for (let i = 0; i < this.columnsMapping.length; i++) {
			this.columnsMapping[i].setIndex(i);
			this.columnsMapping[i].setId("c" + i);
		}

		this.columnsMapping.forEach((col) => {
			const th = headerRow.createEl("th", {
				cls: "ptp-th-container",
				attr: { columnIdx: col.getIndex() }
			});

			// Création du texte principal
			th.createEl("span", { text: col.getPropertyName() });
			if (!col.isFiltering()) return;
			// Ajout du texte entre parenthèses sur une nouvelle ligne avec une classe
			th.createEl("br"); // Saut de ligne
			const smallText = th.createEl("span", {
				text: `(${col.getStrType()})`
			});
			smallText.addClass("th-small-text"); // Classe CSS pour réduire la taille
		});

		headerRow.querySelectorAll("th").forEach((h) => {
			h.addEventListener("click", () => {
				const columnIdx = Number(h.getAttribute("columnIdx"));
				this.sortTable(columnIdx);
				this.columnsMapping[columnIdx].setSortAsc(!this.columnsMapping[columnIdx].getSortAsc());
			});
		});

		const filterRow = thead.createEl("tr");
		Object.entries(this.columnsMapping).forEach(([key, col]) => {
			const th = filterRow.createEl("th", { cls: "ptp-th-container" });
			if (!col.isFiltering()) return;

			const filterButton = th.createEl("button", {
				text: "+",
				cls: "ptp-filter-button"
			});
			filterButton.setAttribute("columnIdx", col.getIndex().toString());

			filterButton.addEventListener("click", () => {
				const columnIdx = Number(filterButton.getAttribute("columnIdx"));
				this.openFilterModal(columnIdx);
			});
		});
	}

	private getAllUniqueValuesForProperty(propName: string): any[] {
		//	console.log("dsd",propName);
		const uniqueValues = new Set<any>();
		for (const { props } of this.fileProperties) {
			const val = props[propName];
			if (val !== undefined && val !== null) {
				if (Array.isArray(val)) {
					for (const item of val) {
						if (item !== null && item !== undefined) {
							uniqueValues.add(item.replaceAll("[", "").replaceAll("]", ""));
						}
					}
				} else {
					uniqueValues.add(val);
				}
			}
		}
		let a = Array.from(uniqueValues);
		a.push(""); //add an empty one... assumption , there is always an empty one !!! Not good.
		return a;
	}

	private updateFilterButtonStyles() {
		const filterButtons = document.querySelectorAll(".ptp-filter-button");
		filterButtons.forEach((button) => {
			const col = this.columnsMapping[Number(button.getAttribute("columnIdx"))];
			if (col.getFilter().length > 0) {
				button.classList.add("ptp-filter-button-active");
			} else {
				button.classList.remove("ptp-filter-button-active");
			}
		});
	}

	private openFilterModal(columnIdx: number) {
		let col = this.columnsMapping[columnIdx];
		const allowedValues = this.getAllUniqueValuesForProperty(this.columnsMapping[columnIdx].getPropertyName());
		const modal = new FilterModal(this.app, col, allowedValues, (selectedValues: any[]) => {
			this.columnsMapping[columnIdx].setFilter(selectedValues);
			this.applyFilters(columnIdx);
			this.updateFilterButtonStyles();
		});
		modal.open();
	}

	private applyFilters(columnIdx: number): void {
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.querySelectorAll("tr"));
		let col = this.columnsMapping[columnIdx];
		col.filterRows(rows);
	}

	private buildTableBody() {
		if (!this.table) return;
		const tbody = this.table.createEl("tbody", { cls: "ptp-tbody-container" });
		//		console.log(this.fileProperties);
		for (const { file, props } of this.fileProperties) {
			const tr = tbody.createEl("tr");

			this.columnsMapping.forEach((col) => {
				let prop = col.getPropertyName();
				const value = props[prop];
				const td = tr.createEl("td", { cls: "ptp-td-container" });
				col.fillCell(td, file, prop, value);
			});
		}
	}

	sortTable(columnIdx: number) {
		//		console.log("->",columnIdx);
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.getElementsByTagName("tr"));
		let columnIndex = columnIdx;
		let col = this.columnsMapping[columnIdx];
		tbody.append(...col.sortRows(rows));
	}

	private addZoomFeature() {
		if (!this.table) return;
		this.table.style.transform = `scale(${this.scale})`;
		this.table.style.transformOrigin = "top left";

		this.table.addEventListener("wheel", (event) => {
			if (!event.ctrlKey) return;
			event.preventDefault();
			const zoomFactor = 0.1;
			if (event.deltaY < 0) {
				this.scale += zoomFactor;
			} else {
				this.scale = Math.max(0.5, this.scale - zoomFactor);
			}
			if (this.table) {
				this.table.style.transform = `scale(${this.scale})`;
				this.table.style.transformOrigin = "top left";
			}
		});
	}
	
	async  createFileWithProperties() {
    try {
        const fileName = `new_file_${Date.now()}.md`;
        const filePath = `${this.folderPath}/${fileName}`;
		
		let yamlContent ='---\n'
        for (const col of this.columnsMapping.splice(3)) {
            yamlContent += col.getPropertyName()+":\n";
        }
		yamlContent +='---\n'		
        const newFile :TFile = await this.app.vault.create(filePath, yamlContent);
        console.log(`Fichier créé : ${filePath}`);
    } catch (error) {
        console.error("Erreur lors de la création du fichier :", error);
    }
}

	getAllValuesForProperty(property: string) {
		const values: Set<any> = new Set();
		for (const { props } of this.fileProperties) {
			if (props[property] !== undefined) {
				values.add(props[property]);
			}
		}
		return Array.from(values);
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}
}
