import { Column, Entity, PrimaryGeneratedColumn, Unique, CreateDateColumn } from 'typeorm';

@Entity('users')
@Unique('token_unique_idx', ['token'])
export class User {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    token: string;

    @Column('boolean', { name: 'is_admin', default: 'false' })
    isAdmin: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}