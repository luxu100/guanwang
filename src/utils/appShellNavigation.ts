export type AppShellNavigationGuard = (targetPath: string) => boolean | Promise<boolean>;

let navigationGuard: AppShellNavigationGuard | null = null;

export function registerAppShellNavigationGuard(guard: AppShellNavigationGuard) {
  navigationGuard = guard;
  return () => {
    if (navigationGuard === guard) navigationGuard = null;
  };
}

export function runAppShellNavigationGuard(targetPath: string) {
  return navigationGuard ? navigationGuard(targetPath) : true;
}
