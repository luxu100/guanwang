export interface ConfirmActionOptions {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export function confirmAction(options: ConfirmActionOptions) {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: options.title || "操作确认",
      content: options.content,
      confirmText: options.confirmText || "确认",
      cancelText: options.cancelText || "取消",
      confirmColor: options.confirmColor || "#0d82ee",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false),
    });
  });
}

export function confirmDangerAction(options: ConfirmActionOptions) {
  return confirmAction({
    ...options,
    confirmText: options.confirmText || "删除",
    confirmColor: options.confirmColor || "#ef4444",
  });
}
