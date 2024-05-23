import { DataSource, DataSourceOptions } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { envFilePath } from './src/common/utils'
import { EnvVariables } from './src/common/app.constants'
import { UserEntity } from './src/users/entities/user.entity'
import { FileEntity } from './src/tg-bot/entity/file.entity'
import { CreateUserEntity1686138383992 } from './migrations/1686138383992-CreateUserEntity'
import { CreateFileEntity1686138571664 } from './migrations/1686138571664-CreateFileEntity'
import { FileCreateDateIndex1686292244871 } from './migrations/1686292244871-FileCreateDateIndex'

config({ path: envFilePath })

const configService = new ConfigService({ envFilePath })

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get(EnvVariables.dbHost),
  port: configService.get(EnvVariables.dbPort),
  username: configService.get(EnvVariables.dbUserName),
  password: configService.get(EnvVariables.dbUserPassword),
  database: configService.get(EnvVariables.dbName),
  entities: [UserEntity, FileEntity],
  migrations: [CreateUserEntity1686138383992, CreateFileEntity1686138571664, FileCreateDateIndex1686292244871]
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
