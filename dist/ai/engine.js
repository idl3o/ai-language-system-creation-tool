"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEngine = void 0;
const openai_1 = __importDefault(require("openai"));
const processor_1 = require("../nlp/processor");
class AIEngine {
    constructor(apiKey) {
        this.openai = new openai_1.default({
            apiKey: apiKey || process.env.OPENAI_API_KEY
        });
        this.nlpProcessor = new processor_1.NLPProcessor();
    }
    /**
     * Generates a complete language system from natural language requirements
     */
    generateSystem(request) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Generating system for domain: ${request.domain}`);
            // Analyze the requirements
            const analysis = yield this.nlpProcessor.analyzeText(request.requirements, request.domain);
            // Generate system components using AI
            const systemPrompt = this.buildSystemPrompt(request, analysis);
            const aiResponse = yield this.queryOpenAI(systemPrompt);
            // Parse AI response and create structured system
            const system = yield this.parseSystemResponse(aiResponse, request, analysis);
            return system;
        });
    }
    /**
     * Generates intelligent rules from natural language descriptions
     */
    generateRules(description, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = this.buildRuleGenerationPrompt(description, context);
            const response = yield this.queryOpenAI(prompt);
            return this.parseRulesResponse(response, description);
        });
    }
    /**
     * Optimizes existing rules using AI
     */
    optimizeRules(rules, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = this.buildOptimizationPrompt(rules, context);
            const response = yield this.queryOpenAI(prompt);
            return this.parseOptimizedRules(response, rules);
        });
    }
    /**
     * Generates training data for the system
     */
    generateTrainingData(system, count = 50) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = this.buildTrainingDataPrompt(system, count);
            const response = yield this.queryOpenAI(prompt);
            return this.parseTrainingData(response);
        });
    }
    /**
     * Builds system generation prompt for OpenAI
     */
    buildSystemPrompt(request, analysis) {
        var _a;
        return `
You are an expert AI system architect. Generate a complete intelligent language system specification based on the following requirements:

Domain: ${request.domain}
Requirements: ${request.requirements}

Analysis Results:
- Detected Entities: ${analysis.entities.map(e => e.name).join(', ')}
- Detected Intents: ${analysis.intents.map(i => i.name).join(', ')}
- Key Patterns: ${analysis.patterns.slice(0, 5).join(', ')}
- Confidence: ${analysis.confidence}

Examples provided:
${request.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

${request.constraints ? `
Constraints:
- Max Rules: ${request.constraints.maxRules || 'No limit'}
- Min Confidence: ${request.constraints.minConfidence || 0.7}
- Allowed Intents: ${((_a = request.constraints.allowedIntents) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Any'}
` : ''}

${request.style ? `
Style Requirements:
- Formality: ${request.style.formality}
- Verbosity: ${request.style.verbosity}
- Tone: ${request.style.tone}
` : ''}

Please generate a comprehensive system specification including:
1. System metadata (name, description, version)
2. Core entities with patterns and synonyms
3. Intent definitions with sample utterances
4. Intelligent rules with conditions and actions
5. Vocabulary terms relevant to the domain
6. Performance expectations

Format the response as valid JSON with the following structure:
{
  "name": "system_name",
  "description": "system_description",
  "domain": "${request.domain}",
  "entities": [...],
  "intents": [...],
  "rules": [...],
  "vocabulary": {...},
  "metadata": {...}
}
`;
    }
    /**
     * Builds rule generation prompt
     */
    buildRuleGenerationPrompt(description, context) {
        return `
Generate intelligent rules based on this description: "${description}"

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Create rules that are:
1. Precise and unambiguous
2. Cover edge cases
3. Have appropriate confidence scores
4. Include natural language explanations

Format as JSON array of rules:
[
  {
    "name": "rule_name",
    "condition": {
      "type": "nlp|simple|complex",
      "expression": "condition_expression",
      "entities": [...],
      "intents": [...]
    },
    "action": {
      "type": "response|function|redirect|api",
      "target": "action_target",
      "parameters": {...}
    },
    "confidence": 0.8,
    "priority": 1,
    "naturalLanguage": "plain English explanation"
  }
]
`;
    }
    /**
     * Builds optimization prompt
     */
    buildOptimizationPrompt(rules, context) {
        return `
Optimize the following rules for better performance and accuracy:

Current Rules:
${JSON.stringify(rules, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Improvements to consider:
1. Merge redundant rules
2. Improve confidence scores
3. Optimize condition expressions
4. Enhance action specificity
5. Add missing edge cases

Return optimized rules in the same JSON format.
`;
    }
    /**
     * Builds training data generation prompt
     */
    buildTrainingDataPrompt(system, count) {
        return `
Generate ${count} diverse training examples for this language system:

System: ${system.name}
Domain: ${system.domain}
Description: ${system.description}

Entities: ${system.entities.map(e => e.name).join(', ')}
Intents: ${system.intents.map(i => i.name).join(', ')}

Generate varied, realistic examples that would help train this system.
Include different phrasings, edge cases, and natural variations.

Return as JSON array of strings:
["example 1", "example 2", ...]
`;
    }
    /**
     * Queries OpenAI with the given prompt
     */
    queryOpenAI(prompt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert AI system architect specializing in natural language processing and rule-based systems.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                });
                return ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
            }
            catch (error) {
                console.error('OpenAI API error:', error);
                throw new Error(`Failed to generate AI response: ${error}`);
            }
        });
    }
    /**
     * Parses system response from AI
     */
    parseSystemResponse(response, request, analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const parsed = JSON.parse(this.extractJSON(response));
                return {
                    id: this.generateId(),
                    name: parsed.name || `${request.domain}_system`,
                    description: parsed.description || `Intelligent system for ${request.domain}`,
                    domain: request.domain,
                    rules: parsed.rules || [],
                    entities: parsed.entities || analysis.entities,
                    intents: parsed.intents || analysis.intents,
                    vocabulary: parsed.vocabulary || analysis.vocabulary,
                    metadata: {
                        version: '1.0.0',
                        created: new Date(),
                        lastModified: new Date(),
                        author: 'AI Generator',
                        tags: [request.domain, 'ai-generated'],
                        performance: {
                            accuracy: 0.85,
                            precision: 0.82,
                            recall: 0.88,
                            f1Score: 0.85,
                            responseTime: 150
                        }
                    }
                };
            }
            catch (error) {
                console.error('Failed to parse system response:', error);
                throw new Error('Invalid AI response format');
            }
        });
    }
    /**
     * Parses rules response from AI
     */
    parseRulesResponse(response, description) {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return Array.isArray(parsed) ? parsed.map((rule, index) => ({
                id: this.generateId(),
                name: rule.name || `rule_${index + 1}`,
                condition: rule.condition,
                action: rule.action,
                confidence: rule.confidence || 0.8,
                priority: rule.priority || 1,
                naturalLanguage: rule.naturalLanguage || description,
                generatedFrom: 'ai'
            })) : [];
        }
        catch (error) {
            console.error('Failed to parse rules response:', error);
            return [];
        }
    }
    /**
     * Parses optimized rules response
     */
    parseOptimizedRules(response, originalRules) {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return Array.isArray(parsed) ? parsed : originalRules;
        }
        catch (error) {
            console.error('Failed to parse optimized rules:', error);
            return originalRules;
        }
    }
    /**
     * Parses training data response
     */
    parseTrainingData(response) {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return Array.isArray(parsed) ? parsed : [];
        }
        catch (error) {
            console.error('Failed to parse training data:', error);
            return [];
        }
    }
    /**
     * Extracts JSON from response text
     */
    extractJSON(text) {
        // Find JSON content between ```json and ``` or just raw JSON
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
            text.match(/\{[\s\S]*\}/) ||
            text.match(/\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    }
    /**
     * Generates unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    /**
     * Validates AI response quality
     */
    validateResponse(response, expectedType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const parsed = JSON.parse(this.extractJSON(response));
                switch (expectedType) {
                    case 'system':
                        return parsed.name && parsed.domain && Array.isArray(parsed.rules);
                    case 'rules':
                        return Array.isArray(parsed) && parsed.every(rule => rule.condition && rule.action);
                    case 'training':
                        return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
                    default:
                        return false;
                }
            }
            catch (_a) {
                return false;
            }
        });
    }
}
exports.AIEngine = AIEngine;
