import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ PostgreSQL connecté');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Soft delete — met est_actif à false */
  async softDelete(model: string, where: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any)[model].update({ where, data: { est_actif: false } });
  }
}
