import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { RegisterDto } from '../Auth/DTO/register.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Public } from '../Auth/Decorators/public.decorator';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() registerDto: RegisterDto) {
    return this.usuarioService.createUser(registerDto);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  @Public()
  @Get('cedula/:cedula')
  async obtenerNombrePorCedula(@Param('cedula') cedula: string) {
    const datosCedula = await this.usuarioService.obtenerNombrePorCedula(cedula);
    return {
      "mi nombre es": datosCedula?.nombre,
      "mi primer apellido es": datosCedula?.apellido1,
      "mi segundo apellido es": datosCedula?.apellido2,
    };
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
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(+id, updateUsuarioDto);
  }

  @Get('email/:email')
  findOneByEmail(@Param('email') email: string) {
    return this.usuarioService.findOneByEmail(email);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuarioService.remove(+id);
  }
}
