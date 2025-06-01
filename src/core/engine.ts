import { Rule } from './rule';
import { Fact } from './fact';
import { InferenceEngine, InferenceResult } from './inference';
import { Logger } from '../utils/logger';
import { LanguageSystem } from '../types';
import { RuleRepository } from '../storage/ruleRepository';
import { FactRepository } from '../storage/factRepository';

export interface EngineConfig {
    maxIterations?: number;
    enableLogging?: boolean;
    inferenceMode?: 'forward' | 'backward' | 'hybrid';
    conflictResolution?: 'priority' | 'confidence' | 'recency';
}

export interface ExecutionResult {
    success: boolean;
    appliedRules: string[];
    derivedFacts: Fact[];
    confidence: number;
    executionTime: number;
    reasoning: string[];
    errors: string[];
}

export class Engine {
    private rules: Rule[] = [];
    private facts: Fact[] = [];
    private inferenceEngine: InferenceEngine;
    private logger: Logger;
    private config: EngineConfig;
    private _isInitialized: boolean = false;
    private lastExecutedAction: string | null = null;
    private ruleRepository?: RuleRepository;
    private factRepository?: FactRepository;

    constructor(
        ruleRepository?: RuleRepository, 
        factRepository?: FactRepository, 
        config: EngineConfig = {}
    ) {
        // If repositories are passed, use them
        this.ruleRepository = ruleRepository;
        this.factRepository = factRepository;
        
        this.config = {
            maxIterations: 100,
            enableLogging: true,
            inferenceMode: 'forward',
            conflictResolution: 'priority',
            ...config
        };
        
        this.logger = new Logger('Engine');
        this.inferenceEngine = new InferenceEngine(this.rules, this.config.maxIterations);
        
        if (this.config.enableLogging) {
            this.logger.info('Engine initialized with config:', this.config);
        }
    }

    // Initialization methods
    initialize(facts: Fact[] = []): void {
        // Load rules from repository if available
        if (this.ruleRepository) {
            this.rules = this.ruleRepository.getRules();
        }
        
        // Load facts from repository if available, then add any additional facts passed as parameter
        if (this.factRepository) {
            this.facts = [...this.factRepository.getFacts(), ...facts];
        } else {
            this.facts = [...facts];
        }
        
        this.inferenceEngine = new InferenceEngine(this.rules, this.config.maxIterations);
        this._isInitialized = true;
        
        if (this.config.enableLogging) {
            this.logger.info(`Engine initialized with ${this.rules.length} rules and ${this.facts.length} facts`);
        }
    }

    initializeFromSystem(system: LanguageSystem): void {
        this.rules = system.rules.map(rule => 
            new Rule(rule.condition, rule.action, rule.priority, undefined, rule)
        );
        this.initialize();
        
        if (this.config.enableLogging) {
            this.logger.info(`Engine initialized from system: ${system.name}`);
        }
    }

    // Rule management
    addRule(rule: Rule): void {
        this.rules.push(rule);
        if (this._isInitialized) {
            this.inferenceEngine.addRule(rule);
        }
        
        if (this.config.enableLogging) {
            this.logger.info(`Added rule: ${rule.name} (${rule.id})`);
        }
    }

    removeRule(ruleId: string): boolean {
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

    updateRule(ruleId: string, updates: Partial<Rule>): boolean {
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
    addFact(fact: Fact): void {
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
        } else {
            this.facts.push(fact);
            
            if (this.config.enableLogging) {
                this.logger.info(`Added fact: ${fact.name} = ${fact.value}`);
            }
        }

        if (this._isInitialized) {
            this.inferenceEngine.addFact(fact);
        }
    }

    removeFact(factName: string): boolean {
        const initialLength = this.facts.length;
        this.facts = this.facts.filter(fact => fact.name !== factName);
        
        const removed = this.facts.length < initialLength;
        if (removed && this.config.enableLogging) {
            this.logger.info(`Removed fact: ${factName}`);
        }
        return removed;
    }

    getFact(name: string): Fact | undefined {
        return this.facts.find(fact => fact.name === name);
    }

    // Execution methods
    execute(): ExecutionResult {
        if (!this._isInitialized) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        const result: ExecutionResult = {
            success: false,
            appliedRules: [],
            derivedFacts: [],
            confidence: 0,
            executionTime: 0,
            reasoning: [],
            errors: []
        };

        try {
            let inferenceResult: InferenceResult;

            switch (this.config.inferenceMode) {
                case 'forward':
                    inferenceResult = this.inferenceEngine.forwardChain(this.facts);
                    break;
                case 'backward':
                    // For backward chaining, we need a goal - use first rule's action as goal
                    if (this.rules.length > 0) {
                        const goal = new Fact('goal', this.rules[0].action.target, 'system');
                        inferenceResult = this.inferenceEngine.backwardChain(goal, this.facts);
                    } else {
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

        } catch (error) {
            result.errors.push(String(error));
            this.logger.error(`Execution failed: ${error}`);
        }

        result.executionTime = Date.now() - startTime;
        return result;
    }

    // Query methods
    query(query: string): Fact[] {
        const queryLower = query.toLowerCase();
        return this.facts.filter(fact => 
            fact.name.toLowerCase().includes(queryLower) ||
            String(fact.value).toLowerCase().includes(queryLower)
        );
    }

    queryByPattern(pattern: RegExp): Fact[] {
        return this.facts.filter(fact => 
            pattern.test(fact.name) || pattern.test(String(fact.value))
        );
    }

    evaluateCondition(condition: string): boolean {
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
        } catch (error) {
            this.logger.error(`Error evaluating condition "${condition}": ${error}`);
            return false;
        }
    }

    // State management
    reset(): void {
        this.facts = [];
        this.inferenceEngine = new InferenceEngine(this.rules, this.config.maxIterations);
        
        if (this.config.enableLogging) {
            this.logger.info('Engine reset');
        }
    }

    clear(): void {
        this.rules = [];
        this.facts = [];
        this._isInitialized = false;
        
        if (this.config.enableLogging) {
            this.logger.info('Engine cleared');
        }
    }

    // Export/Import
    exportState(): any {
        return {
            rules: this.rules.map(rule => rule.toJSON()),
            facts: this.facts.map(fact => fact.toJSON()),
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }

    importState(state: any): void {
        this.config = { ...this.config, ...state.config };
        this.rules = state.rules.map((ruleData: any) => 
            new Rule(ruleData.condition, ruleData.action, ruleData.priority, ruleData.description, ruleData)
        );
        this.facts = state.facts.map((factData: any) => Fact.fromJSON(factData));
        this.initialize();
        
        if (this.config.enableLogging) {
            this.logger.info('Engine state imported');
        }
    }

    // Getters
    getRules(): Rule[] {
        return [...this.rules];
    }

    getFacts(): Fact[] {
        return [...this.facts];
    }

    getConfig(): EngineConfig {
        return { ...this.config };
    }

    getFactsAsMap(): Record<string, any> {
        const map: Record<string, any> = {};
        for (const fact of this.facts) {
            map[fact.name] = fact.value;
        }
        return map;
    }

    getStats(): any {
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
    isInitialized(): boolean {
        return this._isInitialized;
    }

    getLastExecutedAction(): string | null {
        return this.lastExecutedAction;
    }
}