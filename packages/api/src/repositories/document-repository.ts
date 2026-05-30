import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../utils/config';
import { dynamoClient } from '../utils/dynamo-client';
import { logger } from '../utils/logger';
import type { Document, KnowledgeBase, SyncStatus } from '@talent-finder/shared';

/**
 * CreateDocumentInput represents the fields required to create a new document record.
 * Excludes sizeBytes as it is unknown at presigned URL generation time.
 */
export type CreateDocumentInput = Omit<Document, 'sizeBytes'>;

/** DocumentItem represents the raw DynamoDB item shape, including composite key attributes. */
interface DocumentItem extends Document {
  pk: string;
  sk: string;
}

/** Composite key builders for the Documents DynamoDB table and its GSIs. */
export const DocumentsTableKeys = {
  pk: (kbId: string) => `KB#${kbId}`,
  sk: {
    document: (documentId: string) => `DOCUMENT#${documentId}`,
    syncState: 'SYNC_STATE' as const,
  },
  gsi: {
    syncStatusIndex: {
      pk: (kbId: string) => `KB#${kbId}`,
    },
    bedrockSyncJobIdIndex: {
      pk: (bedrockSyncJobId: string) => bedrockSyncJobId,
    },
  },
} as const;

/** Strips DynamoDB composite key attributes from a raw item to produce a clean Document. */
const toDocument = (item: DocumentItem): Document => {
  const { pk: _pk, sk: _sk, ...document } = item;
  return document;
};

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
        Item: {
          pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID),
          sk: DocumentsTableKeys.sk.document(doc.documentId),
          ...doc,
        },
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
        Key: { pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID), sk: DocumentsTableKeys.sk.document(documentId) },
      });
      const response = await dynamoClient.send(command);
      const document = response.Item ? toDocument(response.Item as DocumentItem) : undefined;
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
      const command = new QueryCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': DocumentsTableKeys.pk(config.BEDROCK_KB_ID),
          ':prefix': 'DOCUMENT#',
        },
      });
      const response = await dynamoClient.send(command);
      const documents = (response.Items || []).map((item) => toDocument(item as DocumentItem));
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
   * Retrieves all documents with a specific sync status.
   * @param status - The sync status to filter by
   * @returns An array of documents matching the given sync status
   * @throws Error if the DynamoDB scan operation fails
   */
  listByStatus: async (status: SyncStatus): Promise<Document[]> => {
    logger.debug({ status }, '[DocumentRepository] > listByStatus');
    try {
      const command = new QueryCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        IndexName: 'syncStatus-index',
        KeyConditionExpression: 'pk = :pk AND syncStatus = :status',
        ExpressionAttributeValues: {
          ':pk': DocumentsTableKeys.pk(config.BEDROCK_KB_ID),
          ':status': status,
        },
      });
      const response = await dynamoClient.send(command);
      const documents = (response.Items || []).map((item) => toDocument(item as DocumentItem));
      logger.debug({ status, count: documents.length }, '[DocumentRepository] < listByStatus - documents retrieved');
      return documents;
    } catch (error) {
      logger.error({ error, status }, '[DocumentRepository] < listByStatus - failed to list documents by status');
      throw error;
    }
  },

  /**
   * Retrieves all documents associated with a specific Bedrock sync job ID.
   * @param bedrockSyncJobId - The Bedrock ingestion job ID to filter by
   * @returns An array of documents matching the given job ID
   * @throws Error if the DynamoDB scan operation fails
   */
  listByJobId: async (bedrockSyncJobId: string): Promise<Document[]> => {
    logger.debug({ bedrockSyncJobId }, '[DocumentRepository] > listByJobId');
    try {
      const command = new QueryCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        IndexName: 'bedrockSyncJobId-index',
        KeyConditionExpression: 'bedrockSyncJobId = :jobId',
        ExpressionAttributeValues: { ':jobId': bedrockSyncJobId },
      });
      const response = await dynamoClient.send(command);
      const documents = (response.Items || []).map((item) => toDocument(item as DocumentItem));
      logger.debug(
        { bedrockSyncJobId, count: documents.length },
        '[DocumentRepository] < listByJobId - documents retrieved',
      );
      return documents;
    } catch (error) {
      logger.error(
        { error, bedrockSyncJobId },
        '[DocumentRepository] < listByJobId - failed to list documents by job ID',
      );
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
      const updateExpressionParts = ['syncStatus = :syncStatus', 'updatedAt = :updatedAt'];
      const expressionAttributeValues: Record<string, string> = {
        ':syncStatus': status,
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
        Key: { pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID), sk: DocumentsTableKeys.sk.document(documentId) },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
      });
      logger.debug(
        { input: command.input },
        '[DocumentRepository] - updateSyncStatus - sending update command to DynamoDB',
      );
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
        Key: { pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID), sk: DocumentsTableKeys.sk.document(documentId) },
      });
      await dynamoClient.send(command);
      logger.debug({ documentId }, '[DocumentRepository] < deleteById - document deleted successfully');
    } catch (error) {
      logger.error({ error, documentId }, '[DocumentRepository] < deleteById - failed to delete document');
      throw error;
    }
  },

  /**
   * Retrieves the sync state record for the current knowledge base.
   * @returns The KnowledgeBase record if the SYNC_STATE item exists, or undefined if not found
   * @throws Error if the DynamoDB get operation fails
   */
  getSyncState: async (): Promise<KnowledgeBase | undefined> => {
    logger.debug('[DocumentRepository] > getSyncState');
    try {
      const command = new GetCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Key: { pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID), sk: DocumentsTableKeys.sk.syncState },
      });
      const response = await dynamoClient.send(command);
      if (!response.Item) {
        logger.debug('[DocumentRepository] < getSyncState - no sync state item found');
        return undefined;
      }
      const knowledgeBase: KnowledgeBase = {
        knowledgeBaseId: config.BEDROCK_KB_ID,
        syncNeeded: response.Item.syncNeeded as boolean,
      };
      logger.debug(
        { syncNeeded: knowledgeBase.syncNeeded },
        '[DocumentRepository] < getSyncState - sync state retrieved',
      );
      return knowledgeBase;
    } catch (error) {
      logger.error({ error }, '[DocumentRepository] < getSyncState - failed to retrieve sync state');
      throw error;
    }
  },

  /**
   * Upserts the syncNeeded flag on the SYNC_STATE item for the current knowledge base.
   * Creates the item if it does not yet exist.
   * @param syncNeeded - Whether a Bedrock knowledge base sync is required
   * @throws Error if the DynamoDB update operation fails
   */
  setSyncNeeded: async (syncNeeded: boolean): Promise<void> => {
    logger.debug({ syncNeeded }, '[DocumentRepository] > setSyncNeeded');
    try {
      const command = new UpdateCommand({
        TableName: config.DOCUMENTS_TABLE_NAME,
        Key: { pk: DocumentsTableKeys.pk(config.BEDROCK_KB_ID), sk: DocumentsTableKeys.sk.syncState },
        UpdateExpression: 'SET syncNeeded = :syncNeeded',
        ExpressionAttributeValues: { ':syncNeeded': syncNeeded },
      });
      await dynamoClient.send(command);
      logger.debug({ syncNeeded }, '[DocumentRepository] < setSyncNeeded - sync needed flag updated');
    } catch (error) {
      logger.error({ error, syncNeeded }, '[DocumentRepository] < setSyncNeeded - failed to update sync needed flag');
      throw error;
    }
  },
};
