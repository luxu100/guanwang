/* ===================== types ===================== */

export interface FieldOption {
    label: string;
    value: number | string;
}

export interface FormField {
    key: string;
    label: string;
    type: "input" | "select" | "datetime" | "textarea" | "location";
    required?: boolean;
    placeholder?: string;
    options?: FieldOption[];
    large?: boolean;
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

};