import DateTimeColumn from '../src/DateTimeColumn';
import { TFile, Vault } from 'obsidian';
import fs from 'fs';
import yaml from "js-yaml";

describe('FilterAlgo', () => {
  let column;
  let mockVault;
  let rows;

  beforeEach(() => {
    mockVault = new Vault();
    column = new DateTimeColumn("testProperty", { vault: mockVault });
    column.setIndex(3); // Index of the date column
    column.setFilter(['2023-11-01', '2024-01-03']); // Range for filtering
    rows = createMockTableRows();
  });

  it('filterDate', async () => {
	 
    column.filterRows(rows);

    const visibleRows = rows.filter(row => row.style.display === '');
    const hiddenRows = rows.filter(row => row.style.display === 'none');

    // Verify number of visible and hidden rows
    expect(visibleRows.length).toBe(3); 
    expect(hiddenRows.length).toBe(7); 

    // Specific checks
    expect(rows[4].style.display).toBe('none'); 
    expect(rows[2].style.display).toBe(''); 

  });

  function createMockTableRows() {
    const data = [
      ["1", "flskdfj/lfksdjfslf/", "f1.md", '2023-10-01T00:00:00', true, 56, ['fdkj', 'aaa', 'fds'], "ffff", 34],
      ["2", "example/dir/", "file2.md", '2023-11-22T00:00:00', false, null, null, "sampleString", null],
      ["3", "sample/dir/", "file3.md", '2023-12-01T00:00:00', null, 42, ['item1', 'item2'], null, 18],
      ["4", "another/path/", "file_four.md", null, null, null, ['one'], "text", 49],
      ["5", "just/path/", "fileV.md", null, true, null, ['another', 'list'], "word", null],
      ["6", "dirName/", "lastFile.md", '2023-12-13T00:00:00', true, 29, null, null, 10],
      ["7", "test/dir7/", "file7.md", null, null, 77, ['alpha', 'beta'], "testString", 23],
      ["8", "path8/", "theFile8.md", null, false, null, ['lambda'], "anotherString", null],
      ["9", "directory/nine/", "file_9.md", '2024-02-21T00:00:00', true, null, ['foo', 'bar'], "random", 15],
      ["10", "sampleDir10/", "file10.md", '2024-03-05T00:00:00', false, 47, null, "lastString", 38],
    ];

    return data.map(([id, dir, nomdefichier, ...rest]) => {
      const row = document.createElement('div');
      row.style.display = "none"; 

      const idCell = document.createElement('td');
      idCell.textContent = id;
      row.appendChild(idCell);

      const dirCell = document.createElement('td');
      dirCell.textContent = dir;
      row.appendChild(dirCell);

      const nfCell = document.createElement('td');
      nfCell.textContent = nomdefichier;
      row.appendChild(nfCell);

      rest.forEach(value => {
        const cell = document.createElement('td');
		const input = document.createElement('input');
		cell.appendChild(input);
		input.value = value
        row.appendChild(cell);
      });

      return row;
    });
  }
});