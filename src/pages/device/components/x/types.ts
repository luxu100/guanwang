/* ===================== types ===================== */

export interface FieldOption {
    label: string;
    value: number | string;
}

export interface FormField {
    key: string;
    label: string;
    type: "input" | "select" | "datetime" | "textarea";
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
    | { key: string; label: string; type: "input" }
    | { key: string; label: string; type: "date" }
    | { key: string; label: string; type: "select"; dict: string };

export type DictItem = {
    label: string;
    value: any;
};
