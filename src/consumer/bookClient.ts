import axios, { AxiosInstance } from 'axios';

// Datos del libro que la aplicacion de la biblioteca necesita mostrar
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  availableCopies: number;
}

export class BookClient {
  private http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      headers: { Accept: 'application/json' },
    });
  }

  // Devuelve el libro o null si la API responde 404
  async getBook(id: number): Promise<Book | null> {
    try {
      const response = await this.http.get(`/books/${id}`);
      return response.data as Book;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// Texto que la aplicacion muestra al usuario segun la respuesta
export function describeBook(book: Book | null): string {
  if (book === null) {
    return 'Libro no encontrado';
  }
  if (book.availableCopies > 0) {
    return `${book.title} de ${book.author}: disponible (${book.availableCopies} copias)`;
  }
  return `${book.title} de ${book.author}: sin copias disponibles`;
}
