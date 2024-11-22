import { QueryEntity } from "../../entities/core/query.entity";
import { ResponseEntity } from "../../entities/core/response.entity";
import { Constants } from "../../utils/constants.util";
import MasterModel from "../master.model";

interface VendorFormData {
    name: string;
    tradeName?: string;
    emailId?: string;
    phoneNumber?: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    typeOfOrganization?: string;
    natureOfBusiness?: string;
    bankName?: string;
    branchAddress?: string;
    branchPhoneNumber?: string;
    accountNumber?: string;
    typeOfAccount?: string;
    ifscCode?: string;
    pfRegistrationNumber?: string;
    esicRegistrationNumber?: string;
    workingHours?: string;
    customFields: Record<string, string>;
    verifications: {
        bankDetails: { verified: boolean; verifiedAt: string | null; };
        pan: { verified: boolean; verifiedAt: string | null; };
        aadhar: { verified: boolean; verifiedAt: string | null; };
        gst: { verified: boolean; verifiedAt: string | null; };
    };
}

export class VendorModel extends MasterModel {
    async createVendor(formData: VendorFormData) {
        const resModel = { ...ResponseEntity };
        let queryModel = { ...QueryEntity };

        try {
            await this.beginTransaction();

            try {
                // 1. Insert into vendors table
                const vendorQuery = `
                    INSERT INTO public.vendor_master (
                        name, trade_name, email_id, phone_number,
                        type_of_organization, nature_of_business, working_hours
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `;

                const vendorValues = [
                    formData.name,
                    formData.tradeName || null,
                    formData.emailId || null,
                    formData.phoneNumber || null,
                    formData.typeOfOrganization || null,
                    formData.natureOfBusiness || null,
                    formData.workingHours || null
                ];

                // Log the query and values for debugging
                console.log('Vendor Query:', vendorQuery);
                console.log('Vendor Values:', vendorValues);

                queryModel = await this.sql.executeQuery(vendorQuery, vendorValues);
                
                if (!queryModel.rows || !queryModel.rows[0]) {
                    throw new Error('Failed to insert vendor record');
                }
                
                const vendorId = queryModel.rows[0].id;

                // 2. Insert banking details if provided
                if (formData.bankName || formData.accountNumber) {
                    const bankingQuery = `
                        INSERT INTO public.vendor_banking_details (
                            vendor_id, bank_name, branch_address,
                            branch_phone_number, account_number,
                            type_of_account, ifsc_code
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `;

                    const bankingValues = [
                        vendorId,
                        formData.bankName,
                        formData.branchAddress,
                        formData.branchPhoneNumber,
                        formData.accountNumber,
                        formData.typeOfAccount,
                        formData.ifscCode
                    ];

                    await this.sql.executeQuery(bankingQuery, bankingValues);
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
                    formData.panNumber,
                    formData.aadharNumber,
                    formData.gstNumber,
                    formData.pfRegistrationNumber,
                    formData.esicRegistrationNumber
                ];

                await this.sql.executeQuery(identificationQuery, identificationValues);

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
                    formData.verifications.pan.verified,
                    formData.verifications.pan.verifiedAt,
                    formData.verifications.aadhar.verified,
                    formData.verifications.aadhar.verifiedAt,
                    formData.verifications.gst.verified,
                    formData.verifications.gst.verifiedAt,
                    formData.verifications.bankDetails.verified,
                    formData.verifications.bankDetails.verifiedAt
                ];

                await this.sql.executeQuery(verificationQuery, verificationValues);

                // 5. Insert custom fields if any
                if (Object.keys(formData.customFields).length > 0) {
                    const customFieldsQuery = `
                        INSERT INTO public.vendor_custom_fields (
                            vendor_id, field_name, field_value
                        ) VALUES ($1, $2, $3)
                    `;

                    for (const [fieldName, fieldValue] of Object.entries(formData.customFields)) {
                        await this.sql.executeQuery(customFieldsQuery, [
                            vendorId,
                            fieldName,
                            fieldValue
                        ]);
                    }
                }

                await this.commitTransaction();
                resModel.status = Constants.SUCCESS;
                resModel.data = { vendorId };

            } catch (error: any) {
                await this.rollbackTransaction();
                console.error('Transaction Error:', error);
                throw new Error(error.message || 'Transaction failed');
            }

        } catch (error: any) {
            resModel.status = Constants.ERROR;
            resModel.info = `Error creating vendor: ${error.message || error}`;
            this.logger.error(JSON.stringify({ error: error.message || error }), `${this.constructor.name} : createVendor`);
        }

        return resModel;
    }

    // Add other methods like updateVendor, fetchVendor, etc.
}