"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
class Rule {
    constructor(condition, action, priority = 1, description, options) {
        this.id = (options === null || options === void 0 ? void 0 : options.id) || this.generateId();
        this.name = (options === null || options === void 0 ? void 0 : options.name) || `Rule_${this.id.substring(0, 8)}`;
        this.condition = typeof condition === 'string' ?
            { type: 'simple', expression: condition } : condition;
        this.action = typeof action === 'string' ?
            { type: 'response', target: action } : action;
        this.confidence = (options === null || options === void 0 ? void 0 : options.confidence) || 1.0;
        this.priority = priority;
        this.context = options === null || options === void 0 ? void 0 : options.context;
        this.naturalLanguage = (options === null || options === void 0 ? void 0 : options.naturalLanguage) || this.generateNaturalLanguage();
        this.generatedFrom = options === null || options === void 0 ? void 0 : options.generatedFrom;
        this.enabled = true;
        this.description = description;
        this.tags = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    generateId() {
        return 'rule_' + Math.random().toString(36).substr(2, 9);
    }
    generateNaturalLanguage() {
        const conditionText = typeof this.condition === 'object' ?
            this.condition.expression : String(this.condition);
        const actionText = typeof this.action === 'object' ?
            this.action.target : String(this.action);
        return `When ${conditionText}, then ${actionText}`;
    }
    evaluate(facts) {
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
        }
        catch (error) {
            console.error(`Rule evaluation error for ${this.id}:`, error);
            return false;
        }
    }
    evaluateSimpleCondition(expression, facts) {
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
        }
        catch (_a) {
            return false;
        }
    }
    evaluateComplexCondition(condition, facts) {
        // Handle complex conditions with entities and intents
        const { expression, entities, intents, patterns } = condition;
        let result = this.evaluateSimpleCondition(expression, facts);
        // Check entities if specified
        if (entities && facts.entities) {
            const hasRequiredEntities = entities.every(entityName => facts.entities.some((e) => e.name === entityName || e.type === entityName));
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
    evaluateNLPCondition(condition, facts) {
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
            return entities.every(entityName => facts.entities.some((e) => e.name === entityName || e.type === entityName));
        }
        return false;
    }
    execute(context) {
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
        }
        catch (error) {
            console.error(`Rule execution error for ${this.id}:`, error);
            throw error;
        }
    }
    executeResponse(action, context) {
        const response = this.processTemplate(action.target, action.parameters, context);
        console.log(`Rule ${this.id} response: ${response}`);
        return { type: 'response', content: response };
    }
    executeFunction(action, context) {
        console.log(`Executing function: ${action.target} with params:`, action.parameters);
        return { type: 'function', function: action.target, parameters: action.parameters };
    }
    executeRedirect(action, context) {
        console.log(`Redirecting to: ${action.target}`);
        return { type: 'redirect', target: action.target, parameters: action.parameters };
    }
    executeAPI(action, context) {
        console.log(`API call to: ${action.target}`, action.parameters);
        return { type: 'api', endpoint: action.target, parameters: action.parameters };
    }
    processTemplate(template, parameters, context) {
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
    toJSON() {
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
    clone() {
        return new Rule(this.condition, this.action, this.priority, this.description, {
            id: this.generateId(),
            name: this.name + '_copy',
            confidence: this.confidence,
            context: this.context,
            naturalLanguage: this.naturalLanguage,
            generatedFrom: this.generatedFrom
        });
    }
    updateNaturalLanguage(text) {
        this.naturalLanguage = text;
        this.updatedAt = new Date();
    }
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date();
        }
    }
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date();
        }
    }
}
exports.Rule = Rule;
