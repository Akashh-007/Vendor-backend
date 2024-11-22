import { Request, Response, NextFunction } from "express";
import { Constants } from "../utils/constants.util";
import Logger from "../utils/logger.util";
import { ResponseEntity } from "../entities/core/response.entity";

export class AuthMiddleware {
    private logger: Logger;

    constructor() {
        this.logger = new Logger();

        // bindings
        this.checkAuth = this.checkAuth.bind(this);
    }

    public async checkAuth(req: Request, res: Response, next: NextFunction) {
        let resModel = {...ResponseEntity}
        const startMS = new Date().getTime();

        try {
            const authHeaders = req.headers['authorization']
            const clientAccessToken = authHeaders && authHeaders.split(' ')[1]
            // const clientAccessToken = req.cookies['accessToken'];

            if (!clientAccessToken) {
                resModel.status = Constants.AUTH_KEY_NOT_PASSED;
                resModel.info = "ERROR: AUTH error: SUCCESS: 0, status: UNAUTHORIZED"
                resModel.endDT = new Date();
                resModel.tat = (new Date().getTime() - startMS) / 1000;

                return res.status(Constants.HTTP_UNAUTHORIZED).json(resModel);
            }

            res.locals.accessToken = clientAccessToken

            next();
        } catch (error) {
            this.logger.error(error, "checkAuth: Middleware")
            resModel.status = Constants.AUTH_ERROR
            resModel.info = "ERROR: AUTH error: SUCCESS: 0, status: UNAUTHORIZED"
            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            resModel.info = error;
            return res.status(Constants.HTTP_UNAUTHORIZED).json(resModel);
        }
    }
}