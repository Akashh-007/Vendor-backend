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

    // Add other methods like updateVendor, fetchVendor, etc.
}