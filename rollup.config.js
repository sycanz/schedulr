import replace from "@rollup/plugin-replace";
import dotenv from "dotenv";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

dotenv.config();

const isProduction = process.env.BUILD === "prd";

const getReplacementValue = (prodVar, devVar) => {
    const val = isProduction ? process.env[prodVar] : process.env[devVar];
    if (isProduction && !val) {
        throw new Error(`CRITICAL: Missing mandatory production environment variable: ${prodVar}`);
    }
    return JSON.stringify(val || "");
};

const replacePlugin = replace({
    preventAssignment: true,
    __CLIENT_ID__: getReplacementValue("CLIENT_ID_PROD", "CLIENT_ID"),
    __CFW_AUTH_ENDPOINT__: getReplacementValue("CFW_AUTH_ENDPOINT_PROD", "CFW_AUTH_ENDPOINT_DEV"),
    __CFW_REFRESH_ENDPOINT__: getReplacementValue("CFW_REFRESH_ENDPOINT_PROD", "CFW_REFRESH_ENDPOINT_DEV"),
    __CFW_CHECK_RETURN_USER_ENDPOINT__: getReplacementValue("CFW_CHECK_RETURN_USER_ENDPOINT_PROD", "CFW_CHECK_RETURN_USER_ENDPOINT_DEV"),
    __CFW_GET_CALENDAR_ENDPOINT__: getReplacementValue("CFW_GET_CALENDAR_ENDPOINT_PROD", "CFW_GET_CALENDAR_ENDPOINT_DEV"),
    __CFW_ADD_NEW_EVENT_ENDPOINT__: getReplacementValue("CFW_ADD_NEW_EVENT_ENDPOINT_PROD", "CFW_ADD_NEW_EVENT_ENDPOINT_DEV"),
});

const resolvePlugins = [
    nodeResolve({
        browser: true,
        preferBuiltins: false,
    }),
    commonjs(),
    typescript(),
];

const frontendConfigs = [
    ["frontend/src/scripts/scraper/scraper.js", "frontend/dist/scraper.bundle.js", "iife", "scraperBundle"],
    ["frontend/src/scripts/auth/authFlow.js", "frontend/dist/authFlow.bundle.js", "es", "authFlowBundle"],
    [
        "frontend/src/scripts/calendar/calListQuery.js",
        "frontend/dist/calListQuery.bundle.js",
        "es",
        "calListQueryBundle",
    ],
].map(([input, file, format, name]) => ({
    input,
    output: { file, format, name },
    plugins: [replacePlugin],
}));

const backendConfigs = [
    {
        input: "backend/cloudflare-workers/src/lib/googleAuth.ts",
        output: {
            file: "backend/cloudflare-workers/dist/googleAuth.bundle.js",
            format: "es",
            name: "authFlowBundle",
        },
        plugins: [replacePlugin, ...resolvePlugins],
    },
    {
        input: "backend/cloudflare-workers/src/index.ts",
        output: {
            file: "backend/cloudflare-workers/dist/worker.js",
            format: "es",
        },
        plugins: resolvePlugins,
    },
];

export default [...frontendConfigs, ...backendConfigs];
