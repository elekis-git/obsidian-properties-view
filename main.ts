import { Plugin, WorkspaceLeaf, Menu, TFolder, TFile } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";

export default class GlobalPropertiesPlugin extends Plugin {
	async onload() {
		this.registerView(
			GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			(leaf: WorkspaceLeaf) => new GlobalPropertiesView(leaf)
		);

		this.app.workspace.on("active-leaf-change", this.refreshView.bind(this));
		
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
		this.app.vault.on("create", (file: TFile) => {this.refreshAllView()});
		this.app.vault.on("rename", (file: TFile) => {this.refreshAllView()});
		this.app.vault.on("delete", (file: TFile) => {this.refreshAllView()});	
	}
	
	refreshAllView(){
		const leaves = this.app.workspace.getLeavesOfType(GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof GlobalPropertiesView)
				view.rebuildTheView();
		}
	}
	
	refreshView() {
		console.log("refresh the view");
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view instanceof GlobalPropertiesView) {
			activeLeaf.view.rebuildTheView();
		}
	}
	
	
	async openTab(fd: TFolder) {
		const leaves = this.app.workspace.getLeavesOfType(GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW);
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
