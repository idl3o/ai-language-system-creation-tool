export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}

export class Logger {
    private context: string;
    private level: LogLevel;
    private entries: LogEntry[] = [];

    constructor(context: string = 'DEFAULT', level: LogLevel = LogLevel.INFO) {
        this.context = context;
        this.level = level;
    }

    static log(message: string): void {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    }

    static error(message: string): void {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    }

    static warn(message: string): void {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }

    static info(message: string): void {
        console.info(`[INFO] ${new Date().toISOString()}: ${message}`);
    }

    debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data);
    }

    fatal(message: string, data?: any): void {
        this.log(LogLevel.FATAL, message, data);
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (level < this.level) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            context: this.context,
            data
        };

        this.entries.push(entry);
        this.output(entry);
    }

    private output(entry: LogEntry): void {
        const timestamp = entry.timestamp.toISOString();
        const levelName = LogLevel[entry.level];
        const contextStr = entry.context ? `[${entry.context}]` : '';
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
        
        const message = `[${levelName}] ${timestamp} ${contextStr}: ${entry.message}${dataStr}`;

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(message);
                break;
            case LogLevel.INFO:
                console.info(message);
                break;
            case LogLevel.WARN:
                console.warn(message);
                break;
            case LogLevel.ERROR:
                console.error(message);
                break;
            case LogLevel.FATAL:
                console.error(`🚨 ${message}`);
                break;
        }
    }

    getEntries(): LogEntry[] {
        return [...this.entries];
    }

    clearEntries(): void {
        this.entries = [];
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    getLevel(): LogLevel {
        return this.level;
    }

    exportLogs(): string {
        return this.entries.map(entry => {
            const timestamp = entry.timestamp.toISOString();
            const levelName = LogLevel[entry.level];
            const contextStr = entry.context ? `[${entry.context}]` : '';
            const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
            return `${timestamp} [${levelName}] ${contextStr}: ${entry.message}${dataStr}`;
        }).join('\n');
    }
}