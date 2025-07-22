import { ChangeEventHandler } from "react";

interface ColumnObject {
  dataField: string;
  type: string;
  custom?: string;
  headerStyle: object;
  headerClassName: string;
  caption: string;
  className: string;
  isLower?: Function;
  isHigher?: Function;
  classFunc?: Function;

  style: object;
  options?: Array<{
    label: string;
    value: string;
    id: number;
  }>;
  elem: Function;
  render: Function;
  columnType: string;
}

export interface CustomtableProps {
  data: Array<any>;
  columns: Array<ColumnObject>;
  tableScrollClass: object;
  selectAllProducts: ChangeEventHandler;
  header?: boolean;
  loading?: boolean;
  tableName?: string,
  startDate?: string,
  endDate?: string
}