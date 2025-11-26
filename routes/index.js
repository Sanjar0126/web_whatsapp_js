import wwebAPIRoutes from './wweb.js';
import connectRoutes from '../connect-rpc/whatsapp_service.js';

export default async function routes(fastify, options) {
    fastify.register(wwebAPIRoutes, { prefix: '/whatsapp' });

    // Note: Connect handles its own routing paths (e.g. /whatsapp_service.WhatsappService/PushWhatsappMessage)
    fastify.register(connectRoutes);
}
