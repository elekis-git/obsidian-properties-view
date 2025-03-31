import { App, Modal } from "obsidian";

import FileColumn from "./FileColumn"
import DirColumn from "./DirColumn"
import TextColumn from "./TextColumn"

import BoolColumn from "./FileColumn"
import DateTimeColumn from "./DirColumn"
import DateColumn from "./TextColumn"

import Column from "./Column"
import IDColumn from "./IDColumn"
import ListColumn from "./ListColumn"
import IntColumn from "./ColumnData"



export class FilterModal extends Modal {
  col : Column;
  allowedValues: any[];
  onSubmit: (selectedValues: any[]) => void;
  selectedValues: Set<any>;

  constructor(
    app: App,
    col: Column,
    allowedValues: any[],
    onSubmit: (selectedValues: any[]) => void
  ) {
    super(app);
    this.col = col;
    this.allowedValues = allowedValues;
    this.onSubmit = onSubmit;
    this.selectedValues = new Set();
  }

  private createCheckbox(value: any, container: HTMLElement) {
    const checkbox = container.createEl("input", { attr: { type: "checkbox" } });
    if (this.col.getFilter() && this.col.getFilter().includes(value)) {
      checkbox.checked = true;
      this.selectedValues.add(value);
    }
    checkbox.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        this.selectedValues.add(value);
      } else {
        this.selectedValues.delete(value);
      }
    });
    container.createEl("label", { text: String(value) });
  }

  private createDateRangeFilter(contentEl: HTMLElement) {
    const { allowedValues } = this;
    const validDates = allowedValues.map(date => new Date(date)).filter(date => !isNaN(date.getTime()));

    const minDate = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null;
    const maxDate = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null;

    const createDateInput = (label: string, value: string | null, onClick: () => void) => {
      const container = contentEl.createEl("div", { cls: "filter-date-container" });
      container.createEl("label", { text: label });
      const input = container.createEl("input", { attr: { type: "date", value: value ? value.split("T")[0] : "" } });
      return { container, input };
    };

    const { input: fromInput } = createDateInput(
      "From : ",
      minDate ? minDate.toISOString() : null,
      () => { if (minDate) fromInput.value = minDate.toISOString().split("T")[0]; }
    );

    const { input: toInput } = createDateInput(
      "To : ",
      maxDate ? maxDate.toISOString() : null,
      () => { if (maxDate) toInput.value = maxDate.toISOString().split("T")[0]; }
    );

    const filterButton = contentEl.createEl("button", { text: "Filtrer" });
    filterButton.addEventListener("click", () => {
      this.onSubmit([fromInput.value ? new Date(fromInput.value).toISOString() : null, toInput.value ? new Date(toInput.value).toISOString() : null]);
      this.close();
    });

    const clearButton = contentEl.createEl("button", { text: "Clear Filter", cls: "clear-filter-button" });
    clearButton.addEventListener("click", () => {
      this.onSubmit([]); 
      this.close();
    });

    contentEl.appendChild(fromInput.parentElement!);
    contentEl.appendChild(toInput.parentElement!);
    contentEl.appendChild(filterButton);
    contentEl.appendChild(clearButton);
  }



  private createDefaultFilter(contentEl: HTMLElement) {
    this.allowedValues.sort().forEach((value) => {
      const container = contentEl.createEl("div", { cls: "filter-value-container" });
      this.createCheckbox(value, container);
    });

    const filterButton = contentEl.createEl("button", { text: "Filtrer" });
    filterButton.addEventListener("click", () => {
      this.onSubmit(Array.from(this.selectedValues));
      this.close();
    });

    const clearButton = contentEl.createEl("button", { text: "Clear Filter", cls: "clear-filter-button" });
    clearButton.addEventListener("click", () => {
      this.onSubmit([]); 
      this.close();
    });

    contentEl.appendChild(filterButton);
    contentEl.appendChild(clearButton);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: `Filtrer ${this.col.getPropertyName()}` });

    if (this.col instanceof DateTimeColumn || this.col instanceof DateTimeColumn) {
      this.createDateRangeFilter(contentEl);
    } else {
      this.createDefaultFilter(contentEl);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

