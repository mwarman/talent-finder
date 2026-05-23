import { S3Client } from '@aws-sdk/client-s3';

/**
 * Singleton S3 client instance pre-configured for the current AWS environment.
 * Credentials and region are sourced from the Lambda execution environment.
 */
const s3Client = new S3Client({});

export { s3Client };
