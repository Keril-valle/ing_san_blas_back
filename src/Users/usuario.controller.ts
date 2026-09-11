import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Public } from '../Auth/Decorators/public.decorator';
import type { RequestWithUser } from '../Common/Interfaces/requestWithUser.interface';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.createUser(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
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
    return this.usuarioService.update(+id, updateUsuarioDto, Number(req.user.sub));
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
