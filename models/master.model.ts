import SQLMaster from "../database/postgres.database";
import { QueryEntity } from "../entities/core/query.entity";
import { ResponseEntity } from "../entities/core/response.entity";
import { Constants } from "../utils/constants.util";
import Logger from "../utils/logger.util";
import Methods from "../utils/method.util";

export default class MasterModel {

    protected logger: Logger;
    protected sql: SQLMaster;
    protected methods: Methods;

    constructor() {
        this.sql = new SQLMaster();
        this.logger = new Logger();
        this.methods = new Methods();
    }

    public async createEntity(payload: any, table: string, primary_key: string) {
        const startMS = new Date().getTime();
        const resModel = { ...ResponseEntity }
        let queryModel = { ...QueryEntity }
        let query = "";
        try {
            query = `INSERT INTO user_schema.${table} (${Object.keys(payload)}) VALUES (${Object.values(payload).map(val => `'${this.methods._SQLTEXT_HANDLE(`${val}`)}'`)}) RETURNING ${primary_key} AS id`

            // Execute Query
            queryModel = await this.sql.executeQuery(query, []);

            if (queryModel.status == Constants.SUCCESS) {
                resModel.status = queryModel.status;
                resModel.info =
                    "OK: DB Query: " +
                    queryModel.info +
                    " : " +
                    queryModel.tat +
                    " : " +
                    queryModel.message;
                resModel.data = queryModel;
            } else {
                resModel.status = Constants.ERROR;
                resModel.info = "ERROR: DB Query: " + JSON.stringify(queryModel);
            }
        } catch (error) {
            resModel.status = -33;
            resModel.info = "catch : " + resModel.info + " : " + error;
            console.log(error);
            this.logger.error(JSON.stringify(resModel), `${this.constructor.name} : createEntity : ${table}`);
        } finally {
            resModel.tat = (new Date().getTime() - startMS) / 100;
        }

        return resModel;
    }

    public async updateEntity(table: string, params: any, payload: any) {
        const startMS = new Date().getTime();
        const resModel = { ...ResponseEntity };
        let queryModel = { ...QueryEntity };
        let query = "";
        const values: any[] = [];

        try {
            // Building the UPDATE clause
            query = `UPDATE user_schema.${table} SET `;

            // Add each field to the SET clause with placeholders
            Object.keys(payload).forEach((field, index) => {
                query += `${field} = $${index + 1}, `;
                values.push(payload[field]);
            });

            // Remove trailing comma and space from the SET clause
            query = this.methods.rtrim(query, ", ");

            // Building the WHERE clause
            const paramStartIndex = values.length + 1; // Start from the next placeholder index
            query += ' WHERE ';

            Object.entries(params).forEach(([key, value], index) => {
                query += `${key} = $${paramStartIndex + index} AND `;
                values.push(value);
            });

            // Remove trailing AND from the WHERE clause
            query = this.methods.rtrim(query, " AND");

            // Execute the query with parameters
            queryModel = await this.sql.executeQuery(query, values);

            if (queryModel.status === Constants.SUCCESS) {
                resModel.status = queryModel.status;
                resModel.info =
                    "OK: DB Query: " +
                    queryModel.info +
                    " : " +
                    queryModel.tat +
                    " : " +
                    queryModel.message;
                resModel.data = queryModel;
            } else {
                resModel.status = Constants.ERROR;
                resModel.info = "ERROR: DB Query: " + JSON.stringify(queryModel);
            }
        } catch (error) {
            resModel.status = -33;
            resModel.info = "catch : " + resModel.info + " : " + error;
            console.log(error);
            this.logger.error(JSON.stringify(resModel), `${this.constructor.name} : updateEntity : ${table}`);
        } finally {
            resModel.tat = (new Date().getTime() - startMS) / 100;
        }

        return resModel;
    }


    public async beginTransaction() {
        try {
            await this.sql.executeQuery("BEGIN", []);
        } catch (error) {
            this.logger.error(`Error starting transaction: ${error}`, `${this.constructor.name} : beginTransaction`);
            throw error;
        }
    }

    public async commitTransaction() {
        try {
            await this.sql.executeQuery("COMMIT", []);
        } catch (error) {
            this.logger.error(`Error committing transaction: ${error}`, `${this.constructor.name} : commitTransaction`);
            throw error;
        }
    }

    public async rollbackTransaction() {
        try {
            await this.sql.executeQuery("ROLLBACK", []);
        } catch (error) {
            this.logger.error(`Error rolling back transaction: ${error}`, `${this.constructor.name} : rollbackTransaction`);
            throw error;
        }
    }

    public async createMultipleEntities(entities: any[], table: string) {
        const startMS = new Date().getTime();
        const resModel = { ...ResponseEntity }
        let queryModel = { ...QueryEntity }
        let query = "";
        try {

            if (entities.length === 0) {
                resModel.status = Constants.ERROR;
                resModel.info = "ERROR: DB Query: " + JSON.stringify(queryModel);
            }

            const fields = Object.keys(entities[0]); // Assuming all entities have the same fields

            query = `INSERT INTO ${table} (`;
            for (const field of fields) {
                query += "`" + field + "`, ";
            }
            query = this.methods.rtrim(query, ", ") + ") ";
            query += "VALUES ";

            const values = [];
            entities.forEach(entity => {
                const rowValues = Object.values(entity).map(value => {
                    if (value == null) {
                        return null;
                    } else {
                        return (typeof value === "object" ? JSON.stringify(value) : value);
                    }
                });
                query += "(" + rowValues.map(() => "?").join(", ") + "), ";
                values.push(...rowValues);
            });

            query = this.methods.rtrim(query, ", ") + ";";

            // Execute Query
            queryModel = await this.sql.executeQuery(query, values);

            if (queryModel.status == Constants.SUCCESS) {
                resModel.status = queryModel.status;
                resModel.info =
                    "OK: DB Query: " +
                    queryModel.info +
                    " : " +
                    queryModel.tat +
                    " : " + 
                    queryModel.message;
                resModel.data = queryModel;
            } else {
                resModel.status = Constants.ERROR;
                resModel.info = "ERROR: DB Query: " + JSON.stringify(queryModel);
            }

        } catch (error) {
            resModel.status = -33;
            resModel.info = "catch : " + resModel.info + " : " + error;
            this.logger.error(JSON.stringify(resModel), 'createMultipleEntities : model');
        } finally {
            try {
                resModel.tat = (new Date().getTime() - startMS) / 100;
            } catch (error) {
                this.logger.error(error, "createMultipleEntities : model")
                throw new Error(`${error}`);
            }
        }

        return resModel;
    }


}
