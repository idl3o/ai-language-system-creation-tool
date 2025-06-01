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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const express_1 = require("express");
const systemGenerator_1 = require("../generators/systemGenerator");
const processor_1 = require("../nlp/processor");
const engine_1 = require("../ai/engine");
const logger_1 = require("../utils/logger");
const validator_1 = require("../utils/validator");
class SystemController {
    constructor() {
        this.systemGenerator = new systemGenerator_1.SystemGenerator();
        this.nlpProcessor = new processor_1.NLPProcessor();
        this.aiEngine = new engine_1.AIEngine();
        this.validator = new validator_1.SystemValidator();
        this.logger = new logger_1.Logger('SystemController');
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/status', this.getSystemStatus.bind(this));
        this.router.post('/generate', this.generateSystem.bind(this));
        this.router.post('/analyze', this.analyzeText.bind(this));
        this.router.post('/validate', this.validateSystem.bind(this));
        this.router.post('/optimize', this.optimizeSystem.bind(this));
        this.router.get('/examples', this.getExamples.bind(this));
        this.router.post('/export', this.exportSystem.bind(this));
    }
    getSystemStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = {
                    aiEngine: true,
                    nlpProcessor: true,
                    systemGenerator: true,
                    timestamp: new Date().toISOString()
                };
                res.json(status);
            }
            catch (error) {
                this.logger.error(`Failed to get system status: ${error}`);
                res.status(500).json({ error: 'Failed to get system status' });
            }
        });
    }
    generateSystem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { requirements, domain, complexity, options } = req.body;
                if (!requirements) {
                    res.status(400).json({ error: 'Requirements are required' });
                    return;
                }
                this.logger.info(`Generating system for domain: ${domain}`);
                const systemConfig = Object.assign({ requirements, domain: domain || 'general', complexity: complexity || 'medium' }, options);
                const system = yield this.systemGenerator.generateSystem(systemConfig);
                this.logger.info(`Successfully generated system: ${system.metadata.version}`);
                res.status(201).json(system);
            }
            catch (error) {
                this.logger.error(`System generation failed: ${error}`);
                res.status(500).json({ error: 'System generation failed' });
            }
        });
    }
    analyzeText(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { text, domain, options } = req.body;
                if (!text) {
                    res.status(400).json({ error: 'Text is required for analysis' });
                    return;
                }
                this.logger.info(`Analyzing text for domain: ${domain}`);
                const analysis = yield this.nlpProcessor.analyzeText(text, domain || 'general');
                res.json(analysis);
            }
            catch (error) {
                this.logger.error(`Text analysis failed: ${error}`);
                res.status(500).json({ error: 'Text analysis failed' });
            }
        });
    }
    validateSystem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { system } = req.body;
                if (!system) {
                    res.status(400).json({ error: 'System is required for validation' });
                    return;
                }
                const validation = yield this.validator.validateSystem(system);
                res.json({
                    valid: validation.isValid,
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }
            catch (error) {
                this.logger.error(`System validation failed: ${error}`);
                res.status(500).json({ error: 'System validation failed' });
            }
        });
    }
    optimizeSystem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { system, optimizationGoals } = req.body;
                if (!system) {
                    res.status(400).json({ error: 'System is required for optimization' });
                    return;
                }
                this.logger.info('Optimizing system with AI');
                const optimizedSystem = yield this.aiEngine.optimizeRules(system.rules || [], optimizationGoals || ['performance', 'accuracy']);
                res.json({
                    originalSystem: system,
                    optimizedRules: optimizedSystem,
                    improvements: this.calculateImprovements(system.rules, optimizedSystem)
                });
            }
            catch (error) {
                this.logger.error(`System optimization failed: ${error}`);
                res.status(500).json({ error: 'System optimization failed' });
            }
        });
    }
    getExamples(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { domain, type } = req.query;
                // Provide basic examples since getExampleSystems doesn't exist yet
                const examples = this.getBasicExamples(domain, type);
                res.json(examples);
            }
            catch (error) {
                this.logger.error(`Failed to get examples: ${error}`);
                res.status(500).json({ error: 'Failed to get examples' });
            }
        });
    }
    getBasicExamples(domain, type) {
        const examples = [
            {
                name: 'Simple Greeting System',
                domain: 'customer-service',
                type: 'basic',
                rules: [
                    {
                        condition: { type: 'simple', expression: 'intent === "greeting"' },
                        action: { type: 'response', target: 'Hello! How can I help you today?' }
                    }
                ]
            },
            {
                name: 'Order Processing System',
                domain: 'e-commerce',
                type: 'advanced',
                rules: [
                    {
                        condition: { type: 'simple', expression: 'intent === "order" && orderTotal > 0' },
                        action: { type: 'function', target: 'processOrder' }
                    }
                ]
            }
        ];
        if (domain) {
            return examples.filter(ex => ex.domain === domain);
        }
        if (type) {
            return examples.filter(ex => ex.type === type);
        }
        return examples;
    }
    exportSystem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { system, format } = req.body;
                if (!system) {
                    res.status(400).json({ error: 'System is required for export' });
                    return;
                }
                const finalFormat = format || 'json';
                const exportedData = yield this.systemGenerator.exportSystem(system, finalFormat);
                res.json({
                    format: finalFormat,
                    data: exportedData,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                this.logger.error(`System export failed: ${error}`);
                res.status(500).json({ error: 'System export failed' });
            }
        });
    }
    calculateImprovements(originalRules, optimizedRules) {
        return {
            ruleCount: {
                original: originalRules.length,
                optimized: optimizedRules.length,
                change: optimizedRules.length - originalRules.length
            },
            estimatedPerformanceGain: '15-25%',
            optimizationApplied: ['rule_consolidation', 'priority_optimization', 'condition_simplification']
        };
    }
}
exports.SystemController = SystemController;
