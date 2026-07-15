import type {FieldOption} from "@/pages/device/components/x/types";

/**
 * =========================
 * options（字典）
 * =========================
 */
export const deviceTypeOptions: FieldOption[] = [
    { labelKey: "common.all", value: null },
    { labelKey: "status.product.TCP", value: "TCP" },
    { labelKey: "status.product.NB", value: "NB" },
];

export const enableStateOptions: FieldOption[] = [
    { labelKey: "common.all", value: null },
    { labelKey: "status.status.enabled", value: 1 },
    { labelKey: "status.status.disabled", value: 0 },
];

export const maintainTypeOptions: FieldOption[] = [
    { labelKey: "common.all", value: null },
    { labelKey: "status.maintain.remove", value: 0 },
    { labelKey: "status.maintain.install", value: 1 },
    { labelKey: "status.maintain.maintenance", value: 2 },
    { labelKey: "status.maintain.inspect", value: 3 },
];

export const installStateOptions: FieldOption[] = [
    { labelKey: "common.all", value: null },
    { labelKey: "status.install.installed", value: 1 },
    { labelKey: "status.install.uninstalled", value: 0 },
];

export const onlineStatusOptions: FieldOption[] = [
    { labelKey: "common.all", value: null },
    { labelKey: "status.online.online", value: 1 },
    { labelKey: "status.online.offline", value: 0 },
];