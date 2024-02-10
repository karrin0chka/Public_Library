const express = require('express'); // базовая конфигурация, чтобы сервер мог выполнять запросы
const PORT = process.env.PORT || 3000;
const Pool = require('pg').Pool

const pool = new Pool({
    user: "postgres",
    password: "1111",
    host: "localhost",
    port: 5432, 
    database: "public_library"
})    
        
let error = "Книга добавлена"
const app = express(); 
  
app.set('view engine', 'ejs')   

app.get('/', async function(req, res) {
    const { book_query } = req.params;
    const data = await pool.query('SELECT * FROM book_list')
    const book_list = data.rows 
    res.render('home_page', {book_query: book_query, book_list: book_list, error: error})         
})

app.get('/personal_account', async function (req, res) {
    const data = await pool.query(`SELECT id_book, isbn, title_book, author, take_date, return_date
                                FROM my_books INNER JOIN book_list
                                ON book_list.isbn = my_books.isbn_book`)
    const my_books = data.rows
    error = "Книга добавлена"
    res.render('personal_account_page', { my_books: my_books})
}) 
 
 
app.get('/search', async function (req, res) {
    const book_query = req.query.book_query;
    const data = await pool.query(`SELECT * FROM book_list WHERE title_book LIKE '%${book_query}%' OR 
                        author LIKE '%${book_query}%' OR publishing_house LIKE '%${book_query}%' OR isbn = '${book_query}'`)
    const book_list = data.rows;
    res.render('search_page', {book_query: book_query, book_list: book_list})     
})    
 
app.post('/add_book/:book_isbn', async function (req, res) {
    const { book_isbn }= req.params;    
    let now = new Date()
    let now_date = now.getFullYear() + ' ' + (now.getMonth()+1) + ' ' + now.getDate()
    const data = await pool.query(`SELECT MAX(id_book) FROM my_books`)
    const id = data.rows[0].max 
    
    const data1 = await pool.query(`SELECT isbn_book FROM my_books WHERE isbn_book = '${book_isbn}'`)
    let flag = 1
    if (data1.rows[0] == null) {
        flag = 0
    }

    const data2 = await pool.query(`SELECT count_books FROM book_list WHERE isbn = '${book_isbn}'`)
    const count = data2.rows[0].count_books

    if (Number(count) > 0 & !flag) {
        await pool.query(`INSERT INTO my_books(id_book, isbn_book, take_date, return_date) VALUES(${id + 1}, '${book_isbn}', to_date('${now_date}', 'YYYY MM DD'), to_date('${now_date}', 'YYYY MM DD') + 20)`)
        await pool.query(`UPDATE book_list SET count_books = count_books - 1 WHERE isbn = '${book_isbn}'`)
        
        error = 'Книга добавлена'
         
    } else {
        if (flag == 1)
            error = 'Книга уже взята'
        if (Number(count) == 0)
            error = 'Книги нет в наличии'
    }    
    res.redirect('/')
})   

app.post('/delete_book/:book_isbn', async function (req, res) {
    const { book_isbn } = req.params;
    await pool.query(`DELETE FROM my_books WHERE isbn_book = '${book_isbn}'`)
    await pool.query(`UPDATE book_list SET count_books = count_books + 1 WHERE isbn = '${book_isbn}'`)
    res.redirect('/personal_account')
})
 
app.listen(PORT, () => console.log('server started on port ${PORT}')) 