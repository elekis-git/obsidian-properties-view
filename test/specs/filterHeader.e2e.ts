import { browser } from "@wdio/globals";
import fs from "fs-extra"; // Assure-toi d'utiliser fs-extra
import path from "path";

describe("Test my plugin", function () {

    before(async function () {
        const vaultTest = path.resolve(__dirname, "../../vaultTest");
        const vaultTestFile = path.resolve(__dirname, "../../vaultTestFiles");
        const pluginsDir = path.join(vaultTest, ".obsidian", "plugins", "properties-global-view");

        try {
            await fs.emptyDir(vaultTest);
            await fs.copy(vaultTestFile, vaultTest);
        } catch (error) {
            console.error("Erreur lors de la préparation du test :", error);
        }
        await browser.reloadObsidian({ vault: "./vaultTest" });
        const folderElement = await browser.$(
            '//div[@class="tree-item-inner nav-folder-title-content" and text()="TEST_23_a"]'
        );
        await folderElement.click({ button: 2 });
        const contextMenu = await browser.$(".menu");
        const propertiesOption = await browser.$('//div[@class="menu-item-title" and text()="Properties that Folder"]');
        await propertiesOption.click();
        await browser.pause(500);
    });

    beforeEach(async function () {  // Ajoute `async` à beforeEach
        let table = await browser.$(".ptp-global-table");
        let headerRow = await table.$("thead tr");
        const rows = await table.$$("tbody tr");
        const exp = [1, 2, 3,4,5,6,7,8,9,10];
        let columnValues = []; // Déclare `columnValues`

        for (let i = 0; i < rows.length; i++) {
            const text = await rows[i].$$("td")[0].getText(); // `await` l'élément `getText`
            columnValues.push(Number(text));
        }
        if (exp.toString() === columnValues.toString()) return;

        await headerRow.$$("th")[0].click();
        await browser.pause(500);
        columnValues = [];

        for (let i = 0; i < rows.length; i++) {
            const text = await rows[i].$$("td")[0].getText(); // `await` l'élément `getText`
            columnValues.push(Number(text));
        }
        if (exp.toString() === columnValues.toString()) return;

        await headerRow.$$("th")[0].click(); 
        await browser.pause(500);
    });

    it("test filter file s1", async () => {
		const expectedOrder = ["t1","t10", "t2", "t3","t4","t5","t6","t7","t8","t9"];
        
		let table = await browser.$(".ptp-global-table");
        let headerRow = await table.$("thead tr");
        let columnValues = [];

		await headerRow.$$("th")[2].click();
		
        rows = await table.$$("tbody tr");

        for (let i = 0; i < rows.length; i++) {
            let text = await rows[i].$$("td")[2].getText(); // `await` l'élément `getText`
            columnValues.push(text);
        }
        expect(columnValues).toEqual(expectedOrder);
		
		table = await browser.$(".ptp-global-table");
        headerRow = await table.$("thead tr");
		await headerRow.$$("th")[2].click();

		rows = await table.$$("tbody tr");
        columnValues = [];

        for (let i = 0; i < rows.length; i++) {
            let text = await rows[i].$$("td")[2].getText(); // `await` l'élément `getText`
            columnValues.push(text);
        }
		expect(columnValues).toEqual(expectedOrder.reverse());		
    });
	

	
	
	
});