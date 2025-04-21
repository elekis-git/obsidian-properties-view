import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import BasedTextColumn from "./BasedTextColumn";

export default class ListColumn extends BasedTextColumn {
	constructor(pname: string, app: App) {
		super(pname, app);
	}

	public getUniqDisplayValuesFiltered(rows: HTMLElement[]) {
		let values: string[] = [];
		let cells = this.extractCells(rows);
		cells.forEach((cell) => {
			let e = cell.querySelector("textarea");
			if (e && e.value != "") {
				let tt = e.value
					.trim()
					.split("\n")
					.filter((v) => v !== "");
				values.push(...tt); // Ajoute uniquement des valeurs uniques
			}
		});
		values.push("");
		return [...new Set(values)];
	}

	public filterRows(rows: HTMLElement[]) {
		rows.forEach((row) => {
			const cells = row.querySelectorAll("td");
			const cell = cells[this.getIndex()];
			row.style.display = "";

			let cellText: string[] = [];
			const listItems = cell.querySelectorAll("li");
			cellText = Array.from(listItems).map((li) => li.textContent?.trim() || "");

			if (this.getFilter().length > 0) {
				let isMatch = false;
				for (const filterValue of this.getFilter()) {
					if (filterValue === "") {
						if (cellText.length === 0 || (cellText.length === 1 && cellText[0] === "")) {
							isMatch = true;
							break;
						}
					} else {
						if (cellText.some((item) => item.toLowerCase().includes(filterValue.toLowerCase()))) {
							isMatch = true;
							break;
						}
					}
				}
				if (!isMatch) {
					row.style.display = "none";
				}
			}
		});
	}

	public getStrType(): string {
		return "List";
	}
	public sortRows(rows: HTMLElement[], asc: boolean): HTMLElement[] {
		return super.sortRows(rows, asc);
	}

	public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null) {
	cell.empty();
	cell.setAttribute("filepath", file.path);
	cell.setAttribute("prop", prop);
	const displayDiv = cell.createEl("div", { cls: "ptp-markdown-preview" });

	let cv = Array.isArray(value) ? value : [value];

	const list = displayDiv.createEl("ul", { cls: "ptp-list-ul" });

	if (cv.length === 1 && cv[0] == null) {
		cell.classList.add("ptp-global-table-td-empty");
	} else {
		cell.classList.remove("ptp-global-table-td-empty");
		cv.forEach((v) => {
			if (v == null) return;
			const listItem = list.createEl("li", { cls: "ptp-list-il" });

			if (/^\[\[.*\]\]$/.test(v)) {
				const fileName = v.replace(/^\[\[|\]\]$/g, "");
				const tfile = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
				if (tfile == null) {
					this.createHref(listItem, fileName);
				} else {
					this.createHref(listItem, tfile);
				}
			} else {
				listItem.createEl("span", { text: v });
			}
		});
	}

	const textarea = cell.createEl("textarea", {
		cls: "ptp-textarea",
		text: cv.join("\n")
	});
	textarea.style.display = "none";

	cell.addEventListener("dblclick", () => {
		displayDiv.style.display = "none";
		textarea.style.display = "block";
		textarea.focus();
	});

	textarea.addEventListener("focus", () => {
		textarea.dataset.oldValue = textarea.value;
	});

	textarea.addEventListener("blur", async () => {
		const oldValue = textarea.dataset.oldValue;

		displayDiv.style.display = "block";
		textarea.style.display = "none";

		const newValue = textarea.value
			.trim()
			.split("\n")
			.filter((v) => v !== "");

		if (newValue.length === 0) {
			cell.classList.add("ptp-global-table-td-empty");
		} else {
			cell.classList.remove("ptp-global-table-td-empty");
		}

		this.fillCell(cell, file, prop, newValue);

		if (oldValue !== textarea.value) {
			await this.updateYamlProperty(file.path, prop, newValue, "update");
		}
	});

	// Suggest menu inline
	const suggestMenu = createDiv({ cls: "ptp-suggest-menu" });
	document.body.appendChild(suggestMenu);

	const context = {
		suggestMenu,
		currentIndex: -1,
		matches: [],
		input: textarea,
		filepath: file.path
	};

	textarea.addEventListener("input", (e) => this.onInput(textarea, context));
	textarea.addEventListener("keydown", (e) => this.onKeydown(e, textarea, context));
}

	
	
}
