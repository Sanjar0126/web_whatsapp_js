import wwebjs from 'whatsapp-web.js';
import MongoStore from './mongo_store.js';
import mongoose from 'mongoose';
import WhatsappContact from '../models/whatsapp_contact.js';

const { Client, RemoteAuth } = wwebjs;

class WhatsAppClient {
    /**
     * @param {import('pino').Logger} logger 
     * @param {string} clientId 
     */
    constructor(logger, clientId) {
        this.isReady = false;
        this.logger = logger;
        this.clientId = clientId;
        /** @type {string | null} */
        this.qrCode = null;
        /** @type {wwebjs.Client | null} */
        this.client = null;
        /** @type {MongoStore | null} */
        this.store = null;
    }

    /** @returns {Promise<void>} */
    initialize() {
        this.logger.info(`Initializing WhatsApp Client ${this.clientId}...`);

        this.store = new MongoStore({ mongoose: mongoose });

        this.client = new Client({
            authStrategy: new RemoteAuth({
                store: this.store,
                backupSyncIntervalMs: 300000,
                clientId: this.clientId
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.client.on('ready', () => {
            this.logger.info(`WhatsApp Client ${this.clientId} is ready!`);
            this.qrCode = null;
            this.isReady = true;
        });

        this.client.on('remote_session_saved', () => {
            this.logger.info(`Remote session saved for client ${this.clientId}`);
            this.isReady = true;
        })

        this.client.on('qr', qr => {
            this.logger.info(`QR Code received, scan it. for client ${this.clientId}`);
            this.qrCode = qr;
        });

        this.client.on('message_create', async message => {
            if (!message.fromMe) {
                await WhatsappContact.findOneAndUpdate({ client_id: this.clientId, number: message.from }, { number: message.from }, { upsert: true });

                this.logger.info(`Message received: ${message.from}, ${message.body}`);
                switch (message.body.toLowerCase()) {
                    case 'ping':
                        console.log('pong');
                        break;
                    case 'start':
                        this.logger.info('Start command received');
                        break;
                    default:
                        break;
                }
            }
        });

        this.client.initialize();
    }

    /**
     * @async
     * @param {string} receiverId 
     * @param {string} message 
     * @param {number} [delay=0]
     * @returns {Promise<wwebjs.Message>} 
     * @throws {Error} 
     */
    async sendMessage(receiverId, message, delay = 0) {
        if (!this.isReady) {
            throw new Error(`WhatsApp client ${this.clientId} is not ready yet`);
        }

        const chatId = receiverId.includes('@') ? receiverId : `${receiverId}@c.us`; //by phone number > phone@c.us

        const contact = await WhatsappContact.findOne({ client_id: this.clientId, number: chatId });
        if (!contact) {
            throw new Error('Cannot send message to unknown contact');
        }

        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
            const response = await this.client.sendMessage(chatId, message);
            return response;
        } catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    getClient() {
        return this.client;
    }

    getStatus() {
        return {
            isReady: this.isReady,
            hasClient: this.client !== null
        };
    }

    getQRCode() {
        return this.qrCode;
    }
}

export default WhatsAppClient;
