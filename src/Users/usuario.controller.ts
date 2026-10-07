import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { BuscarUsuariosDto } from './DTO/buscar-usuarios.dto';
import { Public } from '../Auth/Decorators/public.decorator';
import { Permisos } from '../Auth/Decorators/permisos.decorator';
import type { RequestWithUser } from '../Common/Interfaces/requestWithUser.interface';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Permisos('usuarios')
  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.createUser(createUsuarioDto);
  }

  // sin query params devuelve la lista completa (compatibilidad con el frontend actual);
  // con ?page=&limit=&search= responde { data, total, page, pages, limit } para paginar en el servidor
  @Permisos('usuarios')
  @Get()
  findAll(@Query() buscarUsuariosDto: BuscarUsuariosDto) {
    const { page, limit, search, role, state, sortBy, sortDirection } =
      buscarUsuariosDto;
    if (
      page === undefined &&
      limit === undefined &&
      search === undefined &&
      role === undefined &&
      state === undefined &&
      sortBy === undefined &&
      sortDirection === undefined
    ) {
      return this.usuarioService.findAll();
    }
    return this.usuarioService.findAllPaginado(
      page,
      limit,
      search,
      role,
      state,
      sortBy,
      sortDirection,
    );
  }

  @Public()
  @Get('cedula/:cedula')
  obtenerNombrePorCedula(@Param('cedula') cedula: string) {
    return this.usuarioService.obtenerNombrePorCedula(cedula);
  }

  // Lectura propia: cualquier cuenta autenticada puede ver SU perfil
  // (Mi perfil) aunque no tenga el permiso 'usuarios'. El resto sigue
  // exigiendo el permiso. El JWT válido lo sigue exigiendo el AuthGuard.
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const solicitante = req.user;
    const misRoles: string[] = Array.isArray(solicitante?.roles)
      ? solicitante.roles
      : solicitante?.role
        ? [solicitante.role]
        : [];
    const misPermisos: string[] = Array.isArray(solicitante?.permisos)
      ? solicitante.permisos
      : [];
    const esPropio = Number(solicitante?.sub) === +id;
    const puedeVer =
      misRoles.includes('secretario') || misPermisos.includes('usuarios');
    if (!esPropio && !puedeVer) {
      throw new ForbiddenException();
    }
    return this.usuarioService.findOne(+id);
  }

  @Permisos('usuarios')
  @Get('nombre/:nombre')
  findUserByName(@Param('nombre') userName: string) {
    return this.usuarioService.findByUserName(userName);
  }

  @Permisos('usuarios')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usuarioService.update(
      +id,
      updateUsuarioDto,
      Number(req.user.sub),
    );
  }

  @Permisos('usuarios')
  @Get('email/:email')
  findOneByEmail(@Param('email') email: string) {
    return this.usuarioService.findOneByEmail(email);
  }

  @Permisos('usuarios')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usuarioService.remove(+id, Number(req.user.sub));
  }
}
