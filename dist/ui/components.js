"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIUtils = exports.SelectField = exports.InputField = exports.Button = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
/**
 * Terminal-based button component
 */
class Button {
    constructor(config) {
        this.config = config;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const styledLabel = this.getStyledLabel();
            console.log(`\n${styledLabel}`);
            yield this.config.action();
        });
    }
    getStyledLabel() {
        const { label, style = 'primary' } = this.config;
        switch (style) {
            case 'primary':
                return chalk_1.default.blue.bold(`▶ ${label}`);
            case 'secondary':
                return chalk_1.default.gray(`○ ${label}`);
            case 'danger':
                return chalk_1.default.red.bold(`⚠ ${label}`);
            default:
                return label;
        }
    }
}
exports.Button = Button;
/**
 * Terminal-based input field component
 */
class InputField {
    constructor(config) {
        this.config = config;
    }
    prompt() {
        return __awaiter(this, void 0, void 0, function* () {
            const answers = yield inquirer_1.default.prompt([
                {
                    type: this.config.type || 'input',
                    name: this.config.name,
                    message: this.config.message,
                    default: this.config.default,
                    validate: this.config.validate
                }
            ]);
            return answers[this.config.name];
        });
    }
}
exports.InputField = InputField;
/**
 * Terminal-based select field component
 */
class SelectField {
    constructor(config) {
        this.config = config;
    }
    prompt() {
        return __awaiter(this, void 0, void 0, function* () {
            const answers = yield inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: this.config.name,
                    message: this.config.message,
                    choices: this.config.choices,
                    pageSize: this.config.pageSize || 10
                }
            ]);
            return answers[this.config.name];
        });
    }
}
exports.SelectField = SelectField;
/**
 * Utility functions for terminal UI
 */
class UIUtils {
    static displayHeader(title) {
        console.log('\n' + chalk_1.default.cyan('='.repeat(60)));
        console.log(chalk_1.default.cyan.bold(`  ${title}`));
        console.log(chalk_1.default.cyan('='.repeat(60)) + '\n');
    }
    static displaySuccess(message) {
        console.log(chalk_1.default.green.bold(`✅ ${message}`));
    }
    static displayError(message) {
        console.log(chalk_1.default.red.bold(`❌ ${message}`));
    }
    static displayWarning(message) {
        console.log(chalk_1.default.yellow.bold(`⚠️  ${message}`));
    }
    static displayInfo(message) {
        console.log(chalk_1.default.blue(`ℹ️  ${message}`));
    }
    static displayProgress(message) {
        console.log(chalk_1.default.gray(`⏳ ${message}...`));
    }
    static displayTable(data, headers) {
        if (data.length === 0) {
            console.log(chalk_1.default.gray('No data to display'));
            return;
        }
        const table = data.map(row => {
            if (typeof row === 'object') {
                return Object.values(row);
            }
            return [row];
        });
        // Simple table formatting
        table.forEach((row, index) => {
            if (index === 0 && headers) {
                console.log(chalk_1.default.bold(headers.join(' | ')));
                console.log(chalk_1.default.gray('-'.repeat(headers.join(' | ').length)));
            }
            console.log(row.join(' | '));
        });
    }
}
exports.UIUtils = UIUtils;
