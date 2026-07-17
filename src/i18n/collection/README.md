# I18n String Collection

This folder stores the first-pass language-pack collection for the current codebase.

- Source root: `src`
- Generated at: `2026-07-17T04:00:17.516Z`
- Unique Chinese UI strings: `2295`
- Generated file: `zh-CN.todo.json`

The collection is intentionally not imported by the app yet. Use it as the source list when creating `zh-CN.ts` and `en-US.ts`, then replace page literals with `t("...")` module by module.

| Module | Unique strings |
| --- | ---: |
| appShell | 63 |
| command | 289 |
| common.admin | 3 |
| dataAnalysis | 148 |
| dataReceive | 212 |
| device | 43 |
| leakMonitor | 143 |
| leakReport | 543 |
| login | 26 |
| misc | 234 |
| partition | 146 |
| system | 276 |
| utils | 13 |
| workOrder | 156 |

## Refresh

```bash
node scripts/collect-i18n-strings.mjs
```
