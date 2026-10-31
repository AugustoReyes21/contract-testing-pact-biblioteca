import { createApp } from './app';
import { BookRepository } from './bookRepository';

const repository = new BookRepository();
repository.save({
  id: 1,
  title: 'Cien años de soledad',
  author: 'Gabriel García Márquez',
  isbn: '9780307474728',
  totalCopies: 5,
  loanedCopies: 2,
});

const port = Number(process.env.PORT ?? 3000);
createApp(repository).listen(port, () => {
  console.log(`API de biblioteca escuchando en http://localhost:${port}`);
});
