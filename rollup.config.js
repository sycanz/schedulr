import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

dotenv.config();

const sharedPlugins = [
    replace({
        preventAssignment: true,
        __CLIENT_ID__: JSON.stringify(process.env.CLIENT_ID),
        __CFW_AUTH_ENDPOINT__: JSON.stringify(process.env.CFW_AUTH_ENDPOINT_DEV),
        __CFW_REFRESH_ENDPOINT__: JSON.stringify(process.env.CFW_REFRESH_ENDPOINT_DEV),
    })
];

export default [
    {
        input: 'frontend/src/scripts/scraper/scraper.js',
        output: {
            file: 'frontend/dist/scraper.bundle.js',
            format: 'iife',
            name: 'scraperBundle',
        },
        plugins: sharedPlugins,
    },
    {
        input: 'frontend/src/scripts/auth/authFlow.js',
        output: {
            file: 'frontend/dist/authFlow.bundle.js',
            format: 'es',
            name: 'authFlowBundle',
        },
        plugins: sharedPlugins,
    }
];