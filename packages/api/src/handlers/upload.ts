import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';

import { logger, withRequestTracking } from '../utils/logger';
import { parseBody, ValidationError } from '../utils/validate';
import { response } from '../utils/response';
import { UploadService } from '../services/upload-service';

const UploadRequestSchema = z.object({
  filename: z.string().min(1, 'filename must be a non-empty string'),
  contentType: z.enum(['application/pdf', 'text/plain']),
});

export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
  withRequestTracking(event, context);
  logger.info('[UploadHandler] > handle');

  try {
    const { filename, contentType } = parseBody(UploadRequestSchema, event);

    const { documentId, uploadUrl } = await UploadService.createDocumentPresignedUrl({ filename, contentType });

    logger.debug({ documentId }, '[UploadHandler] - handle - generated pre-signed URL');
    logger.info('[UploadHandler] < handle');

    return response.ok({ documentId, uploadUrl });
  } catch (error) {
    if (error instanceof ValidationError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      logger.warn({ issues: error.issues }, '[UploadHandler] < handle - validation error');
      return response.badRequest('Validation Error', message);
    }
    logger.error({ error }, '[UploadHandler] < handle - unexpected error');
    return response.internalServerError(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
