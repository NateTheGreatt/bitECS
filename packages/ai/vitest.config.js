import {defineConfig} from 'vitest/config';
import {loadEnv} from 'vite'
import { config } from "dotenv";

export default defineConfig({
    test: {
        testTimeout: 30000
    },
});