import { Rule } from '../core/rule';
import { Logger } from '../utils/logger';

export class RuleRepository {
    private rules: Rule[] = [];
    private logger: Logger;

    constructor() {
        this.logger = new Logger('RuleRepository');
    }

    addRule(rule: Rule): void {
        this.rules.push(rule);
        this.logger.info(`Added rule: ${rule.id}`);
    }

    getRules(): Rule[] {
        return this.rules;
    }

    getRule(id: string): Rule | undefined {
        return this.rules.find(rule => rule.id === id);
    }

    updateRule(id: string, updates: Partial<Rule>): Rule | undefined {
        const ruleIndex = this.rules.findIndex(rule => rule.id === id);
        if (ruleIndex === -1) return undefined;

        // Update the rule properties
        const rule = this.rules[ruleIndex];
        
        // Handle condition and action updates properly
        if (updates.condition) {
            rule.condition = typeof updates.condition === 'string' ? 
                { type: 'simple', expression: updates.condition } : updates.condition;
        }
        if (updates.action) {
            rule.action = typeof updates.action === 'string' ? 
                { type: 'response', target: updates.action } : updates.action;
        }
        
        // Update other properties
        const { condition, action, ...otherUpdates } = updates;
        Object.assign(rule, otherUpdates);
        
        rule.updatedAt = new Date();
        
        this.logger.info(`Updated rule: ${id}`);
        return rule;
    }

    deleteRule(id: string): boolean {
        const ruleIndex = this.rules.findIndex(rule => rule.id === id);
        if (ruleIndex === -1) return false;

        this.rules.splice(ruleIndex, 1);
        this.logger.info(`Deleted rule: ${id}`);
        return true;
    }

    searchRules(query: string, filters?: any): Rule[] {
        if (!query && !filters) return this.rules;

        let filteredRules = this.rules;

        // Text-based search
        if (query) {
            const searchTerm = query.toLowerCase();
            filteredRules = filteredRules.filter(rule => 
                rule.condition.toString().toLowerCase().includes(searchTerm) ||
                rule.action.toString().toLowerCase().includes(searchTerm) ||
                (rule.description && rule.description.toLowerCase().includes(searchTerm))
            );
        }

        // Apply filters
        if (filters) {
            if (filters.priority !== undefined) {
                filteredRules = filteredRules.filter(rule => rule.priority === filters.priority);
            }
            if (filters.enabled !== undefined) {
                filteredRules = filteredRules.filter(rule => rule.enabled === filters.enabled);
            }
            if (filters.domain) {
                filteredRules = filteredRules.filter(rule => 
                    rule.context?.domain === filters.domain
                );
            }
        }

        return filteredRules;
    }

    getRulesByPriority(priority: number): Rule[] {
        return this.rules.filter(rule => rule.priority === priority);
    }

    getActiveRules(): Rule[] {
        return this.rules.filter(rule => rule.enabled !== false);
    }

    clearRules(): void {
        this.rules = [];
        this.logger.info('Cleared all rules');
    }

    getRuleCount(): number {
        return this.rules.length;
    }
}