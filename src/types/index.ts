export interface LanguageSystem {
    id: string;
    name: string;
    description: string;
    domain: string;
    rules: IntelligentRule[];
    entities: Entity[];
    intents: Intent[];
    vocabulary: Vocabulary;
    metadata: SystemMetadata;
}

export interface IntelligentRule {
    id: string;
    name: string;
    description?: string;
    condition: Condition;
    action: Action;
    confidence: number;
    priority: number;
    context?: Context;
    naturalLanguage: string;
    generatedFrom?: string;
}

export interface Condition {
    type: 'simple' | 'complex' | 'nlp';
    expression: string;
    entities?: string[];
    intents?: string[];
    patterns?: string[];
}

export interface Action {
    type: 'response' | 'function' | 'redirect' | 'api';
    target: string;
    parameters?: Record<string, any>;
    template?: string;
}

export interface Entity {
    name: string;
    type: 'builtin' | 'custom' | 'ml';
    values?: string[];
    patterns?: string[];
    synonyms?: Record<string, string[]>;
}

export interface Intent {
    name: string;
    utterances: string[];
    entities: string[];
    confidence: number;
}

export interface Vocabulary {
    terms: Term[];
    synonyms: Record<string, string[]>;
    stopWords: string[];
    domain: string;
}

export interface Term {
    word: string;
    pos: string; // part of speech
    frequency: number;
    context: string[];
}

export interface Context {
    domain?: string;
    user?: UserContext;
    session?: SessionContext;
    environment?: EnvironmentContext;
}

export interface UserContext {
    id?: string;
    preferences?: Record<string, any>;
    history?: string[];
}

export interface SessionContext {
    id: string;
    variables: Record<string, any>;
    state: string;
}

export interface EnvironmentContext {
    platform: string;
    locale: string;
    timezone: string;
}

export interface SystemMetadata {
    version: string;
    created: Date;
    lastModified: Date;
    author: string;
    tags: string[];
    performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    responseTime: number;
}

export interface GenerationRequest {
    domain: string;
    requirements: string;
    examples: string[];
    constraints?: GenerationConstraints;
    style?: GenerationStyle;
}

export interface GenerationConstraints {
    maxRules?: number;
    minConfidence?: number;
    allowedIntents?: string[];
    forbiddenPatterns?: string[];
}

export interface GenerationStyle {
    formality: 'formal' | 'casual' | 'technical';
    verbosity: 'concise' | 'detailed' | 'verbose';
    tone: 'professional' | 'friendly' | 'neutral';
}

export interface AnalysisResult {
    entities: Entity[];
    intents: Intent[];
    patterns: string[];
    vocabulary: Vocabulary;
    confidence: number;
    recommendations: string[];
}
