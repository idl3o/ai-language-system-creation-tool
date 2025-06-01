import { Engine } from '../../src/core/engine';
import { Rule } from '../../src/core/rule';
import { Fact } from '../../src/core/fact';

describe('Engine', () => {
    let engine: Engine;

    beforeEach(() => {
        engine = new Engine();
    });

    test('should initialize the engine', () => {
        engine.initialize();
        expect(engine).toBeDefined();
    });

    test('should add a rule', () => {
        const rule = new Rule('condition', 'action');
        engine.addRule(rule);
        expect(engine.getRules()).toContain(rule);
    });

    test('should execute rules', () => {
        const rule = new Rule('condition', 'action');
        engine.addRule(rule);
        const fact = new Fact('testFact', true);
        engine.addFact(fact);
        engine.initialize(); // Initialize before executing
        const result = engine.execute();
        expect(result.success).toBe(true); // Check success instead of return value
    });
});