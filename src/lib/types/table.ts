/**
 * Table Types - Generic table component interfaces
 *
 * This module provides generic type definitions for table components.
 * These types are reusable across different table implementations and
 * maintain separation between generic table logic and specific data schemas.
 */

/**
 * Generic table column definition
 * @template T - The data type for table rows
 */
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  format?: (value: T[keyof T]) => string;
}
