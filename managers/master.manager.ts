import jwt from 'jsonwebtoken'

import Logger from '../utils/logger.util';
import Methods from '../utils/method.util';

export default class MasterManager {

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
}