import { Rule } from './rule';
import { Fact } from './fact';
import { Logger } from '../utils/logger';

export interface InferenceResult {
    derivedFacts: Fact[];
    appliedRules: string[];
    confidence: number;
    reasoning: string[];
}

export interface ConflictResolutionStrategy {
    name: string;
    resolve: (conflictingRules: Rule[], facts: Record<string, any>) => Rule[];
}

export class InferenceEngine {
    private rules: Rule[];
    private facts: Fact[];
    private maxIterations: number;
    private logger: Logger;
    private conflictResolver: ConflictResolutionStrategy;

    constructor(rules: Rule[] = [], maxIterations: number = 100) {
        this.rules = rules;
        this.facts = [];
        this.maxIterations = maxIterations;
        this.logger = new Logger('InferenceEngine');
        this.conflictResolver = this.createDefaultConflictResolver();
    }

    // Forward chaining inference
    public forwardChain(initialFacts: Fact[]): InferenceResult {
        this.logger.info('Starting forward chaining inference');
        
        const derivedFacts: Fact[] = [];
        const appliedRules: string[] = [];
        const reasoning: string[] = [];
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
                } catch (error) {
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
    public backwardChain(goal: Fact, availableFacts: Fact[]): InferenceResult {
        this.logger.info(`Starting backward chaining for goal: ${goal.name}`);
        
        const derivedFacts: Fact[] = [];
        const appliedRules: string[] = [];
        const reasoning: string[] = [`Goal: ${goal.name} = ${goal.value}`];
        
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

    private proveGoal(
        goal: Fact, 
        availableFacts: Fact[], 
        derivedFacts: Fact[], 
        appliedRules: string[], 
        reasoning: string[],
        visited: Set<string>
    ): boolean {
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
                } catch (error) {
                    reasoning.push(`Error executing rule ${rule.name}: ${error}`);
                }
            }
        }

        reasoning.push(`Could not prove goal ${goal.name}`);
        return false;
    }

    private findApplicableRules(factsMap: Record<string, any>): Rule[] {
        return this.rules.filter(rule => {
            try {
                return rule.enabled && rule.evaluate(factsMap);
            } catch (error) {
                this.logger.error(`Error evaluating rule ${rule.id}: ${error}`);
                return false;
            }
        });
    }

    private findRulesProducingGoal(goal: Fact): Rule[] {
        return this.rules.filter(rule => {
            // This is a simplified check - in practice, you'd analyze the rule's action
            // to see if it can produce the desired fact
            return rule.enabled && (
                rule.action.target.includes(goal.name) ||
                rule.action.template?.includes(goal.name) ||
                rule.naturalLanguage.toLowerCase().includes(goal.name.toLowerCase())
            );
        });
    }

    private extractSubgoals(rule: Rule, availableFacts: Fact[]): Fact[] {
        // Extract facts needed to satisfy the rule's conditions
        const subgoals: Fact[] = [];
        
        if (rule.condition.entities) {
            for (const entityName of rule.condition.entities) {
                if (!availableFacts.some(fact => fact.name === entityName)) {
                    subgoals.push(new Fact(entityName, null, 'unknown'));
                }
            }
        }

        // Parse condition expression for fact references
        const factReferences = this.extractFactReferences(rule.condition.expression);
        for (const factName of factReferences) {
            if (!availableFacts.some(fact => fact.name === factName)) {
                subgoals.push(new Fact(factName, null, 'unknown'));
            }
        }

        return subgoals;
    }

    private extractFactReferences(expression: string): string[] {
        // Simple regex to extract fact names (variables) from condition expressions
        const matches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        return matches.filter(match => 
            !['true', 'false', 'null', 'undefined', 'and', 'or', 'not'].includes(match.toLowerCase())
        );
    }

    private createDefaultConflictResolver(): ConflictResolutionStrategy {
        return {
            name: 'Priority-Based',
            resolve: (conflictingRules: Rule[], facts: Record<string, any>) => {
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

    private factsToMap(facts: Fact[]): Record<string, any> {
        const map: Record<string, any> = {};
        for (const fact of facts) {
            map[fact.name] = fact.value;
        }
        return map;
    }

    private resultToFact(result: any, rule: Rule): Fact | null {
        if (!result) return null;

        // Try to extract a fact from the result
        if (result.type === 'response' && result.content) {
            return new Fact(`result_${rule.id}`, result.content, 'derived', rule.confidence);
        }
        
        if (result.type === 'set' && result.key && result.value !== undefined) {
            return new Fact(result.key, result.value, 'derived', rule.confidence);
        }

        // Default: create a fact representing the rule execution
        return new Fact(`executed_${rule.id}`, true, 'derived', rule.confidence);
    }

    private factExists(fact: Fact, facts: Fact[]): boolean {
        return facts.some(f => f.name === fact.name && f.value === fact.value);
    }

    private factMatches(fact1: Fact, fact2: Fact): boolean {
        return fact1.name === fact2.name && 
               (fact2.value === null || fact1.value === fact2.value);
    }

    private calculateConfidence(appliedRules: string[], derivedFacts: Fact[]): number {
        if (appliedRules.length === 0) return 0;

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
    public addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    public removeRule(ruleId: string): void {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
    }

    public addFact(fact: Fact): void {
        this.facts.push(fact);
    }

    public setConflictResolver(resolver: ConflictResolutionStrategy): void {
        this.conflictResolver = resolver;
    }

    public getRules(): Rule[] {
        return [...this.rules];
    }

    public getFacts(): Fact[] {
        return [...this.facts];
    }
}

// Export for backward compatibility
export { InferenceEngine as Inference };