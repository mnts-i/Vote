import { join } from 'node:path';
import { Logger } from '@nestjs/common';

const isFly = Boolean(process.env.FLY_APP_NAME);
const logger = new Logger('Configuration', { timestamp: true });

logger.log('Fly.io Mode: ' + (isFly ? 'YES' : 'NO'));

export default () => ({
    IMAGES_DIR: isFly ? '/data/images' : join(process.cwd(), 'data', 'images'),
    DATABASE_DIR: isFly ? '/data' : join(process.cwd(), 'data'),
});