import { App, MarkdownRenderer, TFile, parseYaml, stringifyYaml, ItemView, WorkspaceLeaf } from "obsidian";

import Column from "./Column";

export default class DateTimeColumn extends Column {
    private dtype: string;

    constructor(pname: string, app: App, dtype: string = "date") {
        super(pname, app);
        this.dtype = dtype;
    }

    public getDType(): string {
        return this.dtype;
    }

    public filterRows(rows: HTMLElement[]) {
        rows.forEach((row) => {
            row.style.display = "";
            const cells = row.querySelectorAll("td");
            const cell = cells[this.getIndex()];
            if (this.getFilter().length > 0) {
                const input = cell?.querySelector("input, select");
                if (input) {
                    const [from, to] = this.getFilter();
                    if (from || to) {
                        let cellDate: Date | null = null;
                        if (input instanceof HTMLInputElement && input.value.includes("T")) {
                            cellDate = new Date(input.value.trim());
                        } else if (input instanceof HTMLInputElement) {
                            cellDate = new Date(input.value.trim() + "T00:00:00");
                        }

                        if (cellDate && !isNaN(cellDate.getTime())) {
                            const fromDate = from ? new Date(from.trim()) : null;
                            const toDate = to ? new Date(to.trim()) : null;
                            if (
                                (fromDate && cellDate < fromDate) ||
                                (toDate && cellDate.getTime() > toDate.getTime() + 86400000)
                            ) {
                                row.style.display = "none";
                            }
                        } else {
                            if (Boolean(this.getFilter()[2]) != true) row.style.display = "none";
                        }
                    } else {
                        row.style.display = "none";
                    }
                } else {
                    row.style.display = "none";
                }
            }
        });
    }

    public getStrType(): string {
        return this.dtype;
    }

    public getUniqDisplayValues(rows: HTMLElement[]): any[] {
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        rows.forEach((row) => {
            const cell = row.getElementsByTagName("td")[this.columnIndex];
            const input = cell?.querySelector("input, select") as HTMLInputElement | null;

            // Vérification de la validité de la date
            if (input && !isNaN(new Date(input.value.trim()).getTime())) {
                const currentDate = new Date(input.value.trim());

                // Calcul de la date minimale
                if (minDate === null || currentDate < minDate) {
                    minDate = currentDate;
                }

                // Calcul de la date maximale
                if (maxDate === null || currentDate > maxDate) {
                    maxDate = currentDate;
                }
            }
        });

        return [minDate, maxDate, ""];
    }

    public sortRows(rows: HTMLElement[], asc: boolean) {
        rows.sort((a, b) => {
            const cellA = a.getElementsByTagName("td")[this.columnIndex];
            const cellB = b.getElementsByTagName("td")[this.columnIndex];
            const inputA = cellA?.querySelector("input, select") as HTMLInputElement | null;
            const inputB = cellB?.querySelector("input, select") as HTMLInputElement | null;
            const isValidA = inputA && !isNaN(new Date(inputA.value.trim()).getTime());
            const isValidB = inputB && !isNaN(new Date(inputB.value.trim()).getTime());
            if (isValidA && isValidB) {
                const cA = new Date(inputA.value.trim()).getTime();
                const cB = new Date(inputB.value.trim()).getTime();
                return asc ? cA - cB : cB - cA;
            } else if (isValidA) {
                return asc ? -1 : 1;
            } else if (isValidB) {
                return asc ? 1 : -1;
            } else {
                return 0;
            }
        });
        return rows;
    }

    public getCorrectDateTime(dd: Date) {
        const year = dd.getFullYear();
        const month = (dd.getMonth() + 1).toString().padStart(2, "0");
        const day = dd.getDate().toString().padStart(2, "0");
        const hours = dd.getHours().toString().padStart(2, "0");
        const minutes = dd.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    public fillCell(cell: HTMLElement, file: TFile, prop: string, value: Object | null) {
        cell.empty();
        const input = cell.createEl("input", { cls: "ptp-date-button" });
        input.setAttribute("filepath", file.path);
        input.setAttribute("prop", prop);
        input.type = this.dtype;
        if (value != null && value !== "") {
            let dd = new Date(value as string);
            if (this.dtype == "datetime-local") input.value = this.getCorrectDateTime(dd);
            else input.value = dd.toISOString().split("T")[0];
        } else {
            input.classList.add("ptp-date-gray-input");
        }

        input.addEventListener("change", async () => {
            const filep = input.getAttribute("filepath")!;
            const propp = input.getAttribute("prop")!;
            const rawVal = input.value;
            const dateValue = new Date(rawVal);
            let v2 = "";
            if (rawVal !== "") {
                v2 =
                    input.type === "datetime-local"
                        ? this.getCorrectDateTime(dateValue)
                        : dateValue.toISOString().split("T")[0];
                input.classList.remove("ptp-date-gray-input");
            } else {
                input.classList.add("ptp-date-gray-input");
            }
            await this.updateYamlProperty(filep, propp, v2, "update");
        });
        //		input.focus();
    }
}
