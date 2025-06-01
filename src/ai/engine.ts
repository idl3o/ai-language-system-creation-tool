import OpenAI from 'openai';
import { GenerationRequest, LanguageSystem, IntelligentRule, AnalysisResult } from '../types';
import { NLPProcessor } from '../nlp/processor';

export class AIEngine {
    private openai: OpenAI;
    private nlpProcessor: NLPProcessor;

    constructor(apiKey?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY
        });
        this.nlpProcessor = new NLPProcessor();
    }

    /**
     * Generates a complete language system from natural language requirements
     */
    async generateSystem(request: GenerationRequest): Promise<LanguageSystem> {
        console.log(`Generating system for domain: ${request.domain}`);
        
        // Analyze the requirements
        const analysis = await this.nlpProcessor.analyzeText(request.requirements, request.domain);
        
        // Generate system components using AI
        const systemPrompt = this.buildSystemPrompt(request, analysis);
        const aiResponse = await this.queryOpenAI(systemPrompt);
        
        // Parse AI response and create structured system
        const system = await this.parseSystemResponse(aiResponse, request, analysis);
        
        return system;
    }

    /**
     * Generates intelligent rules from natural language descriptions
     */
    async generateRules(description: string, context?: any): Promise<IntelligentRule[]> {
        const prompt = this.buildRuleGenerationPrompt(description, context);
        const response = await this.queryOpenAI(prompt);
        
        return this.parseRulesResponse(response, description);
    }

    /**
     * Optimizes existing rules using AI
     */
    async optimizeRules(rules: IntelligentRule[], context: any): Promise<IntelligentRule[]> {
        const prompt = this.buildOptimizationPrompt(rules, context);
        const response = await this.queryOpenAI(prompt);
        
        return this.parseOptimizedRules(response, rules);
    }

    /**
     * Generates training data for the system
     */
    async generateTrainingData(system: LanguageSystem, count: number = 50): Promise<string[]> {
        const prompt = this.buildTrainingDataPrompt(system, count);
        const response = await this.queryOpenAI(prompt);
        
        return this.parseTrainingData(response);
    }

    /**
     * Builds system generation prompt for OpenAI
     */
    private buildSystemPrompt(request: GenerationRequest, analysis: AnalysisResult): string {
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
- Allowed Intents: ${request.constraints.allowedIntents?.join(', ') || 'Any'}
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
    private buildRuleGenerationPrompt(description: string, context?: any): string {
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
    private buildOptimizationPrompt(rules: IntelligentRule[], context: any): string {
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
    private buildTrainingDataPrompt(system: LanguageSystem, count: number): string {
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
    private async queryOpenAI(prompt: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
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

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate AI response: ${error}`);
        }
    }

    /**
     * Parses system response from AI
     */
    private async parseSystemResponse(
        response: string, 
        request: GenerationRequest, 
        analysis: AnalysisResult
    ): Promise<LanguageSystem> {
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
        } catch (error) {
            console.error('Failed to parse system response:', error);
            throw new Error('Invalid AI response format');
        }
    }

    /**
     * Parses rules response from AI
     */
    private parseRulesResponse(response: string, description: string): IntelligentRule[] {
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
        } catch (error) {
            console.error('Failed to parse rules response:', error);
            return [];
        }
    }

    /**
     * Parses optimized rules response
     */
    private parseOptimizedRules(response: string, originalRules: IntelligentRule[]): IntelligentRule[] {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return Array.isArray(parsed) ? parsed : originalRules;
        } catch (error) {
            console.error('Failed to parse optimized rules:', error);
            return originalRules;
        }
    }

    /**
     * Parses training data response
     */
    private parseTrainingData(response: string): string[] {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to parse training data:', error);
            return [];
        }
    }

    /**
     * Extracts JSON from response text
     */
    private extractJSON(text: string): string {
        // Find JSON content between ```json and ``` or just raw JSON
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                         text.match(/\{[\s\S]*\}/) || 
                         text.match(/\[[\s\S]*\]/);
        
        return jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    }

    /**
     * Generates unique ID
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validates AI response quality
     */
    async validateResponse(response: string, expectedType: 'system' | 'rules' | 'training'): Promise<boolean> {
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            
            switch (expectedType) {
                case 'system':
                    return parsed.name && parsed.domain && Array.isArray(parsed.rules);
                case 'rules':
                    return Array.isArray(parsed) && parsed.every(rule => 
                        rule.condition && rule.action
                    );
                case 'training':
                    return Array.isArray(parsed) && parsed.every(item => 
                        typeof item === 'string'
                    );
                default:
                    return false;
            }
        } catch {
            return false;
        }
    }
}
