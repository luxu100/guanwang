# I18n Draft

This directory contains the first language-pack collection and lightweight runtime helper for the admin UI.

- `index.ts`: runtime helper with `t()`, `useI18n()`, `setLocale()`, local storage, and user default language helpers.
- `types.ts`: locale and interpolation types.
- `locales/zh-CN.ts`: curated Chinese keys for shared UI, AppShell, menus, login, system, data reception, device, and work order modules.
- `locales/en-US.ts`: matching English draft translations.
- `collection/zh-CN.todo.json`: generated first-pass collection of Chinese UI strings that still need review and migration.

Pages are not migrated yet. Use the helper while replacing literals module by module:

```ts
import { useI18n } from "@/i18n";

const { t, locale, setLocale } = useI18n();
```

```vue
<text>{{ t("system.user.saveUser") }}</text>
```

Use `applyUserLocale(userInfo)` after login if the backend returns `locale`, `defaultLanguage`, or `language` on `userInfo`.

Refresh the collection after new pages or visible text changes:

```bash
node scripts/collect-i18n-strings.mjs
```
