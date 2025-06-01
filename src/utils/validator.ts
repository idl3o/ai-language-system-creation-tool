import { LanguageSystem, IntelligentRule, Entity, Intent } from '../types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateRule(rule: any): boolean {
    if (!rule.condition || typeof rule.condition !== 'string') {
        throw new Error('Invalid rule: condition must be a non-empty string.');
    }
    if (!rule.action || typeof rule.action !== 'function') {
        throw new Error('Invalid rule: action must be a function.');
    }
    return true;
}

export function validateFact(fact: any): boolean {
    if (!fact.name || typeof fact.name !== 'string') {
        throw new Error('Invalid fact: name must be a non-empty string.');
    }
    if (fact.value === undefined) {
        throw new Error('Invalid fact: value must be defined.');
    }
    return true;
}

export class SystemValidator {
    /**
     * Validates a complete language system
     */
    async validateSystem(system: LanguageSystem): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate basic structure
        if (!system.id) errors.push('System ID is required');
        if (!system.name) errors.push('System name is required');
        if (!system.domain) errors.push('System domain is required');
        if (!system.description) warnings.push('System description is recommended');

        // Validate entities
        const entityValidation = this.validateEntities(system.entities);
        errors.push(...entityValidation.errors);
        warnings.push(...entityValidation.warnings);

        // Validate intents
        const intentValidation = this.validateIntents(system.intents);
        errors.push(...intentValidation.errors);
        warnings.push(...intentValidation.warnings);

        // Validate rules
        const ruleValidation = this.validateRules(system.rules);
        errors.push(...ruleValidation.errors);
        warnings.push(...ruleValidation.warnings);

        // Validate cross-references
        const crossRefValidation = this.validateCrossReferences(system);
        errors.push(...crossRefValidation.errors);
        warnings.push(...crossRefValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validates entities
     */
    private validateEntities(entities: Entity[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (entities.length === 0) {
            warnings.push('No entities defined - consider adding entities for better recognition');
        }

        entities.forEach((entity, index) => {
            if (!entity.name) {
                errors.push(`Entity ${index} is missing a name`);
            }
            
            if (!entity.type) {
                errors.push(`Entity ${entity.name} is missing a type`);
            }

            if (entity.type === 'custom' && (!entity.values || entity.values.length === 0)) {
                warnings.push(`Custom entity ${entity.name} has no values defined`);
            }

            if (!entity.patterns || entity.patterns.length === 0) {
                warnings.push(`Entity ${entity.name} has no patterns defined`);
            }
        });

        // Check for duplicate entity names
        const names = entities.map(e => e.name);
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate entity names found: ${duplicates.join(', ')}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Validates intents
     */
    private validateIntents(intents: Intent[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (intents.length === 0) {
            warnings.push('No intents defined - system may not understand user input effectively');
        }

        intents.forEach((intent, index) => {
            if (!intent.name) {
                errors.push(`Intent ${index} is missing a name`);
            }

            if (!intent.utterances || intent.utterances.length === 0) {
                errors.push(`Intent ${intent.name} has no utterances`);
            }

            if (intent.utterances && intent.utterances.length < 3) {
                warnings.push(`Intent ${intent.name} has few utterances (${intent.utterances.length}) - consider adding more for better training`);
            }

            if (intent.confidence < 0.5) {
                warnings.push(`Intent ${intent.name} has low confidence (${intent.confidence})`);
            }
        });

        // Check for duplicate intent names
        const names = intents.map(i => i.name);
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate intent names found: ${duplicates.join(', ')}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Validates rules
     */
    private validateRules(rules: IntelligentRule[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (rules.length === 0) {
            errors.push('No rules defined - system will not be able to respond to inputs');
        }

        rules.forEach((rule, index) => {
            if (!rule.id) {
                errors.push(`Rule ${index} is missing an ID`);
            }

            if (!rule.name) {
                warnings.push(`Rule ${index} is missing a name`);
            }

            if (!rule.condition) {
                errors.push(`Rule ${rule.name || index} is missing a condition`);
            } else {
                if (!rule.condition.type) {
                    errors.push(`Rule ${rule.name || index} condition is missing a type`);
                }
                if (!rule.condition.expression) {
                    errors.push(`Rule ${rule.name || index} condition is missing an expression`);
                }
            }

            if (!rule.action) {
                errors.push(`Rule ${rule.name || index} is missing an action`);
            } else {
                if (!rule.action.type) {
                    errors.push(`Rule ${rule.name || index} action is missing a type`);
                }
                if (!rule.action.target) {
                    errors.push(`Rule ${rule.name || index} action is missing a target`);
                }
            }

            if (rule.confidence < 0.3) {
                warnings.push(`Rule ${rule.name || index} has very low confidence (${rule.confidence})`);
            }

            if (rule.confidence > 1.0) {
                errors.push(`Rule ${rule.name || index} has invalid confidence (${rule.confidence}) - must be between 0 and 1`);
            }

            if (!rule.naturalLanguage) {
                warnings.push(`Rule ${rule.name || index} is missing natural language description`);
            }
        });

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Validates cross-references between components
     */
    private validateCrossReferences(system: LanguageSystem): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const entityNames = system.entities.map(e => e.name);
        const intentNames = system.intents.map(i => i.name);

        // Check if rules reference existing entities and intents
        system.rules.forEach(rule => {
            if (rule.condition.entities) {
                rule.condition.entities.forEach(entityName => {
                    if (!entityNames.includes(entityName)) {
                        errors.push(`Rule ${rule.name} references unknown entity: ${entityName}`);
                    }
                });
            }

            if (rule.condition.intents) {
                rule.condition.intents.forEach(intentName => {
                    if (!intentNames.includes(intentName)) {
                        errors.push(`Rule ${rule.name} references unknown intent: ${intentName}`);
                    }
                });
            }
        });

        // Check if intents reference existing entities
        system.intents.forEach(intent => {
            intent.entities.forEach(entityName => {
                if (!entityNames.includes(entityName)) {
                    warnings.push(`Intent ${intent.name} references unknown entity: ${entityName}`);
                }
            });
        });

        // Check for orphaned entities (not used by any intent or rule)
        entityNames.forEach(entityName => {
            const usedInIntents = system.intents.some(intent => 
                intent.entities.includes(entityName)
            );
            const usedInRules = system.rules.some(rule => 
                rule.condition.entities?.includes(entityName)
            );

            if (!usedInIntents && !usedInRules) {
                warnings.push(`Entity ${entityName} is not used by any intent or rule`);
            }
        });

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Validates rule expression syntax
     */
    validateRuleExpression(expression: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Basic syntax validation
            if (!expression.trim()) {
                errors.push('Expression cannot be empty');
                return { isValid: false, errors, warnings };
            }

            // Check for balanced parentheses
            let parenCount = 0;
            for (const char of expression) {
                if (char === '(') parenCount++;
                if (char === ')') parenCount--;
                if (parenCount < 0) {
                    errors.push('Unmatched closing parenthesis in expression');
                    break;
                }
            }
            if (parenCount > 0) {
                errors.push('Unmatched opening parenthesis in expression');
            }

            // Check for common syntax issues
            if (expression.includes('&&') || expression.includes('||')) {
                // Valid logical operators
            } else if (expression.includes('and') || expression.includes('or')) {
                warnings.push('Consider using && and || instead of "and"/"or" for better performance');
            }

        } catch (error) {
            errors.push(`Expression validation error: ${error}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
     * Validates a single rule
     */
    validateRule(rule: IntelligentRule): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate required fields
        if (!rule.id) errors.push('Rule ID is required');
        if (!rule.name) warnings.push('Rule name is recommended');
        if (!rule.condition) errors.push('Rule condition is required');
        if (!rule.action) errors.push('Rule action is required');

        // Validate condition
        if (rule.condition) {
            if (!rule.condition.type) {
                errors.push('Condition type is required');
            }
            if (!rule.condition.expression) {
                errors.push('Condition expression is required');
            } else {
                const expressionValidation = this.validateRuleExpression(rule.condition.expression);
                errors.push(...expressionValidation.errors);
                warnings.push(...expressionValidation.warnings);
            }
        }

        // Validate action
        if (rule.action) {
            if (!rule.action.type) {
                errors.push('Action type is required');
            }
            if (!rule.action.target) {
                errors.push('Action target is required');
            }
        }

        // Validate confidence and priority
        if (rule.confidence < 0 || rule.confidence > 1) {
            errors.push('Confidence must be between 0 and 1');
        }
        if (rule.priority < 0) {
            errors.push('Priority must be non-negative');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }
}