import { defineRule } from "@oxlint/plugins";
import type { Ranged, Suggestion } from "@oxlint/plugins";

export interface UseThemingParametersOptions {
  importSource?: string;
  objectName?: string;
}

const SAP_VAR_PATTERN = /^var\(\s*--(sap[A-Za-z0-9_-]+)\s*\)$/;

function cssVarToReplacement(name: string, objectName: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return `${objectName}.${name}`;
  }
  return `${objectName}[${JSON.stringify(name)}]`;
}

function importSourceMatches(source: unknown, importSource: string): boolean {
  const value =
    (source as { resolved?: { value?: string } }).resolved?.value ??
    (source as { value?: string }).value;
  return Boolean(
    value === importSource || (value !== undefined && value.endsWith("/ThemingParameters")),
  );
}

export const useThemingParameters = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Avoid inline `var(--sap...)` CSS variable strings and use the type-safe ThemingParameters object instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          importSource: {
            type: "string",
          },
          objectName: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
    hasSuggestions: true,
    messages: {
      useThemingParameters:
        "Avoid inline CSS variable strings. Use the type-safe ThemingParameters object instead: {{ replacement }}.",
      replaceWithThemingParameter: "Replace with `{{ replacement }}`.",
      replaceAndImportThemingParameter:
        "Replace with `{{ replacement }}` and import ThemingParameters.",
    },
    defaultOptions: [
      {
        importSource: "@ui5/webcomponents-react-base/ThemingParameters",
        objectName: "ThemingParameters",
      },
    ],
  },
  create(context) {
    const [options = {}] = context.options as unknown as [
      UseThemingParametersOptions | undefined,
    ];
    const importSource =
      options.importSource ?? "@ui5/webcomponents-react-base/ThemingParameters";
    const objectName = options.objectName ?? "ThemingParameters";
    let themingParametersImported = false;

    const checkStringValue = (
      node: Ranged,
      replacementRange: [number, number],
      value: string,
    ) => {
      const match = SAP_VAR_PATTERN.exec(value);
      if (!match) return;
      const replacement = cssVarToReplacement(match[1]!, objectName);

      const suggestions: Suggestion[] = [
        {
          messageId: "replaceWithThemingParameter",
          data: { replacement },
          fix: (fixer) => fixer.replaceTextRange(replacementRange, replacement),
        },
      ];

      if (!themingParametersImported) {
        suggestions.push({
          messageId: "replaceAndImportThemingParameter",
          data: { replacement },
          fix: (fixer) => [
            fixer.replaceTextRange(replacementRange, replacement),
            fixer.insertTextBeforeRange(
              [0, 0],
              `import { ${objectName} } from '${importSource}';\n`,
            ),
          ],
        });
      }

      context.report({
        node,
        messageId: "useThemingParameters",
        data: { replacement },
        suggest: suggestions,
      });
    };

    return {
      Program(node) {
        for (const statement of node.body) {
          if (statement.type !== "ImportDeclaration") continue;
          const specifiers = (statement as unknown as {
            specifiers: Array<{ type: string; imported?: { name?: string; value?: string } }>;
          }).specifiers;
          if (!importSourceMatches(statement.source, importSource)) continue;
          for (const specifier of specifiers) {
            if (
              specifier.type === "ImportSpecifier" &&
              (specifier.imported?.name === objectName || specifier.imported?.value === objectName)
            ) {
              themingParametersImported = true;
            }
          }
        }
      },
      Literal(node) {
        if (typeof node.value !== "string") return;
        checkStringValue(node, [node.range[0], node.range[1]], node.value);
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        const quasi = node.quasis[0];
        if (!quasi) return;
        const cooked = quasi.value.cooked;
        if (cooked == null) return;
        checkStringValue(node, [quasi.range[0], quasi.range[1]], cooked);
      },
    };
  },
});