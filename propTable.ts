import {
    App,
    Plugin,
    Modal,
    MarkdownRenderer,
    TFile
} from "obsidian";

import { parseYaml, stringifyYaml } from "obsidian";

import {
    Plugin,
    ItemView,
    WorkspaceLeaf
} from "obsidian";

import {
    FilterModal
} from "FilterModal";

export class globalPropertiesView extends ItemView {

    fileProperties = [];
    properties = null;
    public GLOBAL_PROPERTIES_VIEW = "glbVeID";
    table = null;
    constructor(app: App) {
        super(app);
    }

    getViewType() {
        return globalPropertiesView.GLOBAL_PROPERTIES_VIEW;
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

addList(cell: HTMLElement, filepath: string, prop: string, currentValue: Array<string>) {
    // Nettoyer la cellule et définir les attributs
    cell.empty();
    cell.setAttribute("filepath", filepath);
    cell.setAttribute("prop", prop);

    let cv = Array.isArray(currentValue) ? currentValue : [currentValue];

    // Créer une liste UL pour afficher les valeurs
    const list = cell.createEl("ul", { cls: "properties-list-elekis" });

    cv.forEach(v => {
        if (v == null || v === undefined) return;
        const listItem = list.createEl("li", { cls: "properties-list-item" });

        // Créer un lien cliquable
        this.createHref(listItem, v, v);

        // Ajouter un bouton de suppression
        const delbutton = listItem.createEl("button", {
            text: '-',
            cls: 'properties-del-elekis-divprop-button',
            attr: { "filepath": filepath, "prop": prop, "value": v }
        });

        delbutton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            let filep = delbutton.getAttribute("filepath");
            let prop = delbutton.getAttribute("prop");
            let value = delbutton.getAttribute("value");

            // Mettre à jour le fichier
            this.updateYamlProperty(filep, prop, value, "delete");
            listItem.remove(); // Supprimer visuellement
        });
    });

    // Ajouter la liste à la cellule
    cell.appendChild(list);

    // Événement pour activer l'édition en Markdown
    cell.addEventListener('click', () => {
        if (cell.querySelector("textarea")) return; // Empêcher l'ajout multiple de textarea

        // Récupérer le contenu YAML sous forme de texte
        let markdownText = cv.join("\n");

        // Remplacer la liste par un textarea
        cell.empty();
        const textarea = cell.createEl("textarea", {
            cls: "properties-markdown-textarea",
            text: markdownText
        });

        // Focus pour édition immédiate
        textarea.focus();

        // Gérer la mise à jour après édition
        textarea.addEventListener("blur", async () => {
            let newValue = textarea.value.trim().split("\n").filter(v => v !== ""); // Convertir en liste YAML
            cell.empty();
            this.updateYamlProperty(filepath, prop, newValue, "update");
            this.addList(cell, filepath, prop, newValue); // Rafraîchir l'affichage
        });
    });
}

    async updateYamlProperty(filePath: string, prop: string, value: string | Array<string>, actiontype: string) {
        console.log("updateYAMLPROPERTY", filePath, prop, value, actiontype);

        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!file) return;

        let fileContent = await this.app.vault.read(file);
        const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
        let yamlContent = "{}";

        if (match) yamlContent = match[1];  

        const yamlData = parseYaml(yamlContent);

        if (actiontype === "update") {
            if (!value || (Array.isArray(value) && value.length === 0) || value === "") {
                delete yamlData[prop]; // Supprimer la propriété si elle est vide
            } else {
                yamlData[prop] = value; // Mettre à jour la propriété
            }
        } else if (actiontype === "delete") {
            if (Array.isArray(yamlData[prop])) {
                yamlData[prop] = yamlData[prop].filter(item => item !== value); // Supprimer la valeur spécifique
                if (yamlData[prop].length === 0) delete yamlData[prop]; // Supprimer la propriété si vide
            } else {
                delete yamlData[prop]; // Supprimer directement si ce n'est pas un tableau
            }
        } else if (actiontype === "addingtolist") {
            if (!Array.isArray(yamlData[prop])) {
                yamlData[prop] = value.length > 0 ? [...new Set(value)] : undefined; // Évite d'ajouter une liste vide
            } else {
                yamlData[prop] = [...new Set([...yamlData[prop], ...value])]; // Ajoute sans doublons
            }
            
            if (!yamlData[prop] || yamlData[prop].length === 0) {
                delete yamlData[prop]; // Supprime si vide après l'ajout
            }
        }
        // Convertir en YAML et mettre à jour le fichier
        const newYaml = stringifyYaml(yamlData);
        fileContent = match 
            ? fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`) 
            : `---\n${newYaml}---\n${fileContent}`;

        console.log("Updated YAML:", newYaml);
        await this.app.vault.modify(file, fileContent);
    }



    addText(cell: HTMLElement, path: string, prop: string, v2: string) {

        //console.log("addText", path, prop, v2)
        let value = "";        
        if (v2 != null) value = String(v2); 
        // Créer un div pour afficher la version formatée
        const displayDiv = cell.createEl('div', { cls: 'markdown-preview' });

        // Fonction pour afficher le texte formaté
        const renderMarkdown = () => {
            displayDiv.empty();
            MarkdownRenderer.renderMarkdown(value, displayDiv, path, this.app);
            
            // Convertir les liens Obsidian en liens cliquables
            const links = displayDiv.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const targetPath = link.getAttribute('href');
                    if (targetPath) {
                        this.app.workspace.openLinkText(targetPath, "", true);
                    }
                });
            });
        };

        renderMarkdown(); // Premier rendu

            // Création de l'input pour l'édition
            const input = cell.createEl('input', { type: 'text', cls: 'markdown-input' });
            input.value = value;
            input.style.display = 'none'; // Caché par défaut

            // Basculer en mode édition lors d'un clic
            cell.addEventListener('click', () => {
                displayDiv.style.display = 'none';
                input.style.display = 'block';
                input.focus();
            });

            // Sauvegarder et repasser en affichage lors d'un blur
            input.addEventListener('blur', async () => {
                value = input.value;
                displayDiv.style.display = 'block';
                input.style.display = 'none';
                this.updateYamlProperty(path, prop, value, "update");              

                renderMarkdown(); // Mettre à jour l'affichage
            });

            cell.appendChild(input);
        }

    
    addIntInput(cell: HTMLElement, filepath: string, prop: string, currentValue: string) {
        console.log("addIntButton", filepath, prop, currentValue);
        cell.empty();
        const createInput = (value: string | null) => {
            cell.empty();
            const input = cell.createEl("input", {
                type: "number",
                value: value ?? ""
            });

            input.setAttribute("filepath", filepath);
            input.setAttribute("prop", prop);
            input.step = "1"; // Assure que seules des valeurs entières sont saisies

            input.addEventListener("change", async () => {
                const newValue = input.value.trim();
                let filep = input.getAttribute("filepath");
                let propp = input.getAttribute("prop");

                if (!filep || !propp) return;

                if (newValue === "") {
                    // Supprimer l'input et la propriété du YAML si vide
                    cell.empty();
                    await this.updateYamlProperty(filep, propp, null, "delete");
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



    addDateButton(cell: HTMLElement, filepath:string, prop:string, value: string, type:string) {
        //console.log("addDateButton", filepath, prop, value, type);
        cell.empty();
        const input = cell.createEl("input",{cls: 'properties-add-elekis-date-button'});

        input.setAttribute("filepath",filepath);
        input.setAttribute("prop",prop); 
        input.type = type === "DateTime" ? "datetime-local" : "date";
         if (!(value == null) && !(value == "")) {
                let dd =  new Date(value)
                if (type === "DateTime")input.value = dd.toISOString().split(".")[0]; // Format compatible avec datetime-local
                else input.value = dd.toISOString().split("T")[0] + "T00:00"; // Format compatible avec datetime-local
        }else{
            input.classList.add("my-gray-input");
            }


        input.addEventListener("change", async () => {
                let filep = input.getAttribute("filepath");
                let propp = input.getAttribute("prop");
                let newValue = input.value == "" ? "":new Date(input.value);
                let v2 =""
                if (input.value != "")  {
                        v2 = input.type  === "datetime-local"  
                                            ? newValue.toISOString().split(".")[0] 
                                            : newValue.toISOString().split("T")[0];
                        input.classList.remove("my-gray-input");
                        }
                else  {
                        input.classList.add("my-gray-input");
                    }
               this.updateYamlProperty(filep, prop, v2, "update");   
        });
        input.focus();
    }

    async onOpen() {
        console.log("onOpen");
        const {
            contentEl
        } = this;
        console.log(this); 
        console.log(contentEl);

        contentEl.empty();
        contentEl.classList.add("modal-j-content");
        const title = parent.createEl("h1", {
            text: "Tableau des propriétés des fichiers"
        });
        title.classList.add("modal-j-title");
        this.buildFileProperties();
        this.table = contentEl.createEl("table", {
            cls: "properties-j-table"
        });
        this.buildTableHeader();
        this.buildTableBody();
        this.addZoomFeature();
        console.log("fin onOpn");
    }


    private buildFileProperties() {
        const files = this.app.vault.getMarkdownFiles();
        const propertyMap: Map < string, string > = new Map();
        this.fileProperties = [];

        for (const file of files) {
            //console.log("-->",file.path);
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache && cache.frontmatter) {
                const props = {};
                for (const key in cache.frontmatter) {
                    const value = cache.frontmatter[key];

                    // Détecter le type de la propriété
                    const detectedType = this.detectPropertyType(key, value, propertyMap);
                    //console.log("detectedType", detectedType);
                    propertyMap.set(key, detectedType);

                    props[key] = value;
                    props["filter"] = [];
                }
                this.fileProperties.push({
                    file,
                    props
                });
            } else {
                this.fileProperties.push({
                    file,
                    props: {}
                });
            }
        }
        this.properties = Array.from(propertyMap.entries()).map(([name, type, filter]) => ({
            name,
            type,
            filter
        }));
    }

    private detectPropertyType(key: string, value: any, propertyMap: Map < string, string > ): string {
        //console.log("detectPropertyType",key, value);
        const isNumeric = (value) => !isNaN(value);
        // Si la propriété a déjà été vue comme un Array, elle doit rester un Array
        if (value == null || value == "") {
            if (propertyMap.get(key) == null) return null;
        }
        if (propertyMap.get(key) === "List") return "List";
        if (propertyMap.get(key) === "DateTime") return "DateTime";

        if (Array.isArray(value)) {
            return "List"; // Toute la propriété devient une liste
        } else if (typeof value === "string") {
            if (this.isDateTime(value)) return "DateTime";
            if (this.isDate(value)) return "Date";
            return "Text";
        } else if (typeof value === "number" || isNumeric(value) ) {            
            if (propertyMap.get(key) !== null) return propertyMap.get(key) ;
            return "Int";
        } else if (typeof value === "boolean") {
            return "Boolean";
        }

        return "Text"; // Par défaut
    }

    private buildTableHeader() {
        // Création de l'en-tête principal
        const thead = this.table.createEl("thead", {
            cls: "th-j-container"
        });
        const headerRow = thead.createEl("tr");

        headerRow.createEl("th", { 
            text: "⇅",
            cls: "th-j-container",
            attr: {"columnId": 0, "sortasc":false, "type":"Id"} 
        });
        headerRow.createEl("th", {
            text: "Fichier",
            cls: "th-j-container",
            attr: {"columnId": 1, "sortasc":false, "type":"Text"} 
        });

       for (let i = 0; i < this.properties.length; i++) {
             const prop = this.properties[i];
             const t = headerRow.createEl("th", {
                    text: `${prop.name} (${prop.type})`,
                    cls: "th-j-container",
                    attr: {"columnId": i+2, "sortasc":false, "type":prop["type"]}  // On associe l'index de la colonne à cet attribut
                });
        }

        headerRow.querySelectorAll("th").forEach((h)=>{
            h.addEventListener("click", () => {
                const columnId = h.getAttribute("columnId");  // Récupère l'ID de la colonne
                const columnsort = h.getAttribute("sortasc") == "true";  // Récupère l'ID de la colonne
                //console.log(columnId, columnsort);
                this.sortTable(columnId, columnsort,h.getAttribute("type") );
                h.setAttribute("sortasc", !columnsort);

               });
          });

        const filterRow = thead.createEl("tr");
        filterRow.createEl("th", {
            cls: "th-j-container"
        });
        filterRow.createEl("th", {
            cls: "th-j-container"
        });

        for (const prop of this.properties) {
            const th = filterRow.createEl("th", {
                cls: "th-j-container"
            });
            const filterButton = th.createEl("button", {
                text: '+',
                cls: 'properties-filter-elekis-divprop-button'
            });
            filterButton.setAttribute('data-prop', prop.name);
            filterButton.addEventListener("click", () => {
                this.openFilterModal(prop);
            });
        }
    }

    private getAllUniqueValuesForProperty(propName: string): any[] {
        const uniqueValues = new Set < any > ();
        for (const {
                props
            }
            of this.fileProperties) {
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
        // Sélectionne tous les boutons de filtre
        const filterButtons = document.querySelectorAll('.properties-filter-elekis-divprop-button');
 //       //console.log(filterButtons);
        filterButtons.forEach((button) => {
            // Trouve la propriété associée en récupérant son `data-prop` (ou autre méthode)
            const propName = button.getAttribute('data-prop');
            if (!propName) return;

            // Trouve la propriété correspondante
            const prop = this.properties.find(p => p.name === propName);
            if (!prop) return;
            // Si le filtre contient des valeurs, on ajoute la classe active
            if (prop.filter && prop.filter.length > 0) {
                button.classList.add('filter-active');
                //console.log("Ajout classe active:", button.classList);
            } else {
                button.classList.remove('filter-active');
            }
        });
    }

    private openFilterModal(prop: {
        name: string,
        type: string,
        filter ? : any[]
    }) {
        const allowedValues = this.getAllUniqueValuesForProperty(prop.name);
        const modal = new FilterModal(this.app, prop, allowedValues, (selectedValues: any[]) => {
            prop.filter = selectedValues;
 //           //console.log("prop.filter:", prop.filter)
            this.applyFilters();
            this.updateFilterButtonStyles();
        });
        modal.open();
    }

    private applyFilters(): void {
        if (!this.table) return;
        const tbody = this.table.querySelector("tbody");
        if (!tbody) return;
        // Parcourir toutes les lignes du corps du tableau
        const rows = Array.from(tbody.querySelectorAll("tr"));
        rows.forEach(row => {
            let visible = true;
            const cells = row.querySelectorAll("td");
            this.properties.forEach((prop, i) => {
                if (prop.filter && prop.filter.length > 0) {
                    //console.log("propfilter",prop.filter);
                    // Récupère la cellule correspondante
                    const cell = cells[i+2]; // les props commencent a la seconde colonne
                    //console.log("cell:",cell);
                    if (prop.type === "List") {
                        const cellText = cell ? cell.textContent.trim() : "";
                        const match = prop.filter.some((filterValue: string) => cellText.includes(filterValue));
                        if (!match) visible = false;
                    } else if (prop.type === "Int") {
                        const selectEl = cell.querySelector("select") as HTMLSelectElement;
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
                        const cellText = cell ? cell.textContent.trim() : "";
                        if (!prop.filter.some((filterValue: string) => cellText.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1)) {
                            visible = false;
                        }
                    } else if (prop.type === "DateTime") {
                            const input = cell.querySelector("input, select");
                            if (input) {
                                const [from, to] = prop.filter; // prop.filter contient [fromDate, toDate]

                                if (from || to) {
                                    let cellDate: Date | null = null;

                                    // Vérification si la date contient bien des heures et minutes
                                    if (input.value.includes("T")) {
                                        cellDate = new Date(input.value.trim());
                                    } else {
                                        // Si la date ne contient pas d'heure (format "YYYY-MM-DD"), on force à minuit UTC
                                        cellDate = new Date(input.value.trim() + "T00:00:00");
                                    }

                                    if (!isNaN(cellDate.getTime())) { // Vérifie si la conversion est valide
                                        const fromDate = from ? new Date(from.trim()) : null;
                                        const toDate = to ? new Date(to.trim()) : null;

                                        if ((fromDate && cellDate < fromDate) || (toDate && cellDate > toDate)) {
                                            visible = false;
                                        }
                                    } else {
                                        console.warn("Date invalide détectée :", input.value);
                                        visible = false; // Si la cellule ne contient pas une date valide
                                    }
                                }else{
                                    visible = false;                             
                                    }

                            }else{
                                    visible = false;                             
                                    }
                    } else {
                        if (!prop.filter.includes(cellText)) {
                            visible = false;
                        }
                    }
                }
            });
            row.style.display = visible ? "" : "none";
        });
    }



    private createHref(elem: HTMLElement, text: string, path: string) {
        //console.log("createHref",text, path);
        let value =""
        let path2 = ""

        try{
            value = text.replace("[[", "").replace("]]", "")
            path2 = path.replace("[[", "").replace("]]", "")
        }catch(err){}
 
        const fileLink = elem.createEl("a", {
            text: value,
            cls: "cm-underline",
            href: path2,
            attr: { tabindex: "-1"}
        });
        fileLink.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.close();
            this.app.workspace.openLinkText(path2, "", false);
        });
    }

    /** Construit le corps du tableau avec les données */
    private buildTableBody() {
        const tbody = this.table.createEl("tbody");
        let i = 1
        for (const {
                file,
                props
            }
            of this.fileProperties) {
            const tr = tbody.createEl("tr");
            const ind = tr.createEl("td", {
                text: i,
                cls: "td-j-container"
            });
            // Création de la cellule du lien vers le fichier
            const tdFile = tr.createEl("td", {
                cls: "td-j-container"
            });

            this.createHref(tdFile, file.basename, file.basename);

            // Création des cellules pour chaque propriété
            for (const propi of this.properties) {
                let prop = propi["name"];
                let typep = propi["type"];
                const td = tr.createEl("td", {
                    cls: "td-j-container"
                });
                //console.log("-------------------------------------")
                //console.log("prop",prop, "\ntypep", typep)
                const value = props[prop];
                if (typep === "DateTime") {
                    this.addDateButton(td,file.path,prop, value, "DateTime");
                } else if (typep === "Date") {
                    this.addDateButton(td,file.path,prop, value, "Date");
                } else if (typep === "Int") {
                    this.addIntInput(td, file.path, prop, value);
                } else if (typep === "List") {
                    this.addList(td,file.path, prop, value);
                } else if (typep === "Text") {
                    this.addText(td, file.path, prop, value);
                } else {
                    //console.log("bad type", value);
                }
            }
            i++;
        }
    }

    sortTable(columnIndex, ascending, type) {
        const tbody = this.table.querySelector("tbody");
        if (!tbody) return;
				  const rows = Array.from(tbody.getElementsByTagName("tr"));
			//console.log(rows.length);
			if (type == "Int") {
				rows.sort((a, b) => {
					const cellA = a.getElementsByTagName("td")[columnIndex];
					const cellB = b.getElementsByTagName("td")[columnIndex];

					// Vérifier si les cellules contiennent des valeurs numériques
					const isNumericA = cellA && cellA.querySelector("select") && !isNaN(parseInt(cellA.querySelector("select").value));
					const isNumericB = cellB && cellB.querySelector("select") && !isNaN(parseInt(cellB.querySelector("select").value));

					// Si les deux cellules contiennent des valeurs numériques, les comparer
					if (isNumericA && isNumericB) {
						const cA = parseInt(cellA.querySelector("select").value);
						const cB = parseInt(cellB.querySelector("select").value);
						return ascending ? cA - cB : cB - cA;
					}
					// Si une seule des deux cellules contient une valeur numérique, la placer en premier
					else if (isNumericA) {
						return ascending ?-1 : 1;
					}
					else if (isNumericB) {
						return ascending ? 1 : -1;
					}
					// Si aucune des deux cellules ne contient de valeur numérique, les garder dans le même ordre
					else {
						return 0;
					}
				});
            }else if (type == "DateTime" || type == "Date"){
				   rows.sort((a, b) => {
				const cellA = a.getElementsByTagName("td")[columnIndex];
				const cellB = b.getElementsByTagName("td")[columnIndex];

				// Vérifier si les cellules contiennent des valeurs valides
				const isValidA = cellA && (cellA.querySelector("input") || cellA.querySelector("select")) && !isNaN(new Date(cellA.querySelector("input, select").value.trim()).getTime());
				const isValidB = cellB && (cellB.querySelector("input") || cellB.querySelector("select")) && !isNaN(new Date(cellB.querySelector("input, select").value.trim()).getTime());

				// Si les deux cellules contiennent des valeurs valides, les comparer
				if (isValidA && isValidB) {
					const cA = new Date(cellA.querySelector("input, select").value.trim()).getTime();
					const cB = new Date(cellB.querySelector("input, select").value.trim()).getTime();
					return ascending ? cA - cB : cB - cA;
				}
				// Si une seule des deux cellules contient une valeur valide, la placer en premier
				else if (isValidA) {
					return ascending ?-1 : 1;
				}
				else if (isValidB) {
					return ascending ? 1 : -1;
				}
				// Si aucune des deux cellules ne contient de valeur valide, les garder dans le même ordre
				else {
					return 0;
				}
			});
            }else if (type == "Id"){
                rows.sort((a, b) => {
                    const cellA = a.getElementsByTagName("td")[columnIndex]?.textContent.trim().toLowerCase() ||"";
                    const cellB = b.getElementsByTagName("td")[columnIndex]?.textContent.trim().toLowerCase() ||"";
                    return ascending ? Number(cellA) - Number(cellB) : Number(cellB) - Number(cellA);
                });
            }else{
                rows.sort((a, b) => {
                const cellA = a.getElementsByTagName("td")[columnIndex]?.textContent.trim().toLowerCase() ||"";
                const cellB = b.getElementsByTagName("td")[columnIndex]?.textContent.trim().toLowerCase() ||"";
                return ascending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
                });
            }
        tbody.append(...rows);
       }

    private addZoomFeature() {
        let scale = 1; // Échelle de zoom initiale

        this.table.addEventListener("wheel", (event) => {
            if (!event.ctrlKey) return; // Vérifie que CTRL est enfoncé

            event.preventDefault(); // Empêche le défilement par défaut

            const zoomFactor = 0.1; // Facteur de zoom
            if (event.deltaY < 0) {
                scale += zoomFactor; // Zoom avant
            } else {
                scale = Math.max(0.5, scale - zoomFactor); // Zoom arrière (limite à 50%)
            }

            // Appliquer la transformation CSS
            this.table.style.transform = `scale(${scale})`;
            this.table.style.transformOrigin = "top center";
        });
    }


    getAllValuesForProperty(property: string) {
        const values: Set < any > = new Set();
        for (const {
                props
            }
            of this.fileProperties) {
            if (props[property] !== undefined) {
                values.add(props[property]);
            }
        }
        return Array.from(values);
    }


    onClose() {
        this.contentEl.empty();
    }
}
