#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickGenerate = void 0;
const systemGenerator_1 = require("../generators/systemGenerator");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger = new logger_1.Logger('Generator');
/**
 * Quick generation script for testing and development
 */
function quickGenerate() {
    return __awaiter(this, void 0, void 0, function* () {
        const generator = new systemGenerator_1.SystemGenerator();
        // Example generation request
        const request = {
            domain: 'customer_service',
            requirements: `
            Create a customer service system that can:
            - Handle product inquiries
            - Process refund requests
            - Provide order status updates
            - Route complex issues to human agents
            - Collect customer feedback
            
            The system should be friendly, helpful, and efficient.
            It should understand common customer service scenarios and respond appropriately.
        `,
            examples: [
                "I want to return my order",
                "Where is my package?",
                "Can you help me with product information?",
                "I need to speak to a manager",
                "How do I get a refund?"
            ],
            style: {
                formality: 'formal',
                verbosity: 'detailed',
                tone: 'friendly'
            },
            constraints: {
                maxRules: 30,
                minConfidence: 0.7
            }
        };
        try {
            console.log('🚀 Starting system generation...\n');
            const startTime = Date.now();
            const system = yield generator.generateSystem(request);
            const endTime = Date.now();
            console.log(`✅ System generated successfully!`);
            console.log(`⏱️  Generation time: ${(endTime - startTime) / 1000}s\n`);
            console.log(`📊 System Statistics:`);
            console.log(`   Name: ${system.name}`);
            console.log(`   Domain: ${system.domain}`);
            console.log(`   Rules: ${system.rules.length}`);
            console.log(`   Entities: ${system.entities.length}`);
            console.log(`   Intents: ${system.intents.length}`);
            console.log(`   Vocabulary Terms: ${system.vocabulary.terms.length}`);
            console.log(`   Performance Score: ${(system.metadata.performance.f1Score * 100).toFixed(1)}%\n`);
            // Export the system
            const outputDir = './generated_systems';
            yield generator.exportSystem(system, outputDir, ['json', 'yaml', 'rules']);
            // Generate documentation
            const docs = yield generator.generateDocumentation(system);
            yield fs.writeFile(path.join(outputDir, `${system.name}.md`), docs);
            console.log(`📁 System exported to: ${outputDir}`);
            console.log(`📚 Documentation: ${system.name}.md`);
            // Show sample rules
            console.log(`\n🔧 Sample Rules Generated:`);
            system.rules.slice(0, 3).forEach((rule, index) => {
                console.log(`\n${index + 1}. ${rule.name}`);
                console.log(`   Description: ${rule.naturalLanguage}`);
                console.log(`   Confidence: ${(rule.confidence * 100).toFixed(1)}%`);
                console.log(`   Condition: ${rule.condition.expression}`);
                console.log(`   Action: ${rule.action.type} -> ${rule.action.target}`);
            });
            if (system.rules.length > 3) {
                console.log(`\n   ... and ${system.rules.length - 3} more rules`);
            }
        }
        catch (error) {
            logger.error(`Generation failed: ${error}`);
            console.error('\n❌ Generation failed. Check the logs for details.');
            process.exit(1);
        }
    });
}
exports.quickGenerate = quickGenerate;
// Run if called directly
if (require.main === module) {
    quickGenerate().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
