import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import {globalPropertiesView} from "propTable";


export default class globalPropertiesPlugin extends Plugin {

    async onload() {
        this.registerView( 
            globalPropertiesView.GLOBAL_PROPERTIES_VIEW,
            (leaf) => new globalPropertiesView(leaf)
        );

        this.addRibbonIcon("dice", "Properties", () => {
            this.openTab();
        });

        // Ajouter un écouteur pour l'événement de changement de tab
        this.app.workspace.on('active-leaf-change', this.onActiveLeafChange.bind(this));
    }

    // Méthode qui se déclenche lorsque la tab active change
    onActiveLeafChange() {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view instanceof globalPropertiesView) {
            // Si la vue active est globalPropertiesView, recharge ou réinitialise la vue
            activeLeaf.view.onOpen(); // ou toute autre méthode pour réinitialiser la vue
        }
    }

    async openTab() {
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.setViewState({
            type: globalPropertiesView.GLOBAL_PROPERTIES_VIEW,
            active: true,
        });
    }
}

