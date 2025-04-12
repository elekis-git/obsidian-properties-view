import DateTimeColumn from "../src/DateTimeColumn";
import TextColumn from "../src/TextColumn";
import IntColumn from "../src/IntColumn";
import BoolColumn from "../src/BoolColumn";
import { TFile, Vault } from "obsidian";
import fs from "fs";
import yaml from "js-yaml";

describe("FilterAlgo", () => {
  let column;
  let mockVault;
  let rows;

  beforeEach(() => {
    mockVault = new Vault();
    rows = createMockTableRows();
  });

  it("filterDateWithoutEmpty", async () => {
    column = new DateTimeColumn("testProperty", { vault: mockVault });
    column.setIndex(3); // Index of the date column
    column.setFilter(["2023-11-01", "2024-01-03"]); // Range for filtering
    column.filterRows(rows);
    const visibleRows = rows.filter((row) => row.style.display === "");
    const hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(3);
    expect(hiddenRows.length).toBe(7);
    expect(rows[4].style.display).toBe("none");
    expect(rows[2].style.display).toBe("");
  });

  it("filterDateWithEmpty", async () => {
    column = new DateTimeColumn("testProperty", { vault: mockVault });
    column.setIndex(3); // Index of the date column
    column.setFilter(["2011-11-01", "2012-01-03", true]); // Range for filtering
    column.filterRows(rows);
    const visibleRows = rows.filter((row) => row.style.display === "");
    const hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(4);
    expect(hiddenRows.length).toBe(6);
  });

  it("filterTextWithEmpty", async () => {
    column = new TextColumn("testProperty", { vault: mockVault });
    column.setIndex(7); // Index of the date column
    column.setFilter(["ampl", ""]); // Range for filtering

    column.filterRows(rows);

    const visibleRows = rows.filter((row) => row.style.display === "");
    const hiddenRows = rows.filter((row) => row.style.display === "none");

    // Verify number of visible and hidden rows
    expect(visibleRows.length).toBe(3);
    expect(hiddenRows.length).toBe(7);

    // Specific checks
    expect(rows[4].style.display).toBe("none");
    expect(rows[2].style.display).toBe("");
    expect(rows[5].style.display).toBe("");
  });

  it("filterTextWithoutEmpty", async () => {
    column = new TextColumn("testProperty", { vault: mockVault });
    column.setIndex(7); // Index of the date column
    column.setFilter(["ampl"]); // Range for filtering

    column.filterRows(rows);

    const visibleRows = rows.filter((row) => row.style.display === "");
    const hiddenRows = rows.filter((row) => row.style.display === "none");

    // Verify number of visible and hidden rows
    expect(visibleRows.length).toBe(1);
    expect(hiddenRows.length).toBe(9);

    expect(rows[4].style.display).toBe("none");
    expect(rows[2].style.display).toBe("none");
    expect(rows[1].style.display).toBe("");
  });

  it("filterIntWithoutEmpty", async () => {
    column = new IntColumn("testProperty", { vault: mockVault });
    column.setIndex(5); // Index of the date column
    column.setFilter(["29"]); // Range for filtering
    column.filterRows(rows);
    let visibleRows = rows.filter((row) => row.style.display === "");
    let hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(1);
    expect(hiddenRows.length).toBe(9);
    expect(rows[4].style.display).toBe("none");
    expect(rows[2].style.display).toBe("none");
    expect(rows[5].style.display).toBe("");
    column.setFilter([29]);
    column.filterRows(rows);
    visibleRows = rows.filter((row) => row.style.display === "");
    hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(1);
    expect(hiddenRows.length).toBe(9);
    expect(rows[4].style.display).toBe("none");
    expect(rows[2].style.display).toBe("none");
    expect(rows[5].style.display).toBe("");
  });

  it("filterIntWithEmpty", async () => {
    column = new IntColumn("testProperty", { vault: mockVault });
    column.setIndex(5);
    column.setFilter(["29", ""]);
    column.filterRows(rows);
    let visibleRows = rows.filter((row) => row.style.display === "");
    let hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(6);
    expect(hiddenRows.length).toBe(4);
    expect(rows[4].style.display).toBe("");
    expect(rows[2].style.display).toBe("none");
    expect(rows[5].style.display).toBe("");
    column.setFilter([29, ""]); // Range for filtering
    column.filterRows(rows);
    visibleRows = rows.filter((row) => row.style.display === "");
    hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(6);
    expect(hiddenRows.length).toBe(4);
    expect(rows[4].style.display).toBe("");
    expect(rows[2].style.display).toBe("none");
    expect(rows[5].style.display).toBe("");
  });

  it("filterBoolWithEmpty", async () => {
    column = new BoolColumn("testProperty", { vault: mockVault });
    column.setIndex(4);
    column.setFilter(["true", ""]);
    column.filterRows(rows);
    let visibleRows = rows.filter((row) => row.style.display === "");
    let hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(4);
    expect(hiddenRows.length).toBe(6);
    column.setFilter([true, ""]); // Range for filtering
    column.filterRows(rows);
    visibleRows = rows.filter((row) => row.style.display === "");
    hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(4);
    expect(hiddenRows.length).toBe(6);
    column.setFilter([false, ""]); // Range for filtering
    column.filterRows(rows);
    visibleRows = rows.filter((row) => row.style.display === "");
    hiddenRows = rows.filter((row) => row.style.display === "none");
    expect(visibleRows.length).toBe(6);
    expect(hiddenRows.length).toBe(4);
  });
  
  

  function createMockTableRows() {
    const data = [
      ["1", "flskdfj/lfksdjfslf/", "f1.md", "2023-10-01T00:00:00", true, 56, ["fdkj", "aaa", "fds"], "ffff", 34],
      ["2", "example/dir/", "file2.md", "2023-11-22T00:00:00", false, null, null, "sampleString", null],
      ["3", "sample/dir/", "file3.md", "2023-12-01T00:00:00", null, 42, ["item1", "item2"], null, 18],
      ["4", "another/path/", "file_four.md", null, null, null, ["one"], "text", 49],
      ["5", "just/path/", "fileV.md", null, true, null, ["another", "list"], "word", null],
      ["6", "dirName/", "lastFile.md", "2023-12-13T00:00:00", true, 29, null, null, 10],
      ["7", "test/dir7/", "file7.md", null, null, 77, ["alpha", "beta"], "testString", 23],
      ["8", "path8/", "theFile8.md", null, false, null, ["lambda"], "anotherString", null],
      ["9", "directory/nine/", "file_9.md", "2024-02-21T00:00:00", true, null, ["foo", "bar"], "random", 15],
      ["10", "sampleDir10/", "file10.md", "2024-03-05T00:00:00", false, 47, null, "lastString", 38]
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
