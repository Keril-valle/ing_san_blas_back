import {
  Controller,
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
import { Roles } from '../Auth/Decorators/roles.decorator';
import { Role } from '../Common/Enums/Roles';
import type { RequestWithUser } from '../Common/Interfaces/requestWithUser.interface';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.createUser(createUsuarioDto);
  }

  // sin query params devuelve la lista completa (compatibilidad con el frontend actual);
  // con ?page=&limit=&search= responde { data, total, page, pages, limit } para paginar en el servidor
  @Get()
  @Roles(Role.ADMIN)
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
  async obtenerNombrePorCedula(@Param('cedula') cedula: string) {
    const resp = await fetch(`https://apis.gometa.org/cedulas/${cedula}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.nombre ?? null;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(+id);
  }

  @Get('nombre/:nombre')
  findUserByName(@Param('nombre') userName: string) {
    return this.usuarioService.findByUserName(userName);
  }

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

  @Get('email/:email')
  findOneByEmail(@Param('email') email: string) {
    return this.usuarioService.findOneByEmail(email);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usuarioService.remove(+id, Number(req.user.sub));
  }
}
