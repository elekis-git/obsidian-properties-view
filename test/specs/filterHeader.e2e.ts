import { browser } from "@wdio/globals";
import fs from "fs";

describe("Test my plugin", function () {
    before(async function () {
        // You can create test vaults and open them with reloadObsidian
        // Alternatively if all your tests use the same vault, you can
        // set the default vault in the wdio.conf.ts.
        //await browser.reloadObsidian({vault: "../../../"});
    });

    it("test filter", async () => {
        // Localiser l'élément du dossier
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
