import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '../utils/config';
import { s3Client } from '../utils/s3-client';
import { logger } from '../utils/logger';

export interface CreateDocumentPresignedUrlParams {
  filename: string;
  contentType: string;
}

export interface CreateDocumentPresignedUrlResult {
  documentId: string;
  uploadUrl: string;
}

/**
 * Generates a UUID v4 document identifier and a pre-signed S3 PUT URL
 * targeting the documents/{documentId}/{filename} key.
 * The URL is valid for 5 minutes (300 seconds).
 * @param params - The filename and content type of the document to upload
 * @returns The generated documentId and pre-signed uploadUrl
 */
const createDocumentPresignedUrl = async (
  params: CreateDocumentPresignedUrlParams,
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

  logger.info({ documentId }, '[UploadService] < createDocumentPresignedUrl - generated pre-signed URL');
  return { documentId, uploadUrl };
};

/**
 * UploadService provides methods for handling document uploads, including generating pre-signed S3 URLs
 * for secure direct uploads from clients. This service abstracts the logic for interacting with S3 and
 * generating unique document identifiers.
 */
export const UploadService = {
  createDocumentPresignedUrl,
};
