"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* global jestPlaywright, browserName, deviceName */
/* eslint-disable @typescript-eslint/no-explicit-any*/
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const DEBUG_OPTIONS = {
    launchOptions: {
        headless: false,
        devtools: true,
    },
};
const runDebugTest = (jestTestType, ...args) => {
    const isConfigProvided = typeof args[0] === 'object';
    const lastArg = args[args.length - 1];
    const timer = typeof lastArg === 'number' ? lastArg : constants_1.DEBUG_TIMEOUT;
    // TODO Looks weird - need to be rewritten
    let options = DEBUG_OPTIONS;
    if (isConfigProvided) {
        options = utils_1.deepMerge(DEBUG_OPTIONS, args[0]);
    }
    jestTestType(args[isConfigProvided ? 1 : 0], async () => {
        const envArgs = await jestPlaywright.configSeparateEnv(options, true);
        try {
            await args[isConfigProvided ? 2 : 1](envArgs);
        }
        finally {
            await envArgs.browser.close();
        }
    }, timer);
};
// @ts-ignore
it.jestPlaywrightDebug = (...args) => {
    runDebugTest(it, ...args);
};
it.jestPlaywrightDebug.only = (...args) => {
    runDebugTest(it.only, ...args);
};
it.jestPlaywrightDebug.skip = (...args) => {
    runDebugTest(it.skip, ...args);
};
const runConfigTest = (jestTypeTest, playwrightOptions, ...args) => {
    const lastArg = args[args.length - 1];
    const timer = typeof lastArg === 'number'
        ? lastArg
        : global[constants_1.CONFIG_ENVIRONMENT_NAME].testTimeout;
    jestTypeTest(args[0], async () => {
        const envArgs = await jestPlaywright.configSeparateEnv(playwrightOptions);
        try {
            await args[1](envArgs);
        }
        finally {
            await envArgs.browser.close();
        }
    }, timer);
};
//@ts-ignore
it.jestPlaywrightConfig = (playwrightOptions, ...args) => {
    runConfigTest(it, playwrightOptions, ...args);
};
it.jestPlaywrightConfig.only = (...args) => {
    runConfigTest(it.only, ...args);
};
it.jestPlaywrightConfig.skip = (...args) => {
    runConfigTest(it.skip, ...args);
};
const customSkip = (skipOption, type, ...args) => {
    const skipFlag = utils_1.getSkipFlag(skipOption, browserName, deviceName);
    if (skipFlag) {
        // @ts-ignore
        global[type].skip(...args);
    }
    else {
        // @ts-ignore
        global[type](...args);
    }
};
it.jestPlaywrightSkip = (skipOption, ...args) => {
    customSkip(skipOption, 'it', ...args);
};
//@ts-ignore
describe.jestPlaywrightSkip = (skipOption, ...args) => {
    customSkip(skipOption, 'describe', ...args);
};
beforeEach(async () => {
    if (global[constants_1.CONFIG_ENVIRONMENT_NAME].resetContextPerTest) {
        await jestPlaywright.resetContext();
    }
});
