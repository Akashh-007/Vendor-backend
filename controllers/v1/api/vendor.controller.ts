import { Request, Response } from "express";
import { Constants } from "../../../utils/constants.util";
import { ResponseEntity } from "../../../entities/core/response.entity";
import MasterController from "../../master.controller";
import VendorModelClient  from "../../../models/v1/vendorClient.model";
import { VendorModel } from "../../../models/v1/vendor.model";

export class VendorController extends MasterController {
    private vendorModelClient: VendorModelClient;
    private vendorModel: VendorModel;

    constructor() {
        super();
        this.vendorModelClient = new VendorModelClient();
        this.vendorModel = new VendorModel();

        this.createVendor = this.createVendor.bind(this);
    }

    async createVendor(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity };
        let payload;
        try {
            payload = req.body.data;
            
            // Add debug logging
            this.logger.info(`Received payload: ${JSON.stringify(payload)}`, 'VendorController:createVendor');

            // Check if payload exists
            if (!payload) {
                resModel.status = Constants.ERROR;
                resModel.info = "No data provided";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }

            // Verify required fields
            const requiredFields = ['name'];
            const missingFields = requiredFields.filter(field => !payload[field]);
            
            if (missingFields.length > 0) {
                resModel.status = Constants.ERROR;
                resModel.info = `Required fields missing: ${missingFields.join(', ')}`;
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

            // Add debug logging
            this.logger.info(`Transformed vendor data: ${JSON.stringify(vendorData)}`, 'VendorController:createVendor');

            // Create vendor using model
            const result = await this.vendorModelClient.createVendor(vendorData);
            resModel.status = Constants.SUCCESS;
            resModel.info = "Vendor created successfully";
            resModel.data = result;

        } catch (error: any) {
            // Improved error handling
            resModel.status = Constants.ERROR;
            resModel.info = `Error creating vendor: ${error.message || JSON.stringify(error)}`;
            this.logger.error(`Failed to create vendor: ${JSON.stringify({
                error: error.message || error,
                stack: error.stack,
                payload
            })}`, 'VendorController:createVendor');
        } finally {
            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            
            const statusCode = resModel.status === Constants.SUCCESS 
                ? Constants.HTTP_OK 
                : Constants.HTTP_INTERNAL_SERVER_ERROR;
                
            res.status(statusCode).json(resModel);
        }
    }

    async getAllVendors(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity };
        
        try {
            const vendors = await this.vendorModel.getAllVendors();
            
            resModel.status = Constants.SUCCESS;
            resModel.info = "Vendors fetched successfully";
            resModel.data = vendors;
            
        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error fetching vendors: ${error.message}`;
            this.logger.error(`Failed to fetch vendors: ${JSON.stringify({
                error: error.message,
                stack: error.stack
            })}`, 'VendorController:getAllVendors');
        } finally {
            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            
            const statusCode = resModel.status === Constants.SUCCESS 
                ? Constants.HTTP_OK 
                : Constants.HTTP_INTERNAL_SERVER_ERROR;
                
            res.status(statusCode).json(resModel);
        }
    }

    async getVendorById(req: Request, res: Response) {
        const startMS = new Date().getTime();
        let resModel = { ...ResponseEntity };
        
        try {
            const vendorId = parseInt(req.params.id);
            
            if (isNaN(vendorId)) {
                resModel.status = Constants.ERROR;
                resModel.info = "Invalid vendor ID";
                return res.status(Constants.HTTP_BAD_REQUEST).json(resModel);
            }
            
            const vendor = await this.vendorModel.getVendorById(vendorId);
            
            resModel.status = Constants.SUCCESS;
            resModel.info = "Vendor fetched successfully";
            resModel.data = vendor;
            
        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error fetching vendor: ${error.message}`;
            this.logger.error(`Failed to fetch vendor: ${JSON.stringify({
                error: error.message,
                stack: error.stack
            })}`, 'VendorController:getVendorById');
        } finally {
            resModel.endDT = new Date();
            resModel.tat = (new Date().getTime() - startMS) / 1000;
            
            const statusCode = resModel.status === Constants.SUCCESS 
                ? Constants.HTTP_OK 
                : Constants.HTTP_INTERNAL_SERVER_ERROR;
                
            res.status(statusCode).json(resModel);
        }
    }
}