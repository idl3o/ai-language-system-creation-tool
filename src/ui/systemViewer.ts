import { LanguageSystem, IntelligentRule, Entity, Intent, PerformanceMetrics } from '../types';
import { Engine, ExecutionResult } from '../core/engine';
import { Fact } from '../core/fact';
import { Logger } from '../utils/logger';
import { SystemValidator, ValidationResult } from '../utils/validator';

export interface ViewerConfig {
    enableRealTimeUpdates?: boolean;
    maxHistoryEntries?: number;
    enablePerformanceTracking?: boolean;
    autoRefreshInterval?: number;
}

export interface SystemStats {
    totalRules: number;
    totalEntities: number;
    totalIntents: number;
    averageConfidence: number;
    lastExecutionTime?: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
}

export interface ExecutionHistory {
    id: string;
    timestamp: Date;
    input: any;
    result: ExecutionResult;
    duration: number;
    success: boolean;
}

export interface VisualizationData {
    ruleNetwork: {
        nodes: Array<{ id: string; label: string; type: string; confidence: number }>;
        edges: Array<{ source: string; target: string; weight: number }>;
    };
    performanceMetrics: PerformanceMetrics;
    confidenceDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    actionTypeDistribution: Record<string, number>;
}

export type ViewMode = 'overview' | 'rules' | 'entities' | 'intents' | 'performance' | 'execution' | 'visualization';

export class SystemViewer {
    private currentSystem: LanguageSystem | null;
    private engine: Engine | null;
    private config: ViewerConfig;
    private logger: Logger;
    private validator: SystemValidator;
    private executionHistory: ExecutionHistory[];
    private stats: SystemStats;
    private currentViewMode: ViewMode;
    private refreshTimer?: NodeJS.Timeout;
    private stateChangeListeners: Array<(system: LanguageSystem | null) => void>;

    constructor(initialSystem?: LanguageSystem, config: ViewerConfig = {}) {
        this.currentSystem = initialSystem || null;
        this.engine = null;
        this.config = {
            enableRealTimeUpdates: true,
            maxHistoryEntries: 100,
            enablePerformanceTracking: true,
            autoRefreshInterval: 5000,
            ...config
        };
        this.logger = new Logger('SystemViewer');
        this.validator = new SystemValidator();
        this.executionHistory = [];
        this.stats = this.initializeStats();
        this.currentViewMode = 'overview';
        this.stateChangeListeners = [];

        if (this.currentSystem) {
            this.initializeSystem(this.currentSystem);
        }

        this.startAutoRefresh();
    }

    // Core system management
    public updateSystem(newSystem: LanguageSystem): void {
        try {
            this.currentSystem = newSystem;
            this.initializeSystem(newSystem);
            this.notifyStateChange();
            this.logger.info(`Updated system: ${newSystem.name}`);
        } catch (error) {
            this.logger.error(`Failed to update system: ${error}`);
            throw error;
        }
    }

    public getCurrentSystem(): LanguageSystem | null {
        return this.currentSystem;
    }

    public async validateCurrentSystem(): Promise<ValidationResult> {
        if (!this.currentSystem) {
            return {
                isValid: false,
                errors: ['No system loaded'],
                warnings: []
            };
        }

        return await this.validator.validateSystem(this.currentSystem);
    }

    // Display and visualization methods
    public async displayState(): Promise<void> {
        if (!this.currentSystem) {
            console.log('No system currently loaded');
            return;
        }

        console.log('='.repeat(60));
        console.log(`SYSTEM: ${this.currentSystem.name}`);
        console.log('='.repeat(60));
        
        await this.displayOverview();
        this.displayRules();
        this.displayEntities();
        this.displayIntents();
        this.displayPerformanceMetrics();
    }

    public async displayOverview(): Promise<void> {
        if (!this.currentSystem) {
            console.log('No system loaded');
            return;
        }

        console.log('\n📊 SYSTEM OVERVIEW');
        console.log('─'.repeat(40));
        console.log(`Name: ${this.currentSystem.name}`);
        console.log(`Domain: ${this.currentSystem.domain}`);
        console.log(`Description: ${this.currentSystem.description}`);
        console.log(`Version: ${this.currentSystem.metadata.version}`);
        console.log(`Created: ${this.currentSystem.metadata.created.toLocaleDateString()}`);
        console.log(`Last Modified: ${this.currentSystem.metadata.lastModified.toLocaleDateString()}`);
        console.log(`Author: ${this.currentSystem.metadata.author}`);
        console.log(`Tags: ${this.currentSystem.metadata.tags.join(', ')}`);
        
        const validation = await this.validateCurrentSystem();
        console.log(`Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (!validation.isValid) {
            console.log(`Errors: ${validation.errors.join(', ')}`);
        }
        if (validation.warnings.length > 0) {
            console.log(`Warnings: ${validation.warnings.join(', ')}`);
        }
    }

    public displayRules(): void {
        if (!this.currentSystem) return;

        console.log('\n📋 RULES');
        console.log('─'.repeat(40));
        console.log(`Total Rules: ${this.currentSystem.rules.length}`);
        
        if (this.currentSystem.rules.length === 0) {
            console.log('No rules defined');
            return;
        }

        this.currentSystem.rules
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10) // Show top 10 rules
            .forEach((rule, index) => {
                console.log(`\n${index + 1}. ${rule.name} (Priority: ${rule.priority})`);
                console.log(`   Condition: ${rule.condition.expression}`);
                console.log(`   Action: ${rule.action.type} -> ${rule.action.target}`);
                console.log(`   Confidence: ${(rule.confidence * 100).toFixed(1)}%`);
                console.log(`   Natural Language: ${rule.naturalLanguage}`);
            });

        if (this.currentSystem.rules.length > 10) {
            console.log(`\n... and ${this.currentSystem.rules.length - 10} more rules`);
        }
    }

    public displayEntities(): void {
        if (!this.currentSystem) return;

        console.log('\n🏷️  ENTITIES');
        console.log('─'.repeat(40));
        console.log(`Total Entities: ${this.currentSystem.entities.length}`);
        
        if (this.currentSystem.entities.length === 0) {
            console.log('No entities defined');
            return;
        }

        this.currentSystem.entities.forEach((entity, index) => {
            console.log(`\n${index + 1}. ${entity.name} (${entity.type})`);
            if (entity.values?.length) {
                console.log(`   Values: ${entity.values.slice(0, 5).join(', ')}${entity.values.length > 5 ? '...' : ''}`);
            }
            if (entity.patterns?.length) {
                console.log(`   Patterns: ${entity.patterns.slice(0, 3).join(', ')}${entity.patterns.length > 3 ? '...' : ''}`);
            }
        });
    }

    public displayIntents(): void {
        if (!this.currentSystem) return;

        console.log('\n🎯 INTENTS');
        console.log('─'.repeat(40));
        console.log(`Total Intents: ${this.currentSystem.intents.length}`);
        
        if (this.currentSystem.intents.length === 0) {
            console.log('No intents defined');
            return;
        }

        this.currentSystem.intents
            .sort((a, b) => b.confidence - a.confidence)
            .forEach((intent, index) => {
                console.log(`\n${index + 1}. ${intent.name} (Confidence: ${(intent.confidence * 100).toFixed(1)}%)`);
                console.log(`   Utterances: ${intent.utterances.slice(0, 3).join(', ')}${intent.utterances.length > 3 ? '...' : ''}`);
                console.log(`   Entities: ${intent.entities.join(', ')}`);
            });
    }

    public displayPerformanceMetrics(): void {
        if (!this.currentSystem) return;

        console.log('\n⚡ PERFORMANCE METRICS');
        console.log('─'.repeat(40));
        
        const metrics = this.currentSystem.metadata.performance;
        console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
        console.log(`Precision: ${(metrics.precision * 100).toFixed(1)}%`);
        console.log(`Recall: ${(metrics.recall * 100).toFixed(1)}%`);
        console.log(`F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%`);
        console.log(`Response Time: ${metrics.responseTime}ms`);
        
        console.log('\n📈 EXECUTION STATISTICS');
        console.log(`Total Executions: ${this.stats.totalExecutions}`);
        console.log(`Successful: ${this.stats.successfulExecutions}`);
        console.log(`Failed: ${this.stats.failedExecutions}`);
        console.log(`Success Rate: ${this.stats.totalExecutions > 0 ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1) : 0}%`);
        
        if (this.stats.lastExecutionTime) {
            console.log(`Last Execution: ${this.stats.lastExecutionTime}ms`);
        }
    }

    public displayExecutionHistory(limit: number = 10): void {
        console.log('\n📝 EXECUTION HISTORY');
        console.log('─'.repeat(40));
        
        if (this.executionHistory.length === 0) {
            console.log('No executions recorded');
            return;
        }

        this.executionHistory
            .slice(-limit)
            .reverse()
            .forEach((entry, index) => {
                console.log(`\n${index + 1}. ${entry.timestamp.toLocaleTimeString()}`);
                console.log(`   Status: ${entry.success ? '✅ Success' : '❌ Failed'}`);
                console.log(`   Duration: ${entry.duration}ms`);
                console.log(`   Applied Rules: ${entry.result.appliedRules.length}`);
                console.log(`   Derived Facts: ${entry.result.derivedFacts.length}`);
                if (entry.result.errors.length > 0) {
                    console.log(`   Errors: ${entry.result.errors.join(', ')}`);
                }
            });
    }

    // Execution and testing
    public executeSystem(input: any): ExecutionResult | null {
        if (!this.engine) {
            console.log('System engine not initialized');
            return null;
        }

        const startTime = Date.now();
        
        try {
            // Add input as facts to the engine
            if (typeof input === 'object') {
                for (const [key, value] of Object.entries(input)) {
                    this.engine.addFact(new Fact(key, value, 'user', 1.0));
                }
            }

            const result = this.engine.execute();
            const duration = Date.now() - startTime;
            
            this.recordExecution(input, result, duration, true);
            this.updateStats(result, duration, true);
            
            console.log(`\n🚀 EXECUTION RESULT`);
            console.log(`Applied Rules: ${result.appliedRules.length}`);
            console.log(`Derived Facts: ${result.derivedFacts.length}`);
            console.log(`Execution Time: ${duration}ms`);
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorResult: ExecutionResult = {
                success: false,
                appliedRules: [],
                derivedFacts: [],
                confidence: 0,
                executionTime: duration,
                reasoning: [],
                errors: [String(error)]
            };
            
            this.recordExecution(input, errorResult, duration, false);
            this.updateStats(errorResult, duration, false);
            
            console.log(`\n❌ EXECUTION FAILED: ${error}`);
            return errorResult;
        }
    }

    // View mode management
    public async setViewMode(mode: ViewMode): Promise<void> {
        this.currentViewMode = mode;
        await this.refreshDisplay();
    }

    public getViewMode(): ViewMode {
        return this.currentViewMode;
    }

    // Data export and visualization
    public generateVisualizationData(): VisualizationData {
        if (!this.currentSystem) {
            throw new Error('No system loaded');
        }

        return {
            ruleNetwork: this.buildRuleNetwork(),
            performanceMetrics: this.currentSystem.metadata.performance,
            confidenceDistribution: this.buildConfidenceDistribution(),
            priorityDistribution: this.buildPriorityDistribution(),
            actionTypeDistribution: this.buildActionTypeDistribution()
        };
    }

    public async exportSystemReport(format: 'json' | 'html' | 'markdown' = 'json'): Promise<string> {
        if (!this.currentSystem) {
            throw new Error('No system loaded');
        }

        switch (format) {
            case 'json':
                return await this.exportAsJSON();
            case 'html':
                return this.exportAsHTML();
            case 'markdown':
                return this.exportAsMarkdown();
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    // Statistics and metrics
    public getSystemStats(): SystemStats {
        return { ...this.stats };
    }

    public refreshStats(): void {
        if (!this.currentSystem) return;

        this.stats = {
            totalRules: this.currentSystem.rules.length,
            totalEntities: this.currentSystem.entities.length,
            totalIntents: this.currentSystem.intents.length,
            averageConfidence: this.calculateAverageConfidence(),
            lastExecutionTime: this.stats.lastExecutionTime,
            totalExecutions: this.stats.totalExecutions,
            successfulExecutions: this.stats.successfulExecutions,
            failedExecutions: this.stats.failedExecutions
        };
    }

    // Event handling and real-time updates
    public addStateChangeListener(listener: (system: LanguageSystem | null) => void): void {
        this.stateChangeListeners.push(listener);
    }

    public removeStateChangeListener(listener: (system: LanguageSystem | null) => void): void {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index > -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }

    // Cleanup
    public destroy(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.stateChangeListeners = [];
        this.executionHistory = [];
        this.engine = null;
        this.currentSystem = null;
    }

    // Private helper methods
    private initializeSystem(system: LanguageSystem): void {
        try {
            this.engine = new Engine();
            this.engine.initializeFromSystem(system);
            this.refreshStats();
            this.logger.info(`Initialized system: ${system.name}`);
        } catch (error) {
            this.logger.error(`Failed to initialize system: ${error}`);
            throw error;
        }
    }

    private initializeStats(): SystemStats {
        return {
            totalRules: 0,
            totalEntities: 0,
            totalIntents: 0,
            averageConfidence: 0,
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0
        };
    }

    private recordExecution(input: any, result: ExecutionResult, duration: number, success: boolean): void {
        if (!this.config.enablePerformanceTracking) return;

        const entry: ExecutionHistory = {
            id: this.generateExecutionId(),
            timestamp: new Date(),
            input,
            result,
            duration,
            success
        };

        this.executionHistory.push(entry);

        // Limit history size
        if (this.executionHistory.length > this.config.maxHistoryEntries!) {
            this.executionHistory = this.executionHistory.slice(-this.config.maxHistoryEntries!);
        }
    }

    private updateStats(result: ExecutionResult, duration: number, success: boolean): void {
        this.stats.totalExecutions++;
        this.stats.lastExecutionTime = duration;

        if (success) {
            this.stats.successfulExecutions++;
        } else {
            this.stats.failedExecutions++;
        }
    }

    private calculateAverageConfidence(): number {
        if (!this.currentSystem || this.currentSystem.rules.length === 0) return 0;
        
        const total = this.currentSystem.rules.reduce((sum, rule) => sum + rule.confidence, 0);
        return total / this.currentSystem.rules.length;
    }

    private buildRuleNetwork(): VisualizationData['ruleNetwork'] {
        if (!this.currentSystem) {
            return { nodes: [], edges: [] };
        }

        const nodes = this.currentSystem.rules.map(rule => ({
            id: rule.id,
            label: rule.name,
            type: rule.condition.type,
            confidence: rule.confidence
        }));

        const edges: Array<{ source: string; target: string; weight: number }> = [];
        
        // Build edges based on rule dependencies and shared entities/intents
        this.currentSystem.rules.forEach(rule => {
            if (rule.condition.entities) {
                rule.condition.entities.forEach(entity => {
                    const relatedRules = this.currentSystem!.rules.filter(r => 
                        r.id !== rule.id && r.condition.entities?.includes(entity)
                    );
                    relatedRules.forEach(relatedRule => {
                        edges.push({
                            source: rule.id,
                            target: relatedRule.id,
                            weight: 0.5
                        });
                    });
                });
            }
        });

        return { nodes, edges };
    }

    private buildConfidenceDistribution(): Record<string, number> {
        if (!this.currentSystem) return {};
        
        const ranges = {
            '0.0-0.2': 0,
            '0.2-0.4': 0,
            '0.4-0.6': 0,
            '0.6-0.8': 0,
            '0.8-1.0': 0
        };

        this.currentSystem.rules.forEach(rule => {
            if (rule.confidence <= 0.2) ranges['0.0-0.2']++;
            else if (rule.confidence <= 0.4) ranges['0.2-0.4']++;
            else if (rule.confidence <= 0.6) ranges['0.4-0.6']++;
            else if (rule.confidence <= 0.8) ranges['0.6-0.8']++;
            else ranges['0.8-1.0']++;
        });

        return ranges;
    }

    private buildPriorityDistribution(): Record<string, number> {
        if (!this.currentSystem) return {};
        
        return this.currentSystem.rules.reduce((dist, rule) => {
            const priority = `Priority ${rule.priority}`;
            dist[priority] = (dist[priority] || 0) + 1;
            return dist;
        }, {} as Record<string, number>);
    }

    private buildActionTypeDistribution(): Record<string, number> {
        if (!this.currentSystem) return {};
        
        return this.currentSystem.rules.reduce((dist, rule) => {
            dist[rule.action.type] = (dist[rule.action.type] || 0) + 1;
            return dist;
        }, {} as Record<string, number>);
    }

    private async exportAsJSON(): Promise<string> {
        return JSON.stringify({
            system: this.currentSystem,
            stats: this.stats,
            executionHistory: this.executionHistory.slice(-20), // Last 20 executions
            validation: await this.validateCurrentSystem(),
            visualization: this.generateVisualizationData()
        }, null, 2);
    }

    private exportAsHTML(): string {
        if (!this.currentSystem) return '';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>System Report: ${this.currentSystem.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .rule { border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .stats { display: flex; gap: 20px; }
        .stat { text-align: center; padding: 10px; background: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.currentSystem.name}</h1>
        <p><strong>Domain:</strong> ${this.currentSystem.domain}</p>
        <p><strong>Description:</strong> ${this.currentSystem.description}</p>
    </div>
    
    <div class="section">
        <h2>Statistics</h2>
        <div class="stats">
            <div class="stat">
                <h3>${this.stats.totalRules}</h3>
                <p>Rules</p>
            </div>
            <div class="stat">
                <h3>${this.stats.totalEntities}</h3>
                <p>Entities</p>
            </div>
            <div class="stat">
                <h3>${this.stats.totalIntents}</h3>
                <p>Intents</p>
            </div>
            <div class="stat">
                <h3>${(this.stats.averageConfidence * 100).toFixed(1)}%</h3>
                <p>Avg Confidence</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Top Rules</h2>
        ${this.currentSystem.rules.slice(0, 10).map(rule => `
            <div class="rule">
                <h4>${rule.name}</h4>
                <p><strong>Condition:</strong> ${rule.condition.expression}</p>
                <p><strong>Action:</strong> ${rule.action.type} → ${rule.action.target}</p>
                <p><strong>Confidence:</strong> ${(rule.confidence * 100).toFixed(1)}%</p>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <p><em>Report generated on ${new Date().toLocaleString()}</em></p>
    </div>
</body>
</html>`;
    }

    private exportAsMarkdown(): string {
        if (!this.currentSystem) return '';
        
        return `# System Report: ${this.currentSystem.name}

## Overview
- **Domain:** ${this.currentSystem.domain}
- **Description:** ${this.currentSystem.description}
- **Version:** ${this.currentSystem.metadata.version}
- **Created:** ${this.currentSystem.metadata.created.toLocaleDateString()}
- **Author:** ${this.currentSystem.metadata.author}

## Statistics
- **Rules:** ${this.stats.totalRules}
- **Entities:** ${this.stats.totalEntities}
- **Intents:** ${this.stats.totalIntents}
- **Average Confidence:** ${(this.stats.averageConfidence * 100).toFixed(1)}%
- **Total Executions:** ${this.stats.totalExecutions}
- **Success Rate:** ${this.stats.totalExecutions > 0 ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1) : 0}%

## Top Rules

${this.currentSystem.rules.slice(0, 10).map((rule, index) => `
### ${index + 1}. ${rule.name}
- **Condition:** \`${rule.condition.expression}\`
- **Action:** ${rule.action.type} → \`${rule.action.target}\`
- **Confidence:** ${(rule.confidence * 100).toFixed(1)}%
- **Priority:** ${rule.priority}
- **Description:** ${rule.naturalLanguage}
`).join('')}

## Performance Metrics
- **Accuracy:** ${(this.currentSystem.metadata.performance.accuracy * 100).toFixed(1)}%
- **Precision:** ${(this.currentSystem.metadata.performance.precision * 100).toFixed(1)}%
- **Recall:** ${(this.currentSystem.metadata.performance.recall * 100).toFixed(1)}%
- **F1 Score:** ${(this.currentSystem.metadata.performance.f1Score * 100).toFixed(1)}%
- **Response Time:** ${this.currentSystem.metadata.performance.responseTime}ms

---
*Report generated on ${new Date().toLocaleString()}*`;
    }

    private async refreshDisplay(): Promise<void> {
        if (!this.config.enableRealTimeUpdates) return;
        
        switch (this.currentViewMode) {
            case 'overview':
                await this.displayOverview();
                break;
            case 'rules':
                this.displayRules();
                break;
            case 'entities':
                this.displayEntities();
                break;
            case 'intents':
                this.displayIntents();
                break;
            case 'performance':
                this.displayPerformanceMetrics();
                break;
            case 'execution':
                this.displayExecutionHistory();
                break;
        }
    }

    private startAutoRefresh(): void {
        if (!this.config.enableRealTimeUpdates || !this.config.autoRefreshInterval) return;
        
        this.refreshTimer = setInterval(async () => {
            this.refreshStats();
            await this.refreshDisplay();
        }, this.config.autoRefreshInterval);
    }

    private notifyStateChange(): void {
        this.stateChangeListeners.forEach(listener => listener(this.currentSystem));
    }

    private generateExecutionId(): string {
        return 'exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
}