"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_runner_1 = __importDefault(require("jest-runner"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const coverage_1 = require("./coverage");
const getBrowserTest = ({ test, config, browser, wsEndpoint, device, testTimeout, }) => {
    const { displayName, testEnvironmentOptions } = test.context.config;
    const playwrightDisplayName = utils_1.getDisplayName(config.displayName || browser, device);
    return {
        ...test,
        context: {
            ...test.context,
            config: {
                ...test.context.config,
                testEnvironmentOptions: {
                    ...testEnvironmentOptions,
                    [constants_1.CONFIG_ENVIRONMENT_NAME]: { ...config, testTimeout },
                },
                browserName: browser,
                wsEndpoint,
                device,
                displayName: {
                    name: displayName
                        ? `${playwrightDisplayName} ${displayName.name || displayName}`
                        : playwrightDisplayName,
                    color: (displayName === null || displayName === void 0 ? void 0 : displayName.color) || 'yellow',
                },
            },
        },
    };
};
const getDevices = (devices, availableDevices) => {
    let resultDevices = [];
    if (devices) {
        if (devices instanceof RegExp) {
            resultDevices = Object.keys(availableDevices).filter((item) => item.match(devices));
        }
        else {
            resultDevices = devices;
        }
    }
    return resultDevices;
};
const getJestTimeout = (configTimeout) => {
    if (configTimeout) {
        return configTimeout;
    }
    return process.env.PWDEBUG ? constants_1.DEBUG_TIMEOUT : constants_1.DEFAULT_TEST_PLAYWRIGHT_TIMEOUT;
};
class PlaywrightRunner extends jest_runner_1.default {
    constructor(globalConfig, context) {
        const config = { ...globalConfig };
        // Set testTimeout
        config.testTimeout = getJestTimeout(config.testTimeout);
        super(config, context);
        this.browser2Server = {};
        this.config = config;
    }
    async launchServer(config, wsEndpoint, browser, key, instance) {
        var _a;
        const { launchType, launchOptions, skipInitialization } = config;
        if (!skipInitialization && launchType === constants_1.SERVER && wsEndpoint === null) {
            if (!this.browser2Server[key]) {
                const options = utils_1.getBrowserOptions(browser, launchOptions);
                this.browser2Server[key] = await instance.launchServer(options);
            }
        }
        return wsEndpoint || ((_a = this.browser2Server[key]) === null || _a === void 0 ? void 0 : _a.wsEndpoint()) || null;
    }
    async getTests(tests, config) {
        const { browsers, devices, connectOptions, useDefaultBrowserType } = config;
        const pwTests = [];
        for (const test of tests) {
            for (const browser of browsers) {
                const browserType = utils_1.getBrowserType(typeof browser === 'string' ? browser : browser.name);
                const browserConfig = typeof browser === 'string'
                    ? config
                    : utils_1.deepMerge(config, browser || {});
                utils_1.checkBrowserEnv(browserType);
                const { devices: availableDevices, instance } = utils_1.getPlaywrightInstance(browserType);
                const resultDevices = getDevices(devices, availableDevices);
                const key = typeof browser === 'string'
                    ? browser
                    : utils_1.generateKey(browser.name, browserConfig);
                const browserOptions = utils_1.getBrowserOptions(browserType, connectOptions);
                const wsEndpoint = await this.launchServer(browserConfig, 'wsEndpoint' in browserOptions ? browserOptions.wsEndpoint : null, browserType, key, instance);
                const browserTest = {
                    test: test,
                    config: browserConfig,
                    wsEndpoint,
                    browser: browserType,
                    testTimeout: this.config.testTimeout,
                };
                if (resultDevices.length) {
                    resultDevices.forEach((device) => {
                        utils_1.checkDevice(device, availableDevices);
                        if (useDefaultBrowserType) {
                            const deviceBrowser = utils_1.getDeviceBrowserType(device, availableDevices);
                            if (deviceBrowser !== null && deviceBrowser !== browser)
                                return;
                        }
                        pwTests.push(getBrowserTest({ ...browserTest, device }));
                    });
                }
                else {
                    pwTests.push(getBrowserTest({ ...browserTest, device: null }));
                }
            }
        }
        return pwTests;
    }
    // @ts-ignore
    async runTests(tests, watcher, onStart, onResult, onFailure, options) {
        const { rootDir, testEnvironmentOptions } = tests[0].context.config;
        const config = await utils_1.readConfig(rootDir, testEnvironmentOptions[constants_1.CONFIG_ENVIRONMENT_NAME]);
        if (this.config.testNamePattern) {
            config.launchType = constants_1.LAUNCH;
            config.skipInitialization = true;
            config.haveSkippedTests = true;
        }
        const browserTests = await this.getTests(tests, config);
        if (config.collectCoverage) {
            await coverage_1.setupCoverage();
        }
        await super.runTests(browserTests, watcher, 
        // @ts-ignore - using new shape
        onStart, 
        // @ts-ignore - using new shape
        onResult, onFailure, options);
        for (const key in this.browser2Server) {
            await this.browser2Server[key].close();
        }
        if (config.collectCoverage) {
            await coverage_1.mergeCoverage();
        }
    }
}
exports.default = PlaywrightRunner;
