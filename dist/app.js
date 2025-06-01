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
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const ruleController_1 = require("./api/ruleController");
const systemController_1 = require("./api/systemController");
const ruleRepository_1 = require("./storage/ruleRepository");
const factRepository_1 = require("./storage/factRepository");
const systemGenerator_1 = require("./generators/systemGenerator");
const processor_1 = require("./nlp/processor");
const engine_1 = require("./ai/engine");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const logger = new logger_1.Logger('Server');
app.use((0, body_parser_1.json)());
// Initialize components
const ruleRepository = new ruleRepository_1.RuleRepository();
const factRepository = new factRepository_1.FactRepository();
const ruleController = new ruleController_1.RuleController(ruleRepository);
const systemController = new systemController_1.SystemController();
// Initialize AI components
const nlpProcessor = new processor_1.NLPProcessor();
const aiEngine = new engine_1.AIEngine();
const systemGenerator = new systemGenerator_1.SystemGenerator();
// API Routes
app.use('/api/rules', ruleController.router);
app.use('/api/system', systemController.router);
// New AI-powered endpoints
app.post('/api/generate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info('Generating new language system');
        const system = yield systemGenerator.generateSystem(req.body);
        res.json(system);
    }
    catch (error) {
        logger.error(`Generation failed: ${error}`);
        res.status(500).json({ error: 'System generation failed' });
    }
}));
app.post('/api/analyze', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, domain } = req.body;
        logger.info(`Analyzing text for domain: ${domain}`);
        const analysis = yield nlpProcessor.analyzeText(text, domain);
        res.json(analysis);
    }
    catch (error) {
        logger.error(`Analysis failed: ${error}`);
        res.status(500).json({ error: 'Text analysis failed' });
    }
}));
app.post('/api/generate-rules', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description, context } = req.body;
        logger.info('Generating rules from description');
        const rules = yield aiEngine.generateRules(description, context);
        res.json(rules);
    }
    catch (error) {
        logger.error(`Rule generation failed: ${error}`);
        res.status(500).json({ error: 'Rule generation failed' });
    }
}));
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
