import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Roles } from '../Auth/Decorators/roles.decorator';
import { Role } from '../Common/Enums/Roles';
import { CreateRolDto } from './DTO/create-rol.dto';
import { RolService } from './rol.service';

@Controller('roles')
@Roles(Role.ADMIN)
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Get()
  findAll() {
    return this.rolService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRolDto) {
    return this.rolService.create(dto);
  }
}
