import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignorer le dossier coverage
    "coverage/**",
  ]),
  // Règles globales personnalisées
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Désactiver la règle any pour ce projet (trop d'utilisations existantes)
      "@typescript-eslint/no-explicit-any": "off",
      // Mettre en warning les variables non utilisées
      "@typescript-eslint/no-unused-vars": "warn",
      // Désactiver l'erreur pour les interfaces vides
      "@typescript-eslint/no-empty-object-type": "off",
      // Apostrophes non échappées - mettre en warning
      "react/no-unescaped-entities": "warn",
      // prefer-const - mettre en warning
      "prefer-const": "warn",
      // Désactiver la règle error-boundaries (nécessite refactorisation)
      "react-hooks/error-boundaries": "off",
      // Composants statiques créés pendant le render - désactiver
      "react-hooks/static-components": "off",
      // Dépendances de hooks - mettre en warning
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Règles spécifiques pour les fichiers de test
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
