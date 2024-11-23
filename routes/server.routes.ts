import { Router } from "express";
import { AuthMiddleware} from "../middlewares/auth.middleware"
import { VendorController } from "../controllers/v1/api/vendor.controller";
import { UploadController } from "../controllers/v1/api/upload.controller";
import { documentUploadMiddleware } from "../middlewares/upload.middleware";

export class Routes {
    public router: Router;
    

    constructor() {
        this.router = Router();
       
        this.routes();  // Changed from initializeRoutes() to routes()
    }

    private routes(): void {  // Changed method name to match what's expected
        const vendorController = new VendorController();
        const uploadController = new UploadController();
        const authMiddleware = new AuthMiddleware(); 
        // const documentUploadMiddleware = new documentUploadMiddleware();       
        
        // Vendor routes
        this.router.post(`/vendor`, vendorController.createVendor.bind(vendorController));

        // Upload route
        this.router.post(
            "/upload-vendor-documents",
            documentUploadMiddleware,
            uploadController.uploadFiles.bind(uploadController)
        );

        // New routes
        this.router.get('/vendors', vendorController.getAllVendors.bind(vendorController));
        this.router.get('/vendor/:id', vendorController.getVendorById.bind(vendorController));
    }
}