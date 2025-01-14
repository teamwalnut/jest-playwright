"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.readConfig = exports.getSkipFlag = exports.getBrowserOptions = exports.getPlaywrightInstance = exports.getDeviceBrowserType = exports.generateKey = exports.getBrowserType = exports.getDisplayName = exports.checkDevice = exports.checkDeviceEnv = exports.deepMerge = exports.checkBrowserEnv = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const fsPromises = fs_1.default.promises;
const BROWSERS = [constants_1.CHROMIUM, constants_1.FIREFOX, constants_1.WEBKIT];
class PlaywrightError extends Error {
    constructor(message) {
        super(exports.formatError(message));
        this.name = 'PlaywrightError';
    }
}
const checkBrowserEnv = (param) => {
    if (!BROWSERS.includes(param)) {
        throw new PlaywrightError(`Wrong browser type. Should be one of [${BROWSERS.join(', ')}], but got ${param}`);
    }
};
exports.checkBrowserEnv = checkBrowserEnv;
/* eslint-disable @typescript-eslint/no-explicit-any*/
const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};
const deepMerge = (target, source) => {
    let output = { ...target };
    const keys = Object.keys(source);
    if (isObject(target) && isObject(source)) {
        keys.forEach((key) => {
            if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                output = { ...output, [key]: [...source[key], ...target[key]] };
            }
            else if (isObject(source[key])) {
                if (!(key in target)) {
                    output = { ...output, [key]: source[key] };
                }
                else {
                    output[key] = exports.deepMerge(target[key], source[key]);
                }
            }
            else {
                output = { ...output, [key]: source[key] };
            }
        });
    }
    return output;
};
exports.deepMerge = deepMerge;
const checkDeviceEnv = (device, availableDevices) => {
    if (!availableDevices.includes(device)) {
        throw new PlaywrightError(`Wrong device. Should be one of [${availableDevices}], but got ${device}`);
    }
};
exports.checkDeviceEnv = checkDeviceEnv;
const checkDevice = (device, availableDevices) => {
    if (typeof device === 'string') {
        const availableDeviceNames = Object.keys(availableDevices);
        exports.checkDeviceEnv(device, availableDeviceNames);
    }
};
exports.checkDevice = checkDevice;
const getDisplayName = (browser, device) => {
    const result = `browser: ${browser}`;
    if (device !== null) {
        if (typeof device === 'string') {
            return `${result} device: ${device}`;
        }
        if (device.name) {
            return `${result} device: ${device.name}`;
        }
    }
    return result;
};
exports.getDisplayName = getDisplayName;
const getBrowserType = (browser) => {
    return browser || constants_1.CHROMIUM;
};
exports.getBrowserType = getBrowserType;
const generateKey = (browser, config) => `${browser}${JSON.stringify(config)}`;
exports.generateKey = generateKey;
const getDeviceBrowserType = (device, availableDevices) => {
    if (typeof device === 'string') {
        return availableDevices[device].defaultBrowserType;
    }
    return (device === null || device === void 0 ? void 0 : device.defaultBrowserType) || null;
};
exports.getDeviceBrowserType = getDeviceBrowserType;
const getPlaywrightInstance = (browserName) => {
    let pw;
    let name;
    if (!browserName) {
        pw = require(constants_1.IMPORT_KIND_PLAYWRIGHT);
        name = constants_1.IMPORT_KIND_PLAYWRIGHT;
        return {
            name,
            instance: pw,
            devices: pw['devices'],
        };
    }
    try {
        pw = require(`${constants_1.IMPORT_KIND_PLAYWRIGHT}-${browserName}`);
        name = browserName;
    }
    catch (e) {
        try {
            pw = require(constants_1.IMPORT_KIND_PLAYWRIGHT);
            name = constants_1.IMPORT_KIND_PLAYWRIGHT;
        }
        catch (e) {
            throw new PlaywrightError(`Cannot find playwright package to use ${browserName}`);
        }
    }
    if (!pw[browserName]) {
        throw new PlaywrightError(`Cannot find playwright package to use ${browserName}`);
    }
    return {
        name,
        instance: pw[browserName],
        devices: pw['devices'],
    };
};
exports.getPlaywrightInstance = getPlaywrightInstance;
function getBrowserOptions(browserName, options) {
    let result = options ? { ...options } : {};
    if (result[browserName]) {
        result = exports.deepMerge(result, result[browserName]);
    }
    BROWSERS.forEach((browser) => {
        delete result[browser];
    });
    return result;
}
exports.getBrowserOptions = getBrowserOptions;
const getSkipFlag = (skipOptions, browserName, deviceName) => {
    const { browsers, devices } = skipOptions;
    const isBrowserIncluded = browsers.includes(browserName);
    if (!devices) {
        return isBrowserIncluded;
    }
    else {
        if (devices instanceof RegExp) {
            return isBrowserIncluded && devices.test(deviceName);
        }
        return isBrowserIncluded && devices.includes(deviceName);
    }
};
exports.getSkipFlag = getSkipFlag;
const readConfig = async (rootDir = process.cwd(), jestEnvConfig) => {
    if (jestEnvConfig) {
        return { ...constants_1.DEFAULT_CONFIG, ...jestEnvConfig };
    }
    const { JEST_PLAYWRIGHT_CONFIG, npm_package_type } = process.env;
    const fileExtension = npm_package_type === 'module' ? 'cjs' : 'js';
    const configPath = JEST_PLAYWRIGHT_CONFIG ||
        `${constants_1.CONFIG_ENVIRONMENT_NAME}.config.${fileExtension}`;
    const absConfigPath = path_1.default.resolve(rootDir, configPath);
    try {
        await fsPromises.access(absConfigPath);
    }
    catch (e) {
        if (JEST_PLAYWRIGHT_CONFIG) {
            throw new PlaywrightError(`Can't find a root directory while resolving a config file path.\nProvided path to resolve: ${configPath}`);
        }
        else {
            return constants_1.DEFAULT_CONFIG;
        }
    }
    const localConfig = await require(absConfigPath);
    if (typeof localConfig === 'function') {
        const config = await localConfig();
        return { ...constants_1.DEFAULT_CONFIG, ...config };
    }
    return { ...constants_1.DEFAULT_CONFIG, ...localConfig };
};
exports.readConfig = readConfig;
const formatError = (error) => `${constants_1.PACKAGE_NAME}: ${error}`;
exports.formatError = formatError;
