import { Plugin, WorkspaceLeaf } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";

export default class GlobalPropertiesPlugin extends Plugin {

	async onload() {
		this.registerView(
			GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			(leaf: WorkspaceLeaf) => new GlobalPropertiesView(leaf)
		);

		this.addRibbonIcon("wrench", "Properties", () => {
			this.openTab();
		});

		// Écouteur sur le changement de tab
		this.app.workspace.on('active-leaf-change', this.onActiveLeafChange.bind(this));
	}

	// Méthode déclenchée lors du changement d'onglet actif
	onActiveLeafChange() {
		const activeLeaf = this.app.workspace.activeLeaf;
		// Utilisation de refreshView() car onOpen() est protégé
		if (activeLeaf && activeLeaf.view instanceof GlobalPropertiesView) {
			activeLeaf.view.refreshView();
		}
	}

	async openTab() {
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.setViewState({
			type: GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			active: true,
		});
	}
}

