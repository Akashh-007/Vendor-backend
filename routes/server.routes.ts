import { Router, Request, Response } from "express";
import { VendorController } from "../controllers/v1/api/vendor.controller";

export class Routes {
    public router: Router;
    private vendorController: VendorController;

    constructor() {
        this.router = Router();
        this.vendorController = new VendorController();
        this.routes();  // Changed from initializeRoutes() to routes()
    }

    private routes(): void {  // Changed method name to match what's expected
        // Vendor routes
        this.router.post(
            "/vendor",
            async (req: Request, res: Response) => {
                await this.vendorController.createVendor(req, res);
            }
        );
    }
}