import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearInscripcionCicaDto } from '../../Modules/Cica/DTO/inscripcion-cica.dto';
import { CrearInscripcionCatequesisBautismoDto } from '../../Modules/CatequesisBautismo/DTO/inscripcion-catequesis-bautismo.dto';
import { CicaService } from '../../Modules/Cica/cica.service';
import { CatequesisBautismoService } from '../../Modules/CatequesisBautismo/catequesis-bautismo.service';

for (const Dto of [
  CrearInscripcionCicaDto,
  CrearInscripcionCatequesisBautismoDto,
]) {
  describe(`Identificación en ${Dto.name}`, () => {
    // Solo revisa estos campos; las otras reglas del formulario tienen sus propios datos obligatorios.
    const erroresIdentificacion = async (datos: object) => {
      const dto = plainToInstance(Dto as typeof CrearInscripcionCicaDto, datos);
      const errores = await validate(dto, { whitelist: true });
      return errores.filter((error) =>
        ['cedula', 'tipoCedula'].includes(error.property),
      );
    };

    it('acepta nueve dígitos sin tipo para mantener compatibilidad', async () => {
      expect(await erroresIdentificacion({ cedula: '102340567' })).toEqual([]);
    });

    it('acepta doce dígitos con tipo extranjera y conserva ceros iniciales', async () => {
      expect(
        await erroresIdentificacion({
          cedula: '012345678901',
          tipoCedula: 'extranjera',
        }),
      ).toEqual([]);
      const dto = plainToInstance(Dto as typeof CrearInscripcionCicaDto, {
        cedula: '012345678901',
        tipoCedula: 'extranjera',
      });
      expect(dto.cedula).toBe('012345678901');
    });

    it.each([
      { cedula: '123456789012', tipoCedula: 'nacional' },
      { cedula: '102340567', tipoCedula: 'extranjera' },
      { cedula: '12345678901', tipoCedula: 'extranjera' },
      { cedula: '12345678901A', tipoCedula: 'extranjera' },
      { cedula: '102340567', tipoCedula: 'otro' },
    ])('rechaza identificación incompatible: %j', async (datos) => {
      expect((await erroresIdentificacion(datos)).length).toBeGreaterThan(0);
    });
  });
}

for (const Servicio of [CicaService, CatequesisBautismoService]) {
  describe(`Consulta completa en ${Servicio.name}`, () => {
    const construir = (repositorio: object) =>
      Servicio === CatequesisBautismoService
        ? new CatequesisBautismoService(repositorio as never, {
            notificarInscripcion: jest.fn(),
            notificarEstado: jest.fn(),
          } as never)
        : new CicaService(repositorio as never);

    const consultar = (
      servicio: CicaService | CatequesisBautismoService,
      cedula: string,
    ) =>
      Servicio === CatequesisBautismoService
        ? (servicio as CatequesisBautismoService).consultarPorCedula(
            cedula,
            '1990-01-01',
          )
        : (servicio as CicaService).consultarPorCedula(cedula);

    it('guarda la cédula completa como texto al crear la inscripción', async () => {
      const datos = {
        cedula: '012345678901',
        tipoCedula: 'extranjera',
        necesitaBautizo: true,
        esCatolico: true,
        provincia: 'Guanacaste',
        canton: 'Nicoya',
        distrito: 'Nicoya', // la prueba de cédula también necesita una ubicación válida
      };
      const repositorio = {
        create: jest.fn().mockImplementation((valor: object) => valor),
        save: jest
          .fn()
          .mockImplementation((valor: object) =>
            Promise.resolve({ ...valor, id: 1 }),
          ),
      };
      const servicio = construir(repositorio);
      await servicio.crear(datos as never);
      expect(repositorio.save).toHaveBeenCalledWith(
        expect.objectContaining({ cedula: '012345678901' }),
      );
    });

    it('busca por los doce dígitos sin truncarlos', async () => {
      const repositorio = { find: jest.fn().mockResolvedValue([]) };
      const servicio = construir(repositorio);
      await consultar(servicio, '012345678901');
      expect(repositorio.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cedula: '012345678901' }),
        }),
      );
    });

    it('rechaza longitudes intermedias antes de consultar la base', () => {
      const repositorio = { find: jest.fn() };
      const servicio = construir(repositorio);
      expect(() => consultar(servicio, '12345678901')).toThrow();
      expect(repositorio.find).not.toHaveBeenCalled();
    });
  });
}
