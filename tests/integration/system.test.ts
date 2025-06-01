import { Engine } from '../../src/core/engine';
import { Rule } from '../../src/core/rule';
import { Fact } from '../../src/core/fact';
import { RuleRepository } from '../../src/storage/ruleRepository';
import { FactRepository } from '../../src/storage/factRepository';

describe('Integration Tests for Rule-Based Logic System', () => {
    let engine: Engine;
    let ruleRepository: RuleRepository;
    let factRepository: FactRepository;

    beforeEach(() => {
        ruleRepository = new RuleRepository();
        factRepository = new FactRepository();
        engine = new Engine(ruleRepository, factRepository);
    });

    test('should initialize the engine', () => {
        engine.initialize();
        expect(engine.isInitialized()).toBe(true);
    });

    test('should add and execute a rule', () => {
        const rule = new Rule('true', 'action');  // Use 'true' as condition so it always fires
        ruleRepository.addRule(rule);
        engine.initialize();
        engine.execute();
        expect(engine.getLastExecutedAction()).toBe('action');
    });

    test('should add and retrieve facts', () => {
        const fact = new Fact('temperature', 100);
        factRepository.addFact(fact);
        const facts = factRepository.getFacts();
        expect(facts.length).toBe(1);
        expect(facts[0].name).toBe('temperature');
        expect(facts[0].value).toBe(100);
    });

    test('should infer new facts based on rules', () => {
        const rule = new Rule('temperature > 90', 'alert');
        ruleRepository.addRule(rule);
        const fact = new Fact('temperature', 100);
        factRepository.addFact(fact);
        engine.initialize();
        engine.execute();
        expect(engine.getLastExecutedAction()).toBe('alert');
    });
});