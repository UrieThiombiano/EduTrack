import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { paginate } from '../../common/helpers/pagination.helper';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: QueryNotificationDto) {
    const where: any = { id_destinataire: userId };
    if (query.non_lues === 'true') where.est_lu = false;
    if (query.type_notification) where.type_notification = query.type_notification;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { date_creation: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const non_lues = await this.prisma.notification.count({ where: { id_destinataire: userId, est_lu: false } });

    return { ...paginate(data, total, query.page, query.limit), non_lues };
  }

  async marquerLu(id: number, userId: number) {
    const notif = await this.prisma.notification.findFirst({
      where: { id_notification: id, id_destinataire: userId },
    });
    if (!notif) throw new NotFoundException(`Notification #${id} introuvable`);

    return this.prisma.notification.update({
      where: { id_notification: id },
      data: { est_lu: true, date_lecture: new Date() },
    });
  }

  async marquerToutLu(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id_destinataire: userId, est_lu: false },
      data: { est_lu: true, date_lecture: new Date() },
    });
    return { count: result.count, message: `${result.count} notification(s) marquée(s) comme lue(s)` };
  }

  async countNonLues(userId: number) {
    const count = await this.prisma.notification.count({ where: { id_destinataire: userId, est_lu: false } });
    return { count };
  }
}
