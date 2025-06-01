"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactRepository = void 0;
const fact_1 = require("../core/fact");
class FactRepository {
    constructor() {
        this.facts = new Map();
    }
    addFact(factOrName, value) {
        if (typeof factOrName === 'string') {
            // Legacy interface: addFact(name, value)
            const fact = new fact_1.Fact(factOrName, value);
            this.facts.set(factOrName, fact);
        }
        else {
            // New interface: addFact(fact)
            this.facts.set(factOrName.name, factOrName);
        }
    }
    getFacts() {
        return Array.from(this.facts.values());
    }
    getFact(name) {
        return this.facts.get(name);
    }
    removeFact(name) {
        return this.facts.delete(name);
    }
    clear() {
        this.facts.clear();
    }
}
exports.FactRepository = FactRepository;
