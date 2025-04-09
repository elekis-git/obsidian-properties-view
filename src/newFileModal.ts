import { App, Modal, Notice, Plugin, TFile, Vault } from "obsidian";


export class FileNameModal extends Modal {
    onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }
 
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Entrez un nouveau nom de fichier" });

        // Création du champ de saisie
        const inputEl = contentEl.createEl("input", { type: "text" });
        inputEl.style.width = "100%";
        inputEl.focus();

        // Élément pour afficher d'éventuelles erreurs
        const errorEl = contentEl.createEl("div", { text: "" });
        errorEl.style.color = "red";
        errorEl.style.marginTop = "10px";

        // Fonction de validation du nom
        const isValidName = (value: string): boolean => {
            // Vérifie qu'il n'y a pas de '/' ou de '\' et que le nom n'est pas vide
            return (value !== "" && !/[\/\\\+\:\*]/.test(value));
        };

        // Fonction de soumission
        const submit = () => {
            const value = inputEl.value.trim();
            if (!isValidName(value)) {
                errorEl.setText("Nom invalide : ne doit pas être vide et ne pas contenir '/' ou '\\'.");
                return;
            }
            this.close();
            this.onSubmit(value);
        };

        // Écoute de la touche "Enter"
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

