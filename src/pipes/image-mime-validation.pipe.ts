import { BadRequestException, PipeTransform } from '@nestjs/common';

export class ImageMimeValidationPipe implements PipeTransform {
    private readonly allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png'
    ];

    transform(file: Express.Multer.File) {
        if (!this.allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException('Μπορείτε να ανεβάσετε μόνο JPEG και PNG');
        }

        return file;
    }
}