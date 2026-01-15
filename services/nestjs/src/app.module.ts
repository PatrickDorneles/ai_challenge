import { Module } from '@nestjs/common'
import { AiModule } from './ai/ai.module'
import { PrismaModule } from './prisma/prisma.module'
import { ConfigModule } from './config/config.module'

@Module({
  imports: [ConfigModule, PrismaModule, AiModule],
})
export class AppModule {}
