import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { config } from '../utils/config';
import { s3Client } from '../utils/s3-client';
import { logger } from '../utils/logger';
import { DocumentRepository } from '../repositories/document-repository';
import type { Document } from '@talent-finder/shared';

/**
 * DocumentService provides methods for handling document operations across multiple AWS services.
 * It orchestrates interactions with S3, DynamoDB, and related services to ensure data consistency.
 */
export const DocumentService = {
  /**
   * Deletes a document by removing its S3 object and DynamoDB record.
   * Fetches the document once to verify it exists and obtain the filename for S3 deletion.
   * Performs S3 deletion first; if S3 fails, the DynamoDB record is not deleted to prevent dangling records.
   * Deleted documents are naturally excluded from the next Bedrock KB sync cycle—no explicit re-trigger is needed.
   * @param documentId - The unique document identifier
   * @returns The deleted Document if found and successfully deleted, or null if the document was not found
   * @throws Error if S3 deletion or DynamoDB operations fail
   */
  deleteDocument: async (documentId: string): Promise<Document | null> => {
    logger.debug({ documentId }, '[DocumentService] > deleteDocument');

    try {
      // Retrieve the document once to get the filename for S3 key construction
      const document = await DocumentRepository.getById(documentId);
      if (!document) {
        logger.debug({ documentId }, '[DocumentService] < deleteDocument - document not found');
        return null;
      }

      // Delete the S3 object first
      // If this fails, we abort before touching DynamoDB to prevent dangling records
      const s3Key = `documents/${documentId}/${document.filename}`;
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.DOCUMENTS_BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);
      logger.debug({ documentId, s3Key }, '[DocumentService] - deleteDocument - S3 object deleted');

      // Delete the DynamoDB record
      await DocumentRepository.deleteById(documentId);
      logger.debug({ documentId }, '[DocumentService] < deleteDocument - document deleted successfully');

      return document;
    } catch (error) {
      logger.error({ error, documentId }, '[DocumentService] < deleteDocument - failed to delete document');
      throw error;
    }
  },
};
