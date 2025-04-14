import { App, Modal, ButtonComponent, setIcon } from "obsidian";
import IColumn from "./Column";

export class ColumnFilterModal extends Modal {
	private columns: IColumn[];
	private items: { column: IColumn; visible: boolean }[];
	private onSubmit: (result: Map<IColumn, { newIndex: number; visible: boolean }>) => void;
	// Stocke l'index de l'item en cours de déplacement
	private dragSrcIndex: number | null = null;

	constructor(
		app: App,
		columns: IColumn[],
		onSubmit: (result: Map<IColumn, { newIndex: number; visible: boolean }>) => void
	) {
		super(app);
		this.columns = columns;
		this.items = columns.map((col) => ({ column: col, visible: col.getV() }));
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Filtrer et réorganiser les colonnes" });

		// Container pour les icônes de tri et de visibilité globale
		const sortContainer = contentEl.createDiv({ cls: "column-sort-container" });

		// Icône pour trier par ordre alphabétique
		const sortAlphaIcon = sortContainer.createEl("span", { cls: "sort-alpha" });
		setIcon(sortAlphaIcon, "arrow-down-narrow-wide");
		sortAlphaIcon.addEventListener("click", () => {
			this.sortItemsAlphabetically();
			this.renderList(listContainer);
		});

		// Icône pour trier par ordre alphabétique inverse
		const sortAlphaReverseIcon = sortContainer.createEl("span", { cls: "sort-alpha-reverse" });
		setIcon(sortAlphaReverseIcon, "arrow-up-narrow-wide");
		sortAlphaReverseIcon.addEventListener("click", () => {
			this.sortItemsAlphabeticallyReverse();
			this.renderList(listContainer);
		});

		// Bouton pour rendre toutes les colonnes visibles
		const showAllIcon = sortContainer.createEl("span", { cls: "show-all" });
		setIcon(showAllIcon, "eye");  
		showAllIcon.addEventListener("click", () => {
			this.items.forEach(item => item.visible = true);
			this.renderList(listContainer);
		});

		// Bouton pour rendre toutes les colonnes invisibles
		const hideAllIcon = sortContainer.createEl("span", { cls: "hide-all" });
		setIcon(hideAllIcon, "eye-off");  // icône "eye-off" pour invisible
		hideAllIcon.addEventListener("click", () => {
			this.items.forEach(item => item.visible = false);
			this.renderList(listContainer);
		});

		// Conteneur pour la liste des colonnes
		const listContainer = contentEl.createDiv({ cls: "column-filter-list" });
		this.renderList(listContainer);

		// Conteneur pour les boutons d'action
		const btnContainer = contentEl.createDiv({ cls: "modal-buttons" });
		new ButtonComponent(btnContainer)
			.setButtonText("Cancel")
			.onClick(() => this.close());
		new ButtonComponent(btnContainer)
			.setButtonText("Apply")
			.onClick(() => {
				const result = new Map<IColumn, { newIndex: number; visible: boolean }>();
				this.items.forEach((item, idx) => {
					result.set(item.column, { newIndex: idx, visible: item.visible });
				});
				this.onSubmit(result);
				this.close();
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private renderList(listContainer: HTMLElement) {
		listContainer.empty();
		this.items.forEach((item, index) => {
			const itemDiv = listContainer.createDiv({
				cls: "column-item",
				attr: { draggable: "true", "data-index": index.toString() },
			});

			// Activation du drag & drop avec les événements HTML5
			itemDiv.addEventListener("dragstart", (e) => {
				this.dragSrcIndex = index;
				// Pour Firefox
				e.dataTransfer?.setData("text/plain", index.toString());
				itemDiv.addClass("dragging");
			});

			itemDiv.addEventListener("dragover", (e) => {
				e.preventDefault(); // Nécessaire pour permettre le drop
				return false;
			});

			itemDiv.addEventListener("drop", (e) => {
				e.preventDefault();
				if (this.dragSrcIndex === null) return;
				const dropTargetIndex = index;
				this.moveItem(this.dragSrcIndex, dropTargetIndex);
				this.dragSrcIndex = null;
				this.renderList(listContainer);
			});

			itemDiv.addEventListener("dragend", () => {
				itemDiv.removeClass("dragging");
				this.dragSrcIndex = null;
			});

			// Icône de visibilité avec setIcon de l'API Obsidian
			const visibilityIcon = itemDiv.createEl("span", { cls: "toggle-visibility" });
			setIcon(visibilityIcon, item.visible ? "eye" : "eye-off");
			visibilityIcon.addEventListener("click", () => {
				item.visible = !item.visible;
				setIcon(visibilityIcon, item.visible ? "eye" : "eye-off");
			});

			// Affichage du nom de la propriété, placé après l'icône de visibilité
			itemDiv.createEl("span", { cls: "column-name", text: item.column.getPropertyName() });
		});
	}

	private moveItem(fromIndex: number, toIndex: number): void {
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= this.items.length || toIndex >= this.items.length)
			return;
		// Extraction de l'élément à déplacer
		const [movedItem] = this.items.splice(fromIndex, 1);
		// Ajustement : si l'élément est déplacé vers un indice supérieur, l'indice de destination est décrémenté
		const insertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
		this.items.splice(insertionIndex, 0, movedItem);
	}

	private sortItemsAlphabetically(): void {
		this.items.sort((a, b) =>
			a.column.getPropertyName().localeCompare(b.column.getPropertyName())
		);
	}

	private sortItemsAlphabeticallyReverse(): void {
		this.items.sort((a, b) =>
			b.column.getPropertyName().localeCompare(a.column.getPropertyName())
		);
	}
}
