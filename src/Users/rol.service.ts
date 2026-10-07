import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IDS_PERMISOS_ROL,
  claveDesdeNombre,
} from '../Common/Constants/permisos-rol';
import { CreateRolDto } from './DTO/create-rol.dto';
import { Rol } from './Entities/rol.entity';

// Claves que nunca se pueden crear ni eliminar desde el panel.
const CLAVES_RESERVADAS = [
  'admin',
  'user',
  'secretario',
  'catequista',
  'gestor-eventos',
  'gestor-donaciones',
];

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  findAll() {
    return this.rolRepository.find({
      order: { esSistema: 'DESC', nombre: 'ASC' },
    });
  }

  findByClave(clave: string) {
    return this.rolRepository.findOne({ where: { clave } });
  }

  async assertExiste(clave: string) {
    const rol = await this.findByClave(clave);
    if (!rol) {
      throw new BadRequestException({
        mensaje: 'El rol indicado no existe.',
      });
    }
    return rol;
  }

  async assertExisten(claves: string[]): Promise<Rol[]> {
    const roles: Rol[] = [];
    for (const clave of claves) {
      roles.push(await this.assertExiste(clave));
    }
    return roles;
  }

  async create(dto: CreateRolDto) {
    const nombre = dto.nombre.trim();
    const descripcion = (dto.descripcion ?? '').trim();
    const permisos = this.normalizarPermisos(dto.permisos);
    const claveBase = claveDesdeNombre(nombre);
    const clave = await this.claveUnica(claveBase);

    if (CLAVES_RESERVADAS.includes(clave)) {
      throw new BadRequestException({
        mensaje: 'Ese nombre está reservado para un rol del sistema.',
      });
    }

    const existenteNombre = await this.rolRepository.findOne({
      where: { nombre },
    });
    if (existenteNombre) {
      throw new BadRequestException({
        mensaje: 'Ya existe un rol con ese nombre.',
      });
    }

    const rol = this.rolRepository.create({
      clave,
      nombre,
      descripcion,
      permisos,
      esSistema: false,
    });

    return this.rolRepository.save(rol);
  }

  async eliminar(id: number): Promise<void> {
    const rol = await this.rolRepository.findOne({ where: { id } });
    if (!rol) {
      throw new NotFoundException({
        mensaje: 'El rol indicado no existe.',
      });
    }
    if (rol.esSistema || CLAVES_RESERVADAS.includes(rol.clave)) {
      throw new BadRequestException({
        mensaje: 'Este rol no se puede eliminar.',
      });
    }
    // Cuentas con el rol en la columna singular o en la tabla intermedia.
    const enSingular: Array<{ total: string }> =
      await this.rolRepository.query(
        `SELECT COUNT(*) AS total FROM usuario WHERE role = $1`,
        [rol.clave],
      );
    const enIntermedia: Array<{ total: string }> =
      await this.rolRepository.query(
        `SELECT COUNT(*) AS total FROM usuario_roles ur JOIN rol r ON r.id = ur.rol_id WHERE r.clave = $1`,
        [rol.clave],
      );
    const asignados =
      Number(enSingular[0]?.total ?? 0) + Number(enIntermedia[0]?.total ?? 0);
    if (asignados > 0) {
      throw new ConflictException({
        mensaje:
          'Este rol tiene cuentas asignadas. Reasigne esas cuentas antes de eliminarlo.',
      });
    }
    await this.rolRepository.remove(rol);
  }

  tieneAccesoPanel(rol: Rol | null): boolean {
    if (!rol) return false;
    return rol.clave === 'secretario' || rol.permisos.includes('panel');
  }

  async permisosDeRoles(claves: string[]): Promise<string[]> {
    const permisos = new Set<string>();
    for (const clave of claves) {
      const rol = await this.findByClave(clave);
      if (!rol) continue;
      for (const permiso of rol.permisos) permisos.add(permiso);
    }
    if (claves.includes('secretario')) permisos.add('panel');
    return [...permisos];
  }

  private normalizarPermisos(permisos: string[]): string[] {
    const unicos = [
      ...new Set(permisos.map((item) => item.trim()).filter(Boolean)),
    ];
    const invalidos = unicos.filter(
      (item) =>
        !IDS_PERMISOS_ROL.includes(item as (typeof IDS_PERMISOS_ROL)[number]),
    );
    if (invalidos.length > 0) {
      throw new BadRequestException({
        mensaje: 'Hay permisos que no son válidos.',
      });
    }

    if (unicos.some((item) => item !== 'panel') && !unicos.includes('panel')) {
      unicos.unshift('panel');
    }

    return unicos;
  }

  private async claveUnica(base: string): Promise<string> {
    let clave = base;
    let indice = 2;
    while (await this.findByClave(clave)) {
      const sufijo = `-${indice}`;
      clave = `${base.slice(0, Math.max(1, 40 - sufijo.length))}${sufijo}`;
      indice += 1;
    }
    return clave;
  }
}
