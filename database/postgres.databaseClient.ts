import dotenv from "dotenv";
import Logger from "../utils/logger.util";
import { Client } from "pg";
import { Constants } from "../utils/constants.util";
import { QueryEntity } from "../entities/core/query.entity";

dotenv.config();

const logger = new Logger();

// PostgreSQL database connection information
const dbConfig = {
    host: process.env.SQL_DB_HOST_IP,
    port: Number(process.env.SQL_DB_PORT),
    database: process.env.USERS_DB_NAME,
    user: process.env.SQL_DB_USER,
    password: process.env.SQL_DB_PASSWORD,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
};

// Type definition for query response
type ResponseType = {
    command: string;
    insertId: number | null;
    rows: any[];
    rowCount: number;
    oid: number | null;
    message: string;
    info: string;
    startDT: Date;
    endDT: Date;
    status: number;
    tat: number;
};

// Logger initialization
logger.info("DB Connection: Preparing to connect to database.", "DB Connection");

export default class SQLMaster {
    // Method to acquire a single client and connect to the database
    async getClient(): Promise<Client> {
        const client = new Client(dbConfig);
        try {
            await client.connect();
            logger.info("Database client successfully connected", "SQLMaster:getClient");
            return client;
        } catch (err) {
            logger.error(`Failed to connect to the database: ${err.message}`, "SQLMaster:getClient");
            throw err;
        }
    }

    // Method to execute a query
    async executeQuery(query: string, args: any[]): Promise<ResponseType> {
        const client = await this.getClient(); // Get a connected client
        const startMS = new Date().getTime();

        // Initialize query response model
        const queryModel: ResponseType = { ...QueryEntity };
        try {
            const result = await client.query(query, args);

            // Populate the query response
            queryModel.command = result.command;
            queryModel.rows = result.rows || [];
            queryModel.rowCount = result.rowCount || 0;
            queryModel.oid = result.oid || null;
            queryModel.message = "Query executed successfully";
            queryModel.status = Constants.SUCCESS;

            if (result.rows?.length && query.trim().toUpperCase().startsWith("INSERT")) {
                queryModel.insertId = result.rows[0].id || null;
                queryModel.info = `Inserted Row ID: ${queryModel.insertId}`;
            } else {
                queryModel.info = `Fetched Rows: ${queryModel.rowCount}`;
            }

            queryModel.endDT = new Date();
            queryModel.tat = (queryModel.endDT.getTime() - startMS) / 1000;

            return queryModel;
        } catch (err) {
            logger.error(`Error executing query: ${query} - ${err.message}`, "SQLMaster:executeQuery");
            queryModel.message = "Query execution failed";
            queryModel.info = err.message;
            queryModel.status = Constants.DB_QUERY_ERROR;
            throw queryModel;
        } finally {
            // Always release the client
            await client.end();
            logger.info("Database client disconnected", "SQLMaster:executeQuery");
        }
    }
}
