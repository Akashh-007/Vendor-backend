import { Request, Response } from "express";
import { Constants } from "../../../utils/constants.util";
import { ResponseEntity } from "../../../entities/core/response.entity";
import MasterController from "../../master.controller";
import { uploadToStorage } from "../../../utils/fileUpload.util";
import { VendorModel,VendorDocument } from "../../../models/v1/vendor.model";

export class UploadController extends MasterController {
    private vendorModel: VendorModel;

    constructor() {
        super();
        this.vendorModel = new VendorModel();
        this.uploadFiles = this.uploadFiles.bind(this);
    }

    async uploadFiles(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity }
        try {
            
            const documentType = req.body.documentType;

           
            if (!req.file || !('mimetype' in req.file)) {
                resModel.status = -9;
                resModel.info = "No file provided";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Validate document type
            const validDocumentTypes = ['cancelled_cheque', 'pan_card', 'gst', 'other'];
            if (!validDocumentTypes.includes(documentType)) {
                resModel.status = -9;
                resModel.info = "Invalid document type";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                resModel.status = -9;
                resModel.info = "Invalid file type. Only JPG, JPEG, PNG and PDF are allowed";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            const uploadResult = await uploadToStorage(req.file, documentType);
            
          
            

            resModel.data = {
               url: uploadResult.url,
               key: uploadResult.key,
               fileName: uploadResult.fileName,
               fileType: uploadResult.fileType,
               fileSize: uploadResult.fileSize
            };
            resModel.info = `Document ${uploadResult.fileName} uploaded successfully`;
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            res.status(Constants.HTTP_OK).json(resModel);

        } catch (error: any) {
            resModel.status = -9;
            resModel.info = "catch: " + error.message;
            this.logger.error(JSON.stringify(resModel), `${this.constructor.name} : uploadDocument`);
            res.status(Constants.HTTP_INTERNAL_SERVER_ERROR).json(resModel);
        }
    }
} 