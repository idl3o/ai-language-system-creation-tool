import chalk from 'chalk';
import inquirer from 'inquirer';

export interface ButtonConfig {
    label: string;
    action: () => void | Promise<void>;
    style?: 'primary' | 'secondary' | 'danger';
}

export interface InputFieldConfig {
    name: string;
    message: string;
    type?: 'input' | 'password' | 'number';
    default?: string;
    validate?: (input: string) => boolean | string;
}

export interface SelectOption {
    name: string;
    value: any;
    short?: string;
}

export interface SelectFieldConfig {
    name: string;
    message: string;
    choices: SelectOption[];
    pageSize?: number;
}

/**
 * Terminal-based button component
 */
export class Button {
    constructor(private config: ButtonConfig) {}

    async execute(): Promise<void> {
        const styledLabel = this.getStyledLabel();
        console.log(`\n${styledLabel}`);
        await this.config.action();
    }

    private getStyledLabel(): string {
        const { label, style = 'primary' } = this.config;
        
        switch (style) {
            case 'primary':
                return chalk.blue.bold(`▶ ${label}`);
            case 'secondary':
                return chalk.gray(`○ ${label}`);
            case 'danger':
                return chalk.red.bold(`⚠ ${label}`);
            default:
                return label;
        }
    }
}

/**
 * Terminal-based input field component
 */
export class InputField {
    constructor(private config: InputFieldConfig) {}

    async prompt(): Promise<string> {
        const answers = await inquirer.prompt([
            {
                type: this.config.type || 'input',
                name: this.config.name,
                message: this.config.message,
                default: this.config.default,
                validate: this.config.validate
            }
        ]);
        
        return answers[this.config.name];
    }
}

/**
 * Terminal-based select field component
 */
export class SelectField {
    constructor(private config: SelectFieldConfig) {}

    async prompt(): Promise<any> {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: this.config.name,
                message: this.config.message,
                choices: this.config.choices,
                pageSize: this.config.pageSize || 10
            }
        ]);
        
        return answers[this.config.name];
    }
}

/**
 * Utility functions for terminal UI
 */
export class UIUtils {
    static displayHeader(title: string): void {
        console.log('\n' + chalk.cyan('='.repeat(60)));
        console.log(chalk.cyan.bold(`  ${title}`));
        console.log(chalk.cyan('='.repeat(60)) + '\n');
    }

    static displaySuccess(message: string): void {
        console.log(chalk.green.bold(`✅ ${message}`));
    }

    static displayError(message: string): void {
        console.log(chalk.red.bold(`❌ ${message}`));
    }

    static displayWarning(message: string): void {
        console.log(chalk.yellow.bold(`⚠️  ${message}`));
    }

    static displayInfo(message: string): void {
        console.log(chalk.blue(`ℹ️  ${message}`));
    }

    static displayProgress(message: string): void {
        console.log(chalk.gray(`⏳ ${message}...`));
    }

    static displayTable(data: any[], headers?: string[]): void {
        if (data.length === 0) {
            console.log(chalk.gray('No data to display'));
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
                console.log(chalk.bold(headers.join(' | ')));
                console.log(chalk.gray('-'.repeat(headers.join(' | ').length)));
            }
            console.log(row.join(' | '));
        });
    }
}