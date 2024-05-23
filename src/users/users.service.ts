import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>) {}

  async createUser(createUserDto: CreateUserDto) {
    const newUser = this.usersRepository.create(createUserDto)
    await this.usersRepository.save(newUser)
    return newUser
  }

  async findByTgIdOrPhone(tgId: number, phoneNumber: string) {
    return this.usersRepository.findOne({ where: [{ tgId }, { phoneNumber }] })
  }
}
