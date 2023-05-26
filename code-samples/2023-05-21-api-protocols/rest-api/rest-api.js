import Express from 'express';
import { books, rentBookOut, returnBook, removeBook } from './books.js';

const service = Express();

// specify no cache control for all requests
service.use((req, res, next) => {
    res.set('Cache-control', 'no-store');
    next();
})

// GET request for all book resources
service.get('/api/books', (req, res, next) => {
    res.status(200).json(books.map(b => toBookResponse(b)));
})

// GET request for specific book resource
service.get('/api/books/:id', (req, res, next) => {
    const id = Number(req.params.id);
    const book = books.find((b => b.id === id));

    res.status(200).json(toBookResponse(book));
})

// PUT request updating book onLoan status to true
service.put('/api/books/:id/rent', (req, res, next) => {
    const id = Number(req.params.id);

    rentBookOut(id);

    res.sendStatus(200);
})

// PUT request updating book onLoan status to false
service.put('/api/books/:id/return', (req, res, next) => {
    const id = Number(req.params.id);

    returnBook(id);

    res.sendStatus(200);
})

// POST request adding a new book resource
service.post('/api/books', Express.json(), (req, res, next) => {
    const {id, title, author } = req.body;

    if (books.find(b => b.id === id)) {
        res.sendStatus(400);
        return;
    }

    const book = {
        id: Number(id),
        title,
        author,
        onLoan: false,
    }

    books.push(book);

    res.status(201).send(id);
})

// DELETE request removing the specified book from the books
service.delete('/api/books/:id', (req, res, next) => {
    const id = req.params.id;

    removeBook(id);

    res.sendStatus(200);
})

const toBookResponse = (book) => ({
        ...book,
        links: {
            rent: '/api/books/1/rent',
            return: '/api/books/1/return',
        }
    })

service.listen(8000, () => {
    console.log('service listening');
})
