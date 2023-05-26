const cleanCode = {
    id: 1,
    title: 'Clean Code',
    Author: 'Uncle Bob',
    onLoan: false,
}

export const books = [cleanCode];

export const rentBookOut = (id) => {
    books.forEach(b => {
     if (b.id === id) {
         b.onLoan = true;
     }
    });
 }
 
 export const returnBook = (id) => {
     books.forEach(b => {
         if(b.id === id) {
             b.onLoan = false;
         }
     });
 }
 
 export const removeBook = (id) => {
     const idx = books.indexOf((b => b.id === id));
     books.splice(idx, 1);
 }