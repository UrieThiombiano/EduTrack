import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, Optional } from '@nestjs/common';
import { Response, Request } from 'express';
import { SuperAdminService } from '../../modules/super-admin/super-admin.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly superAdminService?: SuperAdminService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as Record<string, unknown>;
        message = (body.message as string | string[]) ?? message;
        if (Array.isArray(message)) {
          errors = message;
          message = 'Validation échouée';
        }
      }
    } else if (this.isPrismaKnownError(exception)) {
      status = HttpStatus.CONFLICT;
      switch (exception.code) {
        case 'P2002':
          message = `Doublon : ${(exception.meta?.target as string[])?.join(', ')} déjà utilisé`;
          break;
        case 'P2025':
          message = 'Ressource introuvable';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Contrainte de clé étrangère violée';
          break;
        default:
          message = `Erreur base de données (${exception.code})`;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${exception.message}`, exception.stack);
    }

    // Pousser les erreurs 5xx vers le journal PUKRI
    if (status >= 500 && this.superAdminService) {
      const user = (request as any).user;
      this.superAdminService.pushAlert({
        method: request.method,
        path: request.url,
        status,
        message: Array.isArray(message) ? message.join(', ') : String(message),
        etablissementId: user?.etablissementId,
      }).catch(() => undefined);
    }

    const body: Record<string, unknown> = { statusCode: status, message, timestamp: new Date().toISOString(), path: request.url };
    if (errors) body.errors = errors;
    response.status(status).json(body);
  }

  private isPrismaKnownError(e: unknown): e is { code: string; meta?: Record<string, unknown> } {
    return (
      typeof e === 'object' && e !== null && 'code' in e &&
      typeof (e as Record<string, unknown>).code === 'string' &&
      String((e as Record<string, unknown>).code).startsWith('P')
    );
  }
}
