#!/usr/bin/env node

import { SystemGenerator } from '../generators/systemGenerator';
import { GenerationRequest } from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new Logger('Generator');

/**
 * Quick generation script for testing and development
 */
async function quickGenerate(): Promise<void> {
    const generator = new SystemGenerator();

    // Example generation request
    const request: GenerationRequest = {
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
        const system = await generator.generateSystem(request);
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
        await generator.exportSystem(system, outputDir, ['json', 'yaml', 'rules']);
        
        // Generate documentation
        const docs = await generator.generateDocumentation(system);
        await fs.writeFile(path.join(outputDir, `${system.name}.md`), docs);
        
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

    } catch (error) {
        logger.error(`Generation failed: ${error}`);
        console.error('\n❌ Generation failed. Check the logs for details.');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    quickGenerate().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { quickGenerate };
