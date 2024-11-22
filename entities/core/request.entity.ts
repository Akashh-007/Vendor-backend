import { Request } from "express";
import { Multer } from 'multer';

// Define custom request interface with multer types
interface MulterRequest extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export const RequestEntity = (req: MulterRequest) => {
    const formData = req.body.data ? JSON.parse(req.body.data) : {};
    
    return {
        // Request metadata
        reqPath: req.path + "",
        reqBaseUrl: req.baseUrl + "",
        reqHostname: req.hostname + "",
        reqIp: req.ip + "",
        reqMethod: req.method + "",
        reqOriginalUrl: req.originalUrl + "",
        reqProtocol: req.protocol + "",
        
        // Form data
        vendorData: {
            // Basic Information
            name: formData.name || "",
            tradeName: formData.tradeName || "",
            emailId: formData.emailId || "",
            phoneNumber: formData.phoneNumber || "",
            typeOfOrganization: formData.typeOfOrganization || "",
            natureOfBusiness: formData.natureOfBusiness || "",
            
            // Identification Details
            panNumber: formData.panNumber || "",
            aadharNumber: formData.aadharNumber || "",
            gstNumber: formData.gstNumber || "",
            
            // Banking Details
            bankName: formData.bankName || "",
            branchAddress: formData.branchAddress || "",
            branchPhoneNumber: formData.branchPhoneNumber || "",
            accountNumber: formData.accountNumber || "",
            typeOfAccount: formData.typeOfAccount || "",
            ifscCode: formData.ifscCode || "",
            
            // Additional Details
            pfRegistrationNumber: formData.pfRegistrationNumber || "",
            esicRegistrationNumber: formData.esicRegistrationNumber || "",
            workingHours: formData.workingHours || "",
            qualityCertification: formData.qualityCertification || "",
            
            // Custom Fields
            customFields: formData.customFields || {},
            
            // Verifications
            verifications: formData.verifications || {
                bankDetails: { verified: false, verifiedAt: null, data: null },
                pan: { verified: false, verifiedAt: null, message: null },
                aadhar: { verified: false, verifiedAt: null, message: null },
                gst: { verified: false, verifiedAt: null, message: null }
            }
        },
        
        // Updated file information handling
        fileInfo: req.files ? Object.entries(req.files).map(([fieldname, files]) => {
            const file = Array.isArray(files) ? files[0] : files;
            return {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                size: file.size
            };
        })[0] : null,
        
        // Additional request info (if needed)
        reqQuery: JSON.stringify(req.query) || "",
        reqParams: JSON.stringify(req.params) || "",
        reqSecure: req.secure + "",
        reqXhr: req.xhr + "",
    };
};