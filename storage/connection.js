import mongoose from "mongoose";
import { config } from "../config/config.js";

async function connectDB() {
    /** @type {import('mongoose').ConnectOptions} */
    const options = {};

    let mongoDBUrl;
    if (config.nodeEnv === 'development') {
        mongoDBUrl = `mongodb://${config.mongodbHost}:${config.mongodbPort}/${config.mongodbDatabase}`;
    } else {
        mongoDBUrl = `mongodb://${config.mongodbUser}:${config.mongodbPassword}@${config.mongodbHost}:${config.mongodbPort}/${config.mongodbDatabase}`;
        options.useNewUrlParser = true;
        options.useUnifiedTopology = true;
    }

    console.log("Connecting to database...", mongoDBUrl);

    try {
        await mongoose.connect(mongoDBUrl, options);
        console.log("Connected to database");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

export { connectDB };
