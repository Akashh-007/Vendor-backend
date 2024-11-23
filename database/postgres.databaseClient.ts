import dotenv from "dotenv";
import Logger from "../utils/logger.util";
import pg from "pg";
const { Client } = pg;
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
    // idleTimeoutMillis: 30000,
    // connectionTimeoutMillis: 2000,
    // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    ssl: {
        rejectUnauthorized: false // Only use this in development! For production, use proper SSL certificates
    }
};

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

export default class SQLMaster {
    private client: any = null;

    // Get a new client connection
    async getClient() {
        try {
            const client = new Client(dbConfig);
            await client.connect();
            this.client = client;
            logger.info("Database client successfully connected", "SQLMaster:getClient");
            return client;
        } catch (err) {
            logger.error(`Failed to connect to the database: ${err.message}`, "SQLMaster:getClient");
            throw err;
        }
    }

    // Begin a transaction
    async beginTransaction(): Promise<void> {
        if (!this.client) {
            throw new Error("No client connection available");
        }
        await this.client.query('BEGIN');
        logger.info("Transaction started", "SQLMaster:beginTransaction");
    }

    // Commit a transaction
    async commitTransaction(): Promise<void> {
        if (!this.client) {
            throw new Error("No client connection available");
        }
        await this.client.query('COMMIT');
        logger.info("Transaction committed", "SQLMaster:commitTransaction");
    }

    // Rollback a transaction
    async rollbackTransaction(): Promise<void> {
        if (!this.client) {
            throw new Error("No client connection available");
        }
        await this.client.query('ROLLBACK');
        logger.info("Transaction rolled back", "SQLMaster:rollbackTransaction");
    }

    // Execute a query within the transaction
    async executeTransactionQuery(query: string, args: any[]): Promise<ResponseType> {
        if (!this.client) {
            throw new Error("No client connection available");
        }

        const startMS = new Date().getTime();
        const queryModel: ResponseType = { ...QueryEntity };

        try {
            const result = await this.client.query(query, args);

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
            logger.error(`Error executing query: ${query} - ${err.message}`, "SQLMaster:executeTransactionQuery");
            queryModel.message = "Query execution failed";
            queryModel.info = err.message;
            queryModel.status = Constants.DB_QUERY_ERROR;
            throw queryModel;
        }
    }

    // Close the client connection
    async closeConnection(): Promise<void> {
        if (this.client) {
            await this.client.end();
            this.client = null;
            logger.info("Database client connection closed", "SQLMaster:closeConnection");
        }
    }
}