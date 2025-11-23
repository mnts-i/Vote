import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('votes')
@Unique('vote_per_star_unique_idx', ['userId', 'starId'])
export class Vote {

    @PrimaryColumn('integer', { name: 'user_id' })
    userId: number;

    @PrimaryColumn('integer', { name: 'star_id' })
    starId: number;

    @Column('integer')
    score: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}