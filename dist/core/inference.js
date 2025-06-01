"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inference = exports.InferenceEngine = void 0;
const fact_1 = require("./fact");
const logger_1 = require("../utils/logger");
class InferenceEngine {
    constructor(rules = [], maxIterations = 100) {
        this.rules = rules;
        this.facts = [];
        this.maxIterations = maxIterations;
        this.logger = new logger_1.Logger('InferenceEngine');
        this.conflictResolver = this.createDefaultConflictResolver();
    }
    // Forward chaining inference
    forwardChain(initialFacts) {
        this.logger.info('Starting forward chaining inference');
        const derivedFacts = [];
        const appliedRules = [];
        const reasoning = [];
        let currentFacts = [...initialFacts];
        let iteration = 0;
        let changed = true;
        while (changed && iteration < this.maxIterations) {
            changed = false;
            iteration++;
            reasoning.push(`--- Iteration ${iteration} ---`);
            const factsMap = this.factsToMap(currentFacts);
            // Find applicable rules
            const applicableRules = this.findApplicableRules(factsMap);
            if (applicableRules.length === 0) {
                reasoning.push('No applicable rules found');
                break;
            }
            // Resolve conflicts if multiple rules are applicable
            const resolvedRules = applicableRules.length > 1 ?
                this.conflictResolver.resolve(applicableRules, factsMap) :
                applicableRules;
            // Execute resolved rules
            for (const rule of resolvedRules) {
                try {
                    const result = rule.execute(factsMap);
                    if (result) {
                        const newFact = this.resultToFact(result, rule);
                        if (newFact && !this.factExists(newFact, currentFacts)) {
                            currentFacts.push(newFact);
                            derivedFacts.push(newFact);
                            appliedRules.push(rule.id);
                            reasoning.push(`Applied rule ${rule.name}: ${rule.naturalLanguage}`);
                            reasoning.push(`Derived fact: ${newFact.name} = ${newFact.value}`);
                            changed = true;
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Error executing rule ${rule.id}: ${error}`);
                    reasoning.push(`Error in rule ${rule.name}: ${error}`);
                }
            }
        }
        const confidence = this.calculateConfidence(appliedRules, derivedFacts);
        this.logger.info(`Forward chaining completed. Applied ${appliedRules.length} rules, derived ${derivedFacts.length} facts`);
        return {
            derivedFacts,
            appliedRules,
            confidence,
            reasoning
        };
    }
    // Backward chaining inference for goal-driven reasoning
    backwardChain(goal, availableFacts) {
        this.logger.info(`Starting backward chaining for goal: ${goal.name}`);
        const derivedFacts = [];
        const appliedRules = [];
        const reasoning = [`Goal: ${goal.name} = ${goal.value}`];
        const result = this.proveGoal(goal, availableFacts, derivedFacts, appliedRules, reasoning, new Set());
        const confidence = result ? this.calculateConfidence(appliedRules, derivedFacts) : 0;
        this.logger.info(`Backward chaining completed. Goal ${result ? 'achieved' : 'not achieved'}`);
        return {
            derivedFacts,
            appliedRules,
            confidence,
            reasoning
        };
    }
    proveGoal(goal, availableFacts, derivedFacts, appliedRules, reasoning, visited) {
        // Check if goal already exists in available facts
        if (this.factExists(goal, availableFacts)) {
            reasoning.push(`Goal ${goal.name} already satisfied`);
            return true;
        }
        // Prevent infinite recursion
        const goalKey = `${goal.name}:${goal.value}`;
        if (visited.has(goalKey)) {
            reasoning.push(`Circular dependency detected for ${goal.name}`);
            return false;
        }
        visited.add(goalKey);
        // Find rules that can derive this goal
        const goalProducingRules = this.findRulesProducingGoal(goal);
        for (const rule of goalProducingRules) {
            reasoning.push(`Trying rule: ${rule.name}`);
            // Check if rule conditions can be satisfied
            const subgoals = this.extractSubgoals(rule, availableFacts);
            let allSubgoalsSatisfied = true;
            for (const subgoal of subgoals) {
                if (!this.proveGoal(subgoal, availableFacts, derivedFacts, appliedRules, reasoning, new Set(visited))) {
                    allSubgoalsSatisfied = false;
                    break;
                }
            }
            if (allSubgoalsSatisfied) {
                // Execute the rule
                try {
                    const factsMap = this.factsToMap([...availableFacts, ...derivedFacts]);
                    const result = rule.execute(factsMap);
                    if (result) {
                        const newFact = this.resultToFact(result, rule);
                        if (newFact && this.factMatches(newFact, goal)) {
                            derivedFacts.push(newFact);
                            appliedRules.push(rule.id);
                            reasoning.push(`Rule ${rule.name} satisfied goal ${goal.name}`);
                            return true;
                        }
                    }
                }
                catch (error) {
                    reasoning.push(`Error executing rule ${rule.name}: ${error}`);
                }
            }
        }
        reasoning.push(`Could not prove goal ${goal.name}`);
        return false;
    }
    findApplicableRules(factsMap) {
        return this.rules.filter(rule => {
            try {
                return rule.enabled && rule.evaluate(factsMap);
            }
            catch (error) {
                this.logger.error(`Error evaluating rule ${rule.id}: ${error}`);
                return false;
            }
        });
    }
    findRulesProducingGoal(goal) {
        return this.rules.filter(rule => {
            var _a;
            // This is a simplified check - in practice, you'd analyze the rule's action
            // to see if it can produce the desired fact
            return rule.enabled && (rule.action.target.includes(goal.name) ||
                ((_a = rule.action.template) === null || _a === void 0 ? void 0 : _a.includes(goal.name)) ||
                rule.naturalLanguage.toLowerCase().includes(goal.name.toLowerCase()));
        });
    }
    extractSubgoals(rule, availableFacts) {
        // Extract facts needed to satisfy the rule's conditions
        const subgoals = [];
        if (rule.condition.entities) {
            for (const entityName of rule.condition.entities) {
                if (!availableFacts.some(fact => fact.name === entityName)) {
                    subgoals.push(new fact_1.Fact(entityName, null, 'unknown'));
                }
            }
        }
        // Parse condition expression for fact references
        const factReferences = this.extractFactReferences(rule.condition.expression);
        for (const factName of factReferences) {
            if (!availableFacts.some(fact => fact.name === factName)) {
                subgoals.push(new fact_1.Fact(factName, null, 'unknown'));
            }
        }
        return subgoals;
    }
    extractFactReferences(expression) {
        // Simple regex to extract fact names (variables) from condition expressions
        const matches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        return matches.filter(match => !['true', 'false', 'null', 'undefined', 'and', 'or', 'not'].includes(match.toLowerCase()));
    }
    createDefaultConflictResolver() {
        return {
            name: 'Priority-Based',
            resolve: (conflictingRules, facts) => {
                // Sort by priority (higher priority first), then by confidence
                return conflictingRules.sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority;
                    }
                    return b.confidence - a.confidence;
                }).slice(0, 1); // Take only the highest priority rule
            }
        };
    }
    factsToMap(facts) {
        const map = {};
        for (const fact of facts) {
            map[fact.name] = fact.value;
        }
        return map;
    }
    resultToFact(result, rule) {
        if (!result)
            return null;
        // Try to extract a fact from the result
        if (result.type === 'response' && result.content) {
            return new fact_1.Fact(`result_${rule.id}`, result.content, 'derived', rule.confidence);
        }
        if (result.type === 'set' && result.key && result.value !== undefined) {
            return new fact_1.Fact(result.key, result.value, 'derived', rule.confidence);
        }
        // Default: create a fact representing the rule execution
        return new fact_1.Fact(`executed_${rule.id}`, true, 'derived', rule.confidence);
    }
    factExists(fact, facts) {
        return facts.some(f => f.name === fact.name && f.value === fact.value);
    }
    factMatches(fact1, fact2) {
        return fact1.name === fact2.name &&
            (fact2.value === null || fact1.value === fact2.value);
    }
    calculateConfidence(appliedRules, derivedFacts) {
        if (appliedRules.length === 0)
            return 0;
        const ruleConfidences = appliedRules.map(ruleId => {
            const rule = this.rules.find(r => r.id === ruleId);
            return rule ? rule.confidence : 0.5;
        });
        const factConfidences = derivedFacts.map(fact => fact.confidence || 0.5);
        const allConfidences = [...ruleConfidences, ...factConfidences];
        // Calculate average confidence
        return allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length;
    }
    // Utility methods
    addRule(rule) {
        this.rules.push(rule);
    }
    removeRule(ruleId) {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
    }
    addFact(fact) {
        this.facts.push(fact);
    }
    setConflictResolver(resolver) {
        this.conflictResolver = resolver;
    }
    getRules() {
        return [...this.rules];
    }
    getFacts() {
        return [...this.facts];
    }
}
exports.InferenceEngine = InferenceEngine;
exports.Inference = InferenceEngine;
