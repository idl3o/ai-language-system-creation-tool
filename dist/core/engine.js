"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const rule_1 = require("./rule");
const fact_1 = require("./fact");
const inference_1 = require("./inference");
const logger_1 = require("../utils/logger");
class Engine {
    constructor(ruleRepository, factRepository, config = {}) {
        this.rules = [];
        this.facts = [];
        this._isInitialized = false;
        this.lastExecutedAction = null;
        // If repositories are passed, use them
        this.ruleRepository = ruleRepository;
        this.factRepository = factRepository;
        this.config = Object.assign({ maxIterations: 100, enableLogging: true, inferenceMode: 'forward', conflictResolution: 'priority' }, config);
        this.logger = new logger_1.Logger('Engine');
        this.inferenceEngine = new inference_1.InferenceEngine(this.rules, this.config.maxIterations);
        if (this.config.enableLogging) {
            this.logger.info('Engine initialized with config:', this.config);
        }
    }
    // Initialization methods
    initialize(facts = []) {
        // Load rules from repository if available
        if (this.ruleRepository) {
            this.rules = this.ruleRepository.getRules();
        }
        // Load facts from repository if available, then add any additional facts passed as parameter
        if (this.factRepository) {
            this.facts = [...this.factRepository.getFacts(), ...facts];
        }
        else {
            this.facts = [...facts];
        }
        this.inferenceEngine = new inference_1.InferenceEngine(this.rules, this.config.maxIterations);
        this._isInitialized = true;
        if (this.config.enableLogging) {
            this.logger.info(`Engine initialized with ${this.rules.length} rules and ${this.facts.length} facts`);
        }
    }
    initializeFromSystem(system) {
        this.rules = system.rules.map(rule => new rule_1.Rule(rule.condition, rule.action, rule.priority, undefined, rule));
        this.initialize();
        if (this.config.enableLogging) {
            this.logger.info(`Engine initialized from system: ${system.name}`);
        }
    }
    // Rule management
    addRule(rule) {
        this.rules.push(rule);
        if (this._isInitialized) {
            this.inferenceEngine.addRule(rule);
        }
        if (this.config.enableLogging) {
            this.logger.info(`Added rule: ${rule.name} (${rule.id})`);
        }
    }
    removeRule(ruleId) {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        if (this._isInitialized && this.rules.length < initialLength) {
            this.inferenceEngine.removeRule(ruleId);
            if (this.config.enableLogging) {
                this.logger.info(`Removed rule: ${ruleId}`);
            }
            return true;
        }
        return false;
    }
    updateRule(ruleId, updates) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            Object.assign(rule, updates);
            rule.updatedAt = new Date();
            if (this.config.enableLogging) {
                this.logger.info(`Updated rule: ${ruleId}`);
            }
            return true;
        }
        return false;
    }
    // Fact management
    addFact(fact) {
        // Check if fact already exists
        const existingFactIndex = this.facts.findIndex(f => f.name === fact.name);
        if (existingFactIndex >= 0) {
            // Update existing fact with higher confidence
            const existingFact = this.facts[existingFactIndex];
            if (fact.confidence > existingFact.confidence) {
                this.facts[existingFactIndex] = fact;
                if (this.config.enableLogging) {
                    this.logger.info(`Updated fact: ${fact.name} (confidence: ${fact.confidence})`);
                }
            }
        }
        else {
            this.facts.push(fact);
            if (this.config.enableLogging) {
                this.logger.info(`Added fact: ${fact.name} = ${fact.value}`);
            }
        }
        if (this._isInitialized) {
            this.inferenceEngine.addFact(fact);
        }
    }
    removeFact(factName) {
        const initialLength = this.facts.length;
        this.facts = this.facts.filter(fact => fact.name !== factName);
        const removed = this.facts.length < initialLength;
        if (removed && this.config.enableLogging) {
            this.logger.info(`Removed fact: ${factName}`);
        }
        return removed;
    }
    getFact(name) {
        return this.facts.find(fact => fact.name === name);
    }
    // Execution methods
    execute() {
        if (!this._isInitialized) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }
        const startTime = Date.now();
        const result = {
            success: false,
            appliedRules: [],
            derivedFacts: [],
            confidence: 0,
            executionTime: 0,
            reasoning: [],
            errors: []
        };
        try {
            let inferenceResult;
            switch (this.config.inferenceMode) {
                case 'forward':
                    inferenceResult = this.inferenceEngine.forwardChain(this.facts);
                    break;
                case 'backward':
                    // For backward chaining, we need a goal - use first rule's action as goal
                    if (this.rules.length > 0) {
                        const goal = new fact_1.Fact('goal', this.rules[0].action.target, 'system');
                        inferenceResult = this.inferenceEngine.backwardChain(goal, this.facts);
                    }
                    else {
                        throw new Error('No rules available for backward chaining');
                    }
                    break;
                case 'hybrid':
                    // Run forward chaining first, then backward for any remaining goals
                    inferenceResult = this.inferenceEngine.forwardChain(this.facts);
                    break;
                default:
                    throw new Error(`Unknown inference mode: ${this.config.inferenceMode}`);
            }
            // Update engine state with derived facts
            this.facts.push(...inferenceResult.derivedFacts);
            result.success = true;
            result.appliedRules = inferenceResult.appliedRules;
            result.derivedFacts = inferenceResult.derivedFacts;
            result.confidence = inferenceResult.confidence;
            result.reasoning = inferenceResult.reasoning;
            // Track last executed action for testing
            if (result.appliedRules.length > 0) {
                const lastAppliedRule = this.rules.find(r => r.id === result.appliedRules[result.appliedRules.length - 1]);
                if (lastAppliedRule) {
                    this.lastExecutedAction = lastAppliedRule.action.target;
                }
            }
            if (this.config.enableLogging) {
                this.logger.info(`Execution completed successfully. Applied ${result.appliedRules.length} rules, derived ${result.derivedFacts.length} facts`);
            }
        }
        catch (error) {
            result.errors.push(String(error));
            this.logger.error(`Execution failed: ${error}`);
        }
        result.executionTime = Date.now() - startTime;
        return result;
    }
    // Query methods
    query(query) {
        const queryLower = query.toLowerCase();
        return this.facts.filter(fact => fact.name.toLowerCase().includes(queryLower) ||
            String(fact.value).toLowerCase().includes(queryLower));
    }
    queryByPattern(pattern) {
        return this.facts.filter(fact => pattern.test(fact.name) || pattern.test(String(fact.value)));
    }
    evaluateCondition(condition) {
        try {
            const factsMap = this.getFactsAsMap();
            // Replace fact names with values
            let processedCondition = condition;
            for (const [name, value] of Object.entries(factsMap)) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                const replacement = typeof value === 'string' ? `"${value}"` : String(value);
                processedCondition = processedCondition.replace(regex, replacement);
            }
            // Safety check
            if (/[^a-zA-Z0-9\s\.\>\<\=\!\+\-\*\/\(\)\"\']/.test(processedCondition)) {
                return false;
            }
            return Function(`"use strict"; return (${processedCondition})`)();
        }
        catch (error) {
            this.logger.error(`Error evaluating condition "${condition}": ${error}`);
            return false;
        }
    }
    // State management
    reset() {
        this.facts = [];
        this.inferenceEngine = new inference_1.InferenceEngine(this.rules, this.config.maxIterations);
        if (this.config.enableLogging) {
            this.logger.info('Engine reset');
        }
    }
    clear() {
        this.rules = [];
        this.facts = [];
        this._isInitialized = false;
        if (this.config.enableLogging) {
            this.logger.info('Engine cleared');
        }
    }
    // Export/Import
    exportState() {
        return {
            rules: this.rules.map(rule => rule.toJSON()),
            facts: this.facts.map(fact => fact.toJSON()),
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }
    importState(state) {
        this.config = Object.assign(Object.assign({}, this.config), state.config);
        this.rules = state.rules.map((ruleData) => new rule_1.Rule(ruleData.condition, ruleData.action, ruleData.priority, ruleData.description, ruleData));
        this.facts = state.facts.map((factData) => fact_1.Fact.fromJSON(factData));
        this.initialize();
        if (this.config.enableLogging) {
            this.logger.info('Engine state imported');
        }
    }
    // Getters
    getRules() {
        return [...this.rules];
    }
    getFacts() {
        return [...this.facts];
    }
    getConfig() {
        return Object.assign({}, this.config);
    }
    getFactsAsMap() {
        const map = {};
        for (const fact of this.facts) {
            map[fact.name] = fact.value;
        }
        return map;
    }
    getStats() {
        return {
            ruleCount: this.rules.length,
            factCount: this.facts.length,
            enabledRules: this.rules.filter(r => r.enabled).length,
            recentFacts: this.facts.filter(f => !f.isExpired(60)).length,
            averageRuleConfidence: this.rules.reduce((sum, r) => sum + r.confidence, 0) / Math.max(this.rules.length, 1),
            averageFactConfidence: this.facts.reduce((sum, f) => sum + f.confidence, 0) / Math.max(this.facts.length, 1),
            isInitialized: this._isInitialized
        };
    }
    // Methods required for testing
    isInitialized() {
        return this._isInitialized;
    }
    getLastExecutedAction() {
        return this.lastExecutedAction;
    }
}
exports.Engine = Engine;
