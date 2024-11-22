import jwt from 'jsonwebtoken'

import Logger from '../utils/logger.util';
import Methods from '../utils/method.util';

export default class MasterController {

    protected logger: Logger;
    protected methods: Methods;

    constructor() {
        this.logger = new Logger();
        this.methods = new Methods();
    }

    public verifyKeys = (body: any, data: any) => {
        var result = [];

        for (const key of data) {
            if (!body.hasOwnProperty(key)) {
                result.push("Missing key: {" + key + "} from payload");
            }
        }

        return result;
    }

    public verifyDates = (body: any, data: any) => {
        var result = [];

        for (const key of data) {
            if (body.hasOwnProperty(key)) {
                const value = body[key];

                if (value !== null && isNaN(Date.parse(value))) {
                    result.push(`Invalid date format for key: ${key}`);
                }
            }
        }

        return result;
    }


    public mandatoryFields = (body: any, data: any) => {
        var result = [];

        for (const key of data) {
            if (body[key].length == 0) {
                result.push(key + " is a mandatory field, cannot be empty!");
            }
        }

        return result;
    }


    public validateField = (data) => {
        /** Check if the name is not null, not empty, and starts with an alphabet */
        return typeof data === 'string' && data.trim() !== '' && /^[a-zA-Z][a-zA-Z0-9_-\s]*$/.test(data);
    }

    protected generateJwtToken(payload) {
        const token = jwt.sign(payload, process.env.SECRET_KEY);

        return token;
    }

    public processField = (data) => {
        /** Remove leading and trailing spaces, replace spaces with underscores, and convert to uppercase */
        return data.trim().replace(/\s+/g, '_').replace(/-/g, '_').toUpperCase();
    }
}