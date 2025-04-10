import { Plugin, WorkspaceLeaf, Menu, TFolder, TFile,PluginSettingTab, Setting } from "obsidian";
import { GlobalPropertiesView } from "src/propTable";
import GlobalPropertiesPlugin from "main";

export interface GlobalPropertiesSettings {
	shouldAddFullProperties: boolean;
	shouldAddRibbon : boolean;
}

export const DEFAULT_SETTINGS: GlobalPropertiesSettings = {
	shouldAddFullProperties: false,
	shouldAddRibbon : false
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
			.setName("Add full properties on file creation")
			.setDesc("Automatically add default properties when a new file is created.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.shouldAddFullProperties).onChange(async (value) => {
					this.plugin.settings.shouldAddFullProperties = value;
					await this.plugin.saveSettings();
				})
			);
		
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
		
	}
}

