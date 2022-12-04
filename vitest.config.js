import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["./tests/setup.js"],
        environment: "happy-dom"
    },
});
