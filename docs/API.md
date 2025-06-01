# API Documentation

## Overview

This document provides detailed information about the REST API endpoints available in the Automated Intelligent Language Systems Creation Tool.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. In production, implement appropriate authentication mechanisms.

## Endpoints

### System Operations

#### Generate System

**POST** `/system/generate`

Generates a new intelligent language system based on provided requirements.

**Request Body:**

```json
{
  "domain": "string (required)",
  "requirements": "string (required)", 
  "examples": ["string array (required)"],
  "constraints": {
    "maxRules": "number (optional, default: 100)",
    "minConfidence": "number (optional, default: 0.7)",
    "allowedIntents": ["string array (optional)"],
    "forbiddenPatterns": ["string array (optional)"]
  },
  "style": {
    "formality": "formal|casual|technical (optional, default: professional)",
    "verbosity": "concise|detailed|verbose (optional, default: detailed)",
    "tone": "professional|friendly|neutral (optional, default: professional)"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string", 
    "domain": "string",
    "rules": [/* array of IntelligentRule objects */],
    "entities": [/* array of Entity objects */],
    "intents": [/* array of Intent objects */],
    "vocabulary": {/* Vocabulary object */},
    "metadata": {/* SystemMetadata object */}
  }
}
```

#### Analyze Text

**POST** `/system/analyze`

Analyzes input text to extract entities, intents, and patterns.

**Request Body:**

```json
{
  "text": "string (required)",
  "context": {
    "domain": "string (optional)",
    "user": {/* UserContext object (optional) */},
    "session": {/* SessionContext object (optional) */}
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "entities": [/* array of extracted entities */],
    "intents": [/* array of detected intents */],
    "patterns": [/* array of identified patterns */],
    "vocabulary": {/* relevant vocabulary */},
    "confidence": "number",
    "recommendations": [/* array of recommendation strings */]
  }
}
```

#### Execute System

**POST** `/system/execute`

Executes a language system with provided input.

**Request Body:**

```json
{
  "systemId": "string (required)",
  "input": "string (required)",
  "context": {/* Context object (optional) */}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "string",
    "matchedRules": [/* array of matched rule IDs */],
    "confidence": "number",
    "executionTime": "number (milliseconds)",
    "metadata": {/* execution metadata */}
  }
}
```

### Rule Management

#### List Rules

**GET** `/rules`

Retrieves all rules in the system.

**Query Parameters:**

- `domain` (optional): Filter by domain
- `confidence` (optional): Minimum confidence threshold
- `limit` (optional): Maximum number of results
- `offset` (optional): Pagination offset

**Response:**

```json
{
  "success": true,
  "data": {
    "rules": [/* array of Rule objects */],
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

#### Create Rule

**POST** `/rules`

Creates a new rule in the system.

**Request Body:**

```json
{
  "name": "string (required)",
  "condition": {
    "type": "simple|complex|nlp (required)",
    "expression": "string (required)",
    "entities": ["string array (optional)"],
    "intents": ["string array (optional)"],
    "patterns": ["string array (optional)"]
  },
  "action": {
    "type": "response|function|redirect|api (required)",
    "target": "string (required)",
    "parameters": {/* object (optional) */},
    "template": "string (optional)"
  },
  "confidence": "number (required, 0-1)",
  "priority": "number (required)",
  "naturalLanguage": "string (required)"
}
```

#### Get Rule

**GET** `/rules/:id`

Retrieves a specific rule by ID.

#### Update Rule

**PUT** `/rules/:id`

Updates an existing rule.

#### Delete Rule

**DELETE** `/rules/:id`

Deletes a rule from the system.

### Performance Monitoring

#### Get Performance Metrics

**GET** `/system/performance`

Retrieves system performance metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "accuracy": "number",
    "precision": "number", 
    "recall": "number",
    "f1Score": "number",
    "responseTime": "number",
    "totalRequests": "number",
    "successfulRequests": "number",
    "errorRate": "number"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Requested resource not found
- `INTERNAL_ERROR`: Internal server error
- `AI_SERVICE_ERROR`: AI service unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

API requests are rate limited to:
- 100 requests per minute for generation endpoints
- 1000 requests per minute for query endpoints

## Examples

See the main README.md file for detailed usage examples.
