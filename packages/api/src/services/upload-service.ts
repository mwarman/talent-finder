import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '../utils/config';
import { s3Client } from '../utils/s3-client';
import { logger } from '../utils/logger';
import { DocumentRepository } from '../repositories/document-repository';
import { Document, SyncStatus } from '@talent-finder/shared';

/**
 * CreateDocumentPresignedUrlResult represents the result of generating a pre-signed URL for document upload.
 * It includes the unique documentId and the pre-signed S3 uploadUrl.
 */
export interface CreateDocumentPresignedUrlResult {
  documentId: string;
  uploadUrl: string;
}

/**
 * UploadService provides methods for handling document uploads, including generating pre-signed S3 URLs
 * for secure direct uploads from clients. This service abstracts the logic for interacting with S3 and
 * generating unique document identifiers.
 */
export const UploadService = {
  /**
   * Generates a UUID v4 document identifier and a pre-signed S3 PUT URL
   * targeting the documents/{documentId}/{filename} key.
   * The URL is valid for 5 minutes (300 seconds).
   * Also creates an initial document metadata record in DynamoDB with syncStatus: PENDING.
   * @param params - The filename and content type of the document to upload
   * @param params.filename - The original filename of the document (e.g., "resume.pdf")
   * @param params.contentType - The MIME type of the document (e.g., "application/pdf")
   * @returns The generated documentId and pre-signed uploadUrl
   * @throws Error if the DynamoDB metadata creation fails
   */
  createDocumentPresignedUrl: async (
    params: Pick<Document, 'filename' | 'contentType'>,
  ): Promise<CreateDocumentPresignedUrlResult> => {
    logger.info({ params }, '[UploadService] > createDocumentPresignedUrl - generating pre-signed URL');
    const { filename, contentType } = params;

    const documentId = randomUUID();
    const s3Key = `documents/${documentId}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: config.DOCUMENTS_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });
    logger.debug({ command }, '[UploadService] - createDocumentPresignedUrl - created S3 PutObjectCommand');

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Create initial document metadata in DynamoDB with syncStatus: PENDING
    const uploadedAt = new Date().toISOString();
    await DocumentRepository.create({
      documentId,
      filename,
      uploadedAt,
      contentType,
      syncStatus: SyncStatus.PENDING,
    });

    logger.info(
      { documentId },
      '[UploadService] < createDocumentPresignedUrl - generated pre-signed URL and created metadata',
    );
    return { documentId, uploadUrl };
  },
};
