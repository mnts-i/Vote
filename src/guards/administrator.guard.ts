import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

// Entities
import { User } from 'src/entities/user.entity';

@Injectable()
export class AdministratorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const user = request.user as User | undefined;

        if (!user) {
            throw new UnauthorizedException('Πρέπει να είστε συνδεδεμένος για αυτή την ενέργεια');
        }

        if (!user.isAdmin) {
            throw new UnauthorizedException('Πρέπει να είστε διαχειριστής για αυτή την ενέργεια');
        }

        return true;
    }
}