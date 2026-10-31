import express from 'express';
import { BookRecord, BookRepository } from './bookRepository';

// Convierte el registro interno a lo que se expone en la API
function toResponse(book: BookRecord) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    availableCopies: book.totalCopies - book.loanedCopies,
  };
}

export function createApp(repository: BookRepository) {
  const app = express();

  app.get('/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const book = repository.findById(id);

    if (!book) {
      res.status(404).json({ message: `No existe el libro con id ${id}` });
      return;
    }

    res.status(200).json(toResponse(book));
  });

  return app;
}
