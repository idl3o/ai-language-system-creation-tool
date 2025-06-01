import request from 'supertest';
import express from 'express';
import { SystemController } from '../../src/api/systemController';

// Mock the AI Engine to avoid OpenAI dependency issues in tests
jest.mock('../../src/ai/engine', () => {
    return {
        AIEngine: jest.fn().mockImplementation(() => ({
            optimizeRules: jest.fn().mockResolvedValue([
                {
                    id: 'optimized-rule-1',
                    name: 'optimized_rule',
                    condition: { type: 'simple', expression: 'optimized condition' },
                    action: { type: 'response', target: 'optimized response' },
                    confidence: 0.95,
                    priority: 1,
                    naturalLanguage: 'Optimized rule description'
                }
            ])
        }))
    };
});

// Mock the NLP Processor to avoid compromise/natural library issues in tests
jest.mock('../../src/nlp/processor', () => {
    return {
        NLPProcessor: jest.fn().mockImplementation(() => ({
            analyzeText: jest.fn().mockResolvedValue({
                intent: 'test_intent',
                entities: [{ name: 'test_entity', type: 'test', value: 'test_value' }],
                patterns: ['test pattern'],
                vocabulary: { terms: [], synonyms: {}, stopWords: [] },
                confidence: 0.85,
                recommendations: ['recommendation 1']
            })
        }))
    };
});

// Mock the SystemGenerator to avoid dependency issues
jest.mock('../../src/generators/systemGenerator', () => {
    return {
        SystemGenerator: jest.fn().mockImplementation(() => ({
            generateSystem: jest.fn().mockImplementation((request) => Promise.resolve({
                id: 'test-system-1',
                name: 'Test System',
                description: 'A test system',
                domain: request.domain || 'test',
                rules: [
                    {
                        id: 'test-rule-1',
                        name: 'test_rule',
                        condition: { type: 'simple', expression: 'test condition' },
                        action: { type: 'response', target: 'test response' },
                        confidence: 0.8,
                        priority: 1,
                        naturalLanguage: 'Test rule description'
                    }
                ],
                entities: [{ name: 'test_entity', type: 'test', value: 'test_value' }],
                intents: [{ name: 'test_intent', confidence: 0.8, entities: [], utterances: [] }],
                vocabulary: { terms: [], synonyms: {}, stopWords: [] },
                metadata: {
                    version: '1.0.0',
                    created: new Date(),
                    lastModified: new Date(),
                    author: 'Test',
                    tags: ['test'],
                    performance: { accuracy: 0.85, precision: 0.8, recall: 0.82, f1Score: 0.81, responseTime: 150 }
                }
            })),            exportSystem: jest.fn().mockImplementation((system, format) => Promise.resolve(
                JSON.stringify({ exported: 'system', format: format || 'json' })
            )),
            getExamples: jest.fn().mockReturnValue([
                { id: 1, domain: 'customer-service', type: 'support', name: 'Basic Support', description: 'Handle customer inquiries' },
                { id: 2, domain: 'e-commerce', type: 'catalog', name: 'Product Catalog', description: 'Manage product information' }
            ])
        }))
    };
});

// Mock the SystemValidator to avoid validation dependency issues
jest.mock('../../src/utils/validator', () => {
    return {
        SystemValidator: jest.fn().mockImplementation(() => ({
            validateSystem: jest.fn().mockResolvedValue({
                valid: true,
                isValid: true,
                errors: [],
                warnings: [],
                score: 0.95
            })
        }))
    };
});

describe('SystemController API Tests', () => {
    let app: express.Application;
    let systemController: SystemController;    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        systemController = new SystemController();
        app.use('/api/system', systemController.router);
    });

    describe('GET /api/system/status', () => {
        test('should return system status', async () => {
            const response = await request(app)
                .get('/api/system/status')
                .expect(200);

            expect(response.body).toHaveProperty('aiEngine');
            expect(response.body).toHaveProperty('nlpProcessor');
            expect(response.body).toHaveProperty('systemGenerator');
            expect(response.body).toHaveProperty('timestamp');
            expect(typeof response.body.timestamp).toBe('string');
        });
    });

    describe('POST /api/system/generate', () => {
        test('should generate a new system', async () => {
            const systemRequest = {
                requirements: 'Create a customer service system',
                domain: 'customer-service',
                complexity: 'medium',
                options: {
                    includeNLP: true,
                    includeAI: true
                }
            };

            const response = await request(app)
                .post('/api/system/generate')
                .send(systemRequest)
                .expect(201);

            expect(response.body).toHaveProperty('metadata');
            expect(response.body).toHaveProperty('rules');
            expect(response.body).toHaveProperty('domain');
            expect(response.body.domain).toBe(systemRequest.domain);
        });

        test('should return 400 when requirements are missing', async () => {
            const systemRequest = {
                domain: 'test'
            };

            const response = await request(app)
                .post('/api/system/generate')
                .send(systemRequest)
                .expect(400);

            expect(response.body.error).toBe('Requirements are required');
        });

        test('should use default values when optional fields are missing', async () => {
            const systemRequest = {
                requirements: 'Simple test system'
            };

            const response = await request(app)
                .post('/api/system/generate')
                .send(systemRequest)
                .expect(201);

            expect(response.body.domain).toBe('general');
        });
    });

    describe('POST /api/system/analyze', () => {
        test('should analyze text', async () => {
            const analysisRequest = {
                text: 'Hello, I need help with my order',
                domain: 'customer-service'
            };

            const response = await request(app)
                .post('/api/system/analyze')
                .send(analysisRequest)
                .expect(200);

            expect(response.body).toHaveProperty('intent');
            expect(response.body).toHaveProperty('entities');
            expect(response.body).toHaveProperty('confidence');
        });

        test('should handle analysis without domain', async () => {
            const analysisRequest = {
                text: 'Sample text for analysis'
            };

            const response = await request(app)
                .post('/api/system/analyze')
                .send(analysisRequest)
                .expect(200);

            expect(response.body).toHaveProperty('intent');
            expect(response.body).toHaveProperty('entities');
        });
    });

    describe('POST /api/system/validate', () => {
        test('should validate a system', async () => {
            const validationRequest = {
                system: {
                    name: 'Test System',
                    rules: [
                        {
                            condition: 'intent === "greeting"',
                            action: { type: 'response', target: 'Hello!' }
                        }
                    ],
                    domain: 'test'
                }
            };

            const response = await request(app)
                .post('/api/system/validate')
                .send(validationRequest)
                .expect(200);

            expect(response.body).toHaveProperty('valid');
            expect(response.body).toHaveProperty('errors');
            expect(response.body).toHaveProperty('warnings');
            expect(typeof response.body.valid).toBe('boolean');
        });

        test('should return 400 when system is missing', async () => {
            const response = await request(app)
                .post('/api/system/validate')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('System is required for validation');
        });
    });

    describe('POST /api/system/optimize', () => {
        test('should optimize a system', async () => {
            const optimizationRequest = {
                system: {
                    name: 'Test System',
                    rules: [
                        {
                            condition: 'score > 80',
                            action: { type: 'response', target: 'Good job!' }
                        }
                    ]
                },
                optimizationGoals: ['performance', 'accuracy']
            };

            const response = await request(app)
                .post('/api/system/optimize')
                .send(optimizationRequest)
                .expect(200);

            expect(response.body).toHaveProperty('originalSystem');
            expect(response.body).toHaveProperty('optimizedRules');
            expect(response.body).toHaveProperty('improvements');
        });

        test('should return 400 when system is missing', async () => {
            const response = await request(app)
                .post('/api/system/optimize')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('System is required for optimization');
        });

        test('should use default optimization goals', async () => {
            const optimizationRequest = {
                system: {
                    name: 'Test System',
                    rules: []
                }
            };

            const response = await request(app)
                .post('/api/system/optimize')
                .send(optimizationRequest)
                .expect(200);

            expect(response.body).toHaveProperty('optimizedRules');
        });
    });

    describe('GET /api/system/examples', () => {
        test('should return example systems', async () => {
            const response = await request(app)
                .get('/api/system/examples')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('name');
                expect(response.body[0]).toHaveProperty('domain');
                expect(response.body[0]).toHaveProperty('rules');
            }
        });

        test('should filter examples by domain', async () => {
            const response = await request(app)
                .get('/api/system/examples?domain=customer-service')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((example: any) => {
                expect(example.domain).toBe('customer-service');
            });
        });

        test('should filter examples by type', async () => {
            const response = await request(app)
                .get('/api/system/examples?type=basic')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((example: any) => {
                expect(example.type).toBe('basic');
            });
        });
    });

    describe('POST /api/system/export', () => {
        test('should export a system', async () => {
            const exportRequest = {
                system: {
                    name: 'Export Test System',
                    rules: [
                        {
                            condition: 'test === true',
                            action: { type: 'response', target: 'Test passed' }
                        }
                    ]
                },
                format: 'json'
            };

            const response = await request(app)
                .post('/api/system/export')
                .send(exportRequest)
                .expect(200);

            expect(response.body).toHaveProperty('format');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.format).toBe('json');
        });

        test('should use default format when not specified', async () => {
            const exportRequest = {
                system: {
                    name: 'Export Test System',
                    rules: []
                }
            };

            const response = await request(app)
                .post('/api/system/export')
                .send(exportRequest)
                .expect(200);

            expect(response.body.format).toBe('json');
        });

        test('should return 400 when system is missing', async () => {
            const response = await request(app)
                .post('/api/system/export')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('System is required for export');
        });
    });
});
