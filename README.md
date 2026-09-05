# eslint-plugin-ui5-webcomponents-react

ESLint-compatible plugin with rules for [@ui5/webcomponents-react](https://github.com/SAP/ui5-webcomponents-react). Works with both [ESLint](https://eslint.org) (v9+) and [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) via its JS plugin support.

## Rules

| Rule                                     | Description                                                                                  | Fixable |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| `ui5-webcomponents-react/use-theming-parameters` | Flags inline `var(--sap...)` CSS variable strings and replaces them with the type-safe `ThemingParameters` object. | Yes     |

## Installation

```bash
npm install -D eslint-plugin-ui5-webcomponents-react
```

## Oxlint (JS plugins)

Oxlint's plugin API is compatible with ESLint v9+, so this plugin works out of the box. Add it under `jsPlugins` and enable its rules under `rules`.

### using `oxlint.config.ts`

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["eslint-plugin-ui5-webcomponents-react"],
  rules: {
    "ui5-webcomponents-react/use-theming-parameters": "warn",
  },
});
```

### using `.oxlintrc.json`

```jsonc
{
  "jsPlugins": ["eslint-plugin-ui5-webcomponents-react"],
  "rules": {
    "ui5-webcomponents-react/use-theming-parameters": "warn"
  }
}
```

The rule name is derived from the plugin's `meta.name` (`eslint-plugin-` prefix is stripped). You can override it with an [alias](https://oxc.rs/docs/guide/usage/linter/js-plugins.html#plugin-aliases):

```jsonc
{
  "jsPlugins": [{ "name": "ui5", "specifier": "eslint-plugin-ui5-webcomponents-react" }],
  "rules": {
    "ui5/use-theming-parameters": "warn"
  }
}
```

Both rules are auto-fixable, so run `oxlint --fix` (or apply quick-fixes in your editor) to replace the strings and insert the missing import automatically.

## ESLint (flat config)

This plugin ships an ESLint `meta.name` and a `configs.recommended` export. Using the plugin directly:

```js
// eslint.config.js
import ui5WebComponentsReact from "eslint-plugin-ui5-webcomponents-react";

export default [
  {
    plugins: {
      "ui5-webcomponents-react": ui5WebComponentsReact,
    },
    rules: {
      "ui5-webcomponents-react/use-theming-parameters": "warn",
    },
  },
];
```

Or with the recommended preset:

```js
// eslint.config.js
import ui5WebComponentsReact from "eslint-plugin-ui5-webcomponents-react";

export default [
  ui5WebComponentsReact.configs.recommended,
];
```

## Rule options

`use-theming-parameters` accepts an optional options object:

| Option         | Default                                                          | Description                                   |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| `importSource` | `@ui5/webcomponents-react-base/ThemingParameters`                | Module that exports the theming parameters.   |
| `objectName`   | `ThemingParameters`                                              | Identifier used for the replacement and import. |

```jsonc
{
  "rules": {
    "ui5-webcomponents-react/use-theming-parameters": ["warn", { "importSource": "@ui5/webcomponents-react-base", "objectName": "Theme" }]
  }
}
```

## Development

```bash
bun install        # install dependencies
bun test           # run tests
bun run typecheck  # typecheck
bun run lint       # lint with oxlint
bun run build      # build the plugin
```