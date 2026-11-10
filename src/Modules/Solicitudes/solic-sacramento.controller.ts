import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSolicSacramentoPublicaDto } from './DTO/create-solic-sacramento-publica.dto';
import type { CreateSolicSacramentoDto } from './DTO/create-solic-sacramento.dto';
import { RecaptchaService } from '../../Common/Recaptcha/recaptcha.service';
import { UpdateSolicSacramentoDto } from './DTO/update-solic-sacramento.dto';
import { CambiarEstadoSolicitudDto } from './DTO/cambiar-estado-solicitud.dto';
import { RechazarSolicitudDto } from './DTO/rechazar-solicitud.dto';
import { SearchSolicSacramentoDto } from './DTO/search-solic-sacramento.dto';
import { BuscarSolicSacramentoDto } from './DTO/buscar-solic-sacramento.dto';
import { SolicSacramentoService } from './solic-sacramento.service';
import { EstadoSolicitud } from '../../Common/Enums/EstadoSolicitud';
import { Public } from '../../Auth/Decorators/public.decorator';
import { Permisos } from '../../Auth/Decorators/permisos.decorator';
import type { Request } from 'express';
import type { RequestWithUser } from '../../Common/Interfaces/requestWithUser.interface';

@Controller('solic-sacramento')
export class SolicSacramentoController {
  constructor(
    private readonly solicSacraService: SolicSacramentoService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  // No guardamos una solicitud pública sin verificar su token con Google.
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSolicSacramentoPublicaDto) {
    const { recaptchaToken, ...solicitud } = dto;
    await this.recaptcha.verificar(recaptchaToken);
    return this.solicSacraService.create(solicitud);
  }

  // También verifica el envío multipart antes de subir el comprobante a Cloudinary.
  @Public()
  @Post('con-imagen')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('archivo'))
  async createWithImage(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const payload = (req.body as { Payload?: string } | undefined)?.Payload;
    if (!payload?.trim()) {
      throw new BadRequestException({
        mensaje: 'Los datos de la solicitud son obligatorios.',
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException({
        mensaje: 'El formato de los datos de la solicitud no es válido.',
      });
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('Los datos de la solicitud no son válidos.');
    }
    const { recaptchaToken, ...solicitud } = parsed as Record<string, unknown>;
    await this.recaptcha.verificar(recaptchaToken);
    return this.solicSacraService.createWithImage(
      solicitud as unknown as CreateSolicSacramentoDto,
      archivo,
    ); // conserva el contrato multipart existente, pero nunca persiste el token
  }

  @SkipThrottle()
  @Permisos('constancias')
  @Get()
  findAll(@Query() filters: SearchSolicSacramentoDto) {
    return this.solicSacraService.findAll(filters);
  }

  @Permisos('constancias')
  @Get('buscar')
  buscar(@Query() filters: BuscarSolicSacramentoDto) {
    return this.solicSacraService.buscar(filters);
  }

  @Permisos('constancias')
  @Get('buscar/nombre/:nombre')
  async BuscarSolicPorNombre(@Param('nombre') nombre: string) {
    return this.solicSacraService.BuscarSolicPorNombre(nombre);
  }

  @Permisos('constancias')
  @Get('buscar/apellido/:apellido')
  async BuscarSolicPorApellido(@Param('apellido') apellido: string) {
    return this.solicSacraService.BuscarSolicPorApellido(apellido);
  }

  @Permisos('constancias')
  @Get('buscar/cedula/:cedula')
  async BuscarSolicPorCedula(@Param('cedula') cedula: string) {
    return this.solicSacraService.BuscarSolicPorCedula(+cedula);
  }

  @Permisos('constancias')
  @Get('buscar/estado/:estado')
  async BuscarPorEstado(@Param('estado') estado: EstadoSolicitud) {
    return this.solicSacraService.BuscarPorEstado(estado);
  }

  @Get('estado/:id')
  async verEstadoSolicitud(@Param('id') id: string) {
    return this.solicSacraService.verEstadoSolicitud(+id);
  }

  @Permisos('constancias')
  @Get('historial-rechazos')
  async obtenerHistorialRechazos() {
    return this.solicSacraService.obtenerHistorialRechazos();
  }

  @Permisos('constancias')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicSacraService.findOne(+id);
  }

  @Permisos('constancias')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSolicSacramentoDto: UpdateSolicSacramentoDto,
  ) {
    return this.solicSacraService.update(+id, updateSolicSacramentoDto);
  }

  @Permisos('constancias')
  @Patch('cambiar-estado/:id')
  async CambiarEstadoSolicitud(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoSolicitudDto,
  ) {
    return this.solicSacraService.CambiarEstadoSolicitud(
      +id,
      cambiarEstadoDto.nuevoEstado,
    );
  }

  @Permisos('constancias')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.solicSacraService.remove(+id);
  }

  @Permisos('constancias')
  @Patch(':id/rechazar')
  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() rechazarSolicitudDto: RechazarSolicitudDto,
    @Req() req: RequestWithUser,
  ) {
    return this.solicSacraService.rechazarSolicitud(
      +id,
      rechazarSolicitudDto.motivoRechazo,
      rechazarSolicitudDto.detalleRechazo,
      req.user.sub,
    );
  }
}
