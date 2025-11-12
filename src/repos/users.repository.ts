import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

// Entities
import { User } from 'src/entities/user.entity';

const nanoid = customAlphabet('123456789qwertyujlcvpfghka', 8);

@Injectable()
export class UsersRepository {
    private readonly cache = new Map<string, User>();

    constructor(
        @InjectRepository(User)
        private repository: Repository<User>,
    ) { }

    async generateTokens(total: number) {
        const tokens = await this.repository.find({
            select: ['token']
        });

        const newTokens = new Set<string>();
        const oldTokens = new Set<string>(tokens.map(({ token }) => token));

        for (let i = 0; i < total;) {
            const token = nanoid();

            if (oldTokens.has(token) || newTokens.has(token)) {
                continue;
            }

            newTokens.add(token);
            i++;
        }

        const users = [...newTokens].map(
            (token) => this.repository.create({ token, isAdmin: false })
        );

        await this.repository.save(users);
    }

    async fetchByToken(token: string) {
        const cachedUser = this.cache.get(token);

        if (cachedUser) {
            return cachedUser;
        }

        const fetchedUser = await this.repository.findOneBy({ token });

        if (!fetchedUser) {
            throw new NotFoundException('Δε βρέθηκε χρήστης με αυτό το κλειδί');
        }

        this.cache.set(token, fetchedUser);

        return fetchedUser;
    }

    async validateToken(token: string) {
        try {
            const user = await this.fetchByToken(token);

            return { valid: true, user };
        } catch (error) {
            return { valid: false };
        }
    }

    async truncateTokens() {
        const result = this.repository
            .createQueryBuilder()
            .delete()
            .where('isAdmin = false')
            .execute();

        this.cache.clear();

        return result;
    }

    async fetchAll() {
        return (await this.repository.find({
            where: { isAdmin: false },
            order: { token: 'ASC' },
        })).map(({ token }) => token);
    }
}