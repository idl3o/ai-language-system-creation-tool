export const SYNTAX_CONSTANTS = {
    RULE_PREFIX: 'rule',
    FACT_PREFIX: 'fact',
    ACTION_PREFIX: 'action',
    CONDITION_PREFIX: 'condition',
};

export type RuleSyntax = {
    name: string;
    condition: string;
    action: string;
};

export type FactSyntax = {
    name: string;
    value: any;
};