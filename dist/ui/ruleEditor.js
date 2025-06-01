"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEditor = void 0;
const rule_1 = require("../core/rule");
const logger_1 = require("../utils/logger");
const validator_1 = require("../utils/validator");
class RuleEditor {
    constructor(config = {}) {
        this.rules = new Map();
        this.config = Object.assign({ enableValidation: true, enableAutoSave: false, enableSyntaxHighlighting: true, maxRules: 100 }, config);
        this.logger = new logger_1.Logger('RuleEditor');
        this.validator = new validator_1.SystemValidator();
        this.state = {
            editMode: 'view',
            isDirty: false
        };
        this.changeListeners = [];
        this.validationCache = new Map();
    }
    // Core rule management operations
    addRule(ruleData) {
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
        }
        catch (error) {
            this.logger.error(`Failed to add rule: ${error}`);
            throw error;
        }
    }
    editRule(ruleId, updates) {
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
        }
        catch (error) {
            this.logger.error(`Failed to edit rule ${ruleId}: ${error}`);
            throw error;
        }
    }
    deleteRule(ruleId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to delete rule ${ruleId}: ${error}`);
            throw error;
        }
    }
    duplicateRule(ruleId) {
        try {
            const existingRule = this.rules.get(ruleId);
            if (!existingRule) {
                throw new Error(`Rule not found: ${ruleId}`);
            }
            const duplicatedRule = new rule_1.Rule(existingRule.condition, existingRule.action, existingRule.priority, existingRule.description, {
                name: existingRule.name + '_copy',
                confidence: existingRule.confidence,
                context: existingRule.context,
                naturalLanguage: existingRule.naturalLanguage,
                generatedFrom: existingRule.generatedFrom
            });
            this.rules.set(duplicatedRule.id, duplicatedRule);
            this.markDirty();
            this.notifyListeners();
            this.logger.info(`Duplicated rule: ${ruleId} -> ${duplicatedRule.id}`);
            return duplicatedRule.id;
        }
        catch (error) {
            this.logger.error(`Failed to duplicate rule ${ruleId}: ${error}`);
            throw error;
        }
    }
    // Query and retrieval operations
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getRulesByPriority(priority) {
        return this.getRules().filter(rule => rule.priority === priority);
    }
    searchRules(query, filters) {
        const rules = this.getRules();
        if (!query && !filters)
            return rules;
        let filteredRules = rules;
        // Text-based search
        if (query) {
            const searchTerm = query.toLowerCase();
            filteredRules = filteredRules.filter(rule => rule.name.toLowerCase().includes(searchTerm) ||
                rule.naturalLanguage.toLowerCase().includes(searchTerm) ||
                rule.condition.expression.toLowerCase().includes(searchTerm) ||
                (rule.description && rule.description.toLowerCase().includes(searchTerm)));
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
    validateRule(rule) {
        const cacheKey = rule.id;
        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }
        const result = this.validator.validateRule(rule);
        this.validationCache.set(cacheKey, result);
        return result;
    }
    validateAllRules() {
        const allErrors = [];
        const allWarnings = [];
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
    selectRule(ruleId) {
        if (!this.rules.has(ruleId)) {
            throw new Error(`Rule not found: ${ruleId}`);
        }
        this.state.selectedRuleId = ruleId;
        this.state.editMode = 'view';
    }
    enterEditMode(ruleId) {
        if (ruleId) {
            this.selectRule(ruleId);
        }
        this.state.editMode = this.state.selectedRuleId ? 'edit' : 'create';
    }
    exitEditMode() {
        this.state.editMode = 'view';
        this.state.selectedRuleId = undefined;
    }
    getState() {
        return Object.assign({}, this.state);
    }
    // Import/Export operations
    importRules(rules) {
        let importedCount = 0;
        for (const ruleData of rules) {
            try {
                const rule = new rule_1.Rule(ruleData.condition, ruleData.action, ruleData.priority, ruleData.description || undefined, ruleData);
                this.rules.set(rule.id, rule);
                importedCount++;
            }
            catch (error) {
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
    exportRules(format = 'json') {
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
    reorderRules(ruleIds) {
        // Update priorities based on order
        ruleIds.forEach((ruleId, index) => {
            const rule = this.rules.get(ruleId);
            if (rule) {
                const updatedRule = new rule_1.Rule(rule.condition, rule.action, index + 1, rule.description, rule);
                this.rules.set(ruleId, updatedRule);
            }
        });
        this.markDirty();
        this.notifyListeners();
        this.logger.info(`Reordered ${ruleIds.length} rules`);
    }
    bulkUpdateRules(ruleIds, updates) {
        let updatedCount = 0;
        for (const ruleId of ruleIds) {
            try {
                this.editRule(ruleId, updates);
                updatedCount++;
            }
            catch (error) {
                this.logger.error(`Failed to bulk update rule ${ruleId}: ${error}`);
            }
        }
        return updatedCount;
    }
    clearRules() {
        this.rules.clear();
        this.validationCache.clear();
        this.state.selectedRuleId = undefined;
        this.markDirty();
        this.notifyListeners();
        this.logger.info('Cleared all rules');
    }
    // Event handling
    addChangeListener(listener) {
        this.changeListeners.push(listener);
    }
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }
    // Statistics and metrics
    getStatistics() {
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
    createRuleFromFormData(data) {
        return new rule_1.Rule(data.condition, data.action, data.priority, data.description, {
            name: data.name,
            confidence: data.confidence,
            naturalLanguage: data.naturalLanguage,
            generatedFrom: 'editor'
        });
    }
    updateRuleFromFormData(existing, updates) {
        return new rule_1.Rule(updates.condition || existing.condition, updates.action || existing.action, updates.priority !== undefined ? updates.priority : existing.priority, updates.description !== undefined ? updates.description : existing.description, {
            id: existing.id,
            name: updates.name || existing.name,
            confidence: updates.confidence !== undefined ? updates.confidence : existing.confidence,
            context: existing.context,
            naturalLanguage: updates.naturalLanguage || existing.naturalLanguage,
            generatedFrom: existing.generatedFrom
        });
    }
    markDirty() {
        this.state.isDirty = true;
    }
    notifyListeners() {
        const rules = this.getRules();
        this.changeListeners.forEach(listener => listener(rules));
    }
    exportToCSV(rules) {
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
        return [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    }
    exportToYAML(rules) {
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
    groupBy(items, key) {
        return items.reduce((groups, item) => {
            const value = this.getNestedProperty(item, key);
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current === null || current === void 0 ? void 0 : current[key], obj);
    }
}
exports.RuleEditor = RuleEditor;
