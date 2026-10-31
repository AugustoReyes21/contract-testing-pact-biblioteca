// Repositorio en memoria. En las pruebas reemplaza a una base de datos
export interface BookRecord {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalCopies: number;
  loanedCopies: number;
}

export class BookRepository {
  private books = new Map<number, BookRecord>();

  findById(id: number): BookRecord | undefined {
    return this.books.get(id);
  }

  save(book: BookRecord): void {
    this.books.set(book.id, book);
  }

  clear(): void {
    this.books.clear();
  }
}
