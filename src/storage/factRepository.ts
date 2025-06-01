import { Fact } from '../core/fact';

export class FactRepository {
    private facts: Map<string, Fact>;

    constructor() {
        this.facts = new Map();
    }

    addFact(fact: Fact): void;
    addFact(name: string, value: any): void;
    addFact(factOrName: Fact | string, value?: any): void {
        if (typeof factOrName === 'string') {
            // Legacy interface: addFact(name, value)
            const fact = new Fact(factOrName, value);
            this.facts.set(factOrName, fact);
        } else {
            // New interface: addFact(fact)
            this.facts.set(factOrName.name, factOrName);
        }
    }

    getFacts(): Fact[] {
        return Array.from(this.facts.values());
    }

    getFact(name: string): Fact | undefined {
        return this.facts.get(name);
    }

    removeFact(name: string): boolean {
        return this.facts.delete(name);
    }

    clear(): void {
        this.facts.clear();
    }
}