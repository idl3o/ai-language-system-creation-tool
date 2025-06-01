import { IntelligentRule, Condition, Action, Context } from '../types';
import { Rule } from '../core/rule';
import { Logger } from '../utils/logger';
import { SystemValidator, ValidationResult } from '../utils/validator';

export interface RuleEditorConfig {
    enableValidation?: boolean;
    enableAutoSave?: boolean;
    enableSyntaxHighlighting?: boolean;
    maxRules?: number;
}

export interface RuleFormData {
    name: string;
    condition: {
        type: 'simple' | 'complex' | 'nlp';
        expression: string;
        entities?: string[];
        intents?: string[];
        patterns?: string[];
    };
    action: {
        type: 'response' | 'function' | 'redirect' | 'api';
        target: string;
        parameters?: Record<string, any>;
        template?: string;
    };
    confidence: number;
    priority: number;
    description?: string;
    naturalLanguage?: string;
    tags?: string[];
}

export interface EditorState {
    selectedRuleId?: string;
    editMode: 'create' | 'edit' | 'view';
    isDirty: boolean;
    lastSaved?: Date;
}

export class RuleEditor {
    private rules: Map<string, IntelligentRule>;
    private config: RuleEditorConfig;
    private logger: Logger;
    private validator: SystemValidator;
    private state: EditorState;
    private changeListeners: Array<(rules: IntelligentRule[]) => void>;
    private validationCache: Map<string, ValidationResult>;

    constructor(config: RuleEditorConfig = {}) {
        this.rules = new Map();
        this.config = {
            enableValidation: true,
            enableAutoSave: false,
            enableSyntaxHighlighting: true,
            maxRules: 100,
            ...config
        };
        this.logger = new Logger('RuleEditor');
        this.validator = new SystemValidator();
        this.state = {
            editMode: 'view',
            isDirty: false
        };
        this.changeListeners = [];
        this.validationCache = new Map();
    }

    // Core rule management operations
    public addRule(ruleData: RuleFormData): string {
        try {
            if (this.config.maxRules && this.rules.size >= this.config.maxRules) {
                throw new Error(`Maximum number of rules (${this.config.maxRules}) reached`);
            }

            const rule = this.createRuleFromFormData(ruleData);
            
            if (this.config.enableValidation) {
                const validationResult = this.validateRule(rule);
                if (!validationResult.isValid) {
                    throw new Error(`Rule validation failed: ${validationResult.errors.join(', ')}`);
                }
            }

            this.rules.set(rule.id, rule);
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Added rule: ${rule.id} - ${rule.name}`);
            
            return rule.id;
        } catch (error) {
            this.logger.error(`Failed to add rule: ${error}`);
            throw error;
        }
    }

    public editRule(ruleId: string, updates: Partial<RuleFormData>): boolean {
        try {
            const existingRule = this.rules.get(ruleId);
            if (!existingRule) {
                throw new Error(`Rule not found: ${ruleId}`);
            }

            const updatedRule = this.updateRuleFromFormData(existingRule, updates);
            
            if (this.config.enableValidation) {
                const validationResult = this.validateRule(updatedRule);
                if (!validationResult.isValid) {
                    throw new Error(`Rule validation failed: ${validationResult.errors.join(', ')}`);
                }
            }

            this.rules.set(ruleId, updatedRule);
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Updated rule: ${ruleId}`);
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to edit rule ${ruleId}: ${error}`);
            throw error;
        }
    }

    public deleteRule(ruleId: string): boolean {
        try {
            if (!this.rules.has(ruleId)) {
                throw new Error(`Rule not found: ${ruleId}`);
            }

            this.rules.delete(ruleId);
            this.validationCache.delete(ruleId);
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Deleted rule: ${ruleId}`);
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete rule ${ruleId}: ${error}`);
            throw error;
        }
    }

    public duplicateRule(ruleId: string): string {
        try {
            const existingRule = this.rules.get(ruleId);
            if (!existingRule) {
                throw new Error(`Rule not found: ${ruleId}`);
            }

            const duplicatedRule = new Rule(
                existingRule.condition,
                existingRule.action,
                existingRule.priority,
                existingRule.description,
                {
                    name: existingRule.name + '_copy',
                    confidence: existingRule.confidence,
                    context: existingRule.context,
                    naturalLanguage: existingRule.naturalLanguage,
                    generatedFrom: existingRule.generatedFrom
                }
            );

            this.rules.set(duplicatedRule.id, duplicatedRule);
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Duplicated rule: ${ruleId} -> ${duplicatedRule.id}`);
            
            return duplicatedRule.id;
        } catch (error) {
            this.logger.error(`Failed to duplicate rule ${ruleId}: ${error}`);
            throw error;
        }
    }

    // Query and retrieval operations
    public getRule(ruleId: string): IntelligentRule | undefined {
        return this.rules.get(ruleId);
    }

    public getRules(): IntelligentRule[] {
        return Array.from(this.rules.values());
    }

    public getRulesByPriority(priority: number): IntelligentRule[] {
        return this.getRules().filter(rule => rule.priority === priority);
    }

    public searchRules(query: string, filters?: any): IntelligentRule[] {
        const rules = this.getRules();
        
        if (!query && !filters) return rules;

        let filteredRules = rules;

        // Text-based search
        if (query) {
            const searchTerm = query.toLowerCase();
            filteredRules = filteredRules.filter(rule => 
                rule.name.toLowerCase().includes(searchTerm) ||
                rule.naturalLanguage.toLowerCase().includes(searchTerm) ||
                rule.condition.expression.toLowerCase().includes(searchTerm) ||
                (rule.description && rule.description.toLowerCase().includes(searchTerm))
            );
        }

        // Apply filters
        if (filters) {
            if (filters.priority !== undefined) {
                filteredRules = filteredRules.filter(rule => rule.priority === filters.priority);
            }
            if (filters.conditionType) {
                filteredRules = filteredRules.filter(rule => rule.condition.type === filters.conditionType);
            }
            if (filters.actionType) {
                filteredRules = filteredRules.filter(rule => rule.action.type === filters.actionType);
            }
            if (filters.confidence !== undefined) {
                filteredRules = filteredRules.filter(rule => rule.confidence >= filters.confidence);
            }
        }

        return filteredRules;
    }

    // Validation operations
    public validateRule(rule: IntelligentRule): ValidationResult {
        const cacheKey = rule.id;
        
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey)!;
        }

        const result = this.validator.validateRule(rule);
        this.validationCache.set(cacheKey, result);
        
        return result;
    }

    public validateAllRules(): ValidationResult {
        const allErrors: string[] = [];
        const allWarnings: string[] = [];
        
        for (const rule of this.getRules()) {
            const result = this.validateRule(rule);
            allErrors.push(...result.errors);
            allWarnings.push(...result.warnings);
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings
        };
    }

    // Editor state management
    public selectRule(ruleId: string): void {
        if (!this.rules.has(ruleId)) {
            throw new Error(`Rule not found: ${ruleId}`);
        }
        
        this.state.selectedRuleId = ruleId;
        this.state.editMode = 'view';
    }

    public enterEditMode(ruleId?: string): void {
        if (ruleId) {
            this.selectRule(ruleId);
        }
        this.state.editMode = this.state.selectedRuleId ? 'edit' : 'create';
    }

    public exitEditMode(): void {
        this.state.editMode = 'view';
        this.state.selectedRuleId = undefined;
    }

    public getState(): EditorState {
        return { ...this.state };
    }

    // Import/Export operations
    public importRules(rules: IntelligentRule[]): number {
        let importedCount = 0;
        
        for (const ruleData of rules) {
            try {
                const rule = new Rule(
                    ruleData.condition,
                    ruleData.action,
                    ruleData.priority,
                    ruleData.description || undefined,
                    ruleData
                );
                
                this.rules.set(rule.id, rule);
                importedCount++;
            } catch (error) {
                this.logger.error(`Failed to import rule ${ruleData.name}: ${error}`);
            }
        }

        if (importedCount > 0) {
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Imported ${importedCount} rules`);
        }

        return importedCount;
    }

    public exportRules(format: 'json' | 'csv' | 'yaml' = 'json'): string {
        const rules = this.getRules();
        
        switch (format) {
            case 'json':
                return JSON.stringify(rules, null, 2);
            case 'csv':
                return this.exportToCSV(rules);
            case 'yaml':
                return this.exportToYAML(rules);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Bulk operations
    public reorderRules(ruleIds: string[]): void {
        // Update priorities based on order
        ruleIds.forEach((ruleId, index) => {
            const rule = this.rules.get(ruleId);
            if (rule) {
                const updatedRule = new Rule(
                    rule.condition,
                    rule.action,
                    index + 1,
                    rule.description,
                    rule
                );
                this.rules.set(ruleId, updatedRule);
            }
        });

        this.markDirty();
        this.notifyListeners();
        this.logger.info(`Reordered ${ruleIds.length} rules`);
    }

    public bulkUpdateRules(ruleIds: string[], updates: Partial<RuleFormData>): number {
        let updatedCount = 0;

        for (const ruleId of ruleIds) {
            try {
                this.editRule(ruleId, updates);
                updatedCount++;
            } catch (error) {
                this.logger.error(`Failed to bulk update rule ${ruleId}: ${error}`);
            }
        }

        return updatedCount;
    }

    public clearRules(): void {
        this.rules.clear();
        this.validationCache.clear();
        this.state.selectedRuleId = undefined;
        this.markDirty();
        this.notifyListeners();
        this.logger.info('Cleared all rules');
    }

    // Event handling
    public addChangeListener(listener: (rules: IntelligentRule[]) => void): void {
        this.changeListeners.push(listener);
    }

    public removeChangeListener(listener: (rules: IntelligentRule[]) => void): void {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    // Statistics and metrics
    public getStatistics(): any {
        const rules = this.getRules();
        
        return {
            totalRules: rules.length,
            rulesByType: this.groupBy(rules, 'condition.type'),
            rulesByAction: this.groupBy(rules, 'action.type'),
            averageConfidence: rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length || 0,
            priorityDistribution: this.groupBy(rules, 'priority'),
            validationStatus: this.validateAllRules()
        };
    }

    // Private helper methods
    private createRuleFromFormData(data: RuleFormData): IntelligentRule {
        return new Rule(
            data.condition,
            data.action,
            data.priority,
            data.description,
            {
                name: data.name,
                confidence: data.confidence,
                naturalLanguage: data.naturalLanguage,
                generatedFrom: 'editor'
            }
        );
    }

    private updateRuleFromFormData(existing: IntelligentRule, updates: Partial<RuleFormData>): IntelligentRule {
        return new Rule(
            updates.condition || existing.condition,
            updates.action || existing.action,
            updates.priority !== undefined ? updates.priority : existing.priority,
            updates.description !== undefined ? updates.description : existing.description,
            {
                id: existing.id,
                name: updates.name || existing.name,
                confidence: updates.confidence !== undefined ? updates.confidence : existing.confidence,
                context: existing.context,
                naturalLanguage: updates.naturalLanguage || existing.naturalLanguage,
                generatedFrom: existing.generatedFrom
            }
        );
    }

    private markDirty(): void {
        this.state.isDirty = true;
    }

    private notifyListeners(): void {
        const rules = this.getRules();
        this.changeListeners.forEach(listener => listener(rules));
    }

    private exportToCSV(rules: IntelligentRule[]): string {
        const headers = ['ID', 'Name', 'Condition', 'Action', 'Priority', 'Confidence', 'Description'];
        const rows = rules.map(rule => [
            rule.id,
            rule.name,
            rule.condition.expression,
            rule.action.target,
            rule.priority.toString(),
            rule.confidence.toString(),
            rule.description || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    private exportToYAML(rules: IntelligentRule[]): string {
        // Simple YAML export implementation
        let yaml = 'rules:\n';
        for (const rule of rules) {
            yaml += `  - id: "${rule.id}"\n`;
            yaml += `    name: "${rule.name}"\n`;
            yaml += `    condition:\n`;
            yaml += `      type: "${rule.condition.type}"\n`;
            yaml += `      expression: "${rule.condition.expression}"\n`;
            yaml += `    action:\n`;
            yaml += `      type: "${rule.action.type}"\n`;
            yaml += `      target: "${rule.action.target}"\n`;
            yaml += `    priority: ${rule.priority}\n`;
            yaml += `    confidence: ${rule.confidence}\n`;
            if (rule.description) {
                yaml += `    description: "${rule.description}"\n`;
            }
            yaml += '\n';
        }
        return yaml;
    }

    private groupBy(items: any[], key: string): Record<string, number> {
        return items.reduce((groups, item) => {
            const value = this.getNestedProperty(item, key);
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}