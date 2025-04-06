import { browser } from "@wdio/globals";
import fs from "fs";
import { Key } from "webdriverio";
import fs from "fs-extra";
import path from "path";

describe("Test my plugin", function () {
    before(async function () {
        const vaultTest = path.resolve(__dirname, "../../vaultTest");
        const vaultTestFile = path.resolve(__dirname, "../../vaultTestFiles");
        const pluginsDir = path.join(vaultTest, ".obsidian", "plugins","properties-global-view");

        try {
            await fs.emptyDir(vaultTest);
            await fs.copy(vaultTestFile, vaultTest);
            console.log("vaultTest a été réinitialisé avec le contenu de vaultTestFile");
        } catch (error) {
            console.error("Erreur lors de la préparation du test :", error);
        }
        await browser.reloadObsidian({ vault: "./vaultTest" });
    });

    it("test filter", async () => {
        await browser.pause(500); // Petite pause avant d'envoyer les touches

        const folderElement = await browser.$(
            '//div[@class="tree-item-inner nav-folder-title-content" and text()="TEST_20_a"]'
        );
        await folderElement.click({ button: 2 });
        const contextMenu = await browser.$(".menu"); // Sélecteur pour le menu contextuel
        //        const contextMenuHtml = await contextMenu.getHTML();
        //        fs.writeFileSync('context-menu-output.html', contextMenuHtml, 'utf-8');
        const propertiesOption = await browser.$('//div[@class="menu-item-title" and text()="Properties that Folder"]');
        await propertiesOption.click();
        await browser.pause(500);
        const table = await browser.$(".ptp-global-table");
        const headerRow = await table.$("thead tr");
        const firstHeaderCell = await headerRow.$$("th")[0];
        await firstHeaderCell.click();
        await browser.pause(500);
        const rows = await table.$$("tbody tr"); // Récupérer toutes les lignes du tableau dans <tbody>
        const columnValues = [];
        await browser.pause(500);
        for (let i = 0; i < rows.length; i++) {
            // Accéder à la première cellule de chaque ligne (colonne 1)
            const firstColumn = await rows[i].$$("td")[0];
            const columnText = await firstColumn.getText(); // Récupérer le texte de la cellule
            columnValues.push(Number(columnText)); // Convertir le texte en nombre
        }
        const expectedOrder = [3, 2, 1];
        expect(columnValues).toEqual(expectedOrder); // Compare
    });
});
