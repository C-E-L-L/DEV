import { createApiClient } from './createApiClient';
import { authSession } from '../utils/browserAuthSession';

export default createApiClient(authSession);
