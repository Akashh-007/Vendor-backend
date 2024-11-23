import { QueryEntity } from "../../entities/core/query.entity";
import { ResponseEntity } from "../../entities/core/response.entity";
import { Constants } from "../../utils/constants.util";
import MasterModel from "../master.model";


export interface VendorDocument {
    vendor_id: number;
    document_type: string;
    file_url: string;
    file_key: string;
}



export class VendorModel extends MasterModel {

    constructor() {
        super();
    }

   
    async uploadVendorDocuments(documents: VendorDocument[]) {
        const resModel = { ...ResponseEntity };
        let queryModel = { ...QueryEntity };

        try {
            await this.beginTransaction();

            try {
                // Prepare the query for bulk insert
                const documentQuery = `
                    INSERT INTO public.vendor_documents (
                        vendor_id,
                        document_type,
                        file_url,
                        file_key,
                        created_at
                    ) VALUES ($1, $2, $3, $4, NOW())
                    RETURNING id;
                `;

                const uploadResults = [];

                // Insert each document
                for (const doc of documents) {
                    queryModel = await this.sql.executeQuery(documentQuery, [
                        doc.vendor_id,
                        doc.document_type,
                        doc.file_url,
                        doc.file_key
                    ]);

                    if (!queryModel.rows || !queryModel.rows[0]) {
                        throw new Error(`Failed to insert document of type: ${doc.document_type}`);
                    }

                    uploadResults.push({
                        id: queryModel.rows[0].id,
                        documentType: doc.document_type,
                        fileUrl: doc.file_url
                    });
                }

                await this.commitTransaction();
                resModel.status = Constants.SUCCESS;
                resModel.data = uploadResults;
                resModel.info = "Documents uploaded successfully";

            } catch (error: any) {
                await this.rollbackTransaction();
                console.error('Transaction Error:', error);
                throw new Error(error.message || 'Transaction failed');
            }

        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error uploading vendor documents: ${error.message || error}`;
            this.logger.error(
                JSON.stringify({ error: error.message || error }), 
                `${this.constructor.name} : uploadVendorDocuments`
            );
        }

        return resModel;
    }

    async getAllVendors() {
        const resModel = { ...ResponseEntity };
        let queryModel = { ...QueryEntity };

        try {
            const query = `
                SELECT 
                    vm.*, 
                    vm.created_at as vendor_created_at,
                    vm.updated_at as vendor_updated_at,
                    
                    vb.bank_name, vb.branch_address, vb.branch_phone_number,
                    vb.account_number, vb.type_of_account, vb.ifsc_code,
                    vb.created_at as banking_created_at,
                    vb.updated_at as banking_updated_at,
                    
                    vi.pan_number, vi.aadhar_number, vi.gst_number,
                    vi.pf_registration_number, vi.esic_registration_number,
                    vi.created_at as identification_created_at,
                    vi.updated_at as identification_updated_at,
                    
                    vv.pan_verified, vv.pan_verified_at,
                    vv.aadhar_verified, vv.aadhar_verified_at,
                    vv.gst_verified, vv.gst_verified_at,
                    vv.bank_details_verified, vv.bank_details_verified_at,
                    vv.created_at as verification_created_at,
                    vv.updated_at as verification_updated_at,
                    
                    ARRAY_AGG(
                        DISTINCT jsonb_build_object(
                            'id', vd.id,
                            'document_type', vd.document_type,
                            'file_url', vd.file_url,
                            'file_key', vd.file_key,
                            'created_at', vd.created_at,
                            'updated_at', vd.updated_at
                        )
                    ) FILTER (WHERE vd.id IS NOT NULL) as documents,
                    
                    ARRAY_AGG(
                        DISTINCT jsonb_build_object(
                            'id', vcf.id,
                            'field_name', vcf.field_name,
                            'field_value', vcf.field_value,
                            'section', vcf.section,
                            'created_at', vcf.created_at,
                            'updated_at', vcf.updated_at
                        )
                    ) FILTER (WHERE vcf.id IS NOT NULL) as custom_fields
                FROM 
                    public.vendor_master vm
                LEFT JOIN 
                    public.vendor_banking_details vb ON vm.id = vb.vendor_id
                LEFT JOIN 
                    public.vendor_identification vi ON vm.id = vi.vendor_id
                LEFT JOIN 
                    public.vendor_verifications vv ON vm.id = vv.vendor_id
                LEFT JOIN 
                    public.vendor_documents vd ON vm.id = vd.vendor_id
                LEFT JOIN 
                    public.vendor_custom_fields vcf ON vm.id = vcf.vendor_id
                GROUP BY 
                    vm.id, 
                    vb.bank_name, vb.branch_address, vb.branch_phone_number,
                    vb.account_number, vb.type_of_account, vb.ifsc_code,
                    vb.created_at, vb.updated_at,
                    vi.pan_number, vi.aadhar_number, vi.gst_number,
                    vi.pf_registration_number, vi.esic_registration_number,
                    vi.created_at, vi.updated_at,
                    vv.pan_verified, vv.pan_verified_at,
                    vv.aadhar_verified, vv.aadhar_verified_at,
                    vv.gst_verified, vv.gst_verified_at,
                    vv.bank_details_verified, vv.bank_details_verified_at,
                    vv.created_at, vv.updated_at
                ORDER BY 
                    vm.created_at DESC;
            `;

            queryModel = await this.sql.executeQuery(query, []);

            if (queryModel.status === Constants.SUCCESS) {
                const vendors = queryModel.rows.map(row => ({
                    id: row.id,
                    // Basic Information
                    name: row.name,
                    tradeName: row.trade_name,
                    emailId: row.email_id,
                    phoneNumber: row.phone_number,
                    typeOfOrganization: row.type_of_organization,
                    natureOfBusiness: row.nature_of_business,
                    workingHours: row.working_hours,
                    createdAt: row.vendor_created_at,
                    updatedAt: row.vendor_updated_at,

                    // Banking Details
                    banking: {
                        bankName: row.bank_name,
                        branchAddress: row.branch_address,
                        branchPhoneNumber: row.branch_phone_number,
                        accountNumber: row.account_number,
                        typeOfAccount: row.type_of_account,
                        ifscCode: row.ifsc_code,
                        createdAt: row.banking_created_at,
                        updatedAt: row.banking_updated_at
                    },

                    // Identification Details
                    identification: {
                        panNumber: row.pan_number,
                        aadharNumber: row.aadhar_number,
                        gstNumber: row.gst_number,
                        pfRegistrationNumber: row.pf_registration_number,
                        esicRegistrationNumber: row.esic_registration_number,
                        createdAt: row.identification_created_at,
                        updatedAt: row.identification_updated_at
                    },

                    // Verifications
                    verifications: {
                        pan: {
                            verified: row.pan_verified,
                            verifiedAt: row.pan_verified_at
                        },
                        aadhar: {
                            verified: row.aadhar_verified,
                            verifiedAt: row.aadhar_verified_at
                        },
                        gst: {
                            verified: row.gst_verified,
                            verifiedAt: row.gst_verified_at
                        },
                        bankDetails: {
                            verified: row.bank_details_verified,
                            verifiedAt: row.bank_details_verified_at
                        },
                        createdAt: row.verification_created_at,
                        updatedAt: row.verification_updated_at
                    },

                    // Documents
                    documents: row.documents && row.documents[0] !== null ? row.documents : [],

                    // Custom Fields
                    customFields: row.custom_fields && row.custom_fields[0] !== null ? row.custom_fields : []
                }));

                resModel.status = Constants.SUCCESS;
                resModel.data = vendors;
                resModel.info = "Vendors fetched successfully";
            }

        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error fetching vendors: ${error.message || error}`;
            this.logger.error(
                JSON.stringify({ error: error.message || error }), 
                `${this.constructor.name} : getAllVendors`
            );
        }

        return resModel;
    }

    async getVendorById(vendorId: number) {
        const resModel = { ...ResponseEntity };
        let queryModel = { ...QueryEntity };

        try {
            const query = `
                SELECT 
                    vm.*, 
                    vm.created_at as vendor_created_at,
                    vm.updated_at as vendor_updated_at,
                    
                    vb.bank_name, vb.branch_address, vb.branch_phone_number,
                    vb.account_number, vb.type_of_account, vb.ifsc_code,
                    vb.created_at as banking_created_at,
                    vb.updated_at as banking_updated_at,
                    
                    vi.pan_number, vi.aadhar_number, vi.gst_number,
                    vi.pf_registration_number, vi.esic_registration_number,
                    vi.created_at as identification_created_at,
                    vi.updated_at as identification_updated_at,
                    
                    vv.pan_verified, vv.pan_verified_at,
                    vv.aadhar_verified, vv.aadhar_verified_at,
                    vv.gst_verified, vv.gst_verified_at,
                    vv.bank_details_verified, vv.bank_details_verified_at,
                    vv.created_at as verification_created_at,
                    vv.updated_at as verification_updated_at,
                    
                    ARRAY_AGG(
                        DISTINCT jsonb_build_object(
                            'id', vd.id,
                            'document_type', vd.document_type,
                            'file_url', vd.file_url,
                            'file_key', vd.file_key,
                            'created_at', vd.created_at,
                            'updated_at', vd.updated_at
                        )
                    ) FILTER (WHERE vd.id IS NOT NULL) as documents,
                    
                    ARRAY_AGG(
                        DISTINCT jsonb_build_object(
                            'id', vcf.id,
                            'field_name', vcf.field_name,
                            'field_value', vcf.field_value,
                            'section', vcf.section,
                            'created_at', vcf.created_at,
                            'updated_at', vcf.updated_at
                        )
                    ) FILTER (WHERE vcf.id IS NOT NULL) as custom_fields
                FROM 
                    public.vendor_master vm
                LEFT JOIN 
                    public.vendor_banking_details vb ON vm.id = vb.vendor_id
                LEFT JOIN 
                    public.vendor_identification vi ON vm.id = vi.vendor_id
                LEFT JOIN 
                    public.vendor_verifications vv ON vm.id = vv.vendor_id
                LEFT JOIN 
                    public.vendor_documents vd ON vm.id = vd.vendor_id
                LEFT JOIN 
                    public.vendor_custom_fields vcf ON vm.id = vcf.vendor_id
                WHERE 
                    vm.id = $1
                GROUP BY 
                    vm.id, 
                    vb.bank_name, vb.branch_address, vb.branch_phone_number,
                    vb.account_number, vb.type_of_account, vb.ifsc_code,
                    vb.created_at, vb.updated_at,
                    vi.pan_number, vi.aadhar_number, vi.gst_number,
                    vi.pf_registration_number, vi.esic_registration_number,
                    vi.created_at, vi.updated_at,
                    vv.pan_verified, vv.pan_verified_at,
                    vv.aadhar_verified, vv.aadhar_verified_at,
                    vv.gst_verified, vv.gst_verified_at,
                    vv.bank_details_verified, vv.bank_details_verified_at,
                    vv.created_at, vv.updated_at;
            `;

            queryModel = await this.sql.executeQuery(query, [vendorId]);

            if (queryModel.status === Constants.SUCCESS && queryModel.rows.length > 0) {
                const row = queryModel.rows[0];
                const vendor = {
                    id: row.id,
                    // Basic Information
                    name: row.name,
                    tradeName: row.trade_name,
                    emailId: row.email_id,
                    phoneNumber: row.phone_number,
                    typeOfOrganization: row.type_of_organization,
                    natureOfBusiness: row.nature_of_business,
                    workingHours: row.working_hours,
                    createdAt: row.vendor_created_at,
                    updatedAt: row.vendor_updated_at,

                    // Banking Details
                    banking: {
                        bankName: row.bank_name,
                        branchAddress: row.branch_address,
                        branchPhoneNumber: row.branch_phone_number,
                        accountNumber: row.account_number,
                        typeOfAccount: row.type_of_account,
                        ifscCode: row.ifsc_code,
                        createdAt: row.banking_created_at,
                        updatedAt: row.banking_updated_at
                    },

                    // Identification Details
                    identification: {
                        panNumber: row.pan_number,
                        aadharNumber: row.aadhar_number,
                        gstNumber: row.gst_number,
                        pfRegistrationNumber: row.pf_registration_number,
                        esicRegistrationNumber: row.esic_registration_number,
                        createdAt: row.identification_created_at,
                        updatedAt: row.identification_updated_at
                    },

                    // Verifications
                    verifications: {
                        pan: {
                            verified: row.pan_verified,
                            verifiedAt: row.pan_verified_at
                        },
                        aadhar: {
                            verified: row.aadhar_verified,
                            verifiedAt: row.aadhar_verified_at
                        },
                        gst: {
                            verified: row.gst_verified,
                            verifiedAt: row.gst_verified_at
                        },
                        bankDetails: {
                            verified: row.bank_details_verified,
                            verifiedAt: row.bank_details_verified_at
                        },
                        createdAt: row.verification_created_at,
                        updatedAt: row.verification_updated_at
                    },

                    // Documents
                    documents: row.documents && row.documents[0] !== null ? row.documents : [],

                    // Custom Fields
                    customFields: row.custom_fields && row.custom_fields[0] !== null ? row.custom_fields : []
                };

                resModel.status = Constants.SUCCESS;
                resModel.data = vendor;
                resModel.info = "Vendor fetched successfully";
            } else {
                resModel.status = Constants.ERROR;
                resModel.info = `Vendor with ID ${vendorId} not found`;
            }

        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error fetching vendor: ${error.message || error}`;
            this.logger.error(
                JSON.stringify({ error: error.message || error }), 
                `${this.constructor.name} : getVendorById`
            );
        }

        return resModel;
    }

    // Add other methods like updateVendor, fetchVendor, etc.
}