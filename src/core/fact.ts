export type FactSource = 'user' | 'derived' | 'external' | 'system' | 'unknown';

export interface FactMetadata {
    source: FactSource;
    confidence: number;
    timestamp: Date;
    derivedFrom?: string[];
    constraints?: Record<string, any>;
}

export class Fact {
    public name: string;
    public value: any;
    public confidence: number;
    public source: FactSource;
    public timestamp: Date;
    public derivedFrom: string[];
    public constraints: Record<string, any>;
    public id: string;

    constructor(
        name: string, 
        value: any, 
        source: FactSource = 'unknown',
        confidence: number = 1.0,
        derivedFrom: string[] = []
    ) {
        this.id = this.generateId();
        this.name = name;
        this.value = value;
        this.confidence = Math.max(0, Math.min(1, confidence)); // Clamp between 0 and 1
        this.source = source;
        this.timestamp = new Date();
        this.derivedFrom = derivedFrom;
        this.constraints = {};
    }

    private generateId(): string {
        return 'fact_' + Math.random().toString(36).substr(2, 9);
    }

    getRepresentation(): string {
        return `${this.name}: ${this.value}`;
    }

    getDetailedRepresentation(): string {
        return `${this.name}: ${this.value} (confidence: ${this.confidence}, source: ${this.source})`;
    }

    // Type checking methods
    isNumeric(): boolean {
        return typeof this.value === 'number' && !isNaN(this.value);
    }

    isString(): boolean {
        return typeof this.value === 'string';
    }

    isBoolean(): boolean {
        return typeof this.value === 'boolean';
    }

    isArray(): boolean {
        return Array.isArray(this.value);
    }

    isObject(): boolean {
        return typeof this.value === 'object' && this.value !== null && !Array.isArray(this.value);
    }

    // Value operations
    equals(other: Fact): boolean {
        return this.name === other.name && this.deepEquals(this.value, other.value);
    }

    private deepEquals(a: any, b: any): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== typeof b) return false;
        
        if (typeof a === 'object') {
            if (Array.isArray(a) !== Array.isArray(b)) return false;
            if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                return a.every((val, i) => this.deepEquals(val, b[i]));
            } else {
                const keysA = Object.keys(a);
                const keysB = Object.keys(b);
                if (keysA.length !== keysB.length) return false;
                return keysA.every(key => this.deepEquals(a[key], b[key]));
            }
        }
        
        return false;
    }

    // Constraint management
    addConstraint(name: string, constraint: any): void {
        this.constraints[name] = constraint;
    }

    removeConstraint(name: string): void {
        delete this.constraints[name];
    }

    hasConstraint(name: string): boolean {
        return name in this.constraints;
    }

    validateConstraints(): boolean {
        for (const [name, constraint] of Object.entries(this.constraints)) {
            if (!this.validateConstraint(name, constraint)) {
                return false;
            }
        }
        return true;
    }

    private validateConstraint(name: string, constraint: any): boolean {
        switch (name) {
            case 'type':
                return typeof this.value === constraint;
            case 'min':
                return this.isNumeric() && this.value >= constraint;
            case 'max':
                return this.isNumeric() && this.value <= constraint;
            case 'pattern':
                return this.isString() && new RegExp(constraint).test(this.value);
            case 'enum':
                return Array.isArray(constraint) && constraint.includes(this.value);
            case 'length':
                if (this.isString() || this.isArray()) {
                    return this.value.length === constraint;
                }
                return false;
            case 'minLength':
                if (this.isString() || this.isArray()) {
                    return this.value.length >= constraint;
                }
                return false;
            case 'maxLength':
                if (this.isString() || this.isArray()) {
                    return this.value.length <= constraint;
                }
                return false;
            default:
                // Custom constraint validation could be added here
                return true;
        }
    }

    // Confidence operations
    updateConfidence(newConfidence: number): void {
        this.confidence = Math.max(0, Math.min(1, newConfidence));
    }

    combineConfidence(otherConfidence: number, method: 'average' | 'min' | 'max' = 'average'): number {
        switch (method) {
            case 'average':
                return (this.confidence + otherConfidence) / 2;
            case 'min':
                return Math.min(this.confidence, otherConfidence);
            case 'max':
                return Math.max(this.confidence, otherConfidence);
            default:
                return this.confidence;
        }
    }

    // Versioning and history
    createDerivedFact(newValue: any, derivationSource: string, newConfidence?: number): Fact {
        const derived = new Fact(
            this.name,
            newValue,
            'derived',
            newConfidence || this.confidence,
            [...this.derivedFrom, derivationSource]
        );
        derived.constraints = { ...this.constraints };
        return derived;
    }

    // Serialization
    toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            value: this.value,
            confidence: this.confidence,
            source: this.source,
            timestamp: this.timestamp,
            derivedFrom: this.derivedFrom,
            constraints: this.constraints
        };
    }

    static fromJSON(data: any): Fact {
        const fact = new Fact(data.name, data.value, data.source, data.confidence, data.derivedFrom);
        fact.id = data.id;
        fact.timestamp = new Date(data.timestamp);
        fact.constraints = data.constraints || {};
        return fact;
    }

    // Utility methods
    clone(): Fact {
        const cloned = new Fact(this.name, this.value, this.source, this.confidence, [...this.derivedFrom]);
        cloned.constraints = { ...this.constraints };
        return cloned;
    }

    isExpired(expiryMinutes: number = 60): boolean {
        const now = new Date();
        const diffMs = now.getTime() - this.timestamp.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        return diffMinutes > expiryMinutes;
    }

    toString(): string {
        return this.getDetailedRepresentation();
    }
}