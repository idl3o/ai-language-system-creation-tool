import { AIEngine } from '../ai/engine';
import { NLPProcessor } from '../nlp/processor';
import { LanguageSystem, GenerationRequest, IntelligentRule, AnalysisResult } from '../types';
import { SystemValidator } from '../utils/validator';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

export class SystemGenerator {
    private aiEngine: AIEngine;
    private nlpProcessor: NLPProcessor;
    private validator: SystemValidator;
    private logger: Logger;

    constructor() {
        this.aiEngine = new AIEngine();
        this.nlpProcessor = new NLPProcessor();
        this.validator = new SystemValidator();
        this.logger = new Logger('SystemGenerator');
    }

    /**
     * Main method to generate a complete intelligent language system
     */
    async generateSystem(request: GenerationRequest): Promise<LanguageSystem> {
        this.logger.info(`Starting system generation for domain: ${request.domain}`);
        
        try {
            // Step 1: Validate request
            this.validateRequest(request);
            
            // Step 2: Analyze requirements using NLP
            const analysis = await this.analyzeRequirements(request);
            
            // Step 3: Generate system using AI
            const system = await this.aiEngine.generateSystem(request);
            
            // Step 4: Enhance system with additional processing
            const enhancedSystem = await this.enhanceSystem(system, analysis);
            
            // Step 5: Validate generated system
            const validationResult = await this.validator.validateSystem(enhancedSystem);
            if (!validationResult.isValid) {
                throw new Error(`Generated system validation failed: ${validationResult.errors.join(', ')}`);
            }
            
            // Step 6: Optimize system
            const optimizedSystem = await this.optimizeSystem(enhancedSystem);
            
            this.logger.info(`Successfully generated system: ${optimizedSystem.name}`);
            return optimizedSystem;
            
        } catch (error) {
            this.logger.error(`System generation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Generates system from a file containing requirements
     */
    async generateFromFile(filePath: string): Promise<LanguageSystem> {
        const content = await fs.readFile(filePath, 'utf-8');
        const extension = path.extname(filePath).toLowerCase();
        
        let request: GenerationRequest;
        
        if (extension === '.json') {
            request = JSON.parse(content);
        } else if (extension === '.yaml' || extension === '.yml') {
            request = yaml.parse(content);
        } else {
            // Treat as plain text requirements
            request = {
                domain: 'general',
                requirements: content,
                examples: [],
            };
        }
        
        return this.generateSystem(request);
    }

    /**
     * Generates multiple system variants for comparison
     */
    async generateVariants(request: GenerationRequest, count: number = 3): Promise<LanguageSystem[]> {
        this.logger.info(`Generating ${count} system variants`);
        
        const variants: LanguageSystem[] = [];
        
        for (let i = 0; i < count; i++) {
            // Modify request slightly for each variant
            const variantRequest = this.createVariantRequest(request, i);
            const variant = await this.generateSystem(variantRequest);
            variant.name = `${variant.name}_variant_${i + 1}`;
            variants.push(variant);
        }
        
        return variants;
    }

    /**
     * Exports system to different formats
     */
    async exportSystem(system: LanguageSystem, outputDir: string, formats: string[] = ['json', 'yaml']): Promise<void> {
        await fs.mkdir(outputDir, { recursive: true });
        
        for (const format of formats) {
            const fileName = `${system.name}.${format}`;
            const filePath = path.join(outputDir, fileName);
            
            let content: string;
            if (format === 'json') {
                content = JSON.stringify(system, null, 2);
            } else if (format === 'yaml' || format === 'yml') {
                content = yaml.stringify(system);
            } else if (format === 'rules') {
                content = this.exportRulesFormat(system);
            } else {
                continue;
            }
            
            await fs.writeFile(filePath, content, 'utf-8');
            this.logger.info(`Exported system to: ${filePath}`);
        }
    }

    /**
     * Generates documentation for the system
     */
    async generateDocumentation(system: LanguageSystem): Promise<string> {
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
${system.entities.map(entity => `
### ${entity.name}
- **Type:** ${entity.type}
- **Values:** ${entity.values?.slice(0, 5).join(', ')}${entity.values && entity.values.length > 5 ? '...' : ''}
- **Patterns:** ${entity.patterns?.slice(0, 3).join(', ')}${entity.patterns && entity.patterns.length > 3 ? '...' : ''}
`).join('')}

## Intents (${system.intents.length})
${system.intents.map(intent => `
### ${intent.name}
- **Confidence:** ${(intent.confidence * 100).toFixed(1)}%
- **Entities:** ${intent.entities.join(', ')}
- **Sample Utterances:**
${intent.utterances.slice(0, 3).map(utterance => `  - "${utterance}"`).join('\n')}
`).join('')}

## Rules (${system.rules.length})
${system.rules.map((rule, index) => `
### ${index + 1}. ${rule.name}
**Natural Language:** ${rule.naturalLanguage}

**Condition:**
- Type: ${rule.condition.type}
- Expression: \`${rule.condition.expression}\`
- Entities: ${rule.condition.entities?.join(', ') || 'None'}
- Intents: ${rule.condition.intents?.join(', ') || 'None'}

**Action:**
- Type: ${rule.action.type}
- Target: ${rule.action.target}
- Parameters: ${JSON.stringify(rule.action.parameters || {})}

**Confidence:** ${(rule.confidence * 100).toFixed(1)}%  
**Priority:** ${rule.priority}
`).join('')}

## Vocabulary
**Total Terms:** ${system.vocabulary.terms.length}  
**Stop Words:** ${system.vocabulary.stopWords.length}  
**Synonyms:** ${Object.keys(system.vocabulary.synonyms).length} groups

### Top Terms
${system.vocabulary.terms.slice(0, 10).map(term => 
    `- **${term.word}** (${term.pos}): ${term.frequency} occurrences`
).join('\n')}

## Tags
${system.metadata.tags.map(tag => `\`${tag}\``).join(' ')}
`;

        return doc.trim();
    }

    /**
     * Validates generation request
     */
    private validateRequest(request: GenerationRequest): void {
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
    private async analyzeRequirements(request: GenerationRequest): Promise<AnalysisResult> {
        const fullText = `${request.requirements} ${request.examples.join(' ')}`;
        return await this.nlpProcessor.analyzeText(fullText, request.domain);
    }

    /**
     * Enhances system with additional processing
     */
    private async enhanceSystem(system: LanguageSystem, analysis: AnalysisResult): Promise<LanguageSystem> {
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
        system.vocabulary = {
            ...system.vocabulary,
            ...analysis.vocabulary,
            terms: [...system.vocabulary.terms, ...analysis.vocabulary.terms]
                .reduce((unique, term) => {
                    const existing = unique.find(t => t.word === term.word);
                    if (!existing) {
                        unique.push(term);
                    } else {
                        existing.frequency += term.frequency;
                    }
                    return unique;
                }, [] as typeof system.vocabulary.terms)
                .sort((a, b) => b.frequency - a.frequency)
        };

        return system;
    }

    /**
     * Optimizes the generated system
     */
    private async optimizeSystem(system: LanguageSystem): Promise<LanguageSystem> {
        // Optimize rules using AI
        const optimizedRules = await this.aiEngine.optimizeRules(system.rules, {
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

        return {
            ...system,
            rules: uniqueRules
        };
    }

    /**
     * Creates variant request for generating alternatives
     */
    private createVariantRequest(request: GenerationRequest, variant: number): GenerationRequest {
        const variantRequest = { ...request };
        
        // Modify style for variants
        if (!variantRequest.style) {
            variantRequest.style = {
                formality: 'formal',
                verbosity: 'detailed',
                tone: 'professional'
            };
        }        const styles: { [key: number]: { formality: 'formal' | 'casual' | 'technical'; verbosity: 'concise' | 'detailed' | 'verbose'; tone: 'professional' | 'friendly' | 'neutral' } } = {
            0: { formality: 'formal', verbosity: 'concise', tone: 'professional' },
            1: { formality: 'casual', verbosity: 'detailed', tone: 'friendly' },
            2: { formality: 'technical', verbosity: 'verbose', tone: 'neutral' }
        };

        variantRequest.style = { ...variantRequest.style, ...styles[variant] };
        
        return variantRequest;
    }

    /**
     * Removes duplicate rules based on similarity
     */
    private removeDuplicateRules(rules: IntelligentRule[]): IntelligentRule[] {
        const unique: IntelligentRule[] = [];
        
        for (const rule of rules) {
            const isDuplicate = unique.some(existing => 
                existing.condition.expression === rule.condition.expression &&
                existing.action.target === rule.action.target
            );
            
            if (!isDuplicate) {
                unique.push(rule);
            }
        }
        
        return unique;
    }

    /**
     * Exports rules in a custom format
     */
    private exportRulesFormat(system: LanguageSystem): string {
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
    getStats(): any {
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
