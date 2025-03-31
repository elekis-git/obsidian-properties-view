import { Plugin, WorkspaceLeaf, Menu, TFolder } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";

export default class GlobalPropertiesPlugin extends Plugin {
	async onload() {
		this.registerView(
			GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			(leaf: WorkspaceLeaf) => new GlobalPropertiesView(leaf)
		);

		this.addRibbonIcon("wrench", "Properties", () => {
			this.openTab(this.app.vault.getRoot());
		});

		// Écouteur sur le changement de tab
		this.app.workspace.on("active-leaf-change", this.onActiveLeafChange.bind(this));

		// Ajout du menu contextuel pour les dossiers
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item.setTitle("Properties that Folder")
							.setIcon("wrench")
							.onClick(() => {
								this.openTab(file);
							});
					});
				}
			})
		);
	}

	// Méthode déclenchée lors du changement d'onglet actif
	onActiveLeafChange() {
		const activeLeaf = this.app.workspace.activeLeaf;
		// Utilisation de refreshView() car onOpen() est protégé
		if (activeLeaf && activeLeaf.view instanceof GlobalPropertiesView) {
			activeLeaf.view.refreshView();
		}
	}
	async openTab(fd: TFolder) {
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.setViewState({
			type: GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			active: true,
			state: { folderPath: fd.path }
		});
		
		 // Attendre un peu que la vue soit bien initialisée
    setTimeout(() => {
        const view = leaf.view;
        if (view instanceof GlobalPropertiesView) {
            console.log("Vue correctement récupérée :", view);
            view.createTablePropView(); // Appelle la fonction dans ItemView
        } else {
            console.error("Vue non reconnue !");
        }
    }, 100);
		
	}
}
