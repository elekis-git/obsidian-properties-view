import { Plugin, WorkspaceLeaf, Menu, TFolder } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";

export default class GlobalPropertiesPlugin extends Plugin {
	async onload() {
		this.registerView(
			GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			(leaf: WorkspaceLeaf) => new GlobalPropertiesView(leaf)
		);

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
		const leaves = this.app.workspace.getLeavesOfType(GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW);

		// Vérifier si une leaf existe déjà pour ce dossier
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof GlobalPropertiesView && view.getFolderPath() === fd.path) {
				this.app.workspace.setActiveLeaf(leaf);
				return; // On arrête ici si l'onglet existe déjà
			}
		}

		// Sinon, on ouvre une nouvelle vue
		const newLeaf = this.app.workspace.getLeaf(true);
		await newLeaf.setViewState({
			type: GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			active: true,
			state: { folderPath: fd.path }
		});

		const newView = newLeaf.view;
		if (newView instanceof GlobalPropertiesView) {
			console.log("Vue correctement récupérée :", newView);
			newView.createTablePropView();
		} else {
			console.error("Vue non reconnue !");
		}
	}

	
	
/*	
	async openTab(fd: TFolder) {
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.setViewState({
			type: GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			active: true,
			state: { folderPath: fd.path }
		});
		
        const view = leaf.view;
        if (view instanceof GlobalPropertiesView) {
            console.log("Vue correctement récupérée :", view);
            view.createTablePropView(); // Appelle la fonction dans ItemView
        } else {
            console.error("Vue non reconnue !");
        }
		
	}
*/
}
