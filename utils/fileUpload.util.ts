import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

interface UploadResult {
    url: string;
    key: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

export const uploadToStorage = async (file: Express.Multer.File, documentType: string): Promise<UploadResult> => {
    try {
        const fileExtension = file.originalname.split('.').pop();
        const key = `vendors/${documentType}/${uuidv4()}.${fileExtension}`;

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read' as const
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        
        const url = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        
        return {
            url,
            key,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to storage');
    }
};