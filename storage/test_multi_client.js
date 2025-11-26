import WhatsAppClientManager from '../wweb/clientManager.js';
import { connectDB } from './connection.js';
import WhatsappClientModel from '../models/whatsapp_client.js';

const mockLogger = {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg) => console.error('[ERROR]', msg),
};

async function test() {
    try {
        await connectDB();

        const manager = new WhatsAppClientManager(mockLogger);
        await manager.initialize();

        const clientId = 'test-client-' + Date.now();
        console.log(`Creating client: ${clientId}`);

        await manager.createClient(clientId);

        const clients = manager.getAllClients();
        console.log('Active clients:', clients);

        if (clients.includes(clientId)) {
            console.log('Client creation verified in memory');
        } else {
            console.error('Client creation failed in memory');
        }

        const dbClient = await WhatsappClientModel.findOne({ client_id: clientId });
        if (dbClient) {
            console.log('Client persistence verified in DB');
        } else {
            console.error('Client persistence failed in DB');
        }

        // Cleanup
        await manager.removeClient(clientId);
        console.log('Client removed');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
