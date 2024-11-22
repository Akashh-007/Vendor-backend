import dotenv from "dotenv";
import Logger from "../utils/logger.util";
import { Pool, QueryResult } from 'pg';
import { Constants } from "../utils/constants.util";
import { QueryEntity } from "../entities/core/query.entity";

dotenv.config();

const logger: Logger = new Logger();

type ResponseType = {
    command: string,
    insertId: number | null,
    rows: any[],
    rowCount: number,
    oid: null | number,
    message: string,
    info: string,
    startDT: Date,
    endDT: Date,
    status: number,
    tat: number,
}

// PostgreSQL database connection information
const dbConfig = {
    host: process.env.SQL_DB_HOST_IP,
    port: Number(process.env.SQL_DB_PORT),
    database: process.env.USERS_DB_NAME,
    user: process.env.SQL_DB_USER,
    password: process.env.SQL_DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false // Use true with proper SSL certificates in production
    }
};

// Create a connection pool
logger.info("DB Connection Pool: Starting: DB Name :: " + JSON.stringify(dbConfig.database), 'DB CONN POOL');
export const usersDBPool = new Pool(dbConfig);
logger.info("DB Connection Pool: Success", 'DB CONN POOL');

export default class SQLMaster {
    autoCommit = true;

    // Method to execute a query
    async executeQuery(query: string, args: any[]): Promise<ResponseType> {
        let startMS = new Date().getTime();
        let queryModel: ResponseType = { ...QueryEntity };

        try {
            const result = await usersDBPool.query(query, args);
            queryModel.status = Constants.SUCCESS;
            queryModel.info = "SUCCESS";
            queryModel.command = result.command;
            queryModel.oid = result.oid;

            if (Array.isArray(result.rows)) {
                queryModel.rowCount = result.rowCount;
                queryModel.rows = result.rows;

                // Check if this was an INSERT statement
                if (query.startsWith("INSERT")) {
                    queryModel.insertId = result.rows[0].id;
                    queryModel.info += `: Inserted Row ID: ${queryModel.insertId}`;
                }

                queryModel.info += `: Fetched Rows: ${queryModel.rowCount}`;
            }

            queryModel.tat = (new Date().getTime() - startMS) / 1000;
            return queryModel;
        } catch (err) {
            const errorCode = err.code;
            const errorMessage = err.message;
            logger.error(`DB: ERROR on query: ${query} - Error Code: ${errorCode}, Message: ${errorMessage}`, 'SQLMaster : executeQuery');

            queryModel.status = Constants.DB_QUERY_ERROR;
            queryModel.info = `DB: executeQuery(): ERROR Code: ${errorCode}, Message: ${errorMessage}`;
            throw queryModel;
        }
    }
}
