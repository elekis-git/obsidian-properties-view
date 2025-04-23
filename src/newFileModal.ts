import { App, Modal } from "obsidian";
import IColumn from "./Column";
import { I18n } from "./i18n";

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
        contentEl.createEl("h2", {
            text: I18n.I().t("newFileName.titleH2"),
            cls: "ptp-modal-title"
        });

        const isValidName = (value: string): boolean => {
            return value !== "" && !/[\/\\\+\:\*]/.test(value);
        };

        const inputEl = contentEl.createEl("input", {
            type: "text",
            cls: "ptp-modal-input"
        });
        inputEl.focus();

        const errorEl = contentEl.createEl("div", {
            text: "",
            cls: "ptp-modal-error"
        });

        contentEl.createEl("h3", {
            text: I18n.I().t("newFileName.choose"),//"Choose Properties to create with",
            cls: "ptp-modal-subtitle"
        });

        const checkboxContainer = contentEl.createEl("div", {
            cls: "ptp-checkbox-container"
        });

        const checkboxEls: HTMLInputElement[] = [];
        this.options.forEach((option) => {
            const div = checkboxContainer.createEl("div");
            const checkbox = div.createEl("input", { type: "checkbox" });
            checkbox.checked = true;
            checkboxEls.push(checkbox);
            div.createEl("label", {
                text: option.getPropertyName(),
                cls: "ptp-checkbox-label"
            });
        });

        const buttonContainer = contentEl.createEl("div", {
            cls: "ptp-button-container"
        });

        const selectAllButton = buttonContainer.createEl("button", {
            text: "Select All",
            cls: "ptp-button"
        });
        selectAllButton.addEventListener("click", () => {
            checkboxEls.forEach((cb) => (cb.checked = true));
        });

        const selectNoneButton = buttonContainer.createEl("button", {
            text: "Select None",
            cls: "ptp-button"
        });
        selectNoneButton.addEventListener("click", () => {
            checkboxEls.forEach((cb) => (cb.checked = false));
        });

        const submit = () => {
            const fileName = inputEl.value.trim();
            if (!isValidName(fileName)) {
                errorEl.setText(I18n.I().t("errorfilename"));
                return;
            }
            const selectedOptions = this.options.filter((_, i) => checkboxEls[i].checked);
            this.close();
            this.onSubmit(fileName, selectedOptions);
        };

        inputEl.addEventListener("keydown", (evt: KeyboardEvent) => {
            if (evt.key === "Enter") {
                submit();
            }
        });

        const submitButton = contentEl.createEl("button", {
            text: "Create",
            cls: "ptp-button"
        });
        submitButton.addEventListener("click", submit);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
