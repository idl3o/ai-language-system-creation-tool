import { Router, Request, Response } from 'express';
import { Rule } from '../core/rule';
import { RuleRepository } from '../storage/ruleRepository';
import { Logger } from '../utils/logger';

export class RuleController {
    private ruleRepository: RuleRepository;
    private logger: Logger;
    public router: Router;

    constructor(ruleRepository: RuleRepository) {
        this.ruleRepository = ruleRepository;
        this.logger = new Logger('RuleController');
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAllRules.bind(this));
        this.router.get('/:id', this.getRuleById.bind(this));
        this.router.post('/', this.createRule.bind(this));
        this.router.put('/:id', this.updateRule.bind(this));
        this.router.delete('/:id', this.deleteRule.bind(this));
        this.router.post('/validate', this.validateRule.bind(this));
        this.router.post('/search', this.searchRules.bind(this));
    }

    private async getAllRules(req: Request, res: Response): Promise<void> {
        try {
            const rules = this.ruleRepository.getRules();
            res.json(rules);
        } catch (error) {
            this.logger.error(`Failed to get rules: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve rules' });
        }
    }

    private async getRuleById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const rule = this.ruleRepository.getRule(id);
            if (!rule) {
                res.status(404).json({ error: 'Rule not found' });
                return;
            }
            res.json(rule);
        } catch (error) {
            this.logger.error(`Failed to get rule ${req.params.id}: ${error}`);
            res.status(500).json({ error: 'Failed to retrieve rule' });
        }
    }

    private async createRule(req: Request, res: Response): Promise<void> {
        try {
            const { condition, action, priority, description } = req.body;
            
            if (!condition || !action) {
                res.status(400).json({ error: 'Condition and action are required' });
                return;
            }

            const rule = new Rule(condition, action, priority, description);
            this.ruleRepository.addRule(rule);
            
            this.logger.info(`Created new rule: ${rule.id}`);
            res.status(201).json(rule);
        } catch (error) {
            this.logger.error(`Failed to create rule: ${error}`);
            res.status(500).json({ error: 'Failed to create rule' });
        }
    }

    private async updateRule(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            this.logger.error(`Failed to update rule ${req.params.id}: ${error}`);
            res.status(500).json({ error: 'Failed to update rule' });
        }
    }

    private async deleteRule(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const success = this.ruleRepository.deleteRule(id);
            if (!success) {
                res.status(404).json({ error: 'Rule not found' });
                return;
            }

            this.logger.info(`Deleted rule: ${id}`);
            res.status(204).send();
        } catch (error) {
            this.logger.error(`Failed to delete rule ${req.params.id}: ${error}`);
            res.status(500).json({ error: 'Failed to delete rule' });
        }
    }

    private async validateRule(req: Request, res: Response): Promise<void> {
        try {
            const { condition, action } = req.body;
            
            // Validate rule syntax and logic
            const isValid = this.validateRuleData(condition, action);
            
            res.json({ 
                valid: isValid,
                message: isValid ? 'Rule is valid' : 'Rule validation failed'
            });
        } catch (error) {
            this.logger.error(`Rule validation failed: ${error}`);
            res.status(500).json({ error: 'Validation failed' });
        }
    }

    private async searchRules(req: Request, res: Response): Promise<void> {
        try {
            const { query, filters } = req.body;
            
            const rules = this.ruleRepository.searchRules(query, filters);
            res.json(rules);
        } catch (error) {
            this.logger.error(`Rule search failed: ${error}`);
            res.status(500).json({ error: 'Search failed' });
        }
    }

    private validateRuleData(condition: any, action: any): boolean {
        // Basic validation logic
        if (!condition || !action) return false;
        if (typeof condition !== 'string' && typeof condition !== 'object') return false;
        if (typeof action !== 'string' && typeof action !== 'object') return false;
        return true;
    }
}