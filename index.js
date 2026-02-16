import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import routes from './routes/index.js';
import { config } from './config/config.js';
import WhatsAppClientManager from './wweb/clientManager.js';
import fs from 'fs/promises';
import path from 'path';
import { connectDB } from './storage/connection.js';

const cacheDir = path.join(process.cwd(), '.wwebjs_cache');

async function clearCache() {
    try {
        const files = await fs.readdir(cacheDir);
        await Promise.all(
            files.map(file => fs.rm(path.join(cacheDir, file), { recursive: true, force: true }))
        );
        console.log('Cleared .wwebjs_cache folder contents');
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to clear .wwebjs_cache:', err.message);
        }
    }
}


const fastify = Fastify({
    http2: true, // for connect-rpc
    logger: {
        level: config.logLevel,
        // pino-pretty is commented, because it is not being downloaded in dockerfile
        // transport: {
        //     target: 'pino-pretty',
        //     options: {
        //         translateTime: 'HH:MM:ss Z',
        //         ignore: 'pid,hostname',
        //         singleLine: true
        //     },
        // }
    }
});

await fastify.register(helmet, {
    contentSecurityPolicy: false,
});

await fastify.register(cors, {
    origin: config.corsOrigin,
});

await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
});

// Register routes
await fastify.register(routes);

fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
        statusCode: error.statusCode || 500,
    });
});

const start = async () => {
    try {
        await clearCache();
        await connectDB();

        fastify.log.info(`Using ${config.authStrategy} auth strategy for WhatsApp clients`);
        const whatsappManager = new WhatsAppClientManager(fastify.log, config.authStrategy);
        await whatsappManager.initialize();

        fastify.decorate('whatsappManager', whatsappManager);

        await fastify.listen({
            port: config.port,
            host: config.host,
        });
        fastify.log.info(`Server listening on ${config.host}:${config.port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
