import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const clientSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    client_id: {
        type: String,
        unique: true
    },
    number: {
        type: String
    }
}, {
    collection: 'whatsapp_clients',
    timestamps: true
});

const WhatsappClient = mongoose.model('WhatsappClient', clientSchema);

export default WhatsappClient;
