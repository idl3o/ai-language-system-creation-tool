"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleRepository = void 0;
const logger_1 = require("../utils/logger");
class RuleRepository {
    constructor() {
        this.rules = [];
        this.logger = new logger_1.Logger('RuleRepository');
    }
    addRule(rule) {
        this.rules.push(rule);
        this.logger.info(`Added rule: ${rule.id}`);
    }
    getRules() {
        return this.rules;
    }
    getRule(id) {
        return this.rules.find(rule => rule.id === id);
    }
    updateRule(id, updates) {
        const ruleIndex = this.rules.findIndex(rule => rule.id === id);
        if (ruleIndex === -1)
            return undefined;
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
        const { condition, action } = updates, otherUpdates = __rest(updates, ["condition", "action"]);
        Object.assign(rule, otherUpdates);
        rule.updatedAt = new Date();
        this.logger.info(`Updated rule: ${id}`);
        return rule;
    }
    deleteRule(id) {
        const ruleIndex = this.rules.findIndex(rule => rule.id === id);
        if (ruleIndex === -1)
            return false;
        this.rules.splice(ruleIndex, 1);
        this.logger.info(`Deleted rule: ${id}`);
        return true;
    }
    searchRules(query, filters) {
        if (!query && !filters)
            return this.rules;
        let filteredRules = this.rules;
        // Text-based search
        if (query) {
            const searchTerm = query.toLowerCase();
            filteredRules = filteredRules.filter(rule => rule.condition.toString().toLowerCase().includes(searchTerm) ||
                rule.action.toString().toLowerCase().includes(searchTerm) ||
                (rule.description && rule.description.toLowerCase().includes(searchTerm)));
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
                filteredRules = filteredRules.filter(rule => { var _a; return ((_a = rule.context) === null || _a === void 0 ? void 0 : _a.domain) === filters.domain; });
            }
        }
        return filteredRules;
    }
    getRulesByPriority(priority) {
        return this.rules.filter(rule => rule.priority === priority);
    }
    getActiveRules() {
        return this.rules.filter(rule => rule.enabled !== false);
    }
    clearRules() {
        this.rules = [];
        this.logger.info('Cleared all rules');
    }
    getRuleCount() {
        return this.rules.length;
    }
}
exports.RuleRepository = RuleRepository;
