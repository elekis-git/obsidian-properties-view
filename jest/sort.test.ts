import DateTimeColumn from "../src/DateTimeColumn";
import TextColumn from "../src/TextColumn";
import IntColumn from "../src/IntColumn";
import BoolColumn from "../src/BoolColumn";
import { TFile, Vault } from "obsidian";
import fs from "fs";
import yaml from "js-yaml";

describe("SortAlgo", () => {
    let column;
    let mockVault;
    let rows;

    beforeEach(() => {
        mockVault = new Vault();
        rows = createMockTableRows();
    });

    it("SortDate", async () => {
        column = new DateTimeColumn("testProperty", { vault: mockVault });
        column.setIndex(3); // Index of the date column
        column.sortRows(rows, false);
        let cells = rows.map((row) => Number(row.querySelectorAll("td")[0].textContent));
        expect(cells).toEqual([4, 5, 7, 8, 3, 9, 2, 1, 10, 6]);
        column.sortRows(rows, true);
        cells = rows.map((row) => Number(row.querySelectorAll("td")[0].textContent));
        expect(cells).toEqual([6,10,1,2,9,3,4,5,7,8]);
    });

    function createMockTableRows() {
        const data = [
            ["1", "flskdfj/lfksdjfslf/", "f1.md", "2023-10-01T00:00:00", true, 56, ["fdkj", "aaa", "fds"], "ffff", 34],
            ["2", "example/dir/", "file2.md", "2023-11-22T00:00:00", false, null, null, "sampleString", null],
            ["3", "sample/dir/", "file3.md", "2025-12-01T00:00:00", null, 42, ["item1", "item2"], null, 18],
            ["4", "another/path/", "file_four.md", null, null, null, ["one"], "text", 49],
            ["5", "just/path/", "fileV.md", null, true, null, ["another", "list"], "word", null],
            ["6", "dirName/", "lastFile.md", "2021-12-13T00:00:00", true, 29, null, null, 10],
            ["7", "test/dir7/", "file7.md", null, null, 77, ["alpha", "beta"], "testString", 23],
            ["8", "path8/", "theFile8.md", null, false, null, ["lambda"], "anotherString", null],
            ["9", "directory/nine/", "file_9.md", "2024-02-21T00:00:00", true, null, ["foo", "bar"], "random", 15],
            ["10", "sampleDir10/", "file10.md", "2022-03-05T00:00:00", false, 47, null, "lastString", 38]
        ];

        return data.map(([id, dir, nomdefichier, datet, bool1, num1, list1, txt1, int2]) => {
            const createCellS = (textContent) => {
                const cell = document.createElement("td");
                cell.textContent = textContent;
                return cell;
            };
            const createCellD = (dt) => {
                const cell = document.createElement("td");
                const input = document.createElement("input");
                cell.appendChild(input);
                input.value = dt;
                return cell;
            };

            const createCellB = (bl) => {
                const cell = document.createElement("td");
                const input = document.createElement("input");
                input.type = "checkbox";
                input.checked = bl;
                cell.appendChild(input);
                return cell;
            };

            const row = document.createElement("div");
            row.style.display = "none";

            row.appendChild(createCellS(id));
            row.appendChild(createCellS(dir));
            row.appendChild(createCellS(nomdefichier));
            row.appendChild(createCellD(datet));
            row.appendChild(createCellB(bool1));
            row.appendChild(createCellD(num1));
            row.appendChild(createCellS(list1));
            row.appendChild(createCellS(txt1));
            row.appendChild(createCellS(int2));

            return row;
        });
    }
});
