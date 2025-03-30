import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

export class Column {
    
    constructor(pname, vault) {
        this.vault = vault;
        this.sortasc = false;
        this.columnIndex = -1
        this.filter=""
        this.propertyName = pname
        this.columnId = ""
    }
    public isFiltering(){return true}
        
    public setId(a){ this.columnId = a;}
    public getId(){return this.columnId;}

    public setPropertyName(a){ this.propertyName = a;}
    public getPropertyName(){return this.propertyName;}

    public setSortAsc(a){ this.sortasc = a;}
    public getSortAsc(){return this.sortasc;}
    
    public setIndex(a){this.columnIndex = a};
    public getIndex(){return this.columnIndex};
    
    public setFilter(a){this.filter = a};
    public getFilter(){return this.filter};
    
    public filterRows(rows){
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
		fileContent = match
			? fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`)
			: `---\n${newYaml}---\n${fileContent}`;

		//console.log("Updated YAML:", newYaml);
		await this.vault.modify(fileOrAbstract, fileContent);
	}
    
    public sortRows (rows ){      
    return rows.sort((a, b) => {
                console.log(this.columnIndex);
                console.log(a, b.getElementsByTagName("td")[this.columnIndex]);
				const cellA = a.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
				const cellB = b.getElementsByTagName("td")[this.columnIndex]?.textContent?.trim().toLowerCase() || "";
				return this.sortasc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
			});   
    }   
}

export class TextColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType(){return "Text";}
    
    public sortRows (rows ){return super.sortRows(rows);}
    
    public filterRows(rows){
        rows.forEach(row => {	
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];	
            if (this.getFilter().length > 0) {
                const cellText = cell ? cell.textContent!.trim() : "";
                const match = this.getFilter().some((filterValue: string) => 
                            cellText.toLowerCase().includes(filterValue.toString().toLowerCase().replace("[[","").replace("]]","")  ));
                if (!match) row.style.display = "none"; 
            }
        });
    }
}

export class BoolColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    public getStrType(){return "Bool";}
    public sortRows (row ){return super.sortRows(row);}

}
    
export class DateTimeColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    
    public filterRows(rows){
         rows.forEach(row => {
             row.style.display = ""
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];	
            if (this.getFilter().length > 0) {

        const input = cell?.querySelector("input, select");
						if (input) {
							const [from, to] = this.getFilter();
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
										row.style.display = "none";
									}
								} else {
									row.style.display = "none";
								}
							} else {
								row.style.display = "none";
							}
						} else {
							row.style.display = "none";
						}
            }
         });
    }
    
    public getStrType(){return "DateTime";}

     public sortRows(rows){
        rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[ this.columnIndex];
				const cellB = b.getElementsByTagName("td")[ this.columnIndex];
				const inputA = cellA?.querySelector("input, select") as HTMLInputElement | null;
				const inputB = cellB?.querySelector("input, select") as HTMLInputElement | null;
				const isValidA = inputA && !isNaN(new Date(inputA.value.trim()).getTime());
				const isValidB = inputB && !isNaN(new Date(inputB.value.trim()).getTime());
				if (isValidA && isValidB) {
					const cA = new Date(inputA.value.trim()).getTime();
					const cB = new Date(inputB.value.trim()).getTime();
					return this.sortasc ? cA - cB : cB - cA;
				} else if (isValidA) {
					return this.sortasc ? -1 : 1;
				} else if (isValidB) {
					return this.sortasc ? 1 : -1;
				} else {
					return 0;
				}
			});
        return rows;
    }
    
}

export class DateColumn extends DateTimeColumn {
    constructor(pname, vault) {
        super(pname, vault);
    }
    
    public getStrType(){return "Date";}

    public sortRows(rows){
        return super.sortRows(rows);
    }
    
}
    
export class IntColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    
    
    public filterRows(rows){
        rows.forEach(row => {			
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];	
            row.style.display = ""
            if (this.getFilter().length > 0) {

        
            const selectEl = cell?.querySelector("input") as HTMLSelectElement | null;						
                            if (selectEl) {
                                const cellValue = Number(selectEl.value);
                                const filterValues = this.getFilter().map((val: any) => Number(val));
                                if (!filterValues.includes(cellValue)) {
                                    row.style.display = "none";
                                }
                            } else {
                                row.style.display = "none";
                            }
                        }
        });
    }
    
    
    
    public getStrType(){return "Int";}
    
    public sortRows(rows){
        rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[ this.columnIndex];
				const cellB = b.getElementsByTagName("td")[ this.columnIndex];
				const selectA = cellA?.querySelector("select") as HTMLSelectElement | null;
				const selectB = cellB?.querySelector("select") as HTMLSelectElement | null;
				const isNumericA = selectA && !isNaN(parseInt(selectA.value));
				const isNumericB = selectB && !isNaN(parseInt(selectB.value));
				if (isNumericA && isNumericB) {
					const cA = parseInt(selectA!.value);
					const cB = parseInt(selectB!.value);
					return this.sortasc ? cA - cB : cB - cA;
				} else if (isNumericA) {
					return this.sortasc ? -1 : 1;
				} else if (isNumericB) {
					return this.sortasc ? 1 : -1;
				} else {
					return 0;
				}
			});
        return rows;
    }
    
}

export class ListColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    
    public filterRows(rows){
           rows.forEach(row => {			
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];	
            row.style.display = "";
            if (this.getFilter().length > 0) {

        	let cellText = cell ? cell.textContent!.trim() : "";
						cellText = cellText.toString();
						if (
							!this.getFilter().some((filterValue: string) =>
								cellText.toLowerCase().includes(filterValue.toString().toLowerCase())
							)
						) {
							row.style.display = "none";
						}
            }
           });
    }
    
    public getStrType(){return "List";}
    public sortRows(rows )
        {return super.sortRows(rows);}

}

export class FileColumn extends TextColumn {
    constructor(pname, vault) {
        super(pname, vault);
    }    
    public getStrType(){return "FILE";}
}

export class DirColumn extends TextColumn {
    constructor(pname, vault) {
        super(pname, vault);
    }    
    public getStrType(){return "DIR";}
}


export class IDColumn extends Column {
    constructor(pname, vault) {
        super(pname, vault);
    }
    
    public isFiltering(){return false}

    
    public getStrType(){return "ID";}
    public sortRows (rows){
         rows.sort((a, b) => {
                const cellA = a.getElementsByTagName("td")[ this.columnIndex]?.textContent?.trim().toLowerCase() || "";
				const cellB = b.getElementsByTagName("td")[ this.columnIndex]?.textContent?.trim().toLowerCase() || "";
                const cA = parseInt(cellA);
				const cB = parseInt(cellB);
				return this.sortasc ? cA - cB : cB - cA;

			});
        return rows;
    }    
}
    
    
    


