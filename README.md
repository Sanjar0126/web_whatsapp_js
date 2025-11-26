# Fastify App Template

A modern Node.js REST API template built with Fastify.

## Features

- **Fastify** - Fast and low overhead web framework
- **CORS** - Cross-Origin Resource Sharing enabled
- **Rate Limiting** - Built-in rate limiting
- **Logging** - Pino logger with pretty printing
- **Schema Validation** - Request/response validation
- **Configuration** - Environment-based configuration

## Project Structure

```
.
├── config/
│   └── config.js          # Application configuration
├── routes/
│   ├── index.js           # Route registration
│   └── wweb.js             # API endpoints
├── index.js               # Application entry point
├── package.json           # Dependencies and scripts
├── .env.example           # Example environment variables
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 20+ (for native --watch support)
- npm or yarn

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
yarn run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `yarn start` - Start the production server
- `yarn run dev` - Start development server with auto-reload
- `yarn test` - Run tests

## API Endpoints

### Health Check
```
GET /health
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| HOST | Server host | 0.0.0.0 |
| LOG_LEVEL | Logging level | info |
| CORS_ORIGIN | CORS origin | * |
| NODE_ENV | Environment | development |

## License

ISC
