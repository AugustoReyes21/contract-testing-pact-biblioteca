import path from 'path';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { Verifier } from '@pact-foundation/pact';
import { createApp } from '../../src/provider/app';
import { BookRepository } from '../../src/provider/bookRepository';

// La API (Express, rutas y mapeo de la respuesta) es real.
// El repositorio es en memoria y lo controlan los provider states.
const repository = new BookRepository();
let server: Server;
let baseUrl: string;

beforeAll((done) => {
  server = createApp(repository).listen(0, () => {
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('Verificacion del contrato en BibliotecaAPI', () => {
  it('cumple el contrato de BibliotecaWeb', async () => {
    const verifier = new Verifier({
      provider: 'BibliotecaAPI',
      providerBaseUrl: baseUrl,
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'BibliotecaWeb-BibliotecaAPI.json')],
      logLevel: 'warn',
      stateHandlers: {
        // Cada estado limpia el repositorio y deja solo lo que necesita,
        // asi no importa el orden en que se ejecuten las interacciones
        'existe el libro con id 1': async () => {
          repository.clear();
          repository.save({
            id: 1,
            title: 'Cien años de soledad',
            author: 'Gabriel García Márquez',
            isbn: '9780307474728',
            totalCopies: 5,
            loanedCopies: 2,
          });
        },
        'no existe el libro con id 999': async () => {
          repository.clear();
        },
      },
    });

    await verifier.verifyProvider();
  });
});
