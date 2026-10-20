require('dotenv').config()
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensagem: 'Token não fornecido.'
    });
  }

  const partes = authHeader.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({
      mensagem: 'Formato do token inválido.'
    });
  }

  const token = partes[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.alunoId = decoded.id;
    req.tipo = decoded.tipo;

    next();

  } catch (erro) {
    return res.status(401).json({
      mensagem: 'Token inválido ou expirado.'
    });
  }
}

module.exports = auth;