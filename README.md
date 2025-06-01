# Automated Intelligent Language Systems Creation Tool

An advanced AI-powered tool for automatically creating intelligent language processing systems with rule-based logic, natural language processing, and machine learning capabilities.

## 🚀 Features

- **Automated System Generation**: AI-powered creation of complete language systems from natural language descriptions
- **Natural Language Processing**: Advanced NLP capabilities using multiple libraries (Natural, Compromise)
- **Rule-Based Logic Engine**: Sophisticated rule evaluation and inference system
- **AI Integration**: OpenAI GPT integration for intelligent content generation
- **Interactive CLI**: Command-line interface for system generation and management
- **RESTful API**: Complete API for programmatic access
- **Validation & Testing**: Comprehensive validation and testing framework
- **Performance Monitoring**: Built-in performance metrics and monitoring

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Engine    │    │  NLP Processor  │    │ System Generator│
│                 │    │                 │    │                 │
│ • GPT Integration│    │ • Entity Extract│    │ • Auto Creation │
│ • Content Gen   │    │ • Intent Detect │    │ • Rule Generation│
│ • Analysis      │    │ • Pattern Match │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │             Core Logic Engine                   │
         │                                                 │
         │ • Rule Evaluation    • Fact Management          │
         │ • Inference Engine   • Context Handling         │
         │ • Performance Metrics                           │
         └─────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── ai/                     # AI and machine learning components
│   └── engine.ts          # OpenAI integration and AI processing
├── api/                   # RESTful API endpoints
│   ├── routes.ts         # API route definitions
│   ├── ruleController.ts # Rule management endpoints
│   └── systemController.ts # System-level operations
├── cli/                   # Command-line interface
│   ├── index.ts          # Main CLI entry point
│   └── generate.ts       # System generation commands
├── core/                  # Core logic engine
│   ├── engine.ts         # Main execution engine
│   ├── rule.ts           # Rule definitions and evaluation
│   ├── fact.ts           # Fact management
│   └── inference.ts      # Inference and reasoning
├── generators/            # Automated system generators
│   └── systemGenerator.ts # Main system generation logic
├── nlp/                   # Natural language processing
│   └── processor.ts      # NLP analysis and processing
├── parser/                # Rule and syntax parsing
│   ├── ruleParser.ts     # Rule syntax parser
│   └── syntax.ts         # Syntax definitions
├── storage/               # Data persistence
│   ├── ruleRepository.ts # Rule storage management
│   └── factRepository.ts # Fact storage management
├── types/                 # TypeScript type definitions
│   └── index.ts          # Core type definitions
├── ui/                    # User interface components
│   ├── components.ts     # Reusable UI components
│   ├── ruleEditor.ts     # Rule editing interface
│   └── systemViewer.ts   # System visualization
├── utils/                 # Utility functions
│   ├── validator.ts      # Validation utilities
│   └── logger.ts         # Logging utilities
└── app.ts                # Main application entry point
```

- **tests/**: Contains test files for unit and integration testing.
  - **unit/**: Unit tests for individual components.
    - `engine.test.ts`: Unit tests for the Engine class.
  - **integration/**: Integration tests for overall system functionality.
    - `system.test.ts`: Integration tests for the system.

- **config/**: Configuration settings for the application.
  - `default.json`: Default configuration settings.

- **package.json**: npm configuration file listing dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file specifying compiler options.

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/rule-based-logic-system.git
   cd rule-based-logic-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   echo "PORT=3000" >> .env
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## 🚀 Quick Start

### Using the CLI

Generate a new intelligent language system:

```bash
# Interactive system generation
npm run cli

# Direct generation with parameters
npm run generate -- --domain "customer-support" --description "Handle customer inquiries and complaints"
```

### Using the API

Start the server:

```bash
npm run dev
```

Create a system via API:

```bash
curl -X POST http://localhost:3000/api/system/generate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "customer-support",
    "requirements": "Handle customer inquiries, complaints, and provide solutions",
    "examples": [
      "I need help with my order",
      "My product is defective",
      "Can you refund my purchase?"
    ]
  }'
```

## 📚 Core Concepts

### Language System

A complete intelligent language processing system that includes:

- **Rules**: Conditional logic for processing inputs
- **Entities**: Key data points extracted from text
- **Intents**: User intentions and purposes
- **Vocabulary**: Domain-specific terminology
- **Context**: Environmental and session information

### Intelligent Rules

Enhanced rules that combine traditional logic with NLP:

```typescript
{
  "id": "complaint-handler",
  "condition": {
    "type": "nlp",
    "expression": "intent.complaint AND entity.product",
    "intents": ["complaint"],
    "entities": ["product"]
  },
  "action": {
    "type": "response",
    "template": "I understand you're having issues with {product}. Let me help you resolve this."
  },
  "confidence": 0.85,
  "naturalLanguage": "When user complains about a product, acknowledge and offer help"
}
```

## 🔧 API Reference

### System Generation

**POST** `/api/system/generate`

Generate a new intelligent language system.

**Request Body**:
```json
{
  "domain": "string",
  "requirements": "string",
  "examples": ["string"],
  "constraints": {
    "maxRules": 50,
    "minConfidence": 0.7
  },
  "style": {
    "formality": "professional",
    "verbosity": "detailed",
    "tone": "friendly"
  }
}
```

**Response**:
```json
{
  "id": "system-uuid",
  "name": "Generated System Name",
  "description": "System description",
  "domain": "customer-support",
  "rules": [...],
  "entities": [...],
  "intents": [...],
  "vocabulary": {...},
  "metadata": {...}
}
```

### Rule Management

**GET** `/api/rules` - List all rules
**POST** `/api/rules` - Create a new rule
**GET** `/api/rules/:id` - Get a specific rule
**PUT** `/api/rules/:id` - Update a rule
**DELETE** `/api/rules/:id` - Delete a rule

### System Operations

**GET** `/api/system/analyze` - Analyze text input
**POST** `/api/system/execute` - Execute system with input
**GET** `/api/system/performance` - Get performance metrics

## 💡 Usage Examples

### Example 1: Customer Support System

```bash
npm run generate -- \
  --domain "customer-support" \
  --description "Handle customer inquiries, process returns, and provide product information" \
  --examples "Where is my order?,I want to return this item,Tell me about your warranty policy"
```

### Example 2: FAQ System

```typescript
import { SystemGenerator } from './src/generators/systemGenerator';
import { AIEngine } from './src/ai/engine';

const generator = new SystemGenerator(new AIEngine());

const system = await generator.generateSystem({
  domain: 'product-faq',
  requirements: 'Answer frequently asked questions about products',
  examples: [
    'What are the dimensions?',
    'Is this dishwasher safe?',
    'What materials is this made from?'
  ],
  style: {
    formality: 'casual',
    verbosity: 'concise',
    tone: 'friendly'
  }
});
```

### Example 3: Processing Text Input

```typescript
import { NLPProcessor } from './src/nlp/processor';

const processor = new NLPProcessor();

const result = await processor.analyze("I'm having trouble with my recent order");

console.log(result.intents);   // ['inquiry', 'problem']
console.log(result.entities);  // [{ name: 'order', type: 'product' }]
console.log(result.sentiment); // 'negative'
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run specific tests:

```bash
# Unit tests
npm test -- --testPathPattern=unit

# Integration tests
npm test -- --testPathPattern=integration
```

## 📊 Performance Monitoring

The system includes built-in performance monitoring:

- **Response Time**: Average processing time
- **Accuracy**: Rule matching accuracy
- **Confidence**: Average confidence scores
- **Throughput**: Requests per second

Access metrics via:

```bash
curl http://localhost:3000/api/system/performance
```

## 🔧 Configuration

Create a `config/production.json` file for production settings:

```json
{
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "maxTokens": 2000
  },
  "nlp": {
    "language": "en",
    "confidenceThreshold": 0.7
  },
  "performance": {
    "enableMetrics": true,
    "logLevel": "info"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://github.com/yourusername/rule-based-logic-system/wiki)
- [API Reference](https://github.com/yourusername/rule-based-logic-system/blob/main/docs/api.md)
- [Examples](https://github.com/yourusername/rule-based-logic-system/tree/main/examples)
- [Contributing Guidelines](https://github.com/yourusername/rule-based-logic-system/blob/main/CONTRIBUTING.md)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [FAQ](https://github.com/yourusername/rule-based-logic-system/wiki/FAQ)
2. Search [existing issues](https://github.com/yourusername/rule-based-logic-system/issues)
3. Create a [new issue](https://github.com/yourusername/rule-based-logic-system/issues/new)

---

**Built with ❤️ for automated intelligent systems creation**