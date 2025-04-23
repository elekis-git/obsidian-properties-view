import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default abstract class BasedTextColumn extends Column {
    constructor(pname: string, app: App) {
        super(pname, app);
    }

    abstract fillCell(cell: HTMLElement, file: any, prop: any, value: any): void;

    public getUniqDisplayValuesBasedOnSelector(rows: HTMLElement[], sQuerry: string): any[] {
        let values: (string | null)[] = [];
        let cells = this.extractCells(rows);
        cells.forEach((cell) => {
            let input = cell.querySelector(sQuerry);
            if (input) {
                if (
                    (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) &&
                    input.value.trim() !== ""
                ) {
                    values.push(input.value.trim());
                } else if (input.textContent?.trim() !== "") {
                    values.push(input.textContent?.trim() || "");
                } else {
                    values.push("");
                }
            } else {
                values.push("");
            }
        });
        //        values.push("");
        return [...new Set(values)];
    }

    protected renderMarkdownToDiv(displayDiv: HTMLElement, text: string, file: TFile) {
        displayDiv.empty();
        //@ts-ignore
        MarkdownRenderer.renderMarkdown(text, displayDiv, file.path, null);
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
    }

    protected onSuggestionClick(
        input: HTMLInputElement | HTMLTextAreaElement,
        suggestion: string,
        cursorPos: number,
        context: any
    ) {
        const valueBefore = input.value.slice(0, cursorPos);
        const valueAfter = input.value.slice(cursorPos);
        input.value = valueBefore + suggestion + valueAfter;

        input.selectionStart = input.selectionEnd = valueBefore.length + suggestion.length;
        input.focus();
        if (context.suggestMenu) {
            context.suggestMenu.style.display = "none"; // Cache le menu
        }
    }

    protected onInput(input: HTMLInputElement | HTMLTextAreaElement, context: any) {
        if (!input || !(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
            return;
        }

        const cursorPos = input.selectionStart || 0;
        const textBefore = input.value.slice(0, cursorPos);

        const match = textBefore.match(/\[\[([^\[\]]*)$/);

        if (match) {
            const query = match[1].toLowerCase();

            if (!context.suggestMenu) {
                context.suggestMenu = createDiv({ cls: "link-suggest-menu" });
                document.body.appendChild(context.suggestMenu);

                Object.assign(context.suggestMenu.style, {
                    position: "absolute",
                    zIndex: "1000",
                    overflowY: "auto"
                });
            }

            const rect = input.getBoundingClientRect();
            context.suggestMenu.style.top = `${rect.bottom + window.scrollY}px`;
            context.suggestMenu.style.left = `${rect.left + window.scrollX}px`;
            context.suggestMenu.style.width = `${rect.width}px`;

            const allFiles = this.app.vault.getMarkdownFiles();
            context.matches = allFiles.filter((f) => f.path.toLowerCase().includes(query));
            context.currentIndex = -1;

            context.suggestMenu.empty();
            context.matches.forEach((f: TFile, index: number) => {
                const item = createDiv({ text: f.path, cls: "suggestion-item" });
                item.addEventListener("mousedown", (e) => {
                    e.preventDefault(); // Empêche la perte de focus
                    const cursorPos = input.selectionStart || 0;
                    this.onSuggestionClick(input, f.path, cursorPos, context); // Insérer la suggestion et masquer le menu
                });

                context.suggestMenu!.appendChild(item);
            });

            context.suggestMenu.style.display = context.matches.length > 0 ? "block" : "none";
        } else {
            context.suggestMenu?.remove();
            context.suggestMenu = null;
        }
    }

    protected onKeydown(e: KeyboardEvent, input: HTMLInputElement | HTMLTextAreaElement, context: any) {
        if (!context.suggestMenu || context.suggestMenu.style.display === "none") return;

        if (e.key === "Escape") {
            e.preventDefault();
            context.suggestMenu.style.display = "none"; // Cache le menu
            context.currentIndex = -1; // Réinitialise l'index (aucune sélection)
            this.updateHighlight(context); // Met à jour l'affichage sans surligner de sélection
            return;
        }

        // Gestion des flèches bas
        if (e.key === "ArrowDown") {
            e.preventDefault();
            context.currentIndex = (context.currentIndex + 1) % context.matches.length;
            this.updateHighlight(context);
        }
        // Gestion des flèches haut
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            context.currentIndex = (context.currentIndex - 1 + context.matches.length) % context.matches.length;
            this.updateHighlight(context);
        }
        // Gestion de la touche "Enter"
        else if (e.key === "Enter") {
            e.preventDefault();

            // Si on est dans un textarea, on veut permettre un retour à la ligne
            if (input instanceof HTMLTextAreaElement) {
                const cursorPos = input.selectionStart || 0;
                const textBefore = input.value.slice(0, cursorPos);
                const match = textBefore.match(/\[\[([^\[\]]*)$/);
                if (match) {
                    // Insère la suggestion à la position actuelle du curseur dans le textarea
                    this.insertSuggestion(
                        input,
                        context.matches[context.currentIndex],
                        match.index!,
                        cursorPos,
                        context
                    );
                } else {
                    // Ajoute une nouvelle ligne dans le textarea si on est dans un textarea
                    const newLine = "\n";
                    input.setRangeText(newLine, cursorPos, cursorPos, "end");
                }
            } else {
                // Si on est dans un input classique, on insère la suggestion
                if (context.currentIndex >= 0 && context.matches[context.currentIndex]) {
                    const cursorPos = input.selectionStart || 0;
                    const match = input.value.slice(0, cursorPos).match(/\[\[([^\[\]]*)$/);
                    if (match) {
                        this.insertSuggestion(
                            input,
                            context.matches[context.currentIndex],
                            match.index!,
                            cursorPos,
                            context
                        );
                    }
                }
            }
        }
    }

    protected updateHighlight(context: any) {
        if (!context.suggestMenu) return;
        Array.from(context.suggestMenu.children).forEach((el, i) => {
            (el as HTMLElement).toggleClass("selected", i === context.currentIndex);
        });
    }

    protected insertSuggestion(
        input: HTMLInputElement | HTMLTextAreaElement,
        file: TFile,
        insertStart: number,
        cursorPos: number,
        context: any
    ) {
        const before = input.value.slice(0, insertStart);
        const after = input.value.slice(cursorPos);
        input.value = before + `[[${file.path}]]` + after;
        context.suggestMenu?.remove();
        context.suggestMenu = null;
        input.focus();
        context.currentIndex = -1;
    }

    public filterRows(rows: HTMLElement[]) {
        //issue with filter when column is in the text.
        rows.forEach((row) => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            let filT = this.getFilter();
            if (filT.length > 0) {
                const cellText = cell ? cell.textContent!.trim() : "";
                const match = filT.some((filterValue: string) => {
                    if (filterValue == "") return cellText == "";
                    return cellText
                        .toLowerCase()
                        .includes(filterValue.toString().toLowerCase().replace("[[", "").replace("]]", ""));
                });
                if (!match) row.style.display = "none";
            }
        });
    }
}
