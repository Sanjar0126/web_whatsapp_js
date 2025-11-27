import { WhatsappService } from "../genproto/whatsapp_service/whatsapp_service_pb.js";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import { ConnectError, Code } from "@connectrpc/connect";
import { obfuscateText } from '../helper/obfuscate.js';

export default async function connectRoutes(fastify, options) {
    fastify.register(fastifyConnectPlugin, {
        jsonOptions: {
            alwaysEmitImplicit: true,
            useProtoFieldName: true,
        },
        routes(router) {
            router.service(WhatsappService, {
                async getWhatsappClientStatus(request, context) {
                    fastify.log.info(
                        `Received GetWhatsappClientStatus: ${request.shipperId}`
                    );

                    var client = fastify.whatsappManager.getClient(request.shipperId);
                    if (!client) {
                        fastify.log.error(`Client ${request.shipperId} not found`);
                        await fastify.whatsappManager.createClient(request.shipperId);
                        client = fastify.whatsappManager.getClient(request.shipperId);
                        if (!client) {
                            fastify.log.error(`Client ${request.shipperId} not found`);
                            throw new ConnectError(
                                `Client ${request.shipperId} not found`,
                                Code.NotFound
                            );
                        }
                    }

                    if (!client.getStatus().isReady && !client.getQRCode()) {
                        fastify.log.info(`Waiting for QR code for client ${request.shipperId}...`);
                        await new Promise((resolve) => {
                            const wwebClient = client.getClient();

                            const cleanup = () => {
                                wwebClient.off('qr', onQr);
                                wwebClient.off('ready', onReady);
                                clearTimeout(timeout);
                            };

                            const timeout = setTimeout(() => {
                                cleanup();
                                resolve();
                            }, 20000);

                            const onQr = () => {
                                cleanup();
                                resolve();
                            };

                            const onReady = () => {
                                cleanup();
                                resolve();
                            };

                            wwebClient.on('qr', onQr);
                            wwebClient.on('ready', onReady);
                        });
                    }

                    var clientQrCode = client.getQRCode();

                    return {
                        qr: clientQrCode || "",
                        isReady: client.getStatus().isReady,
                        hasClient: client.getStatus().hasClient
                    }
                },
                async pushWhatsappMessage(request, context) {
                    fastify.log.info(
                        `Received PushWhatsappMessage: ${request.shipperId} ${request.phone}`
                    );

                    const client = fastify.whatsappManager.getClient(request.shipperId);
                    if (!client) {
                        fastify.log.error(`Client ${request.shipperId} not found`);
                        throw new ConnectError(
                            `Client ${request.shipperId} not found`,
                            Code.NotFound
                        );
                    }

                    const status = client.getStatus();
                    if (!status.isReady) {
                        fastify.log.error(`Client ${request.shipperId} is not ready`);
                        throw new ConnectError(
                            `Client ${request.shipperId} is not ready`,
                            Code.FailedPrecondition
                        );
                    }

                    const obfuscatedText = obfuscateText(request.text)

                    try {
                        client.sendMessage(request.phone, obfuscatedText, Math.random() * 10000)
                            .catch(err => fastify.log.error(`Background send failed: ${err.message}`));

                        return {};
                    } catch (err) {
                        fastify.log.error(`Failed to send message: ${err.message}`);

                        throw new ConnectError(
                            "Internal error while sending WhatsApp message",
                            Code.Internal,
                            undefined,
                            err
                        );
                    }
                }
            })
        }
    });
}

