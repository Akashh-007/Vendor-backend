
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { uploadToStorage } from '../utils/fileUpload.util';
import { Constants } from '../utils/constants.util';
// import { sql } from '../database/postgres.database';

// Basic multer configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
}).single('document'); // Changed to single upload

// Document types validation
const VALID_DOCUMENT_TYPES = ['cancelled_cheque', 'pan_card', 'gst', 'other'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export const documentUploadMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: -9,
                info: "File upload error: " + err.message
            });
        }

        try {
            // Validate required fields
            const {  documentType } = req.body;
            if (!documentType) {
                return res.status(400).json({
                    status: -9,
                    info: "Document type is required"
                });
            }

            // Validate document type
            if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
                return res.status(400).json({
                    status: -9,
                    info: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`
                });
            }

            // Check if file exists
            if (!req.file) {
                return res.status(400).json({
                    status: -9,
                    info: "No file provided"
                });
            }

            // Validate file type
            if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
                return res.status(400).json({
                    status: -9,
                    info: "Invalid file type. Only JPG, JPEG, PNG and PDF are allowed"
                });
            }

            // Upload file to S3
            const uploadResult = await uploadToStorage(req.file, documentType);

            next();

        } catch (error: any) {
            return res.status(Constants.HTTP_INTERNAL_SERVER_ERROR).json({
                status: -9,
                info: "Upload processing error: " + error.message
            });
        }
    });
};

export default upload;
