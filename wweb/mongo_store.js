import fs from 'fs';

class MongoStore {
    /** @param {{ mongoose: import('mongoose').Mongoose }} options */
    constructor({ mongoose } = {}) {
        if (!mongoose) throw new Error('A valid Mongoose instance is required for MongoStore.');
        this.mongoose = mongoose;
    }

    /** @param {{ session: string }} options */
    async sessionExists(options) {
        let multiDeviceCollection = this.mongoose.connection.db.collection('whatsapp-session.files');
        let hasExistingSession = await multiDeviceCollection.countDocuments({ filename: `${options.session}.zip` });
        return !!hasExistingSession;
    }

    /** @param {{ session: string, path: string }} options */
    async save(options) {
        var bucket = new this.mongoose.mongo.GridFSBucket(this.mongoose.connection.db, {
            bucketName: 'whatsapp-session'
        });
        await new Promise((resolve, reject) => {
            fs.createReadStream(`${options.session}.zip`)
                .pipe(bucket.openUploadStream(`${options.session}.zip`, {
                    metadata: {
                        client_id: options.session
                    }
                }))
                .on('error', err => reject(err))
                .on('close', () => resolve());
        });
        options.bucket = bucket;
        await this.#deletePrevious(options);
    }

    /** @param {{ session: string, path: string }} options */
    async extract(options) {
        var bucket = new this.mongoose.mongo.GridFSBucket(this.mongoose.connection.db, {
            bucketName: 'whatsapp-session'
        });
        return new Promise((resolve, reject) => {
            bucket.openDownloadStreamByName(`${options.session}.zip`)
                .pipe(fs.createWriteStream(options.path))
                .on('error', err => reject(err))
                .on('close', () => resolve());
        });
    }

    /** @param {{ session: string }} options */
    async delete(options) {
        var bucket = new this.mongoose.mongo.GridFSBucket(this.mongoose.connection.db, {
            bucketName: 'whatsapp-session'
        });
        const documents = await bucket.find({
            filename: `${options.session}.zip`
        }).toArray();

        documents.map(async doc => {
            return bucket.delete(doc._id);
        });
    }

    /** @param {{ bucket: import('mongoose').GridFSBucket, session: string }} options */
    async #deletePrevious(options) {
        const documents = await options.bucket.find({
            filename: `${options.session}.zip`
        }).toArray();
        if (documents.length > 1) {
            const oldSession = documents.reduce((a, b) => a.uploadDate < b.uploadDate ? a : b);
            return options.bucket.delete(oldSession._id);
        }
    }
}

export default MongoStore;