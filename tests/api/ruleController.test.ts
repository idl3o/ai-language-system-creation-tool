import request from 'supertest';
import express from 'express';
import { RuleController } from '../../src/api/ruleController';
import { RuleRepository } from '../../src/storage/ruleRepository';
import { Rule } from '../../src/core/rule';

describe('RuleController API Tests', () => {
    let app: express.Application;
    let ruleRepository: RuleRepository;
    let ruleController: RuleController;    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        ruleRepository = new RuleRepository();
        ruleController = new RuleController(ruleRepository);
        
        app.use('/api/rules', ruleController.router);
    });

    describe('GET /api/rules', () => {
        test('should return empty array when no rules exist', async () => {
            const response = await request(app)
                .get('/api/rules')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test('should return all rules when rules exist', async () => {
            const rule = new Rule('test > 0', 'success');
            ruleRepository.addRule(rule);

            const response = await request(app)
                .get('/api/rules')
                .expect(200);            expect(response.body).toHaveLength(1);
            expect(response.body[0].condition.expression).toBe('test > 0');
            expect(response.body[0].action.target).toBe('success');
        });
    });

    describe('GET /api/rules/:id', () => {
        test('should return rule by id', async () => {
            const rule = new Rule('temperature > 30', 'hot');
            ruleRepository.addRule(rule);

            const response = await request(app)
                .get(`/api/rules/${rule.id}`)
                .expect(200);            expect(response.body.id).toBe(rule.id);
            expect(response.body.condition.expression).toBe('temperature > 30');
            expect(response.body.action.target).toBe('hot');
        });

        test('should return 404 for non-existent rule', async () => {
            const response = await request(app)
                .get('/api/rules/non-existent-id')
                .expect(404);

            expect(response.body.error).toBe('Rule not found');
        });
    });

    describe('POST /api/rules', () => {
        test('should create a new rule', async () => {
            const ruleData = {
                condition: 'score > 85',
                action: 'grade_a',
                priority: 1,
                description: 'Grade A assignment'
            };

            const response = await request(app)
                .post('/api/rules')
                .send(ruleData)
                .expect(201);            expect(response.body.condition.expression).toBe(ruleData.condition);
            expect(response.body.action.target).toBe(ruleData.action);
            expect(response.body.priority).toBe(ruleData.priority);
            expect(response.body.description).toBe(ruleData.description);
            expect(response.body.id).toBeDefined();
        });

        test('should return 400 when condition is missing', async () => {
            const ruleData = {
                action: 'test_action'
            };

            const response = await request(app)
                .post('/api/rules')
                .send(ruleData)
                .expect(400);

            expect(response.body.error).toBe('Condition and action are required');
        });

        test('should return 400 when action is missing', async () => {
            const ruleData = {
                condition: 'test_condition'
            };

            const response = await request(app)
                .post('/api/rules')
                .send(ruleData)
                .expect(400);

            expect(response.body.error).toBe('Condition and action are required');
        });
    });

    describe('PUT /api/rules/:id', () => {
        test('should update an existing rule', async () => {
            const rule = new Rule('old_condition', 'old_action');
            ruleRepository.addRule(rule);

            const updates = {
                condition: 'new_condition',
                action: 'new_action',
                description: 'Updated rule'
            };

            const response = await request(app)
                .put(`/api/rules/${rule.id}`)
                .send(updates)
                .expect(200);            expect(response.body.condition.expression).toBe(updates.condition);
            expect(response.body.action.target).toBe(updates.action);
            expect(response.body.description).toBe(updates.description);
        });

        test('should return 404 for non-existent rule', async () => {
            const updates = { condition: 'new_condition' };

            const response = await request(app)
                .put('/api/rules/non-existent-id')
                .send(updates)
                .expect(404);

            expect(response.body.error).toBe('Rule not found');
        });
    });

    describe('DELETE /api/rules/:id', () => {
        test('should delete an existing rule', async () => {
            const rule = new Rule('to_delete', 'delete_action');
            ruleRepository.addRule(rule);

            await request(app)
                .delete(`/api/rules/${rule.id}`)
                .expect(204);

            const deletedRule = ruleRepository.getRule(rule.id);
            expect(deletedRule).toBeUndefined();
        });

        test('should return 404 for non-existent rule', async () => {
            const response = await request(app)
                .delete('/api/rules/non-existent-id')
                .expect(404);

            expect(response.body.error).toBe('Rule not found');
        });
    });

    describe('POST /api/rules/validate', () => {
        test('should validate a valid rule', async () => {
            const ruleData = {
                condition: 'temperature > 20',
                action: 'warm'
            };

            const response = await request(app)
                .post('/api/rules/validate')
                .send(ruleData)
                .expect(200);

            expect(response.body.valid).toBe(true);
            expect(response.body.message).toBe('Rule is valid');
        });

        test('should reject invalid rule data', async () => {
            const ruleData = {
                condition: null,
                action: undefined
            };

            const response = await request(app)
                .post('/api/rules/validate')
                .send(ruleData)
                .expect(200);

            expect(response.body.valid).toBe(false);
            expect(response.body.message).toBe('Rule validation failed');
        });
    });

    describe('POST /api/rules/search', () => {
        test('should search rules', async () => {
            const rule1 = new Rule('temperature > 30', 'hot');
            const rule2 = new Rule('humidity > 80', 'humid');
            ruleRepository.addRule(rule1);
            ruleRepository.addRule(rule2);

            const searchData = {
                query: 'temperature',
                filters: {}
            };

            const response = await request(app)
                .post('/api/rules/search')
                .send(searchData)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // The actual search implementation would depend on RuleRepository.searchRules
        });
    });
});
