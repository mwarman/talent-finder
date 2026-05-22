import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { response } from '../utils/response';

// TODO: remove after M1
export const handle: APIGatewayProxyHandlerV2 = async (_event, _context) => {
  return response.ok({ status: 'ok' });
};
