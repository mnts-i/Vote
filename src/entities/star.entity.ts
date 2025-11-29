import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stars')
export class Star {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    name: string;

    @Column('varchar', { nullable: true })
    field?: string | null;

    @Column('varchar', { nullable: true })
    color?: string | null;

    @Column('varchar', { nullable: true })
    image?: string | null;

    @Column('int')
    position: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}