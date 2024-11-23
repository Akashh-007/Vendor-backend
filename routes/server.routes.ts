import { Router, Request, Response } from "express";
import { VendorController } from "../controllers/v1/api/vendor.controller";
import { UploadController } from "../controllers/v1/api/upload.controller";
import { documentUploadMiddleware } from "../middlewares/upload.middleware";

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

        // Upload route
        this.router.post(
            "/upload-vendor-documents",
            documentUploadMiddleware,
            async (req: Request, res: Response) => {
                await new UploadController().uploadFiles(req, res);
            }
        );
    }
}