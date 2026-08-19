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
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, mensaje } = this.resolveException(exception);

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      mensaje,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveException(exception: unknown): FriendlyError {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        mensaje: this.resolveHttpExceptionMessage(exception),
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
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return this.isSafeUserMessage(response)
        ? response
        : 'La solicitud no pudo procesarse. Verifique los datos e intente de nuevo.';
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
        return payload.message.join(' ');
      }

      if (
        typeof payload.message === 'string' &&
        this.isSafeUserMessage(payload.message)
      ) {
        return payload.message;
      }
    }

    if (exception.getStatus() === HttpStatus.NOT_FOUND) {
      return 'El recurso solicitado no fue encontrado.';
    }

    if (exception.getStatus() === HttpStatus.BAD_REQUEST) {
      return 'Los datos enviados no son válidos. Revise e intente de nuevo.';
    }

    if (exception.getStatus() === HttpStatus.UNAUTHORIZED) {
      return 'No autorizado, debés iniciar sesión para acceder a esta función';
    }

    if (exception.getStatus() === HttpStatus.FORBIDDEN) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
      return 'Demasiadas solicitudes. Espere un momento e intente de nuevo.';
    }

    return 'Ocurrió un error al procesar la solicitud.';
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
