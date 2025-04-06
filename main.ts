import { Plugin, WorkspaceLeaf, Menu, TFolder, TFile,PluginSettingTab, Setting } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";

export default class GlobalPropertiesPlugin extends Plugin {
	async onload() {
		await this.loadSettings();

		this.registerView(
			GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW,
			(leaf: WorkspaceLeaf) => new GlobalPropertiesView(leaf, this.settings)
		);
		this.addSettingTab(new GlobalPropertiesSettingTab(this));
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
		this.app.vault.on("create", (file: TFile) => {
			this.refreshAllView();
		});
		this.app.vault.on("rename", (file: TFile) => {
			this.refreshAllView();
		});
		this.app.vault.on("delete", (file: TFile) => {
			this.refreshAllView();
		});
	}

	refreshAllView() {
		const leaves = this.app.workspace.getLeavesOfType(GlobalPropertiesView.GLOBAL_PROPERTIES_VIEW);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof GlobalPropertiesView) view.rebuildTheView();
		}
	}

	refreshView() {
		console.log("refresh the view");
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view instanceof GlobalPropertiesView) {
			activeLeaf.view.rebuildTheView();
		}
	}
	// Charge les paramètres
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// Sauvegarde les paramètres
	async saveSettings() {
		await this.saveData(this.settings);
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
}
/*********************************************************************************************/
interface GlobalPropertiesSettings {shouldAddFullProperties: boolean;}
const DEFAULT_SETTINGS: GlobalPropertiesSettings = {shouldAddFullProperties: false,};

class GlobalPropertiesSettingTab extends PluginSettingTab {
	plugin: GlobalPropertiesPlugin;

	constructor(plugin: GlobalPropertiesPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Add full properties on file creation")
			.setDesc("Automatically add default properties when a new file is created.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.shouldAddFullProperties).onChange(async (value) => {
					this.plugin.settings.shouldAddFullProperties = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
