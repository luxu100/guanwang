/** 指令模块通用表格列定义。 */
export interface CommandTableColumn {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "center" | "right";
  className?: string;
  bodyClassName?: string;
  tooltip?: boolean;
  formatter?: (value: any, row: any) => any;
}
