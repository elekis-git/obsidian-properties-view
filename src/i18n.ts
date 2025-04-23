import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { App } from "obsidian";

const locales: Record<string, Record<string, string>> = {
  en,
  fr,
};

export class I18n {
  private static instance: I18n;
  private translations: Record<string, string> = {};
  private lang: string = "en";

  private constructor(app: App) {
    // Obsidian ne fournit pas l'info de langue via une API officielle, donc on passe par appLocale
    this.lang = (app as any).appLocale?.lang || "en";
    this.translations = locales[this.lang] || locales["en"];
  }

  static init(app: App) {
    if (!I18n.instance) {
      I18n.instance = new I18n(app);
    }
  }

  static I(): I18n {
    if (!I18n.instance) {
      throw new Error("I18n not initialized. Call I18n.init(app) first.");
    }
    return I18n.instance;
  }

  t(key: string): string {
    return this.translations[key] || key;
  }
}
