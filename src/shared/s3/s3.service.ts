import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {
    this.s3Client = new S3Client({
      region: this.config.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY'),
      },
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      forcePathStyle: true, // depends on the provider, but good for local/compat
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = this.config.get<string>('S3_BUCKET_NAME');
    const endpointRaw = this.config.get<string>('S3_ENDPOINT');
    const key = `cooler-items/${randomUUID()}-${file.originalname.replace(/\s+/g, '-')}`;

    const body =
      file.buffer != null && file.buffer.length > 0
        ? file.buffer
        : file.path && existsSync(file.path)
          ? readFileSync(file.path)
          : null;

    if (!body?.length) {
      throw new Error(
        'Upload file is empty (no buffer). Use multipart field name "file" and check multer limits.',
      );
    }
    if (!bucket || !endpointRaw) {
      throw new Error('S3_BUCKET_NAME or S3_ENDPOINT is not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.mimetype || 'application/octet-stream',
        // ACL: 'public-read', // Bucket policy might handle this instead
      });

      await this.s3Client.send(command);

      // Construct public URL
      // If endpoint is standard AWS: https://bucket.s3.region.amazonaws.com/key
      // If using the specific endpoint provided: https://s3.eu-north-1.amazonaws.com/bucket/key
      const endpoint = endpointRaw.replace(/\/$/, '');
      return `${endpoint}/${bucket}/${key}`;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }
}
