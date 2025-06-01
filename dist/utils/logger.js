"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor(context = 'DEFAULT', level = LogLevel.INFO) {
        this.entries = [];
        this.context = context;
        this.level = level;
    }
    static log(message) {
        console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    }
    static error(message) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    }
    static warn(message) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
    static info(message) {
        console.info(`[INFO] ${new Date().toISOString()}: ${message}`);
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    error(message, data) {
        this.log(LogLevel.ERROR, message, data);
    }
    fatal(message, data) {
        this.log(LogLevel.FATAL, message, data);
    }
    log(level, message, data) {
        if (level < this.level) {
            return;
        }
        const entry = {
            timestamp: new Date(),
            level,
            message,
            context: this.context,
            data
        };
        this.entries.push(entry);
        this.output(entry);
    }
    output(entry) {
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
    getEntries() {
        return [...this.entries];
    }
    clearEntries() {
        this.entries = [];
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
    exportLogs() {
        return this.entries.map(entry => {
            const timestamp = entry.timestamp.toISOString();
            const levelName = LogLevel[entry.level];
            const contextStr = entry.context ? `[${entry.context}]` : '';
            const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
            return `${timestamp} [${levelName}] ${contextStr}: ${entry.message}${dataStr}`;
        }).join('\n');
    }
}
exports.Logger = Logger;
