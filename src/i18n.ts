import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { App } from "obsidian";

const locales: Record<string, Record<string, string>> = {
  en,
  fr,
};

export class I18n {
  private lang: string;
  private translations: Record<string, string>;

  constructor(app: App) {
    // Obsidian ne fournit pas l'info de langue via une API officielle, donc on passe par appLocale
    this.lang = (app as any).appLocale?.lang || "en";
    this.translations = locales[this.lang] || locales["en"];
  }

  t(key: string): string {
    return this.translations[key] || key;
  }
}
