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
exports.RuleController = void 0;
const express_1 = require("express");
const rule_1 = require("../core/rule");
const logger_1 = require("../utils/logger");
class RuleController {
    constructor(ruleRepository) {
        this.ruleRepository = ruleRepository;
        this.logger = new logger_1.Logger('RuleController');
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAllRules.bind(this));
        this.router.get('/:id', this.getRuleById.bind(this));
        this.router.post('/', this.createRule.bind(this));
        this.router.put('/:id', this.updateRule.bind(this));
        this.router.delete('/:id', this.deleteRule.bind(this));
        this.router.post('/validate', this.validateRule.bind(this));
        this.router.post('/search', this.searchRules.bind(this));
    }
    getAllRules(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rules = this.ruleRepository.getRules();
                res.json(rules);
            }
            catch (error) {
                this.logger.error(`Failed to get rules: ${error}`);
                res.status(500).json({ error: 'Failed to retrieve rules' });
            }
        });
    }
    getRuleById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const rule = this.ruleRepository.getRule(id);
                if (!rule) {
                    res.status(404).json({ error: 'Rule not found' });
                    return;
                }
                res.json(rule);
            }
            catch (error) {
                this.logger.error(`Failed to get rule ${req.params.id}: ${error}`);
                res.status(500).json({ error: 'Failed to retrieve rule' });
            }
        });
    }
    createRule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { condition, action, priority, description } = req.body;
                if (!condition || !action) {
                    res.status(400).json({ error: 'Condition and action are required' });
                    return;
                }
                const rule = new rule_1.Rule(condition, action, priority, description);
                this.ruleRepository.addRule(rule);
                this.logger.info(`Created new rule: ${rule.id}`);
                res.status(201).json(rule);
            }
            catch (error) {
                this.logger.error(`Failed to create rule: ${error}`);
                res.status(500).json({ error: 'Failed to create rule' });
            }
        });
    }
    updateRule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const updates = req.body;
                const existingRule = this.ruleRepository.getRule(id);
                if (!existingRule) {
                    res.status(404).json({ error: 'Rule not found' });
                    return;
                }
                const updatedRule = this.ruleRepository.updateRule(id, updates);
                this.logger.info(`Updated rule: ${id}`);
                res.json(updatedRule);
            }
            catch (error) {
                this.logger.error(`Failed to update rule ${req.params.id}: ${error}`);
                res.status(500).json({ error: 'Failed to update rule' });
            }
        });
    }
    deleteRule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const success = this.ruleRepository.deleteRule(id);
                if (!success) {
                    res.status(404).json({ error: 'Rule not found' });
                    return;
                }
                this.logger.info(`Deleted rule: ${id}`);
                res.status(204).send();
            }
            catch (error) {
                this.logger.error(`Failed to delete rule ${req.params.id}: ${error}`);
                res.status(500).json({ error: 'Failed to delete rule' });
            }
        });
    }
    validateRule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { condition, action } = req.body;
                // Validate rule syntax and logic
                const isValid = this.validateRuleData(condition, action);
                res.json({
                    valid: isValid,
                    message: isValid ? 'Rule is valid' : 'Rule validation failed'
                });
            }
            catch (error) {
                this.logger.error(`Rule validation failed: ${error}`);
                res.status(500).json({ error: 'Validation failed' });
            }
        });
    }
    searchRules(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query, filters } = req.body;
                const rules = this.ruleRepository.searchRules(query, filters);
                res.json(rules);
            }
            catch (error) {
                this.logger.error(`Rule search failed: ${error}`);
                res.status(500).json({ error: 'Search failed' });
            }
        });
    }
    validateRuleData(condition, action) {
        // Basic validation logic
        if (!condition || !action)
            return false;
        if (typeof condition !== 'string' && typeof condition !== 'object')
            return false;
        if (typeof action !== 'string' && typeof action !== 'object')
            return false;
        return true;
    }
}
exports.RuleController = RuleController;
