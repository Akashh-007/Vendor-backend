import SQLMaster from "../../database/postgres.databaseClient";
import Logger from "../../utils/logger.util";
import { Constants } from "../../utils/constants.util";

const logger = new Logger();

type VendorData = {
    name: string;
    tradeName?: string;
    emailId?: string;
    phoneNumber?: string;
    typeOfOrganization?: string;
    natureOfBusiness?: string;
    workingHours?: string;
    bankName?: string;
    branchAddress?: string;
    branchPhoneNumber?: string;
    accountNumber?: string;
    typeOfAccount?: string;
    ifscCode?: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    pfRegistrationNumber?: string;
    esicRegistrationNumber?: string;
    verifications: {
        pan: { verified: boolean; verifiedAt?: string };
        aadhar: { verified: boolean; verifiedAt?: string };
        gst: { verified: boolean; verifiedAt?: string };
        bankDetails: { verified: boolean; verifiedAt?: string };
    };
    customFields: Record<string, string>;
    documents: {
        document_type: string;
        file_url: string;
        file_key: string;
    }[];
};

export default class VendorModel {
    private db: SQLMaster;

    constructor() {
        this.db = new SQLMaster();
    }

    // Main method to create vendor and related data
    async createVendor(vendorData: VendorData) {
        const client = await this.db.getClient();
        let vendorId: number;

        try {
            await client.query("BEGIN"); // Start the transaction

            // 1. Insert vendor data
            const vendorQuery = `
                INSERT INTO public.vendor_master (
                    name, trade_name, email_id, phone_number,
                    type_of_organization, nature_of_business, working_hours
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            const vendorValues = [
                vendorData.name,
                vendorData.tradeName || null,
                vendorData.emailId || null,
                vendorData.phoneNumber || null,
                vendorData.typeOfOrganization || null,
                vendorData.natureOfBusiness || null,
                vendorData.workingHours || null
            ];

            const vendorResult = await client.query(vendorQuery, vendorValues);
            vendorId = vendorResult.rows[0].id;

            logger.info(`Vendor inserted with ID: ${vendorId}`, "VendorModel:createVendor");

            // 2. Insert banking details if provided
            if (vendorData.bankName || vendorData.accountNumber) {
                const bankingQuery = `
                    INSERT INTO public.vendor_banking_details (
                        vendor_id, bank_name, branch_address,
                        branch_phone_number, account_number,
                        type_of_account, ifsc_code
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                const bankingValues = [
                    vendorId,
                    vendorData.bankName,
                    vendorData.branchAddress,
                    vendorData.branchPhoneNumber,
                    vendorData.accountNumber,
                    vendorData.typeOfAccount,
                    vendorData.ifscCode
                ];

                await client.query(bankingQuery, bankingValues);
                logger.info(`Banking details inserted for vendor: ${vendorId}`, "VendorModel:createVendor");
            }

            // 3. Insert identification details
            const identificationQuery = `
                INSERT INTO public.vendor_identification (
                    vendor_id, pan_number, aadhar_number,
                    gst_number, pf_registration_number,
                    esic_registration_number
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `;
            const identificationValues = [
                vendorId,
                vendorData.panNumber,
                vendorData.aadharNumber,
                vendorData.gstNumber,
                vendorData.pfRegistrationNumber,
                vendorData.esicRegistrationNumber
            ];

            await client.query(identificationQuery, identificationValues);
            logger.info(`Identification details inserted for vendor: ${vendorId}`, "VendorModel:createVendor");

            // 4. Insert verifications
            const verificationQuery = `
                INSERT INTO public.vendor_verifications (
                    vendor_id,
                    pan_verified, pan_verified_at,
                    aadhar_verified, aadhar_verified_at,
                    gst_verified, gst_verified_at,
                    bank_details_verified, bank_details_verified_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            const verificationValues = [
                vendorId,
                vendorData.verifications.pan.verified,
                vendorData.verifications.pan.verifiedAt,
                vendorData.verifications.aadhar.verified,
                vendorData.verifications.aadhar.verifiedAt,
                vendorData.verifications.gst.verified,
                vendorData.verifications.gst.verifiedAt,
                vendorData.verifications.bankDetails.verified,
                vendorData.verifications.bankDetails.verifiedAt
            ];

            await client.query(verificationQuery, verificationValues);
            logger.info(`Verifications inserted for vendor: ${vendorId}`, "VendorModel:createVendor");

            // 5. Insert custom fields if any
            if (Object.keys(vendorData.customFields).length > 0) {
                const customFieldsQuery = `
                    INSERT INTO public.vendor_custom_fields (
                        vendor_id, field_name, field_value
                    ) VALUES ($1, $2, $3)
                `;
                for (const [fieldName, fieldValue] of Object.entries(vendorData.customFields)) {
                    await client.query(customFieldsQuery, [vendorId, fieldName, fieldValue]);
                    logger.info(`Custom field inserted: ${fieldName}`, "VendorModel:createVendor");
                }
            }

            // 6. Upload vendor documents
            for (const document of vendorData.documents) {
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
                const documentValues = [
                    vendorId,
                    document.document_type,
                    document.file_url,
                    document.file_key
                ];

                await client.query(documentQuery, documentValues);
                logger.info(`Document uploaded for vendor: ${vendorId}`, "VendorModel:createVendor");
            }

            // Commit transaction
            await client.query("COMMIT");
            logger.info("Transaction committed successfully", "VendorModel:createVendor");

            return { vendorId };

        } catch (error) {
            await client.query("ROLLBACK"); // Rollback if an error occurs
            logger.error(`Transaction failed: ${error.message}`, "VendorModel:createVendor");
            throw new Error(error.message || 'Transaction failed');
        } finally {
            await client.end();
            logger.info("Database client released", "VendorModel:createVendor");
        }
    }
}
