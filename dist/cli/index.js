#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const inquirer = __importStar(require("inquirer"));
const systemGenerator_1 = require("../generators/systemGenerator");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger = new logger_1.Logger('CLI');
const generator = new systemGenerator_1.SystemGenerator();
const program = new commander_1.Command();
exports.program = program;
program
    .name('intelligent-systems-cli')
    .description('CLI for automated intelligent language systems creation')
    .version('1.0.0');
// Generate command
program
    .command('generate')
    .description('Generate an intelligent language system')
    .option('-d, --domain <domain>', 'System domain (e.g., customer_service, e_commerce)')
    .option('-r, --requirements <file>', 'Requirements file path')
    .option('-o, --output <directory>', 'Output directory', './output')
    .option('-f, --format <formats>', 'Export formats (json,yaml,rules)', 'json,yaml')
    .option('--interactive', 'Interactive mode')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (options.interactive) {
            yield runInteractiveGeneration(options);
        }
        else {
            yield runDirectGeneration(options);
        }
    }
    catch (error) {
        logger.error(`Generation failed: ${error}`);
        process.exit(1);
    }
}));
// Interactive generation
function runInteractiveGeneration(options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Welcome to Intelligent Language Systems Generator\n');
        const answers = yield inquirer.default.prompt([
            {
                type: 'input',
                name: 'domain',
                message: 'What domain is your system for?',
                default: options.domain || 'general',
                validate: (input) => input.length > 0 || 'Domain is required'
            },
            {
                type: 'editor',
                name: 'requirements',
                message: 'Describe your system requirements:',
                validate: (input) => input.length > 10 || 'Requirements must be at least 10 characters'
            },
            {
                type: 'input',
                name: 'examples',
                message: 'Provide example interactions (comma-separated):',
                filter: (input) => input.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
            },
            {
                type: 'list',
                name: 'formality',
                message: 'What formality level?',
                choices: ['formal', 'casual', 'technical'],
                default: 'professional'
            },
            {
                type: 'list',
                name: 'verbosity',
                message: 'How verbose should responses be?',
                choices: ['concise', 'detailed', 'verbose'],
                default: 'detailed'
            },
            {
                type: 'list',
                name: 'tone',
                message: 'What tone should the system have?',
                choices: ['professional', 'friendly', 'neutral'],
                default: 'professional'
            },
            {
                type: 'number',
                name: 'maxRules',
                message: 'Maximum number of rules (0 for unlimited):',
                default: 50,
                validate: (input) => input >= 0 || 'Must be a non-negative number'
            },
            {
                type: 'checkbox',
                name: 'formats',
                message: 'Export formats:',
                choices: ['json', 'yaml', 'rules', 'documentation'],
                default: ['json', 'yaml']
            }
        ]);
        const request = {
            domain: answers.domain,
            requirements: answers.requirements,
            examples: answers.examples,
            style: {
                formality: answers.formality,
                verbosity: answers.verbosity,
                tone: answers.tone
            },
            constraints: {
                maxRules: answers.maxRules || undefined
            }
        };
        console.log('\n🔄 Generating your intelligent language system...\n');
        const system = yield generator.generateSystem(request);
        console.log(`✅ Generated system: ${system.name}`);
        console.log(`📊 Statistics:`);
        console.log(`   - Rules: ${system.rules.length}`);
        console.log(`   - Entities: ${system.entities.length}`);
        console.log(`   - Intents: ${system.intents.length}`);
        console.log(`   - Vocabulary: ${system.vocabulary.terms.length} terms\n`);
        const outputDir = options.output || './output';
        yield generator.exportSystem(system, outputDir, answers.formats);
        if (answers.formats.includes('documentation')) {
            const docs = yield generator.generateDocumentation(system);
            yield fs.writeFile(path.join(outputDir, `${system.name}.md`), docs);
            console.log(`📚 Documentation generated: ${system.name}.md`);
        }
        console.log(`\n🎉 System exported to: ${outputDir}`);
    });
}
// Direct generation from options
function runDirectGeneration(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.domain) {
            throw new Error('Domain is required. Use --domain option or --interactive mode.');
        }
        let requirements;
        if (options.requirements) {
            requirements = yield fs.readFile(options.requirements, 'utf-8');
        }
        else {
            throw new Error('Requirements file is required. Use --requirements option or --interactive mode.');
        }
        const request = {
            domain: options.domain,
            requirements,
            examples: []
        };
        console.log(`🔄 Generating system for domain: ${options.domain}`);
        const system = yield generator.generateSystem(request);
        const formats = options.format.split(',');
        yield generator.exportSystem(system, options.output, formats);
        console.log(`✅ System generated and exported to: ${options.output}`);
    });
}
// Analyze command
program
    .command('analyze <file>')
    .description('Analyze a text file for entities, intents, and patterns')
    .option('-d, --domain <domain>', 'Domain context for analysis')
    .option('-o, --output <file>', 'Output file for analysis results')
    .action((file, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { NLPProcessor } = yield Promise.resolve().then(() => __importStar(require('../nlp/processor')));
        const processor = new NLPProcessor();
        const content = yield fs.readFile(file, 'utf-8');
        const analysis = yield processor.analyzeText(content, options.domain);
        const result = {
            file,
            domain: options.domain || 'general',
            analysis,
            timestamp: new Date().toISOString()
        };
        if (options.output) {
            yield fs.writeFile(options.output, JSON.stringify(result, null, 2));
            console.log(`Analysis saved to: ${options.output}`);
        }
        else {
            console.log(JSON.stringify(result, null, 2));
        }
    }
    catch (error) {
        logger.error(`Analysis failed: ${error}`);
        process.exit(1);
    }
}));
// Validate command
program
    .command('validate <file>')
    .description('Validate a language system file')
    .action((file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { SystemValidator } = yield Promise.resolve().then(() => __importStar(require('../utils/validator')));
        const validator = new SystemValidator();
        const content = yield fs.readFile(file, 'utf-8');
        const system = JSON.parse(content);
        const result = yield validator.validateSystem(system);
        if (result.isValid) {
            console.log('✅ System is valid!');
        }
        else {
            console.log('❌ System validation failed:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }
        if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        process.exit(result.isValid ? 0 : 1);
    }
    catch (error) {
        logger.error(`Validation failed: ${error}`);
        process.exit(1);
    }
}));
// Stats command
program
    .command('stats')
    .description('Show generator capabilities and statistics')
    .action(() => {
    const stats = generator.getStats();
    console.log('🔧 Intelligent Language Systems Generator\n');
    console.log('📊 Capabilities:');
    stats.capabilities.forEach((cap) => console.log(`  ✓ ${cap}`));
    console.log('\n🌐 Supported Domains:');
    stats.supportedDomains.forEach((domain) => console.log(`  • ${domain}`));
    console.log('\n📁 Export Formats:');
    stats.supportedFormats.forEach((format) => console.log(`  • ${format}`));
});
// Variants command
program
    .command('variants')
    .description('Generate multiple system variants for comparison')
    .option('-d, --domain <domain>', 'System domain', 'general')
    .option('-r, --requirements <file>', 'Requirements file')
    .option('-c, --count <number>', 'Number of variants', '3')
    .option('-o, --output <directory>', 'Output directory', './variants')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!options.requirements) {
            throw new Error('Requirements file is required');
        }
        const requirements = yield fs.readFile(options.requirements, 'utf-8');
        const request = {
            domain: options.domain,
            requirements,
            examples: []
        };
        const count = parseInt(options.count);
        console.log(`🔄 Generating ${count} system variants...`);
        const variants = yield generator.generateVariants(request, count);
        for (const variant of variants) {
            const variantDir = path.join(options.output, variant.name);
            yield generator.exportSystem(variant, variantDir, ['json', 'yaml']);
            console.log(`✅ Generated variant: ${variant.name}`);
        }
        console.log(`\n🎉 All variants exported to: ${options.output}`);
    }
    catch (error) {
        logger.error(`Variant generation failed: ${error}`);
        process.exit(1);
    }
}));
// Error handling
program.exitOverride();
try {
    program.parse();
}
catch (error) {
    logger.error(`CLI error: ${error}`);
    process.exit(1);
}
