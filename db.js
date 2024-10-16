const mysql = require('mysql2');

// Configurar a conexão com o MySQL
const db = mysql.createConnection({
  host: 'localhost', // Altere para o host do seu banco
  user: 'root', // Altere para seu usuário do MySQL
  password: '10081995Ab.', // Substitua pela senha do seu MySQL
  database: 'auth', // Nome do seu banco de dados
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL!');
});

module.exports = db;
