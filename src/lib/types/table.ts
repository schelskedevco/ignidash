/**
 * Generic table column definition
 * @template T - The data type for table rows
 */
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  format?: (value: T[keyof T]) => string;
}
