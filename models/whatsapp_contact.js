import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const contactSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    client_id: {
        type: String,
    },
    number: {
        type: String,
    }
}, {
    collection: 'whatsapp_contacts',
    timestamps: true
});

const WhatsappContact = mongoose.model('WhatsappContact', contactSchema);

export default WhatsappContact;
