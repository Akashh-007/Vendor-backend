import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class AuthRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes(): void {

    // middlewares
    const authMiddleware = new AuthMiddleware();
    
    // controllers

    // auth routes routes
  }
}