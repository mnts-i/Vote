import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('votes')
@Unique('vote_per_star_unique_idx', ['userId', 'starId'])
export class Vote {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('integer', { name: 'user_id' })
    userId: number;

    @Column('integer', { name: 'star_id' })
    @Index('vote_star_id_idx')
    starId: number;

    @Column('integer')
    score: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}