import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { usersDBPool } from "./database/postgres.database";
import { Routes } from "./routes/server.routes";
import Logger from "./utils/logger.util";
import { AuthRoutes } from "./routes/auth.routes";
import multer from 'multer';
dotenv.config();

class App {
  public app: express.Application;
  private readonly SERVER_PORT = process.env.SERVER_PORT || 5001;
  private logger: Logger;  

  constructor() {
    this.app = express();
    this.logger = new Logger();
    this.middlewares();
    this.routes();
    this.initializServer();
  }

  private middlewares(): void {
    usersDBPool;
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // this.app.use(multer().any());
  }

  private routes(): void {
    this.app.use("/api/v1/", new Routes().router);
    this.app.use("/api/v1/auth", new AuthRoutes().router);
  }

  private initializServer() {
    // Start listening on the server (both Express and Socket.IO)
   
    this.app.listen(this.SERVER_PORT, () => {
      // this.logger.info(`Server is running on http://localhost:${this.SERVER_PORT}`, 'App.listen');
      console.log(`Server is running on http://localhost:${this.SERVER_PORT}`);
    });
  }
}

export default new App().app;
