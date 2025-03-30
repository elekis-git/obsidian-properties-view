import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";
import { FilterModal } from "src/FilterModal";

export class GlobalPropertiesView extends ItemView {
	fileProperties: any[] = [];
	properties: { name: string; type: string; filter: string[] }[] = [];
	public static GLOBAL_PROPERTIES_VIEW = "glbVeID"; 
	private table: HTMLElement | null = null;
	private propColStart = 3;
	private scale = 1;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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

	isDate(value: string): boolean {
		return /^\d{4}-\d{2}-\d{2}$/.test(value);
	}

	isDateTime(value: string): boolean {
		return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
	}

	/*************************************/
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
				await this.updateYamlProperty(filep, propAttr, valueAttr, "delete");
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
				await this.updateYamlProperty(filepath, prop, newValue, "update");
				this.addList(cell, filepath, prop, newValue);
			});
		});
	}

	async updateYamlProperty(filePath: string, prop: string, value: any, actiontype: string) {
		//console.log("updateYAMLPROPERTY", filePath, prop, value, actiontype);
		const fileOrAbstract = this.app.vault.getAbstractFileByPath(filePath);
		// Vérifier que c'est bien un fichier
		if (!(fileOrAbstract instanceof TFile)) return;

		let fileContent = await this.app.vault.read(fileOrAbstract);
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
		fileContent = match
			? fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`)
			: `---\n${newYaml}---\n${fileContent}`;

		//console.log("Updated YAML:", newYaml);
		await this.app.vault.modify(fileOrAbstract, fileContent);
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
				await this.updateYamlProperty(filep, propp, newValue, "update");
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
			await this.updateYamlProperty(path, prop, value, "update");
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
					await this.updateYamlProperty(filep, propp, "", "delete");
				} else {
					await this.updateYamlProperty(filep, propp, Number(newValue), "update");
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

	addDateButton(cell: HTMLElement, filepath: string, prop: string, value: string, type: string) {
		cell.empty();
		const input = cell.createEl("input", { cls: "properties-add-elekis-date-button" });
		input.setAttribute("filepath", filepath);
		input.setAttribute("prop", prop);
		input.type = type === "DateTime" ? "datetime-local" : "date";
		if (value != null && value !== "") {
			let dd = new Date(value);
			// Assurer qu'on travaille avec un objet Date
			const dateValue = dd instanceof Date ? dd : new Date(dd);
			if (type === "DateTime") input.value = dateValue.toISOString().split(".")[0];
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
			await this.updateYamlProperty(filep, propp, v2, "update");
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
		this.buildFileProperties();
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
					props["filter"] = [];
				}
				this.fileProperties.push({ file, props });
			} else {
				this.fileProperties.push({ file, props: {} });
			}
		}
		this.properties = Array.from(propertyMap.entries()).map(([name, type]) => ({
			name,
			type: type || "Text",
			filter: []
		}));
		this.properties = this.properties.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
	}

	private detectPropertyType(key: string, value: any, propertyMap: Map<string, string>): string {
		const isNumeric = (val: any) => !isNaN(val);
		if (value == null || value === "") {
			if (propertyMap.get(key) == null) return "Text";
		}
		if (propertyMap.get(key) === "List") return "List";
		if (propertyMap.get(key) === "DateTime") return "DateTime";

		if (Array.isArray(value)) {
			return "List";
		} else if (typeof value === "string") {
			if (this.isDateTime(value)) return "DateTime";
			if (this.isDate(value)) return "Date";
			return "Text";
		} else if (typeof value === "number" || (typeof value !== "boolean" && isNumeric(value))) {
			return propertyMap.get(key) || "Int";
		} else if (typeof value === "boolean") {
			return "Boolean";
		}
		return "Text";
	}

	private buildTableHeader() {
		if (!this.table) return;
		const thead = this.table.createEl("thead", { cls: "th-j-container" });
		const headerRow = thead.createEl("tr");

		headerRow.createEl("th", {
			text: "⇅",
			cls: "th-j-container",
			attr: { columnId: "0", sortasc: "false", type: "Id" }
		});

		headerRow.createEl("th", {
			text: "Dossier",
			cls: "th-j-container",
			attr: { columnId: "0", sortasc: "false", type: "Id" }
		});

		headerRow.createEl("th", {
			text: "Fichier",
			cls: "th-j-container",
			attr: { columnId: "1", sortasc: "false", type: "Text" }
		});

		for (let i = 0; i < this.properties.length; i++) {
			const prop = this.properties[i];
			headerRow.createEl("th", {
				text: `${prop.name} (${prop.type})`,
				cls: "th-j-container",
				attr: { columnId: (i + this.propColStart).toString(), sortasc: "false", type: prop.type }
			});
		}

		headerRow.querySelectorAll("th").forEach((h) => {
			h.addEventListener("click", () => {
				const columnId = h.getAttribute("columnId")!;
				const columnsort = h.getAttribute("sortasc") === "true";
				this.sortTable(columnId, columnsort, h.getAttribute("type") || "");
				h.setAttribute("sortasc", (!columnsort).toString());
			});
		});

		const filterRow = thead.createEl("tr");
		for (let i = 0; i < this.propColStart; i++) filterRow.createEl("th", { cls: "th-j-container" });

		for (const prop of this.properties) {
			const th = filterRow.createEl("th", { cls: "th-j-container" });
			const filterButton = th.createEl("button", {
				text: "+",
				cls: "properties-filter-elekis-divprop-button"
			});
			filterButton.setAttribute("data-prop", prop.name);
			filterButton.addEventListener("click", () => {
				this.openFilterModal(prop);
			});
		}
	}

	private getAllUniqueValuesForProperty(propName: string): any[] {
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
			const propName = button.getAttribute("data-prop");
			if (!propName) return;
			const prop = this.properties.find((p: { name: string }) => p.name === propName);
			if (!prop) return;
			if (prop.filter && prop.filter.length > 0) {
				button.classList.add("filter-active");
			} else {
				button.classList.remove("filter-active");
			}
		});
	}

	private openFilterModal(prop: { name: string; type: string; filter?: any[] }) {
		const allowedValues = this.getAllUniqueValuesForProperty(prop.name);
		const modal = new FilterModal(this.app, prop, allowedValues, (selectedValues: any[]) => {
			prop.filter = selectedValues;
			this.applyFilters();
			this.updateFilterButtonStyles();
		});
		modal.open();
	}

	private applyFilters(): void {
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.querySelectorAll("tr"));
		rows.forEach((row) => {
			let visible = true;
			const cells = row.querySelectorAll("td");
			this.properties.forEach((prop, i) => {
				if (prop.filter && prop.filter.length > 0) {
					const cell = cells[i + this.propColStart];
					if (prop.type === "List") {
						const cellText = cell ? cell.textContent!.trim() : "";
						const match = prop.filter.some((filterValue: string) => cellText.includes(filterValue));
						if (!match) visible = false;
					} else if (prop.type === "Int") {
						const selectEl = cell?.querySelector("select") as HTMLSelectElement | null;
						if (selectEl) {
							const cellValue = Number(selectEl.value);
							const filterValues = prop.filter.map((val: any) => Number(val));
							if (!filterValues.includes(cellValue)) {
								visible = false;
							}
						} else {
							visible = false;
						}
					} else if (prop.type === "Text") {
						const cellText = cell ? cell.textContent!.trim() : "";
						if (
							!prop.filter.some((filterValue: string) =>
								cellText.toLowerCase().includes(filterValue.toLowerCase())
							)
						) {
							visible = false;
						}
					} else if (prop.type === "DateTime") {
						const input = cell?.querySelector("input, select");
						if (input) {
							const [from, to] = prop.filter;
							if (from || to) {
								let cellDate: Date | null = null;
								if (input instanceof HTMLInputElement && input.value.includes("T")) {
									cellDate = new Date(input.value.trim());
								} else if (input instanceof HTMLInputElement) {
									cellDate = new Date(input.value.trim() + "T00:00:00");
								}
								if (cellDate && !isNaN(cellDate.getTime())) {
									const fromDate = from ? new Date(from.trim()) : null;
									const toDate = to ? new Date(to.trim()) : null;
									if ((fromDate && cellDate < fromDate) || (toDate && cellDate > toDate)) {
										visible = false;
									}
								} else {
									console.warn("Date invalide détectée :", (input as HTMLInputElement).value);
									visible = false;
								}
							} else {
								visible = false;
							}
						} else {
							visible = false;
						}
					} else {
						if (!prop.filter.includes(cell?.textContent?.trim() ?? "")) {
							visible = false;
						}
					}
				}
			});
			row.style.display = visible ? "" : "none";
		});
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
			tr.createEl("td", {
				text: i.toString(),
				cls: "td-j-container"
			});

			const tdDir = tr.createEl("td", {
				text: "/" + file.path.substring(0, file.path.lastIndexOf("/")),
				cls: "td-j-container"
			});

			const tdFile = tr.createEl("td", { cls: "td-j-container" });
			this.createHref(tdFile, file);

			for (const propi of this.properties) {
				let prop = propi.name;
				let typep = propi.type;
				const td = tr.createEl("td", { cls: "td-j-container" });
				const value = props[prop];
				if (typep === "DateTime") {
					this.addDateButton(td, file.path, prop, value, "DateTime");
				} else if (typep === "Date") {
					this.addDateButton(td, file.path, prop, value, "Date");
				} else if (typep === "Int") {
					this.addIntInput(td, file.path, prop, value);
				} else if (typep === "List") {
					this.addList(td, file.path, prop, value);
				} else if (typep === "Text") {
					this.addText(td, file.path, prop, value);
				} else if (typep === "Boolean") {					
					this.addBoolean(td, file.path, prop, value);
				}				
			}
			i++;
		}
	}

	sortTable(columnIndex: string, ascending: boolean, type: string) {
		if (!this.table) return;
		const tbody = this.table.querySelector("tbody");
		if (!tbody) return;
		const rows = Array.from(tbody.getElementsByTagName("tr"));
		if (type === "Int") {
			rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[+columnIndex];
				const cellB = b.getElementsByTagName("td")[+columnIndex];
				const selectA = cellA?.querySelector("select") as HTMLSelectElement | null;
				const selectB = cellB?.querySelector("select") as HTMLSelectElement | null;
				const isNumericA = selectA && !isNaN(parseInt(selectA.value));
				const isNumericB = selectB && !isNaN(parseInt(selectB.value));
				if (isNumericA && isNumericB) {
					const cA = parseInt(selectA!.value);
					const cB = parseInt(selectB!.value);
					return ascending ? cA - cB : cB - cA;
				} else if (isNumericA) {
					return ascending ? -1 : 1;
				} else if (isNumericB) {
					return ascending ? 1 : -1;
				} else {
					return 0;
				}
			});
		} else if (type === "DateTime" || type === "Date") {
			rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[+columnIndex];
				const cellB = b.getElementsByTagName("td")[+columnIndex];
				const inputA = cellA?.querySelector("input, select") as HTMLInputElement | null;
				const inputB = cellB?.querySelector("input, select") as HTMLInputElement | null;
				const isValidA = inputA && !isNaN(new Date(inputA.value.trim()).getTime());
				const isValidB = inputB && !isNaN(new Date(inputB.value.trim()).getTime());
				if (isValidA && isValidB) {
					const cA = new Date(inputA.value.trim()).getTime();
					const cB = new Date(inputB.value.trim()).getTime();
					return ascending ? cA - cB : cB - cA;
				} else if (isValidA) {
					return ascending ? -1 : 1;
				} else if (isValidB) {
					return ascending ? 1 : -1;
				} else {
					return 0;
				}
			});
		} else if (type === "Id") {
			rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[+columnIndex]?.textContent?.trim().toLowerCase() || "";
				const cellB = b.getElementsByTagName("td")[+columnIndex]?.textContent?.trim().toLowerCase() || "";
				return ascending ? Number(cellA) - Number(cellB) : Number(cellB) - Number(cellA);
			});
		} else {
			rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[+columnIndex]?.textContent?.trim().toLowerCase() || "";
				const cellB = b.getElementsByTagName("td")[+columnIndex]?.textContent?.trim().toLowerCase() || "";
				return ascending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
			});
		}
		tbody.append(...rows);
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
