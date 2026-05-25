/**
 * Parses an S3 URI to extract document ID and filename.
 *
 * Expected format: s3://bucket/documents/{documentId}/{filename}
 *
 * @param sourceUri - The S3 URI from metadata (e.g., 's3://bucket/documents/uuid/file.pdf')
 * @returns Object with parsed documentId and filename, or defaults if parsing fails
 */
export const parseS3Uri = (sourceUri?: string): { documentId: string; filename: string } => {
  if (!sourceUri || typeof sourceUri !== 'string') {
    return { documentId: 'unknown', filename: 'unknown' };
  }

  try {
    // Remove 's3://' prefix and split by '/'
    const parts = sourceUri.replace(/^s3:\/\//, '').split('/');

    // Expected structure: bucket/documents/documentId/filename
    // We need at least 4 parts: [bucket, documents, documentId, filename]
    if (parts.length < 4) {
      return { documentId: 'unknown', filename: 'unknown' };
    }

    // Extract the last part as filename
    const filename = parts[parts.length - 1];

    // Extract documentId (second-to-last part, which is the directory before filename)
    const documentId = parts[parts.length - 2];

    // Validate that we have non-empty values
    if (!filename || !documentId) {
      return { documentId: 'unknown', filename: 'unknown' };
    }

    return { documentId, filename };
  } catch {
    // If any error occurs during parsing, return defaults
    return { documentId: 'unknown', filename: 'unknown' };
  }
};
