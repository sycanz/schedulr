import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/node_modules/", "frontend/dist/", "**/backend/"]), {
    extends: compat.extends("eslint:recommended"),

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.webextensions,
            scraperBundle: "readonly",
            authFlowBundle: "readonly",
            calListQueryBundle: "readonly",
            __CLIENT_ID__: "readonly",
            __CFW_AUTH_ENDPOINT__: "readonly",
            __CFW_REFRESH_ENDPOINT__: "readonly",
            __CFW_CHECK_RETURN_USER_ENDPOINT__: "readonly",
            __CFW_GET_CALENDAR_ENDPOINT__: "readonly",
            __CFW_ADD_NEW_EVENT_ENDPOINT__: "readonly",
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "no-unused-vars": "warn",
        "no-console": "off",
        semi: ["error", "always"],

        quotes: ["error", "double", {
            avoidEscape: true,
        }],
    },
}]);