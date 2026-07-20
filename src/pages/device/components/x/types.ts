/* ===================== types ===================== */

export interface FieldOption {
    label?: string;
    labelKey?: string;
    value: number | string | boolean | null
    tagClass?: string;
}

export interface FormField {
    key: string;
    label?: string;
    labelKey?: string;
    type: "input" | "select" | "datetime" | "textarea" | "location" | "photo" | "image" | "tag" | "text";
    required?: boolean;
    placeholder?: string;
    options?: FieldOption[];
    large?: boolean;
    disabled?: boolean;
    /**
     * 展示布局
     * half: 默认两列
     * full: 占满一行
     */
    layout?: "half" | "full";


    /**
     * 展示格式化
     * entity detail 使用
     */
    formatter?: (
        value: any,
        entity: Record<string, any>
    ) => string;


    /**
     * tag 类型样式
     * 例如 status 状态展示
     */
    tagClass?: string;


    /**
     * 日期格式
     * entity detail 使用
     */
    format?: string;

    /**
     * 图片解析
     * @param value
     * @param row
     */
    imageResolver?: (value:any, row:any)=>Promise<string[]>;
}

export interface FormSection {
    title?: string;
    titleKey?: string;
    fields: FormField[];
}

export type Field =
    | {
    key: string;
    label?: string;
    labelKey?: string;
    className?: string;
    type: "input";
}
    | {
    key: string;
    label?: string;
    labelKey?: string;
    className?: string;
    type: "date";
}
    | {
    key: string;
    label?: string;
    labelKey?: string;
    type: "select";
    dict?: string;
    className?: string;
    options?: FieldOption[];
};

export type DictItem = {
    label?: string;
    labelKey: string;
    value: any;
};

export type ToolbarButtons = {

    add?:boolean;
    edit?:boolean;
    delete?:boolean;
    refresh?:boolean;

    bindDept?:boolean;
    bindValve?:boolean;

    import?:boolean;
    export?:boolean;

    detail?:boolean;
};

export interface XDataColumn {
    key:string;
    label?:string;
    labelKey?: string;
    width?:number;
    sortable?: boolean;
    align?:'left'|'center'|'right';
    type?:
        | 'text'
        | 'number'
        | 'time'
        | 'coord'
        | 'link'
        | 'image';
    className?:string;
    bodyClassName?:string;
    formatter?:(value:any,row:any)=>any;
    onClick?:(
        value:any,
        row:any
    )=>void;
    options?: {
        value: any;
        label?: string;
        labelKey?: string;
        tagClass?:string;
    }[];
}
