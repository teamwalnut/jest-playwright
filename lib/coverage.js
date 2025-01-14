"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCoverage = exports.saveCoverageOnPage = exports.saveCoverageToFile = exports.setupCoverage = void 0;
const uuid = __importStar(require("uuid"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const rimraf_1 = __importDefault(require("rimraf"));
const fsAsync = fs_1.default.promises;
// @ts-ignore
const nyc_1 = __importDefault(require("nyc"));
const constants_1 = require("./constants");
const NYC_DIR = '.nyc_output';
const COV_MERGE_DIR = path_1.default.join(NYC_DIR, 'merge');
const cleanMergeFiles = async () => {
    await util_1.promisify(rimraf_1.default)(COV_MERGE_DIR);
};
const setupCoverage = async () => {
    if (!fs_1.default.existsSync(NYC_DIR)) {
        await fsAsync.mkdir(NYC_DIR);
    }
    await cleanMergeFiles();
    await fsAsync.mkdir(COV_MERGE_DIR);
};
exports.setupCoverage = setupCoverage;
const saveCoverageToFile = async (coverage) => {
    await fsAsync.writeFile(path_1.default.join(COV_MERGE_DIR, `${uuid.v4()}.json`), JSON.stringify(coverage));
};
exports.saveCoverageToFile = saveCoverageToFile;
const saveCoverageOnPage = async (page, collectCoverage = false) => {
    if (!collectCoverage) {
        console.warn(`${constants_1.PACKAGE_NAME}: saveCoverage was called but collectCoverage is not true in config file`);
        return;
    }
    const coverage = await page.evaluate(`window.__coverage__`);
    if (coverage) {
        await exports.saveCoverageToFile(coverage);
    }
};
exports.saveCoverageOnPage = saveCoverageOnPage;
const mergeCoverage = async () => {
    const nyc = new nyc_1.default({
        _: ['merge'],
    });
    const map = await nyc.getCoverageMapFromAllCoverageFiles(COV_MERGE_DIR);
    const outputFile = path_1.default.join(NYC_DIR, 'coverage.json');
    const content = JSON.stringify(map, null, 2);
    await fsAsync.writeFile(outputFile, content);
    console.info(`Coverage file (${content.length} bytes) written to ${outputFile}`);
    await cleanMergeFiles();
};
exports.mergeCoverage = mergeCoverage;
