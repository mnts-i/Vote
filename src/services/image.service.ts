import sharp from 'sharp';
import { join } from 'node:path';
import { customAlphabet } from 'nanoid';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstABCDEFGHIJKLMNOPwzWZ', 20);

@Injectable()
export class ImageService {
    private readonly logger = new Logger(ImageService.name);
    private readonly imageDir = join(process.cwd(), 'IMAGES');

    async compressImage(file: Express.Multer.File) {
        const id = nanoid();
        const path = join(this.imageDir, `img_${id}.jpg`);

        try {
            await sharp(file.buffer, { autoOrient: true })
                .resize({
                    fit: 'inside',
                    width: 400,
                    height: 400,
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 })
                .toFile(path);
        } catch (err) {
            this.logger.error(err);
            throw new InternalServerErrorException('Σφάλμα κατά την επεξεργασία της φωτογραφίας');
        }

        return path;
    }
}