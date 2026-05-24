import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../utils/config';
import { dynamoClient } from '../utils/dynamo-client';
import { logger } from '../utils/logger';
import type { Document, SyncStatus } from '@talent-finder/shared';

/**
 * CreateDocumentInput represents the fields required to create a new document record.
 * Excludes sizeBytes as it is unknown at presigned URL generation time.
 */
export type CreateDocumentInput = Omit<Document, 'sizeBytes'>;

/**
 * DocumentRepository provides data access methods for document metadata storage in DynamoDB.
 * All methods are typed against the Document model from @talent-finder/shared.
 */
export const DocumentRepository = {
  /**
   * Creates a new document record in DynamoDB with the provided metadata.
   * @param doc - The document input containing documentId, filename, uploadedAt, contentType, and syncStatus
   * @throws Error if the DynamoDB put operation fails
   */
  create: async (doc: CreateDocumentInput): Promise<void> => {
    logger.debug({ documentId: doc.documentId }, '[DocumentRepository] > create');
    try {
      const command = new PutCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Item: doc,
      });
      await dynamoClient.send(command);
      logger.debug({ documentId: doc.documentId }, '[DocumentRepository] < create - document created successfully');
    } catch (error) {
      logger.error({ error, documentId: doc.documentId }, '[DocumentRepository] < create - failed to create document');
      throw error;
    }
  },

  /**
   * Retrieves a document record by its documentId.
   * @param documentId - The unique document identifier
   * @returns The document record if found, or undefined if not found
   * @throws Error if the DynamoDB get operation fails
   */
  getById: async (documentId: string): Promise<Document | undefined> => {
    logger.debug({ documentId }, '[DocumentRepository] > getById');
    try {
      const command = new GetCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Key: { documentId },
      });
      const response = await dynamoClient.send(command);
      const document = response.Item as Document | undefined;
      logger.debug({ documentId }, '[DocumentRepository] < getById - document retrieved');
      return document;
    } catch (error) {
      logger.error({ error, documentId }, '[DocumentRepository] < getById - failed to retrieve document');
      throw error;
    }
  },

  /**
   * Retrieves all documents from the table, sorted by uploadedAt in descending order (most recent first).
   * @returns An array of all documents sorted by uploadedAt descending
   * @throws Error if the DynamoDB scan operation fails
   */
  list: async (): Promise<Document[]> => {
    logger.debug('[DocumentRepository] > list');
    try {
      const command = new ScanCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
      });
      const response = await dynamoClient.send(command);
      const documents = (response.Items || []) as Document[];
      // Sort by uploadedAt in descending order (most recent first)
      const sorted = documents.sort((a, b) => {
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        return dateB - dateA;
      });
      logger.debug({ count: sorted.length }, '[DocumentRepository] < list - documents retrieved');
      return sorted;
    } catch (error) {
      logger.error({ error }, '[DocumentRepository] < list - failed to list documents');
      throw error;
    }
  },

  /**
   * Updates the sync status and optional metadata of a document record.
   * Automatically sets updatedAt to the current timestamp.
   * @param documentId - The unique document identifier
   * @param status - The new sync status
   * @param options - Optional parameters: bedrockSyncJobId, syncError
   * @throws Error if the DynamoDB update operation fails
   */
  updateSyncStatus: async (
    documentId: string,
    status: SyncStatus,
    options?: { bedrockSyncJobId?: string; syncError?: string },
  ): Promise<void> => {
    logger.debug({ documentId, status, options }, '[DocumentRepository] > updateSyncStatus');
    try {
      const updateExpressionParts = ['syncStatus = :status', 'updatedAt = :updatedAt'];
      const expressionAttributeValues: Record<string, string> = {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      };

      if (options?.bedrockSyncJobId) {
        updateExpressionParts.push('bedrockSyncJobId = :bedrockSyncJobId');
        expressionAttributeValues[':bedrockSyncJobId'] = options.bedrockSyncJobId;
      }

      if (options?.syncError) {
        updateExpressionParts.push('syncError = :syncError');
        expressionAttributeValues[':syncError'] = options.syncError;
      }

      const command = new UpdateCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Key: { documentId },
        UpdateExpression: updateExpressionParts.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      });
      await dynamoClient.send(command);
      logger.debug({ documentId, status }, '[DocumentRepository] < updateSyncStatus - status updated');
    } catch (error) {
      logger.error({ error, documentId, status }, '[DocumentRepository] < updateSyncStatus - failed to update status');
      throw error;
    }
  },

  /**
   * Deletes a document record from DynamoDB by its documentId.
   * @param documentId - The unique document identifier
   * @throws Error if the DynamoDB delete operation fails
   */
  deleteById: async (documentId: string): Promise<void> => {
    logger.debug({ documentId }, '[DocumentRepository] > deleteById');
    try {
      const command = new DeleteCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Key: { documentId },
      });
      await dynamoClient.send(command);
      logger.debug({ documentId }, '[DocumentRepository] < deleteById - document deleted successfully');
    } catch (error) {
      logger.error({ error, documentId }, '[DocumentRepository] < deleteById - failed to delete document');
      throw error;
    }
  },
};
