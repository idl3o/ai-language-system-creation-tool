import { IntelligentRule, Condition, Action, Context } from '../types';

export class Rule implements IntelligentRule {
    public id: string;
    public name: string;
    public condition: Condition;
    public action: Action;
    public confidence: number;
    public priority: number;
    public context?: Context;
    public naturalLanguage: string;
    public generatedFrom?: string;
    public enabled: boolean;
    public description?: string;
    public tags: string[];
    public createdAt: Date;
    public updatedAt: Date;

    constructor(
        condition: Condition | string,
        action: Action | string,
        priority: number = 1,
        description?: string,
        options?: Partial<IntelligentRule>
    ) {
        this.id = options?.id || this.generateId();
        this.name = options?.name || `Rule_${this.id.substring(0, 8)}`;
        this.condition = typeof condition === 'string' ? 
            { type: 'simple', expression: condition } : condition;
        this.action = typeof action === 'string' ? 
            { type: 'response', target: action } : action;
        this.confidence = options?.confidence || 1.0;
        this.priority = priority;
        this.context = options?.context;
        this.naturalLanguage = options?.naturalLanguage || this.generateNaturalLanguage();
        this.generatedFrom = options?.generatedFrom;
        this.enabled = true;
        this.description = description;
        this.tags = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    private generateId(): string {
        return 'rule_' + Math.random().toString(36).substr(2, 9);
    }

    private generateNaturalLanguage(): string {
        const conditionText = typeof this.condition === 'object' ? 
            this.condition.expression : String(this.condition);
        const actionText = typeof this.action === 'object' ? 
            this.action.target : String(this.action);
        return `When ${conditionText}, then ${actionText}`;
    }

    evaluate(facts: Record<string, any>): boolean {
        try {
            switch (this.condition.type) {
                case 'simple':
                    return this.evaluateSimpleCondition(this.condition.expression, facts);
                case 'complex':
                    return this.evaluateComplexCondition(this.condition, facts);
                case 'nlp':
                    return this.evaluateNLPCondition(this.condition, facts);
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Rule evaluation error for ${this.id}:`, error);
            return false;
        }
    }

    private evaluateSimpleCondition(expression: string, facts: Record<string, any>): boolean {
        try {
            // Replace fact names with actual values
            let processedExpression = expression;
            for (const [key, value] of Object.entries(facts)) {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                const replacement = typeof value === 'string' ? `"${value}"` : String(value);
                processedExpression = processedExpression.replace(regex, replacement);
            }

            // Basic safety check - only allow safe operations
            if (/[^a-zA-Z0-9\s\.\>\<\=\!\+\-\*\/\(\)\"\']/.test(processedExpression)) {
                return false;
            }

            // Evaluate the expression (in real implementation, use a safer eval alternative)
            return Function(`"use strict"; return (${processedExpression})`)();
        } catch {
            return false;
        }
    }

    private evaluateComplexCondition(condition: Condition, facts: Record<string, any>): boolean {
        // Handle complex conditions with entities and intents
        const { expression, entities, intents, patterns } = condition;
        
        let result = this.evaluateSimpleCondition(expression, facts);

        // Check entities if specified
        if (entities && facts.entities) {
            const hasRequiredEntities = entities.every(entityName =>
                facts.entities.some((e: any) => e.name === entityName || e.type === entityName)
            );
            result = result && hasRequiredEntities;
        }

        // Check intents if specified
        if (intents && facts.intent) {
            const hasRequiredIntent = intents.includes(facts.intent);
            result = result && hasRequiredIntent;
        }

        // Check patterns if specified
        if (patterns && facts.text) {
            const matchesPattern = patterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(facts.text);
            });
            result = result && matchesPattern;
        }

        return result;
    }

    private evaluateNLPCondition(condition: Condition, facts: Record<string, any>): boolean {
        // NLP-based condition evaluation
        const { patterns, intents, entities } = condition;
        
        if (patterns && facts.text) {
            return patterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(facts.text);
            });
        }

        if (intents && facts.intent) {
            return intents.includes(facts.intent);
        }

        if (entities && facts.entities) {
            return entities.every(entityName =>
                facts.entities.some((e: any) => e.name === entityName || e.type === entityName)
            );
        }

        return false;
    }

    execute(context?: Record<string, any>): any {
        try {
            switch (this.action.type) {
                case 'response':
                    return this.executeResponse(this.action, context);
                case 'function':
                    return this.executeFunction(this.action, context);
                case 'redirect':
                    return this.executeRedirect(this.action, context);
                case 'api':
                    return this.executeAPI(this.action, context);
                default:
                    console.log(`Executing action: ${JSON.stringify(this.action)}`);
                    return null;
            }
        } catch (error) {
            console.error(`Rule execution error for ${this.id}:`, error);
            throw error;
        }
    }

    private executeResponse(action: Action, context?: Record<string, any>): any {
        const response = this.processTemplate(action.target, action.parameters, context);
        console.log(`Rule ${this.id} response: ${response}`);
        return { type: 'response', content: response };
    }

    private executeFunction(action: Action, context?: Record<string, any>): any {
        console.log(`Executing function: ${action.target} with params:`, action.parameters);
        return { type: 'function', function: action.target, parameters: action.parameters };
    }

    private executeRedirect(action: Action, context?: Record<string, any>): any {
        console.log(`Redirecting to: ${action.target}`);
        return { type: 'redirect', target: action.target, parameters: action.parameters };
    }

    private executeAPI(action: Action, context?: Record<string, any>): any {
        console.log(`API call to: ${action.target}`, action.parameters);
        return { type: 'api', endpoint: action.target, parameters: action.parameters };
    }

    private processTemplate(template: string, parameters?: Record<string, any>, context?: Record<string, any>): string {
        let processed = template;
        
        // Replace parameters
        if (parameters) {
            for (const [key, value] of Object.entries(parameters)) {
                processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        }

        // Replace context variables
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        }

        return processed;
    }

    toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            condition: this.condition,
            action: this.action,
            confidence: this.confidence,
            priority: this.priority,
            context: this.context,
            naturalLanguage: this.naturalLanguage,
            generatedFrom: this.generatedFrom,
            enabled: this.enabled,
            description: this.description,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    clone(): Rule {
        return new Rule(
            this.condition,
            this.action,
            this.priority,
            this.description,
            {
                id: this.generateId(),
                name: this.name + '_copy',
                confidence: this.confidence,
                context: this.context,
                naturalLanguage: this.naturalLanguage,
                generatedFrom: this.generatedFrom
            }
        );
    }

    updateNaturalLanguage(text: string): void {
        this.naturalLanguage = text;
        this.updatedAt = new Date();
    }

    addTag(tag: string): void {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
    }

    removeTag(tag: string): void {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date();
        }
    }
}