# I18n String Collection

This folder stores the first-pass language-pack collection for the current codebase.

- Source root: `src`
- Generated at: `2026-06-29T07:11:03.527Z`
- Unique Chinese UI strings: `1107`
- Generated file: `zh-CN.todo.json`

The collection is intentionally not imported by the app yet. Use it as the source list when creating `zh-CN.ts` and `en-US.ts`, then replace page literals with `t("...")` module by module.

| Module | Unique strings |
| --- | ---: |
| appShell | 104 |
| common.admin | 3 |
| dataReceive | 184 |
| device | 139 |
| leakMonitor | 3 |
| leakReport | 239 |
| login | 28 |
| partition | 50 |
| system | 199 |
| utils | 6 |
| workOrder | 152 |

## Refresh

```bash
node scripts/collect-i18n-strings.mjs
```
