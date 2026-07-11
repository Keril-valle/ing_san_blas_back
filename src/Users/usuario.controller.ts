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
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Public } from 'src/Auth/Decorators/public.decorator';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }
   @Public()
   // la ruta es http://localhost:3000/usuario/cedula/:cedula, donde :cedula es el parámetro que se pasa en la URL

   @Get('cedula/:cedula')
   //esto solo es un ejemplo de como se puede usar el servicio para obtener el nombre de una persona a partir de su cédula
   async obtenerNombrePorCedula(@Param('cedula') cedula: string) {
     const datosCedula = await this.usuarioService.obtenerNombrePorCedula(cedula);
     return {
      "mi nombre es": datosCedula?.nombre,
      "mi primer apellido es": datosCedula?.apellido1,
      "mi segundo apellido es": datosCedula?.apellido2
     }
   }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(+id);
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
