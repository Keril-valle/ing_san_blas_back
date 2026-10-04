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
import { esMensajeTecnico } from '../Utils/mensajes-error';

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
    const resumen = `[${request.method}] ${request.url} -> ${status}`;

    // 5xx sí lleva stack; los 4xx son ruido de negocio y no necesitan stack.
    if (status >= 500) {
      this.logger.error(
        resumen,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(resumen);
    }

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

    if (this.isBodyParserError(exception)) {
      const type = (exception as { type?: unknown }).type;
      const demasiadoGrande = type === 'entity.too.large';
      return {
        status: demasiadoGrande
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST,
        mensaje: demasiadoGrande
          ? 'La solicitud es demasiado grande. Verifique el tamaño de los datos enviados.'
          : 'Los datos enviados no son válidos. Revise e intente de nuevo.',
      };
    }

    if (this.isMulterError(exception)) {
      const code = (exception as Error & { code?: string }).code;
      return {
        status: HttpStatus.BAD_REQUEST,
        mensaje:
          code === 'LIMIT_FILE_SIZE'
            ? 'El archivo no puede superar 5 MB.'
            : 'No se pudo procesar el archivo enviado. Verifique el formato e intente de nuevo.',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje:
        'Ocurrió un error inesperado. Intente nuevamente o contacte al administrador.',
    };
  }

  /**
   * body-parser lanza errores con `type = 'entity.*'` (p. ej.
   * `entity.too.large` cuando el cuerpo pasa de 100 KB). Sin esta rama
   * respondían 500 y el usuario veía "error inesperado" en vez del motivo real.
   */
  private isBodyParserError(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) return false;
    const type = (exception as { type?: unknown }).type;
    return typeof type === 'string' && type.startsWith('entity.');
  }

  /** Multer lanza errores con `name = 'MulterError'` y un código `LIMIT_*`. */
  private isMulterError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    const code = (exception as Error & { code?: unknown }).code;
    return (
      exception.name === 'MulterError' ||
      (typeof code === 'string' && code.startsWith('LIMIT_'))
    );
  }

  private resolveHttpExceptionMessage(exception: HttpException): string {
    const response = exception.getResponse();
    const status: HttpStatus = exception.getStatus();

    if (typeof response === 'string') {
      if (
        !this.isFrameworkDefaultMessage(response) &&
        this.isSafeUserMessage(response)
      ) {
        return response;
      }
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
        !this.isFrameworkDefaultMessage(payload.message) &&
        this.isSafeUserMessage(payload.message)
      ) {
        return payload.message;
      }
    }

    if (status === HttpStatus.NOT_FOUND) {
      return 'El recurso solicitado no fue encontrado.';
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return 'Los datos enviados no son válidos. Revise e intente de nuevo.';
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return 'No autorizado, debés iniciar sesión para acceder a esta función';
    }

    if (status === HttpStatus.FORBIDDEN) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
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

  /**
   * Nest/Express devuelven mensajes genéricos en inglés ("Unauthorized",
   * "Cannot GET /ruta", "Validation failed (numeric string is expected)" de
   * ParseIntPipe). Al usuario le llega el texto español del estado.
   */
  private isFrameworkDefaultMessage(message: string): boolean {
    const limpio = message.trim().toLowerCase();
    return (
      limpio === 'unauthorized' ||
      limpio === 'forbidden' ||
      limpio === 'not found' ||
      limpio === 'bad request' ||
      limpio === 'internal server error' ||
      limpio === 'service unavailable' ||
      limpio.startsWith('throttlerexception') ||
      limpio.startsWith('validation failed') ||
      /^cannot (get|post|put|patch|delete|head|options) /.test(limpio)
    );
  }

  private isSafeUserMessage(message: string): boolean {
    return message.trim().length > 0 && !esMensajeTecnico(message);
  }
}
