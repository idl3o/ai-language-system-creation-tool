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
exports.SystemGenerator = void 0;
const engine_1 = require("../ai/engine");
const processor_1 = require("../nlp/processor");
const validator_1 = require("../utils/validator");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
class SystemGenerator {
    constructor() {
        this.aiEngine = new engine_1.AIEngine();
        this.nlpProcessor = new processor_1.NLPProcessor();
        this.validator = new validator_1.SystemValidator();
        this.logger = new logger_1.Logger('SystemGenerator');
    }
    /**
     * Main method to generate a complete intelligent language system
     */
    generateSystem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Starting system generation for domain: ${request.domain}`);
            try {
                // Step 1: Validate request
                this.validateRequest(request);
                // Step 2: Analyze requirements using NLP
                const analysis = yield this.analyzeRequirements(request);
                // Step 3: Generate system using AI
                const system = yield this.aiEngine.generateSystem(request);
                // Step 4: Enhance system with additional processing
                const enhancedSystem = yield this.enhanceSystem(system, analysis);
                // Step 5: Validate generated system
                const validationResult = yield this.validator.validateSystem(enhancedSystem);
                if (!validationResult.isValid) {
                    throw new Error(`Generated system validation failed: ${validationResult.errors.join(', ')}`);
                }
                // Step 6: Optimize system
                const optimizedSystem = yield this.optimizeSystem(enhancedSystem);
                this.logger.info(`Successfully generated system: ${optimizedSystem.name}`);
                return optimizedSystem;
            }
            catch (error) {
                this.logger.error(`System generation failed: ${error}`);
                throw error;
            }
        });
    }
    /**
     * Generates system from a file containing requirements
     */
    generateFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield fs.readFile(filePath, 'utf-8');
            const extension = path.extname(filePath).toLowerCase();
            let request;
            if (extension === '.json') {
                request = JSON.parse(content);
            }
            else if (extension === '.yaml' || extension === '.yml') {
                request = yaml.parse(content);
            }
            else {
                // Treat as plain text requirements
                request = {
                    domain: 'general',
                    requirements: content,
                    examples: [],
                };
            }
            return this.generateSystem(request);
        });
    }
    /**
     * Generates multiple system variants for comparison
     */
    generateVariants(request, count = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Generating ${count} system variants`);
            const variants = [];
            for (let i = 0; i < count; i++) {
                // Modify request slightly for each variant
                const variantRequest = this.createVariantRequest(request, i);
                const variant = yield this.generateSystem(variantRequest);
                variant.name = `${variant.name}_variant_${i + 1}`;
                variants.push(variant);
            }
            return variants;
        });
    }
    /**
     * Exports system to different formats
     */
    exportSystem(system, outputDir, formats = ['json', 'yaml']) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.mkdir(outputDir, { recursive: true });
            for (const format of formats) {
                const fileName = `${system.name}.${format}`;
                const filePath = path.join(outputDir, fileName);
                let content;
                if (format === 'json') {
                    content = JSON.stringify(system, null, 2);
                }
                else if (format === 'yaml' || format === 'yml') {
                    content = yaml.stringify(system);
                }
                else if (format === 'rules') {
                    content = this.exportRulesFormat(system);
                }
                else {
                    continue;
                }
                yield fs.writeFile(filePath, content, 'utf-8');
                this.logger.info(`Exported system to: ${filePath}`);
            }
        });
    }
    /**
     * Generates documentation for the system
     */
    generateDocumentation(system) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = `
# ${system.name}

## Overview
${system.description}

**Domain:** ${system.domain}  
**Version:** ${system.metadata.version}  
**Created:** ${system.metadata.created.toISOString()}  
**Author:** ${system.metadata.author}

## Performance Metrics
- **Accuracy:** ${(system.metadata.performance.accuracy * 100).toFixed(1)}%
- **Precision:** ${(system.metadata.performance.precision * 100).toFixed(1)}%
- **Recall:** ${(system.metadata.performance.recall * 100).toFixed(1)}%
- **F1 Score:** ${(system.metadata.performance.f1Score * 100).toFixed(1)}%
- **Response Time:** ${system.metadata.performance.responseTime}ms

## Entities (${system.entities.length})
${system.entities.map(entity => {
                var _a, _b;
                return `
### ${entity.name}
- **Type:** ${entity.type}
- **Values:** ${(_a = entity.values) === null || _a === void 0 ? void 0 : _a.slice(0, 5).join(', ')}${entity.values && entity.values.length > 5 ? '...' : ''}
- **Patterns:** ${(_b = entity.patterns) === null || _b === void 0 ? void 0 : _b.slice(0, 3).join(', ')}${entity.patterns && entity.patterns.length > 3 ? '...' : ''}
`;
            }).join('')}

## Intents (${system.intents.length})
${system.intents.map(intent => `
### ${intent.name}
- **Confidence:** ${(intent.confidence * 100).toFixed(1)}%
- **Entities:** ${intent.entities.join(', ')}
- **Sample Utterances:**
${intent.utterances.slice(0, 3).map(utterance => `  - "${utterance}"`).join('\n')}
`).join('')}

## Rules (${system.rules.length})
${system.rules.map((rule, index) => {
                var _a, _b;
                return `
### ${index + 1}. ${rule.name}
**Natural Language:** ${rule.naturalLanguage}

**Condition:**
- Type: ${rule.condition.type}
- Expression: \`${rule.condition.expression}\`
- Entities: ${((_a = rule.condition.entities) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'None'}
- Intents: ${((_b = rule.condition.intents) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'None'}

**Action:**
- Type: ${rule.action.type}
- Target: ${rule.action.target}
- Parameters: ${JSON.stringify(rule.action.parameters || {})}

**Confidence:** ${(rule.confidence * 100).toFixed(1)}%  
**Priority:** ${rule.priority}
`;
            }).join('')}

## Vocabulary
**Total Terms:** ${system.vocabulary.terms.length}  
**Stop Words:** ${system.vocabulary.stopWords.length}  
**Synonyms:** ${Object.keys(system.vocabulary.synonyms).length} groups

### Top Terms
${system.vocabulary.terms.slice(0, 10).map(term => `- **${term.word}** (${term.pos}): ${term.frequency} occurrences`).join('\n')}

## Tags
${system.metadata.tags.map(tag => `\`${tag}\``).join(' ')}
`;
            return doc.trim();
        });
    }
    /**
     * Validates generation request
     */
    validateRequest(request) {
        if (!request.domain) {
            throw new Error('Domain is required');
        }
        if (!request.requirements) {
            throw new Error('Requirements are required');
        }
        if (!Array.isArray(request.examples)) {
            request.examples = [];
        }
    }
    /**
     * Analyzes requirements using NLP
     */
    analyzeRequirements(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullText = `${request.requirements} ${request.examples.join(' ')}`;
            return yield this.nlpProcessor.analyzeText(fullText, request.domain);
        });
    }
    /**
     * Enhances system with additional processing
     */
    enhanceSystem(system, analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add missing entities from analysis
            const existingEntityNames = system.entities.map(e => e.name);
            for (const entity of analysis.entities) {
                if (!existingEntityNames.includes(entity.name)) {
                    system.entities.push(entity);
                }
            }
            // Add missing intents from analysis
            const existingIntentNames = system.intents.map(i => i.name);
            for (const intent of analysis.intents) {
                if (!existingIntentNames.includes(intent.name)) {
                    system.intents.push(intent);
                }
            }
            // Enhance vocabulary
            system.vocabulary = Object.assign(Object.assign(Object.assign({}, system.vocabulary), analysis.vocabulary), { terms: [...system.vocabulary.terms, ...analysis.vocabulary.terms]
                    .reduce((unique, term) => {
                    const existing = unique.find(t => t.word === term.word);
                    if (!existing) {
                        unique.push(term);
                    }
                    else {
                        existing.frequency += term.frequency;
                    }
                    return unique;
                }, [])
                    .sort((a, b) => b.frequency - a.frequency) });
            return system;
        });
    }
    /**
     * Optimizes the generated system
     */
    optimizeSystem(system) {
        return __awaiter(this, void 0, void 0, function* () {
            // Optimize rules using AI
            const optimizedRules = yield this.aiEngine.optimizeRules(system.rules, {
                domain: system.domain,
                entities: system.entities,
                intents: system.intents
            });
            // Remove duplicate rules
            const uniqueRules = this.removeDuplicateRules(optimizedRules);
            // Sort rules by priority and confidence
            uniqueRules.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return b.confidence - a.confidence;
            });
            return Object.assign(Object.assign({}, system), { rules: uniqueRules });
        });
    }
    /**
     * Creates variant request for generating alternatives
     */
    createVariantRequest(request, variant) {
        const variantRequest = Object.assign({}, request);
        // Modify style for variants
        if (!variantRequest.style) {
            variantRequest.style = {
                formality: 'formal',
                verbosity: 'detailed',
                tone: 'professional'
            };
        }
        const styles = {
            0: { formality: 'formal', verbosity: 'concise', tone: 'professional' },
            1: { formality: 'casual', verbosity: 'detailed', tone: 'friendly' },
            2: { formality: 'technical', verbosity: 'verbose', tone: 'neutral' }
        };
        variantRequest.style = Object.assign(Object.assign({}, variantRequest.style), styles[variant]);
        return variantRequest;
    }
    /**
     * Removes duplicate rules based on similarity
     */
    removeDuplicateRules(rules) {
        const unique = [];
        for (const rule of rules) {
            const isDuplicate = unique.some(existing => existing.condition.expression === rule.condition.expression &&
                existing.action.target === rule.action.target);
            if (!isDuplicate) {
                unique.push(rule);
            }
        }
        return unique;
    }
    /**
     * Exports rules in a custom format
     */
    exportRulesFormat(system) {
        let content = `# Rules for ${system.name}\n\n`;
        system.rules.forEach((rule, index) => {
            content += `## Rule ${index + 1}: ${rule.name}\n`;
            content += `**Description:** ${rule.naturalLanguage}\n`;
            content += `**Confidence:** ${(rule.confidence * 100).toFixed(1)}%\n`;
            content += `**Priority:** ${rule.priority}\n\n`;
            content += `**When:** ${rule.condition.expression}\n`;
            content += `**Then:** ${rule.action.type} -> ${rule.action.target}\n\n`;
            content += `---\n\n`;
        });
        return content;
    }
    /**
     * Gets generation statistics
     */
    getStats() {
        return {
            supportedDomains: [
                'customer_service', 'e_commerce', 'healthcare', 'education',
                'finance', 'travel', 'food', 'entertainment', 'general'
            ],
            supportedFormats: ['json', 'yaml', 'rules', 'documentation'],
            capabilities: [
                'NLP Analysis', 'AI Rule Generation', 'System Optimization',
                'Multi-format Export', 'Variant Generation', 'Documentation'
            ]
        };
    }
}
exports.SystemGenerator = SystemGenerator;
