import {
	App,
	MarkdownRenderer,
	TFile,
	parseYaml,
	stringifyYaml,
	ItemView,
	WorkspaceLeaf,
	Notice,
	ViewStateResult,
	setIcon
} from "obsidian";
import { GlobalPropertiesSettings, GlobalPropertiesSettingTab, DEFAULT_SETTINGS } from "src/Settings";

import { FilterModal } from "./filterModal";
import { FileNameModal } from "./newFileModal";
import { ColumnFilterModal } from "./ColumnFilterModal";

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
	private table!: HTMLElement;
	private propColStart = 3;
	private scale = 1;
	private columnsMapping: IColumn[] = [];
	private folderPath: string = "/";
	private tablecreated = false;
	private settings;

	constructor(leaf: WorkspaceLeaf, setting: GlobalPropertiesSettings) {
		super(leaf);
		this.settings = setting;
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

	filterColumns(): void {
		const modal = new ColumnFilterModal(
			this.app,
			this.columnsMapping.slice(3),
			(result: Map<IColumn, { newIndex: number; visible: boolean }>) => {
				const base = this.columnsMapping.slice(0, 3);
				const cT = this.columnsMapping.slice(3);

				const reordered = new Array<IColumn>(cT.length);
				result.forEach((value, key) => {
					const originalIndex = cT.findIndex((c) => c === key);
					if (originalIndex !== -1) {
						key.setV(value.visible);
						reordered[value.newIndex] = key;
					}
				});

				this.columnsMapping = [...base, ...reordered];

				let i = 0;
				IDColumn.counter = 0;
				this.columnsMapping.forEach((ci) => {
					ci.setIndex(i);
					i += 1;
				});

				this.createHTMLTablePropView();
			}
		);
		modal.open();
	}

	buildButtonHeader() {
		//global button
		const buttonListGlobal = this.contentEl.createEl("div", {
			cls: "ptp-button-list-g"
		});
		const buttonfr = buttonListGlobal.createEl("a", {
			cls: "ptp-global-button",
			attr: { href: "#" }
		});
		const icon1Container = document.createElement("div");
		setIcon(icon1Container, "refresh-cw");
		buttonfr.appendChild(icon1Container);
		buttonfr.addEventListener("click", async (event) => {
			event.preventDefault();
			await this.rebuildTheView();
		});
		/****************************************************************************/
		const buttonGlobF = buttonListGlobal.createEl("a", {
			cls: "ptp-global-button",
			attr: { href: "#" }
		});
		const icon2Container = document.createElement("div");
		setIcon(icon2Container, "filter-x");
		buttonGlobF.appendChild(icon2Container);
		buttonGlobF.addEventListener("click", async (event) => {
			event.preventDefault();
			console.log("clearAllFilter");
			this.clearAllFilters();
		});

		const buttonf = buttonListGlobal.createEl("a", {
			cls: "ptp-global-button",
			attr: { href: "#" }
		});
		const icon3Container = document.createElement("div");
		setIcon(icon3Container, "file-plus-2");
		buttonf.appendChild(icon3Container);
		buttonf.addEventListener("click", async (event) => {
			event.preventDefault();
			await this.addANewFile();
		});

		const buttone = buttonListGlobal.createEl("a", {
			cls: "ptp-global-button",
			attr: { href: "#" }
		});

		const icon4Container = document.createElement("div");
		setIcon(icon4Container, "eye");
		buttone.appendChild(icon4Container);
		buttone.addEventListener("click", async (event) => {
			this.filterColumns();
		});
	}

	applyVisibility() {
		const headCell = this.table!.querySelectorAll(".ptp-th-container");
		headCell.forEach((c) => {
			let cI = Number(c.getAttribute("columnIdx"));
			if (this.columnsMapping[cI].getV()) (c as HTMLElement).style.display = "";
			else (c as HTMLElement).style.display = "none";
		});

		this.columnsMapping.forEach((col) => {
			col.applyV(this.getRows());
		});
	}

	createHTMLTablePropView() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.classList.add("ptp-global-container");
		const title = contentEl.createEl("h1", {
			text: "Properties of " + this.folderPath,
			cls: "ptp-h1-title"
		});
		this.buildButtonHeader();
		this.table?.empty();
		this.table = contentEl.createEl("table", { cls: "ptp-global-table" });
		this.buildTableHeader();
		this.buildTableBody();
		this.applyVisibility();
		this.addZoomFeature();
		contentEl.scrollTop = 0;
	}

	createColumnsMappingArray() {
		//immonde, probalement qu'on peut faire autrement, plus facilement sans tout recreer.
		let oldOrder: string[] = [];
		let viewedColumns: Record<string, boolean> = {};

		if (this.columnsMapping) {
			oldOrder = this.columnsMapping.map((c) => c.getPropertyName());
			viewedColumns = Object.fromEntries(this.columnsMapping.map((c) => [c.getPropertyName(), c.getV()]));
		}

		// Reconstruit les colonnes
		this.columnsMapping = this.buildFileProperties();

		// Ajoute les colonnes fixes au début
		this.columnsMapping.unshift(new FileColumn("Fichier", this.app));
		this.columnsMapping.unshift(new DirColumn("Dossier", this.app));
		this.columnsMapping.unshift(new IDColumn("⇅", this.app));

		if (oldOrder.length > 0) {
			// Réordonne les colonnes selon l'ancien ordre
			this.columnsMapping.sort((a, b) => {
				const aIndex = oldOrder.indexOf(a.getPropertyName());
				const bIndex = oldOrder.indexOf(b.getPropertyName());

				// Les colonnes non trouvées dans l'ancien ordre vont à la fin
				if (aIndex === -1 && bIndex === -1) return 0;
				if (aIndex === -1) return 1;
				if (bIndex === -1) return -1;
				return aIndex - bIndex;
			});

			// Restaure la visibilité
			this.columnsMapping.forEach((c) => {
				const name = c.getPropertyName();
				if (viewedColumns.hasOwnProperty(name)) {
					c.setV(viewedColumns[name]);
				}
			});
		}
	}

	createTablePropView() {
		if (this.tablecreated == true) return;
		this.tablecreated = true;
		IDColumn.counter = 0;
		this.createColumnsMappingArray();
		this.createHTMLTablePropView();
	}

	async onOpen() {
		console.log("onOpen");
	}

	private detectPropertyType(key: string, value: any, pMap: Map<string, IColumn | null>): IColumn | null {
		const isDate = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}$/.test(value);
		};
		const isDateTime = (value: string): boolean => {
			return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value);
		};

		const existingV = pMap.get(key);

		const isNumeric = (val: any) => !isNaN(val);
		if (value == null || value === "") {
			if (existingV == null) return null;
		}

		if (existingV instanceof ListColumn || Array.isArray(value)) {
			return new ListColumn(key, this.app);
		}

		if (typeof value === "string") {
			if (existingV instanceof TextColumn || existingV instanceof BoolColumn || existingV instanceof IntColumn)
				return new TextColumn(key, this.app);
			if (isDateTime(value)) return new DateTimeColumn(key, this.app, "datetime-local");
			if (isDate(value)) {
				if (existingV != null && (existingV as DateTimeColumn).getDType() == "datetime-local") return existingV;
				else return new DateTimeColumn(key, this.app, "date");
			}
			return new TextColumn(key, this.app);
		}
		if (typeof value === "number" || (typeof value !== "boolean" && isNumeric(value))) {
			return existingV == null ? new IntColumn(key, this.app) : existingV;
		}
		if (typeof value === "boolean") {
			if (existingV instanceof IntColumn || existingV instanceof DateTimeColumn)
				return new TextColumn(key, this.app);
			return existingV == null ? new BoolColumn(key, this.app) : existingV;
		}

		return new TextColumn(key, this.app);
	}

	private buildFileProperties(): IColumn[] {
		const files = this.app.vault.getMarkdownFiles().filter((file) => {
			if (this.folderPath === "/") {
				return true;
			}
			return file.parent?.path === this.folderPath || file.parent?.path.startsWith(this.folderPath + "/");
		});
		const propertyMap: Map<string, IColumn | null> = new Map();
		this.fileProperties = [];

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				const props: any = {};
				for (const key in cache.frontmatter) {
					const value = cache.frontmatter[key];
					const detectedType = this.detectPropertyType(key, value, propertyMap);
					propertyMap.set(key, detectedType);
					if (detectedType != null) detectedType.addCnt1();
					props[key] = value;
				}
				this.fileProperties.push({ file, props });
			} else {
				this.fileProperties.push({ file, props: {} });
			}
		}
		propertyMap.forEach((value: IColumn | null, key: string) => {
			if (value === null) {
				propertyMap.set(key, new TextColumn(key, this.app)); // Remplace la valeur null par la valeur par défaut
			}
		});
		let tmp = Array.from(new Set(Array.from(propertyMap.values())));
		return tmp.filter((col): col is IColumn => col !== null).sort((a, b) => b.getCnt() - a.getCnt()); // Tri en fonction de getCnt()
	}

	private buildTableHeader() {
		if (!this.table) return;
		const thead = this.table.createEl("thead", { cls: "ptp-th-container" });
		const headerRow = thead.createEl("tr");

		for (let i = 0; i < this.columnsMapping.length; i++) {
			this.columnsMapping[i].setIndex(i);
			this.columnsMapping[i].setId("c" + i);
		}

		this.columnsMapping.forEach((col) => {
			const th = headerRow.createEl("th", {
				cls: "ptp-th-container",
				attr: { columnIdx: col.getIndex() }
			});
			const container = th.createEl("div", { cls: "ptp-th-content" });
			const textSpan = container.createEl("span", { text: col.getPropertyName(), cls: "ptp-th-text" });
			const actionButton = container.createEl("button", { cls: "ptp-th-action" });
			actionButton.textContent = "⋮"; // Trois points verticaux, style Excel
			actionButton.addEventListener("click", (event) => {
				event.stopPropagation(); // Évite de déclencher d'autres événements
				this.showContextMenu(event, col);
			});
			th.appendChild(container);
		});
	}
	/**************************************************/
	private showContextMenu(event: MouseEvent, col: IColumn) {
		document.querySelector(".ptp-context-menu")?.remove();

		const menu = document.createElement("div");
		menu.classList.add("ptp-context-menu");

		// Création du type de colonne en haut du menu
		const typeOption = document.createElement("div");
		typeOption.textContent = "col type : " + col.getStrType();
		menu.appendChild(typeOption);

		const createMenuOption = (icon: string | null, onClick: () => void) => {
			const option = document.createElement("div");
			option.classList.add("ptp-menu-option-button");

			if (icon) {
				const iconContainer = document.createElement("div");
				setIcon(iconContainer, icon);
				option.appendChild(iconContainer);
			}

			option.addEventListener("click", () => {
				onClick();
				menu.remove();
			});
			return option;
		};

		const buttonlist = document.createElement("div");
		typeOption.classList.add("ptp-menu-option-button-div");

		buttonlist.appendChild(createMenuOption("arrow-down-narrow-wide", () => this.sortTable(col, true)));
		buttonlist.appendChild(createMenuOption("arrow-up-narrow-wide", () => this.sortTable(col, false)));
		if (!(col instanceof IDColumn)) {
			buttonlist.appendChild(createMenuOption("filter", () => this.openFilterModal(col)));
			buttonlist.appendChild(
				createMenuOption("filter-x", () => {
					col.setFilter([]);
					this.reapplyAllFilters();
				})
			);
		}
		menu.appendChild(buttonlist);
		document.body.appendChild(menu);
		menu.style.top = `${event.clientY}px`;
		menu.style.left = `${event.clientX}px`;

		// Fermer le menu en cliquant ailleurs
		setTimeout(() => {
			document.addEventListener("click", () => menu.remove(), { once: true });
		}, 10);
	}

	private updateFilterButtonStyles() {
		const filterHeader = document.querySelectorAll(".ptp-th-container");
		filterHeader.forEach((cell) => {
			const col = this.columnsMapping[Number(cell.getAttribute("columnIdx"))];
			if (col.getFilter().length > 0) {
				cell.classList.add("ptp-filter-button-active");
			} else {
				cell.classList.remove("ptp-filter-button-active");
			}
		});
	}

	private openFilterModal(col: IColumn) {
		let allowedValues = col.getUniqDisplayValuesFiltered(this.getRows());

		const modal = new FilterModal(this.app, col, allowedValues, (selectedValues: any[]) => {
			col.setFilter(selectedValues);
			this.reapplyAllFilters();
			this.updateFilterButtonStyles();
		});
		modal.open();
	}
	private reapplyAllFilters() {
		let allRows = this.getRows();
		allRows.forEach((r) => (r.style.display = ""));
		this.columnsMapping.forEach((col) => {
			col.filterRows(allRows);
			allRows = this.getRows().filter((r) => r.style.display == "");
			this.updateFilterButtonStyles();
		});
	}

	private clearAllFilters() {
		this.columnsMapping.forEach((col) => {
			col.setFilter([]);
			col.filterRows(this.getRows());
			this.updateFilterButtonStyles();
		});
	}

	private getRows(): HTMLElement[] {
		const tbody = this.table!.querySelector("tbody");
		const rows = Array.from(tbody!.querySelectorAll("tr"));
		return rows;
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

	sortTable(col: IColumn, asc: boolean) {
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.getElementsByTagName("tr"));
		tbody.append(...col.sortRows(rows, asc));
	}

	private addZoomFeature() {
		const container = this.table.parentElement;
		if (!container) return;
		container.style.overflow = "auto";
		container.style.overflowX = "auto"; // Assurer que le scroll horizontal est activé
		container.style.whiteSpace = "nowrap"; // Empêcher le retour à la ligne
		container.style.maxWidth = "100%"; // Éviter que le conteneur soit plus petit que la table

		// Appliquer le zoom
		this.table.style.transform = `scale(${this.scale})`;
		this.table.style.transformOrigin = "top left";

		this.table.addEventListener("wheel", (event) => {
			if (event.shiftKey) {
				// Empêcher le comportement par défaut et activer le scroll horizontal
				event.preventDefault();
				container.scrollLeft += event.deltaY; // Défilement horizontal avec la molette
			} else if (event.ctrlKey) {
				// Gestion du zoom
				event.preventDefault();
				const zoomFactor = 0.1;
				if (event.deltaY < 0) {
					this.scale += zoomFactor;
				} else {
					this.scale = Math.max(0.5, this.scale - zoomFactor);
				}
				this.table.style.transform = `scale(${this.scale})`;
				this.table.style.transformOrigin = "top left";
			}
		});
	}

	addANewFile() {
		new FileNameModal(
			this.app,
			this.columnsMapping.slice(3),
			async (newFileName: string, selectedOptions: IColumn[]) => {
				const fileName = newFileName.endsWith(".md") ? newFileName : `${newFileName}.md`;
				const filePath = `${this.folderPath}/${fileName}`;
				const props = selectedOptions;
				if (this.app.vault.getAbstractFileByPath(filePath)) {
					new Notice("Un fichier avec ce nom existe déjà !");
					return;
				}
				try {
					let yamlContent = "";
					if (props.length > 0) {
						yamlContent = "---\n";
						for (const pp of props) {
							yamlContent += pp.getPropertyName() + ":\n";
						}
						yamlContent += "---\n";
					}
					const newFile: TFile = await this.app.vault.create(filePath, yamlContent);

					new Notice(`Fichier "${filePath}" créé avec succès !`);
				} catch (error) {
					new Notice("Erreur lors de la création du fichier.");
					console.error(error);
				}
			}
		).open();
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
