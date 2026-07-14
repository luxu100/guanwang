/* ===================== types ===================== */

export interface FieldOption {
    label: string;
    value: number | string | boolean;
}

export interface FormField {
    key: string;
    label: string;
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
}

export interface FormSection {
    title: string;
    fields: FormField[];
}

export type Field =
    | { key: string; label?: string; labelKey: string; type: "input" }
    | { key: string; label?: string; labelKey: string; type: "date" }
    | { key: string; label?: string; labelKey: string; type: "select"; dict: string };

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