import sharp from 'sharp';
import { join } from 'node:path';
import { customAlphabet } from 'nanoid';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstABCDEFGHIJKLMNOPwzWZ', 20);

@Injectable()
export class ImageService {
    private readonly imageDir: string;

    private readonly logger = new Logger(ImageService.name);

    constructor(
        configService: ConfigService
    ) {
        this.imageDir = configService.getOrThrow('IMAGES_DIR');
    }

    async compressImage(file: Express.Multer.File) {
        const id = nanoid();
        const name = `img_${id}.jpg`;
        const path = join(this.imageDir, name);

        try {
            await sharp(file.buffer, { autoOrient: true })
                .resize({
                    fit: 'inside',
                    width: 600,
                    height: 600,
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 })
                .toFile(path);
        } catch (err) {
            this.logger.error(err);
            throw new InternalServerErrorException('Σφάλμα κατά την επεξεργασία της φωτογραφίας');
        }

        return name;
    }
}