import * as natural from 'natural';
import compromise from 'compromise';
import { Entity, Intent, Vocabulary, Term, AnalysisResult } from '../types';

export class NLPProcessor {
    private tokenizer: natural.WordTokenizer;
    private stemmer: typeof natural.PorterStemmer;
    private sentiment: natural.SentimentAnalyzer;

    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.sentiment = new natural.SentimentAnalyzer('English', 
            natural.PorterStemmer, 'afinn');
    }

    /**
     * Analyzes text to extract entities, intents, and patterns
     */
    async analyzeText(text: string, domain?: string): Promise<AnalysisResult> {
        const tokens = this.tokenize(text);
        const entities = await this.extractEntities(text);
        const intents = await this.extractIntents(text, domain);
        const patterns = this.extractPatterns(text);
        const vocabulary = this.buildVocabulary(tokens);
        
        const confidence = this.calculateConfidence(entities, intents, patterns);
        const recommendations = this.generateRecommendations(entities, intents, patterns);

        return {
            entities,
            intents,
            patterns,
            vocabulary,
            confidence,
            recommendations
        };
    }

    /**
     * Tokenizes text into individual words
     */
    tokenize(text: string): string[] {
        return this.tokenizer.tokenize(text.toLowerCase()) || [];
    }

    /**
     * Extracts named entities from text
     */
    async extractEntities(text: string): Promise<Entity[]> {
        const doc = compromise(text);
        const entities: Entity[] = [];

        // Extract people
        const people = doc.people().out('array');
        if (people.length > 0) {
            entities.push({
                name: 'person',
                type: 'builtin',
                values: people,
                patterns: people.map((p: string) => `\\b${p}\\b`)
            });
        }

        // Extract places
        const places = doc.places().out('array');
        if (places.length > 0) {
            entities.push({
                name: 'location',
                type: 'builtin',
                values: places,
                patterns: places.map((p: string) => `\\b${p}\\b`)
            });
        }

        // Extract organizations
        const orgs = doc.organizations().out('array');
        if (orgs.length > 0) {
            entities.push({
                name: 'organization',
                type: 'builtin',
                values: orgs,
                patterns: orgs.map((o: string) => `\\b${o}\\b`)
            });
        }        // Extract dates using pattern matching
        const dateMatches = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\w+ \d{1,2}, \d{4}\b/g) || [];
        if (dateMatches.length > 0) {
            entities.push({
                name: 'date',
                type: 'builtin',
                values: dateMatches,
                patterns: ['\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}', '\\b\\w+ \\d{1,2}, \\d{4}\\b']
            });
        }

        // Extract numbers using pattern matching
        const numberMatches = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
        if (numberMatches.length > 0) {
            entities.push({
                name: 'number',
                type: 'builtin',
                values: numberMatches,
                patterns: ['\\b\\d+\\b', '\\b\\d+\\.\\d+\\b']
            });
        }

        return entities;
    }

    /**
     * Extracts intents from text based on patterns and keywords
     */
    async extractIntents(text: string, domain?: string): Promise<Intent[]> {
        const intents: Intent[] = [];
        const tokens = this.tokenize(text);
        
        // Common intent patterns
        const intentPatterns = {
            greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
            question: ['what', 'how', 'when', 'where', 'why', 'which'],
            request: ['please', 'can you', 'could you', 'would you'],
            booking: ['book', 'reserve', 'schedule', 'appointment'],
            cancellation: ['cancel', 'remove', 'delete', 'stop'],
            information: ['tell me', 'show me', 'information about', 'details'],
            help: ['help', 'assist', 'support', 'guide']
        };

        for (const [intentName, keywords] of Object.entries(intentPatterns)) {
            const confidence = this.calculateIntentConfidence(tokens, keywords);
            if (confidence > 0.3) {
                intents.push({
                    name: intentName,
                    utterances: [text],
                    entities: [], // Would be populated based on context
                    confidence
                });
            }
        }

        return intents;
    }

    /**
     * Extracts linguistic patterns from text
     */
    extractPatterns(text: string): string[] {
        const patterns: string[] = [];        const doc = compromise(text);

        // Extract sentence patterns
        const sentences = doc.sentences().out('array') as string[];
        sentences.forEach((sentence: string) => {
            const simplified = compromise(sentence).normalize().out('text');
            patterns.push(simplified);
        });

        // Extract phrase patterns
        const nouns = doc.nouns().out('array');
        const verbs = doc.verbs().out('array');
        
        if (nouns.length > 0 && verbs.length > 0) {
            patterns.push(`[VERB] [NOUN]`);
        }

        return [...new Set(patterns)]; // Remove duplicates
    }

    /**
     * Builds vocabulary from tokens
     */
    buildVocabulary(tokens: string[]): Vocabulary {
        const termFreq: Record<string, number> = {};
        const terms: Term[] = [];

        // Count frequency
        tokens.forEach(token => {
            termFreq[token] = (termFreq[token] || 0) + 1;
        });

        // Create terms
        Object.entries(termFreq).forEach(([word, frequency]) => {
            terms.push({
                word,
                pos: this.getPartOfSpeech(word),
                frequency,
                context: this.getWordContext(word, tokens)
            });
        });

        return {
            terms: terms.sort((a, b) => b.frequency - a.frequency),
            synonyms: this.generateSynonyms(terms),
            stopWords: natural.stopwords,
            domain: 'general'
        };
    }    /**
     * Gets part of speech for a word
     */
    private getPartOfSpeech(word: string): string {
        try {
            // Simple POS detection using basic rules
            // In production, use a proper POS tagger
            if (word.match(/\w+ing$/)) return 'VBG'; // Present participle
            if (word.match(/\w+ed$/)) return 'VBD'; // Past tense
            if (word.match(/\w+s$/)) return 'NNS'; // Plural noun
            if (word.match(/^[A-Z]/)) return 'NNP'; // Proper noun
            return 'NN'; // Default to noun
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Gets context words for a given word
     */
    private getWordContext(word: string, tokens: string[], windowSize: number = 2): string[] {
        const context: string[] = [];
        const indices = tokens.map((token, index) => token === word ? index : -1)
                             .filter(index => index !== -1);

        indices.forEach(index => {
            const start = Math.max(0, index - windowSize);
            const end = Math.min(tokens.length, index + windowSize + 1);
            context.push(...tokens.slice(start, end).filter(t => t !== word));
        });

        return [...new Set(context)];
    }

    /**
     * Generates synonyms for terms
     */
    private generateSynonyms(terms: Term[]): Record<string, string[]> {
        const synonyms: Record<string, string[]> = {};
        
        // Basic synonym generation - in production use WordNet or similar
        terms.forEach(term => {
            if (term.frequency > 1) {
                synonyms[term.word] = this.getSimilarWords(term.word, terms);
            }
        });

        return synonyms;
    }

    /**
     * Gets similar words based on context
     */
    private getSimilarWords(word: string, terms: Term[]): string[] {
        // Simple similarity based on shared context
        const targetTerm = terms.find(t => t.word === word);
        if (!targetTerm) return [];

        return terms
            .filter(term => 
                term.word !== word && 
                term.context.some(ctx => targetTerm.context.includes(ctx))
            )
            .slice(0, 3) // Limit to 3 synonyms
            .map(term => term.word);
    }

    /**
     * Calculates intent confidence based on keyword matching
     */
    private calculateIntentConfidence(tokens: string[], keywords: string[]): number {
        const matches = keywords.filter(keyword => 
            tokens.some(token => token.includes(keyword) || keyword.includes(token))
        );
        return matches.length / keywords.length;
    }

    /**
     * Calculates overall confidence of the analysis
     */
    private calculateConfidence(entities: Entity[], intents: Intent[], patterns: string[]): number {
        const entityScore = Math.min(entities.length / 3, 1) * 0.3;
        const intentScore = Math.min(intents.length / 2, 1) * 0.4;
        const patternScore = Math.min(patterns.length / 5, 1) * 0.3;
        
        return entityScore + intentScore + patternScore;
    }

    /**
     * Generates recommendations based on analysis
     */
    private generateRecommendations(entities: Entity[], intents: Intent[], patterns: string[]): string[] {
        const recommendations: string[] = [];

        if (entities.length === 0) {
            recommendations.push('Consider adding more specific entities to improve recognition');
        }

        if (intents.length === 0) {
            recommendations.push('No clear intents detected - consider providing more context');
        }

        if (patterns.length < 3) {
            recommendations.push('Add more varied sentence patterns for better understanding');
        }

        const avgIntentConfidence = intents.reduce((sum, intent) => sum + intent.confidence, 0) / intents.length;
        if (avgIntentConfidence < 0.5) {
            recommendations.push('Intent confidence is low - consider adding more training examples');
        }

        return recommendations;
    }

    /**
     * Analyzes sentiment of text
     */
    analyzeSentiment(text: string): number {
        const tokens = this.tokenize(text);
        return this.sentiment.getSentiment(tokens);
    }

    /**
     * Extracts key phrases from text
     */
    extractKeyPhrases(text: string): string[] {
        const doc = compromise(text);
        const phrases: string[] = [];

        // Extract noun phrases
        phrases.push(...doc.match('#Noun+ #Noun').out('array'));
        
        // Extract verb phrases
        phrases.push(...doc.match('#Verb #Adverb? #Noun').out('array'));

        // Extract important adjective phrases
        phrases.push(...doc.match('#Adjective #Noun').out('array'));

        return [...new Set(phrases)].filter(phrase => phrase.length > 3);
    }
}
