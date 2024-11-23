import { Request, Response } from "express";
import { Constants } from "../../../utils/constants.util";
import { ResponseEntity } from "../../../entities/core/response.entity";
import MasterController from "../../master.controller";
import VendorModel  from "../../../models/v1/vendorClient.model";

export class VendorController extends MasterController {
    private vendorModel: VendorModel;

    constructor() {
        super();
        this.vendorModel = new VendorModel();
        this.createVendor = this.createVendor.bind(this);
    }

    async createVendor(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity };
        let payload;
        try {
            payload = req.body.data;
            console.log(payload);
            // console.log(req);
            // payload = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            // Check if formData exists
            if (!payload) {
                resModel.status = -9;
                resModel.info = "error: No data provided";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Verify required fields
            const requiredFields = ['name'];
            const missingFields = requiredFields.filter(field => !payload[field]);
            
            if (missingFields.length > 0) {
                resModel.status = -9;
                resModel.info = "error: Required fields missing: " + missingFields.join(', ');
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Transform data for vendor model
            const vendorData = {
                // Basic Information
                
                name: payload.name,
                tradeName: payload.tradeName,
                emailId: payload.emailId,
                phoneNumber: payload.phoneNumber,
                typeOfOrganization: payload.typeOfOrganization,
                natureOfBusiness: payload.natureOfBusiness,
                workingHours: payload.workingHours,

                // Banking Details
                bankName:   payload.bankName,
                branchAddress: payload.branchAddress,
                branchPhoneNumber: payload.branchPhoneNumber,
                accountNumber: payload.accountNumber,
                typeOfAccount: payload.typeOfAccount,
                ifscCode: payload.ifscCode,

                // Identification Details
                panNumber: payload.panNumber,
                aadharNumber: payload.aadharNumber,
                gstNumber: payload.gstNumber,
                pfRegistrationNumber: payload.pfRegistrationNumber,
                esicRegistrationNumber: payload.esicRegistrationNumber,

                // Add documents field
                documents: payload.documents || [],

                // Custom Fields
                customFields: payload.customFields || {},

                // Verifications
                verifications: payload.verifications || {
                    bankDetails: { verified: false, verifiedAt: null },
                    pan: { verified: false, verifiedAt: null },
                    aadhar: { verified: false, verifiedAt: null },
                    gst: { verified: false, verifiedAt: null }
                }
            };

            console.log(vendorData);
            // Create vendor using model
            const result = await this.vendorModel.createVendor(vendorData);
            resModel.status = Constants.SUCCESS;
            resModel.info = "Vendor created successfully";
            resModel.data = result;

            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            
            const statusCode = resModel.status === Constants.SUCCESS 
                ? Constants.HTTP_OK 
                : Constants.HTTP_BAD_REQUEST;
                
            res.status(statusCode).json(resModel);

        } catch (error) {
            resModel.status = -9;
            resModel.info = "catch: " + JSON.stringify(error) + " : " + resModel.info;
            this.logger.error(JSON.stringify(resModel), `${this.constructor.name} : createVendor`);
            res.status(Constants.HTTP_INTERNAL_SERVER_ERROR).json(resModel);
        }
    }
}