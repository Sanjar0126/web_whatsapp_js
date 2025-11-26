import WhatsAppClientManager from '../wweb/clientManager.js';

/**
 * @param {import('fastify').FastifyInstance & {whatsappManager: WhatsAppClientManager}} fastify
 */
export default async function wwebAPIRoutes(fastify, options) {
    // POST /clients - Create a new client
    fastify.post('/clients', {
        schema: {
            body: {
                type: 'object',
                required: ['client_id'],
                properties: {
                    client_id: { type: 'string', minLength: 1 }
                }
            }
        },
        handler: async (request, reply) => {
            const { client_id } = request.body;
            try {
                await fastify.whatsappManager.createClient(client_id);
                return { success: true, message: `Client ${client_id} created/started` };
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Failed to create client', details: error.message });
            }
        }
    });

    // GET /clients - List all clients
    fastify.get('/clients', async (request, reply) => {
        const clients = fastify.whatsappManager.getAllClients();
        return { clients };
    });

    // POST /send-message
    fastify.post('/send-message', {
        schema: {
            body: {
                type: 'object',
                required: ['receiver_id', 'message', 'client_id'],
                properties: {
                    client_id: { type: 'string' },
                    receiver_id: {
                        type: 'string',
                        description: 'Phone number or chat ID with @c.us'
                    },
                    message: {
                        type: 'string',
                        minLength: 1
                    },
                },
            },
        },
        handler: async (request, reply) => {
            const { receiver_id, message, client_id } = request.body;

            const client = fastify.whatsappManager.getClient(client_id);
            if (!client) {
                return reply.status(404).send({ error: `Client ${client_id} not found` });
            }

            const status = client.getStatus();
            if (!status.isReady) {
                return reply.status(503).send({
                    error: 'WhatsApp client is not ready yet. Please wait for QR code scan or initialization.',
                    status: status
                });
            }

            try {
                var response = await client.sendMessage(receiver_id, message, Math.random() * 5000);
                return {
                    success: true,
                    message: 'Message sent successfully',
                    data: {
                        receiver_id,
                        timestamp: new Date().toISOString(),
                        messageId: response.id._serialized
                    }
                };
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: 'Failed to send message',
                    details: error.message
                });
            }
        },
    });

    // GET /status
    fastify.get('/status', {
        schema: {
            querystring: {
                type: 'object',
                required: ['client_id'],
                properties: {
                    client_id: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            const { client_id } = request.query;
            const client = fastify.whatsappManager.getClient(client_id);

            if (!client) {
                return reply.status(404).send({ error: `Client ${client_id} not found` });
            }

            const status = client.getStatus();
            return {
                ...status,
                timestamp: new Date().toISOString()
            };
        }
    });

    // GET /qr
    fastify.get('/qr', {
        schema: {
            querystring: {
                type: 'object',
                required: ['client_id'],
                properties: {
                    client_id: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            const { client_id } = request.query;
            const client = fastify.whatsappManager.getClient(client_id);

            if (!client) {
                return reply.status(404).send({ error: `Client ${client_id} not found` });
            }

            const qrCode = client.getQRCode();

            if (!qrCode) {
                return reply.status(404).send({
                    error: 'No QR code available',
                    message: 'Either the client is already authenticated or QR code has not been generated yet'
                });
            }

            return {
                qr: qrCode,
                timestamp: new Date().toISOString()
            };
        }
    });

    // GET /qr-page
    fastify.get('/qr-page', {
        schema: {
            querystring: {
                type: 'object',
                required: ['client_id'],
                properties: {
                    client_id: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            const { client_id } = request.query;
            const client = fastify.whatsappManager.getClient(client_id);

            if (!client) {
                return reply.status(404).send(`Client ${client_id} not found`);
            }

            const qrCode = client.getQRCode();
            const status = client.getStatus();

            if (status.isReady) {
                reply.type('text/html');
                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>WhatsApp QR Code - ${client_id}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            }
                            .container {
                                text-align: center;
                                background: white;
                                padding: 40px;
                                border-radius: 20px;
                                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            }
                            h1 { color: #128C7E; margin-bottom: 20px; }
                            .success { color: #25D366; font-size: 18px; }
                            .icon { font-size: 64px; margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>WhatsApp Connected!</h1>
                            <p class="success">Client <strong>${client_id}</strong> is already authenticated and ready to use.</p>
                        </div>
                    </body>
                    </html>
                `;
            }

            if (!qrCode) {
                reply.type('text/html');
                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>WhatsApp QR Code - ${client_id}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            }
                            .container {
                                text-align: center;
                                background: white;
                                padding: 40px;
                                border-radius: 20px;
                                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            }
                            h1 { color: #128C7E; margin-bottom: 20px; }
                            .loading { color: #666; font-size: 18px; }
                            .spinner {
                                border: 4px solid #f3f3f3;
                                border-top: 4px solid #25D366;
                                border-radius: 50%;
                                width: 50px;
                                height: 50px;
                                animation: spin 1s linear infinite;
                                margin: 20px auto;
                            }
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                        <script>
                            setTimeout(() => window.location.reload(), 2000);
                        </script>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Waiting for QR Code...</h1>
                            <div class="spinner"></div>
                            <p class="loading">Initializing WhatsApp client <strong>${client_id}</strong>...</p>
                        </div>
                    </body>
                    </html>
                `;
            }

            const QRCode = await import('qrcode');
            const qrDataUrl = await QRCode.default.toDataURL(qrCode);

            reply.type('text/html');
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp QR Code - ${client_id}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            max-width: 500px;
                        }
                        h1 {
                            color: #128C7E;
                            margin-bottom: 10px;
                        }
                        .instructions {
                            color: #666;
                            margin-bottom: 30px;
                            line-height: 1.6;
                        }
                        .qr-container {
                            background: white;
                            padding: 20px;
                            border-radius: 10px;
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        }
                        img {
                            display: block;
                            width: 300px;
                            height: 300px;
                        }
                        .steps {
                            text-align: left;
                            margin-top: 30px;
                            background: #f5f5f5;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        .steps ol {
                            margin: 10px 0;
                            padding-left: 20px;
                        }
                        .steps li {
                            margin: 8px 0;
                            color: #333;
                        }
                        .auto-refresh {
                            margin-top: 20px;
                            color: #999;
                            font-size: 14px;
                        }
                    </style>
                    <script>
                        // Auto refresh every 5 seconds to check if authenticated
                        setTimeout(() => window.location.reload(), 5000);
                    </script>
                </head>
                <body>
                    <div class="container">
                        <h1>Scan QR Code</h1>
                        <p class="instructions">
                            Open WhatsApp on your phone and scan this code to connect client <strong>${client_id}</strong>
                        </p>
                        
                        <div class="qr-container">
                            <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
                        </div>

                        <div class="steps">
                            <strong>How to scan:</strong>
                            <ol>
                                <li>Open WhatsApp on your phone</li>
                                <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
                                <li>Select <strong>Linked Devices</strong></li>
                                <li>Tap <strong>Link a Device</strong></li>
                                <li>Point your phone at this screen to scan the code</li>
                            </ol>
                        </div>

                        <p class="auto-refresh">⟳ Page will refresh automatically</p>
                    </div>
                </body>
                </html>
            `;
        }
    });
}
