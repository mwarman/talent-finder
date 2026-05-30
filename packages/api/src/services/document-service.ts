import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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

      // Delete the entire S3 folder (prefix) for this document
      // If this fails, we abort before touching DynamoDB to prevent dangling records
      const s3Prefix = `documents/${documentId}/`;

      // List all objects in the folder
      const listCommand = new ListObjectsV2Command({
        Bucket: config.DOCUMENTS_BUCKET_NAME,
        Prefix: s3Prefix,
      });
      logger.debug(
        { command: listCommand.input },
        '[DocumentService] - deleteDocument - listing S3 objects for deletion',
      );

      const listResponse = await s3Client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete all objects in the folder
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: config.DOCUMENTS_BUCKET_NAME,
          Delete: {
            Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
          },
        });
        logger.debug({ command: deleteCommand.input }, '[DocumentService] - deleteDocument - deleting S3 objects');

        await s3Client.send(deleteCommand);
        logger.debug(
          { documentId, s3Prefix, deletedItemCount: listResponse.Contents.length },
          '[DocumentService] - deleteDocument - S3 folder deleted',
        );
      }

      // Delete the DynamoDB record
      await DocumentRepository.deleteById(documentId);

      // Mark the KB as needing a sync since a document was removed.
      // Fire-and-forget: log errors but do not re-throw — the document is already deleted
      // and the user can still manually trigger a sync.
      try {
        await DocumentRepository.setSyncNeeded(true);
        logger.debug({ documentId }, '[DocumentService] - deleteDocument - sync needed flag set to true');
      } catch (syncError) {
        logger.error(
          { error: syncError, documentId },
          '[DocumentService] - deleteDocument - failed to set sync needed flag',
        );
      }

      logger.debug({ documentId }, '[DocumentService] < deleteDocument - document deleted successfully');
      return document;
    } catch (error) {
      logger.error({ error, documentId }, '[DocumentService] < deleteDocument - failed to delete document');
      throw error;
    }
  },
};
