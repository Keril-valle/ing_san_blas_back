import { BadRequestException } from '@nestjs/common';

// Mismo catálogo de los selects: https://github.com/lfbvyo/ubicaciones (MIT).
// Copia del 28/10/2026; validar una inscripción no depende de que esa web esté disponible.
const CATALOGO = `San José|Central|Carmen|Merced|Hospital|Catedral|Zapote|San Francisco De Dos Rios|Uruca|Mata Redonda|Pavas|Hatillo|San Sebastián
San José|Escazú|Escazú|San Antonio|San Rafael
San José|Desamparados|Desamparados|San Miguel|San Juan De Dios|San Rafael Arriba|San Antonio|Frailes|Patarra|San Cristobal|Rosario|Damas|San Rafael Abajo|Gravilias|Los Guido
San José|Puriscal|Santiago|Mercedes Sur|Barbacoas|Grifo Alto|San Rafael|Candelarita|Desamparaditos|San Antonio|Chires
San José|Tarrazú|San Marcos|San Lorenzo|San Carlos
San José|Aserrí|Aserrí|Tarbaca|Vuelta De Jorco|San Gabriel|Legua|Monterrey|Salitrillos
San José|Mora|Colón|Guayabo|Tabarcia|Piedras Negras|Picagres|Jaris|Quitirrisí
San José|Goicoechea|Guadalupe|San Francisco|Calle Blancos|Mata De Platano|Ipís|Rancho Redondo|Purral
San José|Santa Ana|Santa Ana|Salitral|Pozos|Uruca|Piedades|Brasil
San José|Alajuelita|Alajuelita|San Josecito|San Antonio|Concepción|San Felipe
San José|Vázquez De Coronado|San Isidro|San Rafael|Dulce Nombre De Jesus|Patalillo|Cascajal
San José|Acosta|San Ignacio|Guaitil|Palmichal|Cangrejal|Sabanillas
San José|Tibás|San Juan|Cinco Esquinas|Anselmo Llorente|Leon Xiii|Colima
San José|Moravia|San Vicente|San Jeronimo|La Trinidad
San José|Montes De Oca|San Pedro|Sabanilla|Mercedes|San Rafael
San José|Turrubares|San Pablo|San Pedro|San Juan De Mata|San Luis|Carara
San José|Dota|Santa María|Jardin|Copey
San José|Curridabat|Curridabat|Granadilla|Sanchez|Tirrases
San José|Pérez Zeledón|San Isidro De El General|El General|Daniel Flores|Rivas|San Pedro|Platanares|Pejivalle|Cajon|Baru|Rio Nuevo|Páramo|La Amistad
San José|León Cortés Castro|San Pablo|San Andres|Llano Bonito|San Isidro|Santa Cruz|San Antonio
Alajuela|Central|Alajuela|San José|Carrizal|San Antonio|Guácima|San Isidro|Sabanilla|San Rafael|Rio Segundo|Desamparados|Turrucares|Tambor|Garita|Sarapiquí
Alajuela|San Ramón|San Ramón|Santiago|San Juan|Piedades Norte|Piedades Sur|San Rafael|San Isidro|Angeles|Alfaro|Volio|Concepción|Zapotal|Peñas Blancas|San Lorenzo
Alajuela|Grecia|Grecia|San Isidro|San José|San Roque|Tacares|Puente De Piedra|Bolivar
Alajuela|San Mateo|San Mateo|Desmonte|Jesús María|Labrador
Alajuela|Atenas|Atenas|Jesús|Mercedes|San Isidro|Concepción|San José|Santa Eulalia|Escobal
Alajuela|Naranjo|Naranjo|San Miguel|San José|Cirrí Sur|San Jerónimo|San Juan|El Rosario|Palmitos
Alajuela|Palmares|Palmares|Zaragoza|Buenos Aires|Santiago|Candelaria|Esquipulas|La Granja
Alajuela|Poás|San Pedro|San Juan|San Rafael|Carrillos|Sabana Redonda
Alajuela|Orotina|Orotina|El Mastate|Hacienda Vieja|Coyolar|La Ceiba
Alajuela|San Carlos|Quesada|Florencia|Buenavista|Aguas Zarcas|Venecia|Pital|La Fortuna|La Tigra|La Palmera|Venado|Cutris|Monterrey|Pocosol
Alajuela|Zarcero|Zarcero|Laguna|Tapesco|Guadalupe|Palmira|Zapote|Brisas
Alajuela|Sarchí|Sarchí Norte|Sarchí Sur|Toro Amarillo|San Pedro|Rodriguez
Alajuela|Upala|Upala|Aguas Claras|San José o Pizote|Bijagua|Delicias|Dos Rios|Yolillal|Canalete
Alajuela|Los Chiles|Los Chiles|Caño Negro|El Amparo|San Jorge
Alajuela|Guatuso|San Rafael|Buenavista|Cote|Katira
Alajuela|Río Cuarto|Río Cuarto|Santa Rita|Santa Isabel
Cartago|Central|Oriental|Occidental|Carmen|San Nicolás|Aguacaliente o San Francisco|Guadalupe o Arenilla|Corralillo|Tierra Blanca|Dulce Nombre|Llano Grande|Quebradilla
Cartago|Paraíso|Paraiso|Santiago|Orosi|Cachí|Llanos de Santa Lucía|Birrisito
Cartago|La Unión|Tres Rios|San Diego|San Juan|San Rafael|Concepción|Dulce Nombre|San Ramón|Rio Azul
Cartago|Jiménez|Juan Viñas|Tucurrique|Pejibaye|La Victoria
Cartago|Turrialba|Turrialba|La Suiza|Peralta|Santa Cruz|Santa Teresita|Pavones|Tuis|Tayutic|Santa Rosa|Tres Equis|La Isabel|Chirripó
Cartago|Alvarado|Pacayas|Cervantes|Capellades
Cartago|Oreamuno|San Rafael|Cot|Potrero Cerrado|Cipreses|Santa Rosa
Cartago|El Guarco|El Tejar|San Isidro|Tobosi|Patio De Agua
Heredia|Central|Heredia|Mercedes|San Francisco|Ulloa|Varablanca
Heredia|Barva|Barva|San Pedro|San Pablo|San Roque|Santa Lucía|San José de la Montaña|Puente Salas
Heredia|Santo Domingo|Santo Domingo|San Vicente|San Miguel|Paracito|Santo Tomás|Santa Rosa|Tures|Para
Heredia|Santa Barbara|Santa Bárbara|San Pedro|San Juan|Jesús|Santo Domingo|Puraba
Heredia|San Rafael|San Rafael|San Josecito|Santiago|Los Ángeles|Concepción
Heredia|San Isidro|San Isidro|San José|Concepción|San Francisco
Heredia|Belén|San Antonio|La Ribera|La Asuncion
Heredia|Flores|San Joaquín|Barrantes|Llorente
Heredia|San Pablo|San Pablo|Rincon De Sabanilla
Heredia|Sarapiquí|Puerto Viejo|La Virgen|Las Horquetas|Llanuras Del Gaspar|Cureña
Guanacaste|Liberia|Liberia|Cañas Dulces|Mayorga|Nacascolo|Curubande
Guanacaste|Nicoya|Nicoya|Mansión|San Antonio|Quebrada Honda|Sámara|Nosara|Belén De Nosarita
Guanacaste|Santa Cruz|Santa Cruz|Bolson|Veintisiete de Abril|Tempate|Cartagena|Cuajiniquil|Diria|Cabo Velas|Tamarindo
Guanacaste|Bagaces|Bagaces|La Fortuna|Mogote|Rio Naranjo|Pijije
Guanacaste|Carrillo|Filadelfia|Palmira|Sardinal|Belen
Guanacaste|Cañas|Cañas|Palmira|San Miguel|Bebedero|Porozal
Guanacaste|Abangares|Las Juntas|Sierra|San Juan|Colorado
Guanacaste|Tilarán|Tilarán|Quebrada Grande|Tronadora|Santa Rosa|Líbano|Tierras Morenas|Arenal|Cabeceras
Guanacaste|Nandayure|Carmona|Santa Rita|Zapotal|San Pablo|Porvenir|Bejuco
Guanacaste|La Cruz|La Cruz|Santa Cecilia|La Garita|Santa Elena
Guanacaste|Hojancha|Hojancha|Monte Romo|Puerto Carrillo|Huacas|Matambú
Puntarenas|Central|Puntarenas|Pitahaya|Chomes|Lepanto|Paquera|Manzanillo|Guacimal|Barranca|Isla Del Coco|Cóbano|Chacarita|Chira|Acapulco|El Roble|Arancibia
Puntarenas|Esparza|Espíritu Santo|San Juan Grande|Macacona|San Rafael|San Jerónimo|Caldera
Puntarenas|Buenos Aires|Buenos Aires|Volcán|Potrero Grande|Boruca|Pilas|Colinas|Changuena|Biolley|Brunka|Cabagra
Puntarenas|Montes De Oro|Miramar|La Unión|San Isidro
Puntarenas|Osa|Puerto Cortés|Palmar|Sierpe|Bahía Ballena|Piedras Blancas|Bahía Drake
Puntarenas|Quepos|Quepos|Savegre|Naranjito
Puntarenas|Golfito|Golfito|Guaycara|Pavón
Puntarenas|Coto Brus|San Vito|Sabalito|Aguabuena|Limoncito|Pittier|Gutiérrez Braun
Puntarenas|Parrita|Parrita
Puntarenas|Corredores|Corredor|La Cuesta|Canoas|Laurel
Puntarenas|Garabito|Jacó|Tárcoles|Lagunillas
Puntarenas|Monteverde|Monteverde
Puntarenas|Puerto Jiménez|Puerto Jiménez
Limón|Central|Limón|Valle La Estrella|Rio Blanco|Matama
Limón|Pococí|Guapiles|Jiménez|Rita|Roxana|Cariari|Colorado|La Colonia
Limón|Siquirres|Siquirres|Pacuarito|Florida|Germania|El Cairo|Alegría|Reventazón
Limón|Talamanca|Bratsi|Sixaola|Cahuita|Telire
Limón|Matina|Matina|Batán|Carrandi
Limón|Guácimo|Guácimo|Mercedes|Pocora|Rio Jiménez|Duacari`;

const normalizar = (valor: string) =>
  valor
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
const ubicaciones = CATALOGO.split('\n').map((fila) =>
  fila.split('|').map(normalizar),
);

// Un texto válido no basta: el distrito debe pertenecer al cantón y este a la provincia.
export function validarUbicacionCostaRica(datos: {
  provincia: string;
  canton: string;
  distrito: string;
}): void {
  const provincia = normalizar(datos.provincia ?? '');
  const canton = normalizar(datos.canton ?? '');
  const distrito = normalizar(datos.distrito ?? '');
  const filas = ubicaciones.filter((fila) => fila[0] === provincia);
  const errores: Record<string, string[]> = {};
  if (!filas.length)
    errores.provincia = ['Seleccione una provincia de Costa Rica.'];
  const fila = filas.find((fila) => fila[1] === canton);
  if (!fila)
    errores.canton = ['El cantón no pertenece a la provincia seleccionada.'];
  else if (!fila.slice(2).includes(distrito))
    errores.distrito = ['El distrito no pertenece al cantón seleccionado.'];
  if (Object.keys(errores).length)
    throw new BadRequestException({
      mensaje: 'Revise la ubicación seleccionada.',
      errores,
    });
}
