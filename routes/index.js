import wwebAPIRoutes from './wweb.js';

export default async function routes(fastify, options) {
    // Register API routes under /api prefix
    fastify.register(wwebAPIRoutes, { prefix: '/whatsapp' });
}
