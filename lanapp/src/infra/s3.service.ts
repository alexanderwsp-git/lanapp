import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.AWS_S3_BUCKET || 'sheep-photos';

export const s3Service = {
    async getPresignedUploadUrl(
        filename: string,
        contentType: string,
        folder = 'sheep'
    ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
        const ext = filename.split('.').pop() || 'jpg';
        const key = `${folder}/${randomUUID()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        const fileUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

        return { uploadUrl, fileUrl, key };
    },
};
