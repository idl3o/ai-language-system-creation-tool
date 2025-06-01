#!/usr/bin/env node

import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { SystemGenerator } from '../generators/systemGenerator';
import { GenerationRequest } from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new Logger('CLI');
const generator = new SystemGenerator();

const program = new Command();

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
    .action(async (options) => {
        try {
            if (options.interactive) {
                await runInteractiveGeneration(options);
            } else {
                await runDirectGeneration(options);
            }
        } catch (error) {
            logger.error(`Generation failed: ${error}`);
            process.exit(1);
        }
    });

// Interactive generation
async function runInteractiveGeneration(options: any): Promise<void> {
    console.log('🚀 Welcome to Intelligent Language Systems Generator\n');

    const answers = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'domain',
            message: 'What domain is your system for?',
            default: options.domain || 'general',
            validate: (input: string) => input.length > 0 || 'Domain is required'
        },
        {
            type: 'editor',
            name: 'requirements',
            message: 'Describe your system requirements:',
            validate: (input: string) => input.length > 10 || 'Requirements must be at least 10 characters'
        },
        {
            type: 'input',
            name: 'examples',
            message: 'Provide example interactions (comma-separated):',
            filter: (input: string) => input.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
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
            validate: (input: number) => input >= 0 || 'Must be a non-negative number'
        },
        {
            type: 'checkbox',
            name: 'formats',
            message: 'Export formats:',
            choices: ['json', 'yaml', 'rules', 'documentation'],
            default: ['json', 'yaml']
        }
    ]);

    const request: GenerationRequest = {
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
    const system = await generator.generateSystem(request);

    console.log(`✅ Generated system: ${system.name}`);
    console.log(`📊 Statistics:`);
    console.log(`   - Rules: ${system.rules.length}`);
    console.log(`   - Entities: ${system.entities.length}`);
    console.log(`   - Intents: ${system.intents.length}`);
    console.log(`   - Vocabulary: ${system.vocabulary.terms.length} terms\n`);

    const outputDir = options.output || './output';
    await generator.exportSystem(system, outputDir, answers.formats);

    if (answers.formats.includes('documentation')) {
        const docs = await generator.generateDocumentation(system);
        await fs.writeFile(path.join(outputDir, `${system.name}.md`), docs);
        console.log(`📚 Documentation generated: ${system.name}.md`);
    }

    console.log(`\n🎉 System exported to: ${outputDir}`);
}

// Direct generation from options
async function runDirectGeneration(options: any): Promise<void> {
    if (!options.domain) {
        throw new Error('Domain is required. Use --domain option or --interactive mode.');
    }

    let requirements: string;
    if (options.requirements) {
        requirements = await fs.readFile(options.requirements, 'utf-8');
    } else {
        throw new Error('Requirements file is required. Use --requirements option or --interactive mode.');
    }

    const request: GenerationRequest = {
        domain: options.domain,
        requirements,
        examples: []
    };

    console.log(`🔄 Generating system for domain: ${options.domain}`);
    const system = await generator.generateSystem(request);

    const formats = options.format.split(',');
    await generator.exportSystem(system, options.output, formats);

    console.log(`✅ System generated and exported to: ${options.output}`);
}

// Analyze command
program
    .command('analyze <file>')
    .description('Analyze a text file for entities, intents, and patterns')
    .option('-d, --domain <domain>', 'Domain context for analysis')
    .option('-o, --output <file>', 'Output file for analysis results')
    .action(async (file, options) => {
        try {
            const { NLPProcessor } = await import('../nlp/processor');
            const processor = new NLPProcessor();
            
            const content = await fs.readFile(file, 'utf-8');
            const analysis = await processor.analyzeText(content, options.domain);

            const result = {
                file,
                domain: options.domain || 'general',
                analysis,
                timestamp: new Date().toISOString()
            };

            if (options.output) {
                await fs.writeFile(options.output, JSON.stringify(result, null, 2));
                console.log(`Analysis saved to: ${options.output}`);
            } else {
                console.log(JSON.stringify(result, null, 2));
            }
        } catch (error) {
            logger.error(`Analysis failed: ${error}`);
            process.exit(1);
        }
    });

// Validate command
program
    .command('validate <file>')
    .description('Validate a language system file')
    .action(async (file) => {
        try {
            const { SystemValidator } = await import('../utils/validator');
            const validator = new SystemValidator();
            
            const content = await fs.readFile(file, 'utf-8');
            const system = JSON.parse(content);
            
            const result = await validator.validateSystem(system);
            
            if (result.isValid) {
                console.log('✅ System is valid!');
            } else {
                console.log('❌ System validation failed:');
                result.errors.forEach(error => console.log(`  - ${error}`));
            }
            
            if (result.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                result.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            process.exit(result.isValid ? 0 : 1);
        } catch (error) {
            logger.error(`Validation failed: ${error}`);
            process.exit(1);
        }
    });

// Stats command
program
    .command('stats')
    .description('Show generator capabilities and statistics')
    .action(() => {
        const stats = generator.getStats();
        
        console.log('🔧 Intelligent Language Systems Generator\n');
        console.log('📊 Capabilities:');
        stats.capabilities.forEach((cap: string) => console.log(`  ✓ ${cap}`));
        
        console.log('\n🌐 Supported Domains:');
        stats.supportedDomains.forEach((domain: string) => console.log(`  • ${domain}`));
        
        console.log('\n📁 Export Formats:');
        stats.supportedFormats.forEach((format: string) => console.log(`  • ${format}`));
    });

// Variants command
program
    .command('variants')
    .description('Generate multiple system variants for comparison')
    .option('-d, --domain <domain>', 'System domain', 'general')
    .option('-r, --requirements <file>', 'Requirements file')
    .option('-c, --count <number>', 'Number of variants', '3')
    .option('-o, --output <directory>', 'Output directory', './variants')
    .action(async (options) => {
        try {
            if (!options.requirements) {
                throw new Error('Requirements file is required');
            }

            const requirements = await fs.readFile(options.requirements, 'utf-8');
            const request: GenerationRequest = {
                domain: options.domain,
                requirements,
                examples: []
            };

            const count = parseInt(options.count);
            console.log(`🔄 Generating ${count} system variants...`);
            
            const variants = await generator.generateVariants(request, count);
            
            for (const variant of variants) {
                const variantDir = path.join(options.output, variant.name);
                await generator.exportSystem(variant, variantDir, ['json', 'yaml']);
                console.log(`✅ Generated variant: ${variant.name}`);
            }
            
            console.log(`\n🎉 All variants exported to: ${options.output}`);
        } catch (error) {
            logger.error(`Variant generation failed: ${error}`);
            process.exit(1);
        }
    });

// Error handling
program.exitOverride();

try {
    program.parse();
} catch (error) {
    logger.error(`CLI error: ${error}`);
    process.exit(1);
}

export { program };
