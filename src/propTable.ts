import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";
import { FilterModal } from "src/filterModal";
import { Column, FileColumn,
		DirColumn , ListColumn,
		TextColumn, BoolColumn, 
		DateTimeColumn, DateColumn,
		IDColumn,IntColumn} from "src/ColumnData";

/*
 * [ ]  refactoriser mettre une calsse par type
 * [ ]  creer des tests. 
 * [ ]  filtrer sur les fichiers
 * [ ]  accerlerer le rendu 
 * [ ]  sauver le tout dans un fichier. 
 * */


export class GlobalPropertiesView extends ItemView {
	fileProperties: any[] = [];
	properties: { name: string; type }[] = [];
	public static GLOBAL_PROPERTIES_VIEW = "glbVeID"; 
	private table: HTMLElement | null = null;
	private propColStart = 3;
	private scale = 1;
	private columnsMapping = []
	
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.valueManager = new Column(this.app.vault);
	}

	public refreshView() {
		this.onOpen();
	}

	getViewType() {
		return GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW;
	}

	getDisplayText() {
		return "global properties view";
	}

	
	private detectPropertyType(key: string, value: any, propertyMap: Map<string, string>): string {
		
	 const isDate = (value: string): boolean => {	return /^\d{4}-\d{2}-\d{2}$/.test(value);	} 
	 const isDateTime = (value: string): boolean => {		return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);	}
		
		const isNumeric = (val: any) => !isNaN(val);
		if (value == null || value === "") {
			if (propertyMap.get(key) == null) return new TextColumn(key, this.app.vault);
		}
		if (propertyMap.get(key) instanceof ListColumn) return new ListColumn(key, this.app.vault);
		if (propertyMap.get(key) instanceof DateTimeColumn) return new DateTimeColumn(key, this.app.vault);

		if (Array.isArray(value)) {
			return new  ListColumn(key, this.app.vault);
		} else if (typeof value === "string") {
			if (isDateTime(value)) return new DateTimeColumn(key, this.app.vault);
			if (isDate(value)) return new DateColumn(key, this.app.vault);
			return new  TextColumn(key, this.app.vault);
		} else if (typeof value === "number" || (typeof value !== "boolean" && isNumeric(value))) {
			return propertyMap.get(key) || new  IntColumn(key, this.app.vault);
		} else if (typeof value === "boolean") {
			return new  BoolColumn(key, this.app.vault);
		}
		return new TextColumn(key, this.app.vault);
	}
	
	
	addList(cell: HTMLElement, filepath: string, prop: string, currentValue: string[]) {
		cell.empty();
		cell.setAttribute("filepath", filepath);
		cell.setAttribute("prop", prop);

		let cv = Array.isArray(currentValue) ? currentValue : [currentValue];

		const list = cell.createEl("ul", { cls: "properties-list-elekis" });

		cv.forEach((v) => {
			if (v == null) return;
			const listItem = list.createEl("li", { cls: "properties-list-item" });

			if (/^\[\[.*\]\]$/.test(v)) {
				const fileName = v.replace(/^\[\[|\]\]$/g, ""); // Nettoyer [[ ]]
				let tfile = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
				if (tfile == null) {
					this.createHref(listItem, fileName);
				} else {
					this.createHref(listItem, tfile);
				}
			} else {
				listItem.createEl("span", { text: v });
			}

			const delbutton = listItem.createEl("button", {
				text: "-",
				cls: "properties-del-elekis-divprop-button",
				attr: { filepath: filepath, prop: prop, value: v }
			});

			delbutton.addEventListener("click", async (event) => {
				event.preventDefault();
				event.stopPropagation();
				const filep = delbutton.getAttribute("filepath")!;
				const propAttr = delbutton.getAttribute("prop")!;
				const valueAttr = delbutton.getAttribute("value")!;
				await this.valueManager.updateYamlProperty(filep, propAttr, valueAttr, "delete");
				listItem.remove();
			});
		});

		cell.appendChild(list);

		cell.addEventListener("click", () => {
			if (cell.querySelector("textarea")) return;
			let markdownText = cv.join("\n");
			cell.empty();
			const textarea = cell.createEl("textarea", {
				cls: "properties-markdown-textarea",
				text: markdownText
			});
			textarea.focus();
			textarea.addEventListener("blur", async () => {
				const newValue = textarea.value
					.trim()
					.split("\n")
					.filter((v) => v !== "");
				cell.empty();
				await this.valueManager.updateYamlProperty(filepath, prop, newValue, "update");
				this.addList(cell, filepath, prop, newValue);
			});
		});
	}

	

	addBoolean(cell: HTMLElement, filepath: string, prop: string, currentValue: boolean | null) {
		//console.log("addBooleanButton", filepath, prop, currentValue);
		cell.empty();

		const createCheckbox = (value: boolean | null) => {
			cell.empty();
			const checkbox = cell.createEl("input", { type: "checkbox" });
			// Maintenant vous pouvez définir la propriété `checked` séparément
			checkbox.checked = value ?? false;
			checkbox.setAttribute("filepath", filepath);
			checkbox.setAttribute("prop", prop);

			checkbox.addEventListener("change", async () => {
				const newValue = checkbox.checked; // true ou false selon l'état du checkbox
				const filep = checkbox.getAttribute("filepath")!;
				const propp = checkbox.getAttribute("prop")!;
				await this.valueManager.updateYamlProperty(filep, propp, newValue, "update");
			});

			checkbox.addEventListener("blur", () => {
				// Aucune action spécifique au blur, mais c'est là au cas où
			});

			checkbox.focus();
		};

		if (currentValue == null) {
			// Si la valeur actuelle est null ou undefined, on attend un clic pour créer le checkbox
			cell.empty();
			cell.addEventListener("click", () => createCheckbox(null), { once: true });
		} else {
			createCheckbox(currentValue); // Crée la checkbox avec la valeur actuelle
		}
	}

	addText(cell: HTMLElement, path: string, prop: string, v2: string) {
		let value = v2 != null ? String(v2) : "";
		const displayDiv = cell.createEl("div", { cls: "markdown-preview" });

		const renderMarkdown = () => {
			displayDiv.empty();
			// Utilisation de "this" (la vue qui est un Component) au lieu de this.app
			MarkdownRenderer.renderMarkdown(value, displayDiv, path, this);
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
		input.value = value;
		input.style.display = "none";

		cell.addEventListener("click", () => {
			displayDiv.style.display = "none";
			input.style.display = "block";
			input.focus();
		});

		input.addEventListener("blur", async () => {
			value = input.value;
			displayDiv.style.display = "block";
			input.style.display = "none";
			await this.valueManager.updateYamlProperty(path, prop, value, "update");
			renderMarkdown();
		});

		cell.appendChild(input);
	}

	addIntInput(cell: HTMLElement, filepath: string, prop: string, currentValue: string) {
		//console.log("addIntButton", filepath, prop, currentValue);
		cell.empty();
		const createInput = (value: string | null) => {
			cell.empty();
			const input = cell.createEl("input", {
				type: "number",
				value: value ?? ""
			});
			input.setAttribute("filepath", filepath);
			input.setAttribute("prop", prop);
			input.step = "1";

			input.addEventListener("change", async () => {
				const newValue = input.value.trim();
				const filep = input.getAttribute("filepath")!;
				const propp = input.getAttribute("prop")!;
				if (newValue === "") {
					cell.empty();
					await this.valueManager.updateYamlProperty(filep, propp, "", "delete");
				} else {
					await this.valueManager.updateYamlProperty(filep, propp, Number(newValue), "update");
				}
			});

			input.addEventListener("blur", () => {
				if (input.value.trim() === "") {
					cell.empty();
				}
			});

			input.focus();
		};

		if (currentValue == null || currentValue === "") {
			cell.empty();
			cell.addEventListener("click", () => createInput(null), { once: true });
		} else {
			createInput(currentValue);
		}
	}

	addID(cell: HTMLElement, filepath: string, prop: string, value:string) {
	//	console.log(prop, value)
		cell.empty();
		const input = cell.createEl("div", { text:value });
	}
	
	addDateButton(cell: HTMLElement, filepath: string, prop: string, value: string, col) {
		cell.empty();
		const input = cell.createEl("input", { cls: "properties-add-elekis-date-button" });
		input.setAttribute("filepath", filepath);
		input.setAttribute("prop", prop);
		input.type = col instanceof DateTimeColumn ? "datetime-local" : "date";
		if (value != null && value !== "") {
			let dd = new Date(value);
			// Assurer qu'on travaille avec un objet Date
			const dateValue = dd instanceof Date ? dd : new Date(dd);
			if (col  instanceof DateTimeColumn) input.value = dateValue.toISOString().split(".")[0];
			else input.value = dateValue.toISOString().split("T")[0] + "T00:00";
		} else {
			input.classList.add("my-gray-input");
		}

		input.addEventListener("change", async () => {
			const filep = input.getAttribute("filepath")!;
			const propp = input.getAttribute("prop")!;
			const rawVal = input.value;
			const dateValue = new Date(rawVal);
			let v2 = "";
			if (rawVal !== "") {
				v2 =
					input.type === "datetime-local"
						? dateValue.toISOString().split(".")[0]
						: dateValue.toISOString().split("T")[0];
				input.classList.remove("my-gray-input");
			} else {
				input.classList.add("my-gray-input");
			}
			await this.valueManager.updateYamlProperty(filep, propp, v2, "update");
		});
		input.focus();
	}

	async onOpen() {
		console.log("onOpen");
		const { contentEl } = this;
		contentEl.empty();
		contentEl.classList.add("modal-j-content");
		const title = contentEl.createEl("h1", {
			text: "Tableau des propriétés des fichiers"
		});
		title.classList.add("modal-j-title");
		this.columnsMapping = this.buildFileProperties();
		console.log(this.columnsMapping);
		this.table = contentEl.createEl("table", { cls: "properties-j-table" });
		this.buildTableHeader();
		this.buildTableBody();
		this.addZoomFeature();
		console.log("fin onOpen");
		this.contentEl.scrollTop = 0;
	}

	private buildFileProperties() {
		const files = this.app.vault.getMarkdownFiles();
		const propertyMap: Map<string, string> = new Map();
		this.fileProperties = [];

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				const props: any = {};
				for (const key in cache.frontmatter) {
					const value = cache.frontmatter[key];
					const detectedType = this.detectPropertyType(key, value, propertyMap);
					propertyMap.set(key, detectedType);
					props[key] = value;
				}
				this.fileProperties.push({ file, props });
			} else { 
				this.fileProperties.push({ file, props: {} });
			}
		}
		return Array.from(propertyMap.entries().map(([name, typeInstance]) => typeInstance ));

	

	}

	private buildTableHeader() {
		if (!this.table) return;
		const thead = this.table.createEl("thead", { cls: "th-j-container" });
		const headerRow = thead.createEl("tr");
			
		this.columnsMapping.unshift(new FileColumn("Fichier",this.app.vault));		
		this.columnsMapping.unshift(new DirColumn("Dossier",this.app.vault));		
		this.columnsMapping.unshift(new IDColumn("⇅",this.app.vault));
		
		for (let i = 0; i < this.columnsMapping.length; i++) {
			this.columnsMapping[i].setIndex(i);
			this.columnsMapping[i].setId("c"+i);			
		}

		this.columnsMapping.forEach(col => {
			headerRow.createEl("th", 
							   {text: col.getPropertyName()+"("+col.getStrType()+")",
								cls: "th-j-container",
							   attr:{columnIdx: col.getIndex()}
							   });
		});
		
		headerRow.querySelectorAll("th").forEach((h) => {
			h.addEventListener("click", () => {
				const columnIdx = h.getAttribute("columnIdx");
				this.sortTable(columnIdx);
				this.columnsMapping[columnIdx].setSortAsc(!this.columnsMapping[columnIdx].getSortAsc());
			});
		});
		
		const filterRow = thead.createEl("tr");
		Object.entries(this.columnsMapping).forEach(([key, col]) => {
			if (col.getPropertyName()==null) return; 
			const th = filterRow.createEl("th", { cls: "th-j-container" });
			if (!col.isFiltering())return; 
			
			const filterButton = th.createEl("button", {
				text: "+",
				cls: "properties-filter-elekis-divprop-button"
			}); 
			filterButton.setAttribute("columnIdx", col.getIndex() )
			
			filterButton.addEventListener("click", () => {
				const columnIdx = filterButton.getAttribute("columnIdx");
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
			const col = this.columnsMapping[button.getAttribute("columnIdx")];
			if (col.getFilter().length > 0) {
				button.classList.add("filter-active");
			} else {
				button.classList.remove("filter-active");
			}
		});
	}

	private openFilterModal(columnIdx) {
	//	console.log(columnIdx, this.columnsMapping[columnIdx].getPropertyName());
		const allowedValues = this.getAllUniqueValuesForProperty(this.columnsMapping[columnIdx].getPropertyName());
		const modal = new FilterModal(this.app, this.columnsMapping[columnIdx], allowedValues, (selectedValues: any[]) => {
 		console.log("FilterModal");
			this.columnsMapping[columnIdx].setFilter(selectedValues);
			this.applyFilters(columnIdx);
			this.updateFilterButtonStyles();
		});
		modal.open();
	}

	private applyFilters(columnIdx): void {
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.querySelectorAll("tr"));
		let col =  this.columnsMapping[columnIdx];
		col.filterRows(rows);		
	}

	private createHref(elem: HTMLElement, fname: TFile | string) {
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

	
	private buildTableBody() {
		if (!this.table) return;
		const tbody = this.table.createEl("tbody");
		let i = 1;
		for (const { file, props } of this.fileProperties) {
			const tr = tbody.createEl("tr");
		
			this.columnsMapping.forEach(col => {
				let prop = col.getPropertyName();
				const td = tr.createEl("td", { cls: "td-j-container" });				
				const value = props[prop];
				if(col instanceof IDColumn){
					this.addID(td, file.path,"id",i);
				}else if(col instanceof FileColumn){
					this.createHref(td, file);
				}else if(col instanceof DirColumn){
					this.addText(td, file.path, prop, "/" + file.path.substring(0, file.path.lastIndexOf("/"))  );
				}
				else if (col instanceof DateTimeColumn) {
					this.addDateButton(td, file.path, prop, value, col);
				} else if (col instanceof DateColumn) {
					this.addDateButton(td, file.path, prop, value, col);
				} else if (col instanceof IntColumn) {
					this.addIntInput(td, file.path, prop, value);
				} else if (col instanceof ListColumn) {
					this.addList(td, file.path, prop, value);
				} else if (col instanceof TextColumn) {
					this.addText(td, file.path, prop, value);
				} else if (col instanceof BoolColumn) {					
					this.addBoolean(td, file.path, prop, value);
				}
			});
			i++;
		}
	}

	sortTable(columnIdx) {
		console.log("->",columnIdx);
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.getElementsByTagName("tr"));
		let columnIndex = columnIdx
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
