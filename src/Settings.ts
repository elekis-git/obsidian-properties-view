import { Plugin, WorkspaceLeaf, Menu, TFolder, TFile,PluginSettingTab, Setting } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";
import GlobalPropertiesPlugin from "main";

export interface GlobalPropertiesSettings {
	shouldAddRibbon : boolean;
	showFilePreviewInTextColumn: boolean; // <--- Nouveau paramètre
}

export const DEFAULT_SETTINGS: GlobalPropertiesSettings = {
	shouldAddRibbon : false,
	showFilePreviewInTextColumn: true, // <--- Valeur par défaut
};

export class GlobalPropertiesSettingTab extends PluginSettingTab {
	plugin: GlobalPropertiesPlugin;

	constructor(plugin: GlobalPropertiesPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		
		new Setting(containerEl)
		.setName("Show ribbon icon")
		.setDesc("Toggle the ribbon icon in the sidebar. (Allow table properties of the entire Vault). Warning can be slow")
		.addToggle((toggle) =>
			toggle.setValue(this.plugin.settings.shouldAddRibbon).onChange(async (value) => {
				this.plugin.settings.shouldAddRibbon = value;
				await this.plugin.updateRibbon(); // <-- On met à jour le ribbon
				await this.plugin.saveSettings();
			})
		);
		
		new Setting(containerEl)
	.setName("Show begin file in file column")
	.setDesc("If enabled, the beginning of the file will be displayed in file columns.")
	.addToggle(toggle => 
		toggle
			.setValue(this.plugin.settings.showFilePreviewInTextColumn)
			.onChange(async (value) => {
				this.plugin.settings.showFilePreviewInTextColumn = value;
				await this.plugin.saveSettings();
			})
	);
		
		
	}
}

