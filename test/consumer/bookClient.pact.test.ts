import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { BookClient, describeBook } from '../../src/consumer/bookClient';

const { like, integer, string, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'BibliotecaWeb',
  provider: 'BibliotecaAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('BookClient contra el mock server de Pact', () => {
  it('obtiene un libro que existe y lo muestra como disponible', async () => {
    provider
      .given('existe el libro con id 1')
      .uponReceiving('una solicitud del libro con id 1')
      .withRequest({
        method: 'GET',
        path: '/books/1',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': regex(/application\/json.*/, 'application/json; charset=utf-8'),
        },
        body: {
          id: integer(1),
          title: string('Cien años de soledad'),
          author: string('Gabriel García Márquez'),
          isbn: regex(/^\d{13}$/, '9780307474728'),
          availableCopies: integer(3),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new BookClient(mockServer.url);
      const book = await client.getBook(1);

      expect(book).not.toBeNull();
      expect(book?.id).toBe(1);
      expect(typeof book?.availableCopies).toBe('number');
      expect(describeBook(book)).toBe(
        'Cien años de soledad de Gabriel García Márquez: disponible (3 copias)'
      );
    });
  });

  it('devuelve null cuando el libro no existe y muestra el mensaje', async () => {
    provider
      .given('no existe el libro con id 999')
      .uponReceiving('una solicitud de un libro que no existe')
      .withRequest({
        method: 'GET',
        path: '/books/999',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 404,
        body: { message: like('No existe el libro con id 999') },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new BookClient(mockServer.url);
      const book = await client.getBook(999);

      expect(book).toBeNull();
      expect(describeBook(book)).toBe('Libro no encontrado');
    });
  });
});
