import { Rule } from '../core/rule';

export function parseRules(input: string): Rule[] {
    const rules: Rule[] = [];
    const ruleStrings = input.split(';').map(rule => rule.trim()).filter(rule => rule.length > 0);

    for (const ruleString of ruleStrings) {
        const [condition, action] = ruleString.split('=>').map(part => part.trim());
        if (condition && action) {
            const rule = new Rule(condition, action, 1, `Parsed Rule ${rules.length + 1}`);
            rules.push(rule);
        }
    }

    return rules;
}