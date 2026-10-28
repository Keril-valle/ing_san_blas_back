import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface FriendlyError {
  status: number;
  mensaje: string;
  errores?: Record<string, string[]>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, mensaje, errores } = this.resolveException(exception);

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      mensaje,
      timestamp: new Date().toISOString(),
      ...(errores ? { errores } : {}),
    });
  }

  private resolveException(exception: unknown): FriendlyError {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const errores =
        typeof response === 'object' &&
        response !== null &&
        'errores' in response &&
        response.errores &&
        typeof response.errores === 'object'
          ? (response.errores as Record<string, string[]>)
          : undefined;

      return {
        status: exception.getStatus(),
        mensaje: this.resolveHttpExceptionMessage(exception),
        errores,
      };
    }

    if (exception instanceof QueryFailedError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        mensaje:
          'No fue posible consultar la información en este momento. Intente más tarde.',
      };
    }

    if (this.isConnectionError(exception)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        mensaje:
          'No hay conexión disponible con el servicio de datos. Intente más tarde.',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje:
        'Ocurrió un error inesperado. Intente nuevamente o contacte al administrador.',
    };
  }

  private resolveHttpExceptionMessage(exception: HttpException): string {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // Mensajes de Nest/Throttler suelen traer la palabra "Exception" y el
    // filtro de seguridad los descartaba; usamos el estado HTTP primero.
    const porEstado = this.mensajePorEstadoHttp(status);

    if (typeof response === 'string') {
      return this.isSafeUserMessage(response)
        ? response
        : (porEstado ??
            'La solicitud no pudo procesarse. Verifique los datos e intente de nuevo.');
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as {
        message?: string | string[];
        mensaje?: string;
      };

      if (payload.mensaje && this.isSafeUserMessage(payload.mensaje)) {
        return payload.mensaje;
      }

      if (Array.isArray(payload.message)) {
        const unido = payload.message.join(' ');
        return this.isSafeUserMessage(unido)
          ? unido
          : (porEstado ?? unido);
      }

      if (
        typeof payload.message === 'string' &&
        this.isSafeUserMessage(payload.message)
      ) {
        return payload.message;
      }
    }

    return porEstado ?? 'Ocurrió un error al procesar la solicitud.';
  }

  private mensajePorEstadoHttp(status: number): string | null {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return 'El recurso solicitado no fue encontrado.';
      case HttpStatus.BAD_REQUEST:
        return 'Los datos enviados no son válidos. Revise e intente de nuevo.';
      case HttpStatus.UNAUTHORIZED:
        return 'No autorizado, debés iniciar sesión para acceder a esta función';
      case HttpStatus.FORBIDDEN:
        return 'No tiene permisos para realizar esta acción.';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Demasiadas solicitudes. Espere un momento e intente de nuevo.';
      default:
        return null;
    }
  }

  private isConnectionError(exception: unknown): boolean {
    if (!(exception instanceof Error)) {
      return false;
    }

    const errorWithCode = exception as Error & { code?: string };
    const connectionCodes = new Set([
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH',
    ]);

    if (errorWithCode.code && connectionCodes.has(errorWithCode.code)) {
      return true;
    }

    const message = exception.message.toLowerCase();
    return (
      message.includes('connection terminated') ||
      message.includes('connect etimedout') ||
      message.includes('connection refused')
    );
  }

  private isSafeUserMessage(message: string): boolean {
    const technicalPattern =
      /(query failed|syntax error|typeorm|exception|stack|sql|postgres|ECONN|at \w+\()/i;
    return message.trim().length > 0 && !technicalPattern.test(message);
  }
}
