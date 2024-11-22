import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { Constants } from './constants.util';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ResponseEntity } from '../entities/core/response.entity';

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

interface UploadResponse {
    url: string;
    key: string;
}

export const uploadToStorage = async (file: Express.Multer.File): Promise<UploadResponse> => {
    const startMS = new Date().getTime();
    const resModel = { ...ResponseEntity };

    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Validate file size (e.g., 10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;

        // Set up S3 upload parameters
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
            Key: `vendor-documents/${fileName}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read' as ObjectCannedACL
        };

        // Upload to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Generate public URL
        const fileUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;

        resModel.tat = (new Date().getTime() - startMS) / 1000;
        
        return {
            url: fileUrl,
            key: uploadParams.Key
        };

    } catch (error: any) {
        console.error('File upload error:', error);
        resModel.status = Constants.ERROR;
        resModel.info = `File upload failed: ${error.message}`;
        resModel.tat = (new Date().getTime() - startMS) / 1000;
        throw new Error(error.message);
    }
};

// Optional: Function to delete file from S3
export const deleteFromStorage = async (fileKey: string): Promise<void> => {
    const startMS = new Date().getTime();
    const resModel = { ...ResponseEntity };

    try {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
            Key: fileKey
        };

        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);

        resModel.tat = (new Date().getTime() - startMS) / 1000;

    } catch (error: any) {
        console.error('File deletion error:', error);
        resModel.status = Constants.ERROR;
        resModel.info = `File deletion failed: ${error.message}`;
        resModel.tat = (new Date().getTime() - startMS) / 1000;
        throw new Error(error.message);
    }
};