import express from 'express';
import { json } from 'body-parser';
import { RuleController } from './api/ruleController';
import { SystemController } from './api/systemController';
import { RuleRepository } from './storage/ruleRepository';
import { FactRepository } from './storage/factRepository';
import { SystemGenerator } from './generators/systemGenerator';
import { NLPProcessor } from './nlp/processor';
import { AIEngine } from './ai/engine';
import { Logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;
const logger = new Logger('Server');

app.use(json());

// Initialize components
const ruleRepository = new RuleRepository();
const factRepository = new FactRepository();
const ruleController = new RuleController(ruleRepository);
const systemController = new SystemController();

// Initialize AI components
const nlpProcessor = new NLPProcessor();
const aiEngine = new AIEngine();
const systemGenerator = new SystemGenerator();

// API Routes
app.use('/api/rules', ruleController.router);
app.use('/api/system', systemController.router);

// New AI-powered endpoints
app.post('/api/generate', async (req, res) => {
    try {
        logger.info('Generating new language system');
        const system = await systemGenerator.generateSystem(req.body);
        res.json(system);
    } catch (error) {
        logger.error(`Generation failed: ${error}`);
        res.status(500).json({ error: 'System generation failed' });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { text, domain } = req.body;
        logger.info(`Analyzing text for domain: ${domain}`);
        const analysis = await nlpProcessor.analyzeText(text, domain);
        res.json(analysis);
    } catch (error) {
        logger.error(`Analysis failed: ${error}`);
        res.status(500).json({ error: 'Text analysis failed' });
    }
});

app.post('/api/generate-rules', async (req, res) => {
    try {
        const { description, context } = req.body;
        logger.info('Generating rules from description');
        const rules = await aiEngine.generateRules(description, context);
        res.json(rules);
    } catch (error) {
        logger.error(`Rule generation failed: ${error}`);
        res.status(500).json({ error: 'Rule generation failed' });
    }
});

app.get('/api/stats', (req, res) => {
    const stats = systemGenerator.getStats();
    res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        components: {
            nlp: 'ready',
            ai: 'ready',
            generator: 'ready'
        }
    });
});

// Start server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
    console.log(`🚀 Intelligent Language Systems Server`);
    console.log(`📡 Server running on http://localhost:${port}`);
    console.log(`🔧 API Endpoints:`);
    console.log(`   POST /api/generate - Generate language system`);
    console.log(`   POST /api/analyze - Analyze text`);
    console.log(`   POST /api/generate-rules - Generate rules`);
    console.log(`   GET  /api/stats - System capabilities`);
    console.log(`   GET  /health - Health check`);
});