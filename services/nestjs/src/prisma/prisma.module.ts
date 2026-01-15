import { Global, Module, OnModuleDestroy } from '@nestjs/common'
import { prisma } from './prisma.client'
import { PRISMA } from '../constants/providers'

@Global()
@Module({
  providers: [
    {
      provide: PRISMA,
      useValue: prisma,
    },
  ],
  exports: [PRISMA],
})
export class PrismaModule implements OnModuleDestroy {
  async onModuleDestroy() {
    prisma.$disconnect()
  }
}
