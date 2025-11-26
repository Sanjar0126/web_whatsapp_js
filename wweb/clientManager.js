import WhatsAppClient from './client.js';
import WhatsappClientModel from '../models/whatsapp_client.js';

class WhatsAppClientManager {
    /** @param {import('pino').Logger} logger */
    constructor(logger) {
        this.logger = logger;
        /** @type {Map<string, WhatsAppClient>} */
        this.clients = new Map();
    }

    /** @returns {Promise<void>} */
    async initialize() {
        this.logger.info('Initializing WhatsApp Client Manager...');
        try {
            const savedClients = await WhatsappClientModel.find({});
            for (const clientDoc of savedClients) {
                this.logger.info(`Restoring client: ${clientDoc.client_id}`);
                await this.createClient(clientDoc.client_id, false);
            }
        } catch (error) {
            this.logger.error(`Failed to restore clients: ${error.message}`);
        }
    }

    /** @param {string} clientId @param {boolean} saveToDb */
    async createClient(clientId, saveToDb = true) {
        if (this.clients.has(clientId)) {
            return this.clients.get(clientId);
        }

        if (saveToDb) {
            try {
                const existing = await WhatsappClientModel.findOne({ client_id: clientId });
                if (!existing) {
                    await WhatsappClientModel.create({
                        client_id: clientId,
                        number: 'pending'
                    });
                }
            } catch (error) {
                this.logger.error(`Failed to save client to DB: ${error.message}`);
                throw error;
            }
        }

        const client = new WhatsAppClient(this.logger, clientId);
        client.initialize();
        this.clients.set(clientId, client);
        return client;
    }

    /** @param {string} clientId */
    getClient(clientId) {
        return this.clients.get(clientId);
    }

    /** @returns {string[]} */
    getAllClients() {
        return Array.from(this.clients.keys());
    }

    /** @param {string} clientId */
    async removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            await client.store.delete({ session: clientId });
            this.clients.delete(clientId);
            await WhatsappClientModel.deleteOne({ client_id: clientId });
        }
    }
}

export default WhatsAppClientManager;
