import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

// Repositories
import { UsersRepository } from '../repos/users.repository';

@Injectable()
export class AuthenticateGuard implements CanActivate {
    constructor(
        private usersRepository: UsersRepository
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['x-jwt'];

        if (!Boolean(token) || typeof token !== 'string') {
            throw new UnauthorizedException('Πρέπει να είστε συνδεδεμένος για αυτή την ενέργεια');
        }

        try {
            request['user'] = await this.usersRepository.fetchByToken(token);
        } catch {
            throw new UnauthorizedException('Δε βρέθηκε ο χρήστης με το συγκεκριμένο κλειδί');
        }

        return true;
    }
}