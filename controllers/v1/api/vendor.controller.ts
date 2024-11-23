import { Request, Response } from "express";
import { Constants } from "../../../utils/constants.util";
import { ResponseEntity } from "../../../entities/core/response.entity";
import MasterController from "../../master.controller";
import { VendorModel } from "../../../models/v1/vendor.model";

export class VendorController extends MasterController {
    private vendorModel: VendorModel;

    constructor() {
        super();
        this.vendorModel = new VendorModel();
        this.createVendor = this.createVendor.bind(this);
    }

    async createVendor(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity }
        try {
            const formData = req.body;

            // Check if formData exists
            if (!formData) {
                resModel.status = -9;
                resModel.info = "error: No data provided";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Verify required fields
            const requiredFields = ['name'];
            const missingFields = requiredFields.filter(field => !formData[field]);
            
            if (missingFields.length > 0) {
                resModel.status = -9;
                resModel.info = "error: Required fields missing: " + missingFields.join(', ');
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Transform data for vendor model
            const vendorData = {
                // Basic Information
                name: formData.name,
                tradeName: formData.tradeName,
                emailId: formData.emailId,
                phoneNumber: formData.phoneNumber,
                typeOfOrganization: formData.typeOfOrganization,
                natureOfBusiness: formData.natureOfBusiness,
                workingHours: formData.workingHours,

                // Banking Details
                bankName: formData.bankName,
                branchAddress: formData.branchAddress,
                branchPhoneNumber: formData.branchPhoneNumber,
                accountNumber: formData.accountNumber,
                typeOfAccount: formData.typeOfAccount,
                ifscCode: formData.ifscCode,

                // Identification Details
                panNumber: formData.panNumber,
                aadharNumber: formData.aadharNumber,
                gstNumber: formData.gstNumber,
                pfRegistrationNumber: formData.pfRegistrationNumber,
                esicRegistrationNumber: formData.esicRegistrationNumber,

                // Custom Fields
                customFields: formData.customFields || {},

                // Verifications
                verifications: formData.verifications || {
                    bankDetails: { verified: false, verifiedAt: null },
                    pan: { verified: false, verifiedAt: null },
                    aadhar: { verified: false, verifiedAt: null },
                    gst: { verified: false, verifiedAt: null }
                }
            };

            console.log(vendorData);
            // Create vendor using model
            resModel = await this.vendorModel.createVendor(vendorData);

            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            
            const statusCode = resModel.status === Constants.SUCCESS 
                ? Constants.HTTP_OK 
                : Constants.HTTP_BAD_REQUEST;
                
            res.status(statusCode).json(resModel);

        } catch (error) {
            resModel.status = -9;
            resModel.info = "catch: " + error + " : " + resModel.info;
            this.logger.error(JSON.stringify(resModel), `${this.constructor.name} : createVendor`);
            res.status(Constants.HTTP_INTERNAL_SERVER_ERROR).json(resModel);
        }
    }
}