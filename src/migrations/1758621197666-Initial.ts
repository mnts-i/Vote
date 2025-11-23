import { User } from 'src/entities/user.entity';
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class Initial1758621197666 implements MigrationInterface {
    async up(queryRunner: QueryRunner) {
        const starsTable = new Table({
            name: 'stars',
            columns: [
                { name: 'id', type: 'integer',  isPrimary: true, generationStrategy: 'increment' },

                { name: 'name', type: 'varchar' },
                { name: 'field', type: 'varchar', isNullable: true },
                { name: 'color', type: 'varchar', isNullable: true },
                { name: 'image', type: 'varchar', isNullable: true },

                { name: 'created_at', type: 'datetime', default: `(datetime('now'))` },
            ]
        });

        await queryRunner.createTable(starsTable);

        const usersTable = new Table({
            name: 'users',
            columns: [
                { name: 'id', type: 'integer',  isPrimary: true, generationStrategy: 'increment' },

                { name: 'token', type: 'varchar' },
                { name: 'is_admin', type: 'boolean', default: false },

                { name: 'created_at', type: 'datetime', default: `(datetime('now'))` },
            ]
        });

        await queryRunner.createTable(usersTable);

        await queryRunner.createUniqueConstraint(usersTable, new TableUnique({
            name: 'token_unique_idx',
            columnNames: ['token'],
        }));

        const votesTable = new Table({
            name: 'votes',
            columns: [
                { name: 'user_id', type: 'integer' },
                { name: 'star_id', type: 'integer' },
                { name: 'score', type: 'integer' },

                { name: 'created_at', type: 'datetime', default: `(datetime('now'))` },
            ]
        });

        await queryRunner.createTable(votesTable);

        await queryRunner.createPrimaryKey(votesTable, ['user_id', 'star_id'], 'vote_pk');

        await queryRunner.createForeignKey(votesTable, new TableForeignKey({
            name: 'vote_to_user_fk',
            columnNames: ['user_id'],
            referencedTableName: usersTable.name,
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }));

        await queryRunner.createForeignKey(votesTable, new TableForeignKey({
            name: 'vote_to_star_fk',
            columnNames: ['star_id'],
            referencedTableName: starsTable.name,
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }));

        await queryRunner.createIndex(votesTable, new TableIndex({
            name: 'vote_star_id_idx',
            columnNames: ['star_id']
        }))
        
        await queryRunner.manager.getRepository(User).save({
            token: 'feneri1986!',
            isAdmin: true,
        })
    }

    async down(queryRunner: QueryRunner) {
        await queryRunner.dropTable('votes', true, true, true);
        await queryRunner.dropTable('users', true, true, true);
        await queryRunner.dropTable('stars', true, true, true);
    }
}