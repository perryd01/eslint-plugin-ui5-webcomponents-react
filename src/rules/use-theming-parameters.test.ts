import { describe, it } from "bun:test";
import { RuleTester } from "eslint";
import { useThemingParameters } from "./use-theming-parameters.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

describe("use-theming-parameters", () => {
  ruleTester.run(
    "flags inline sap CSS variables in JSX style props",
    useThemingParameters as never,
    {
      valid: [
        `<div style={{ color: ThemingParameters.sapNegativeColor }} />;`,
        `<div style={{ color: 'red' }} />;`,
        `const x = 'var(--foo)';`,
        `const x = 'var(--sapNegativeColor, red)';`,
        "const x = `var(--sapNegativeColor, ${fallback})`;",
        `const styles = { color: 'var(--notSapSomething)' };`,
      ],
      invalid: [
        {
          code: `<div style={{ color: 'var(--sapNegativeColor)' }} />;`,
          errors: [{ messageId: "useThemingParameters" }],
          output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\n<div style={{ color: ThemingParameters.sapNegativeColor }} />;`,
        },
      ],
    },
  );

  ruleTester.run("fixes multiple occurrences in one style prop", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\n<span style={{ color: 'var(--sapNegativeColor)', fontSize: 'var(--sapFontLargeSize)' }}>My Text</span>;`,
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: "ThemingParameters.sapNegativeColor" },
          },
          {
            messageId: "useThemingParameters",
            data: { replacement: "ThemingParameters.sapFontLargeSize" },
          },
        ],
        output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\n<span style={{ color: ThemingParameters.sapNegativeColor, fontSize: ThemingParameters.sapFontLargeSize }}>My Text</span>;`,
      },
    ],
  });

  ruleTester.run("fixes variables in styles object outside JSX", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: `const styles = { background: 'var(--sapBackgroundColor)' };`,
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: "ThemingParameters.sapBackgroundColor" },
          },
        ],
        output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\nconst styles = { background: ThemingParameters.sapBackgroundColor };`,
      },
    ],
  });

  ruleTester.run("fixes template literal without interpolation", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: "const x = `var(--sapFontLargeSize)`;",
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: "ThemingParameters.sapFontLargeSize" },
          },
        ],
        output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\nconst x = ThemingParameters.sapFontLargeSize;`,
      },
    ],
  });

  ruleTester.run("handles names that require bracket access", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: `const x = 'var(--sapFontUrl_SAP-icons_woff2)';`,
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: 'ThemingParameters["sapFontUrl_SAP-icons_woff2"]' },
          },
        ],
        output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\nconst x = ThemingParameters["sapFontUrl_SAP-icons_woff2"];`,
      },
    ],
  });

  ruleTester.run("does not add an import when already imported", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\nconst x = 'var(--sapNegativeColor)';`,
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: "ThemingParameters.sapNegativeColor" },
          },
        ],
        output: `import { ThemingParameters } from '@ui5/webcomponents-react-base/ThemingParameters';\nconst x = ThemingParameters.sapNegativeColor;`,
      },
    ],
  });

  ruleTester.run("respects custom options", useThemingParameters as never, {
    valid: [],
    invalid: [
      {
        code: `const x = 'var(--sapNegativeColor)';`,
        options: [{ importSource: "@ui5/webcomponents-react-base", objectName: "Theme" }],
        errors: [
          {
            messageId: "useThemingParameters",
            data: { replacement: "Theme.sapNegativeColor" },
          },
        ],
        output: `import { Theme } from '@ui5/webcomponents-react-base';\nconst x = Theme.sapNegativeColor;`,
      },
    ],
  });
});
