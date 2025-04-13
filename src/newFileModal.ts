import { App, Modal } from "obsidian";
import IColumn from "./Column";

export class FileNameModal extends Modal {
    onSubmit: (fileName: string, selectedOptions: IColumn[]) => void;
    options: IColumn[];

    constructor(app: App, options: IColumn[], onSubmit: (fileName: string, selectedOptions: IColumn[]) => void) {
        super(app);
        this.options = options;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Entrez un nouveau nom de fichier" });

        // Création du champ de saisie pour le nom du fichier
        const inputEl = contentEl.createEl("input", { type: "text" });
        inputEl.style.width = "100%";
        inputEl.focus();

        // Élément pour afficher d'éventuelles erreurs
        const errorEl = contentEl.createEl("div", { text: "" });
        errorEl.style.color = "red";
        errorEl.style.marginTop = "10px";

        // Fonction de validation du nom : pas vide et sans caractères interdits
        const isValidName = (value: string): boolean => {
            return value !== "" && !/[\/\\\+\:\*]/.test(value);
        };

        contentEl.createEl("h3", { text: "Choose Properties to create with" });
        
        
        // Création d'un conteneur pour la liste de cases à cocher
        const checkboxContainer = contentEl.createEl("div", {
            attr: { style: "margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px;" }
        });
        checkboxContainer.style.marginTop = "10px";

        // Tableau qui contiendra les éléments checkbox pour récupérer leur état plus tard
        const checkboxEls: HTMLInputElement[] = [];
        // Pour chaque option passée au constructeur, on ajoute un bloc contenant la checkbox et son label
        this.options.forEach((option) => {
            const div = checkboxContainer.createEl("div");
            const checkbox = div.createEl("input", { type: "checkbox" });
            checkbox.checked = true; // par défaut, la case est cochée
            checkboxEls.push(checkbox);
            // On ajoute le label à la suite de la checkbox
            div.createEl("label", { text: option.getPropertyName(), attr: { style: "margin-left: 5px;" } });
        });

        // Conteneur pour les boutons "Select All" et "Select None"
        const buttonContainer = contentEl.createEl("div");
        buttonContainer.style.marginTop = "10px";

        // Bouton Select All : coche toutes les cases
        const selectAllButton = buttonContainer.createEl("button", { text: "Select All" });
        selectAllButton.addEventListener("click", () => {
            checkboxEls.forEach((cb) => (cb.checked = true));
        });

        // Bouton Select None : décoche toutes les cases
        const selectNoneButton = buttonContainer.createEl("button", { text: "Select None" });
        selectNoneButton.style.marginLeft = "10px";
        selectNoneButton.addEventListener("click", () => {
            checkboxEls.forEach((cb) => (cb.checked = false));
        });

        // Fonction de soumission qui récupère le nom de fichier et le tableau des options sélectionnées
        const submit = () => {
            const fileName = inputEl.value.trim();
            if (!isValidName(fileName)) {
                errorEl.setText("Nom invalide : ne doit pas être vide et ne pas contenir '/' ou '\\'.");
                return;
            }
            // Filtre les options sélectionnées
            const selectedOptions = this.options.filter((_, i) => checkboxEls[i].checked);
            this.close();
            // Appelle le callback avec le nom et le tableau des sélectionnés
            this.onSubmit(fileName, selectedOptions);
        };

        // Gestion de l'appui sur la touche "Enter" dans le champ de saisie
        inputEl.addEventListener("keydown", (evt: KeyboardEvent) => {
            if (evt.key === "Enter") {
                submit();
            }
        });

        // Bouton de soumission
        const submitButton = contentEl.createEl("button", { text: "Créer" });
        submitButton.style.marginTop = "10px";
        submitButton.addEventListener("click", submit);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
