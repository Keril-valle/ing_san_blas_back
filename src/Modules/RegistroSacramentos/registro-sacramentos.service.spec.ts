import {
  normalizeBautismoInput,
  normalizeComunionInput,
  normalizeConfirmacionInput,
  normalizeMatrimonioInput,
} from '../../Common/Utils/sacramento-input-normalizer';

describe('sacramento-input-normalizer', () => {
  it('normalizes bautismo input from mixed casing', () => {
    const input = normalizeBautismoInput({
      Id: 2,
      Nombre: 'Juan',
      cedula: 123456789,
      PrimerApellido: 'Perez',
      SegundoApellido: 'Lopez',
      NombreParroquia: 'San Blas',
      FechaBautismo: '2020-05-10',
      AnnioBautismo: 2020,
      Prebispero: 'Padre X',
      fechaNacimiento: '2019-01-01',
      horaNacimiento: '14:30',
      NombreAbuelosPaternos: 'Abuelos P',
      NombreAbuelosMaternos: 'Abuelos M',
    });

    expect(input).toMatchObject({
      id: 2,
      nombre: 'Juan',
      cedula: 123456789,
      primerApellido: 'Perez',
      fechaBautismo: '2020-05-10',
      horaNacimiento: '14:30',
    });
  });

  it('normalizes comunion, confirmacion and matrimonio input', () => {
    expect(
      normalizeComunionInput({
        Nombre: 'Ana',
        DiaComunion: '12',
        MesComunion: 'Mayo',
        AnnioComunion: 2021,
        LugarComunion: 'Nicoya',
      }).nombre,
    ).toBe('Ana');

    expect(
      normalizeConfirmacionInput({
        Nombre: 'Luis',
        DiaConfirmacion: '3',
        MesConfirmacion: 'Junio',
        AnnioConfirmacion: 2022,
        LugarConfirmacion: 'Parroquia',
      }).diaConfirmacion,
    ).toBe('3');

    expect(
      normalizeMatrimonioInput({
        NombreContrayente: 'A',
        NombreContrayente2: 'B',
        DiaMatrimonio: '8',
        MesMatrimonio: 'Julio',
        AnnioMatrimonio: 2023,
        LugarMatrimonio: 'Iglesia',
        Tomo: 1,
        Folio: 2,
      }).tomo,
    ).toBe(1);
  });
});
