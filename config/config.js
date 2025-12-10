import dotenv from 'dotenv';

// Load environment variables once at module initialization
dotenv.config();

export const config = {
    port: process.env.PORT || 8008,
    host: process.env.HOST || '0.0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    nodeEnv: process.env.NODE_ENV || 'development',

    mongodbHost: process.env.MONGODB_HOST || '127.0.0.1',
    mongodbPort: process.env.MONGODB_PORT || '27017',
    mongodbUser: process.env.MONGODB_USER || '',
    mongodbPassword: process.env.MONGODB_PASSWORD || '',
    mongodbDatabase: process.env.MONGODB_DATABASE || 'whatsapp_integration',
};
