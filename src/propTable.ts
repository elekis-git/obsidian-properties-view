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
	private folderPath:string = "/"
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	public refreshView() {
		console.log("refresh");
	}

	getViewType() {
		return GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW;
	}

	getDisplayText() {
		return "global properties view";
	}


	private detectPropertyType(key: string, value: any, propertyMap: Map<string, IColumn>): IColumn {
		const isDate = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}$/.test(value);
		};
		const isDateTime = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
		};

		const isNumeric = (val: any) => !isNaN(val);
		if (value == null || value === "") {
			if (propertyMap.get(key) == null) return new TextColumn(key, this.app);
		}
		if (propertyMap.get(key) instanceof ListColumn) return new ListColumn(key, this.app);
		if (propertyMap.get(key) instanceof DateTimeColumn) return new DateTimeColumn(key, this.app, "DateTime");

		if (Array.isArray(value)) {
			return new ListColumn(key, this.app);
		} else if (typeof value === "string") {
			if (isDateTime(value)) return new DateTimeColumn(key, this.app, "DateTime");
			if (isDate(value)) return new DateTimeColumn(key, this.app, "Date");
			return new TextColumn(key, this.app);
		} else if (typeof value === "number" || (typeof value !== "boolean" && isNumeric(value))) {
			return propertyMap.get(key) || new IntColumn(key, this.app);
		} else if (typeof value === "boolean") {
			return new BoolColumn(key, this.app);
		}
		return new TextColumn(key, this.app);
	}

	
    async setState(state: any, result: ViewStateResult): Promise<void> {
        console.log("setState() appelé avec:", state);
        if (state.folderPath) {
            this.folderPath = state.folderPath;
        }
        await super.setState(state, result);
    }

    getState(): any {
        const state = { folderPath: this.folderPath };
        console.log("getState() retourne:", state);
        return state;
    }
	
	createTablePropView(){
		const { contentEl } = this;
		contentEl.empty();
		contentEl.classList.add("modal-j-content");		
		const title = contentEl.createEl("h1", {
			text: "Tableau des propriétés des fichiers"
		});
		title.classList.add("modal-j-title");
		IDColumn.counter =0;
		this.columnsMapping = this.buildFileProperties();
		this.table = contentEl.createEl("table", { cls: "properties-j-table" });		
		this.buildTableHeader();
		this.buildTableBody();
		this.addZoomFeature();
		contentEl.scrollTop = 0;	
	}
	
	async onOpen() {
		console.log("onOpen");
	}

	private buildFileProperties(): IColumn[] {
		const files = this.app.vault.getMarkdownFiles()
				.filter(file => file.parent?.path.startsWith(this.folderPath));
		const propertyMap: Map<string, IColumn> = new Map();
		this.fileProperties = [];

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				const props: any = {};
				for (const key in cache.frontmatter) {
					const value = cache.frontmatter[key];
					const detectedType = this.detectPropertyType(key, value, propertyMap);

					if (!propertyMap.has(key)) propertyMap.set(key, detectedType);
					else {
						propertyMap.get(key)?.addCnt1();
					}
					props[key] = value;
				}
				this.fileProperties.push({ file, props });
			} else {
				this.fileProperties.push({ file, props: {} });
			}
		}
		let tmp = Array.from(new Set(Array.from(propertyMap.values())));
		if (true) {
			// if ordre alphabetique
			return tmp.sort((a, b) => {
				return b.getCnt() - a.getCnt();
			});
		} else
			return tmp.sort((a, b) => {
				return a.getPropertyName().localeCompare(b.getPropertyName());
			});
	}

	private buildTableHeader() {
		if (!this.table) return;
		const thead = this.table.createEl("thead", { cls: "th-j-container" });
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
				cls: "th-j-container",
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
			const th = filterRow.createEl("th", { cls: "th-j-container" });
			if (!col.isFiltering()) return;

			const filterButton = th.createEl("button", {
				text: "+",
				cls: "properties-filter-elekis-divprop-button"
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
		return Array.from(uniqueValues);
	}

	private updateFilterButtonStyles() {
		const filterButtons = document.querySelectorAll(".properties-filter-elekis-divprop-button");
		filterButtons.forEach((button) => {
			const col = this.columnsMapping[Number(button.getAttribute("columnIdx"))];
			if (col.getFilter().length > 0) {
				button.classList.add("filter-active");
			} else {
				button.classList.remove("filter-active");
			}
		});
	}

	private openFilterModal(columnIdx: number) {
		let col = this.columnsMapping[columnIdx];
		const allowedValues = this.getAllUniqueValuesForProperty(this.columnsMapping[columnIdx].getPropertyName());
		const modal = new FilterModal(
			this.app,
			col,
			allowedValues,
			(selectedValues: any[]) => {
				this.columnsMapping[columnIdx].setFilter(selectedValues);
				this.applyFilters(columnIdx);
				this.updateFilterButtonStyles();
			}
		);
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
		const tbody = this.table.createEl("tbody");
		//		console.log(this.fileProperties);
		for (const { file, props } of this.fileProperties) {
			const tr = tbody.createEl("tr");

			this.columnsMapping.forEach((col) => {
				let prop = col.getPropertyName();
				const value = props[prop];
				const td = tr.createEl("td", { cls: "td-j-container" });
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
		this.table.style.transformOrigin = "top center";

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
				this.table.style.transformOrigin = "top center";
			}
		});
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
