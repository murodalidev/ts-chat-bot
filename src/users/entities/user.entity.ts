import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'users' })
@Index(['tgId', 'phoneNumber'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  fullName: string

  @Column()
  phoneNumber: string

  @Column({ nullable: true })
  tgUsername: string

  @Column({ type: 'bigint' })
  tgId: number
}
