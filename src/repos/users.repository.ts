import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

// Entities
import { User } from 'src/entities/user.entity';

const nanoid = customAlphabet('0123456789qwertyuipfghka', 8);

@Injectable()
export class UsersRepository {
    private readonly cache = new Map<string, User>();

    constructor(
        @InjectRepository(User)
        private repository: Repository<User>,
    ) { }

    async generateUsers(total: number) {
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
            await this.fetchByToken(token);
            
            return true;
        } catch (error) {
            return false;
        }
    }
}