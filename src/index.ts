import { definePlugin } from "@oxlint/plugins";
import { useThemingParameters } from "./rules/use-theming-parameters.js";

const PLUGIN_NAME = "ui5-webcomponents-react";

const plugin = definePlugin({
  meta: {
    name: "eslint-plugin-ui5-webcomponents-react",
  },
  rules: {
    "use-theming-parameters": useThemingParameters,
  },
});

export const configs = {
  recommended: {
    plugins: {
      [PLUGIN_NAME]: plugin,
    },
    rules: {
      [`${PLUGIN_NAME}/use-theming-parameters`]: "warn",
    },
  },
};

export default plugin;
