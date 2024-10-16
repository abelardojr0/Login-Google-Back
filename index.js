const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


app.get('/users', (req, res) => {
  const query = 'SELECT * FROM usuarios';

  db.query(query, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Erro ao consultar o banco de dados' });
    }

    res.json(results);
  });
});

app.post('/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    // Valida o token do Google
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    );

    const { email, name, picture } = googleResponse.data;

    // Verificar se o usuário já existe no banco
    const checkUserQuery = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(checkUserQuery, [email], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Erro ao consultar o banco de dados' });
      }

      if (results.length === 0) {
        // Usuário não existe, vamos cadastrá-lo
        const insertUserQuery =
          'INSERT INTO usuarios (email, nome, foto) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [email, name, picture], (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Erro ao registrar usuário' });
          }

          console.log('Novo usuário cadastrado:', email);

          // Gerar JWT após o registro
          const jwtToken = jwt.sign({ email, name, picture }, JWT_SECRET, {
            expiresIn: '1h',
          });

          res.json({
            message: 'Usuário registrado com sucesso e login bem-sucedido',
            token: jwtToken,
            user: { email, name, picture },
          });
        });
      } else {
        // Usuário já existe, gerar JWT
        const jwtToken = jwt.sign({ email, name, picture }, JWT_SECRET, {
          expiresIn: '1h',
        });

        res.json({
          message: 'Login bem-sucedido',
          token: jwtToken,
          user: { email, name, picture },
        });
      }
    });
  } catch (error) {
    console.error('Erro na autenticação com o Google:', error);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
});

// Middleware para verificar o JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Pega o token após 'Bearer'

  if (!token) {
    return res.status(403).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    req.user = user; // Adiciona os dados do usuário à requisição
    next();
  });
};

// Exemplo de rota protegida
app.get('/profile', authenticateJWT, (req, res) => {
  res.json({
    message: 'Dados do perfil do usuário',
    user: req.user,
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
