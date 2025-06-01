"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRules = void 0;
const rule_1 = require("../core/rule");
function parseRules(input) {
    const rules = [];
    const ruleStrings = input.split(';').map(rule => rule.trim()).filter(rule => rule.length > 0);
    for (const ruleString of ruleStrings) {
        const [condition, action] = ruleString.split('=>').map(part => part.trim());
        if (condition && action) {
            const rule = new rule_1.Rule(condition, action, 1, `Parsed Rule ${rules.length + 1}`);
            rules.push(rule);
        }
    }
    return rules;
}
exports.parseRules = parseRules;
