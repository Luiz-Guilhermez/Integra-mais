function admin(req, res, next) {

  if (req.tipo !== 'admin') {
    return res.status(403).json({
      mensagem: 'Acesso permitido apenas para administradores.'
    });
  }

  next();
}

module.exports = admin;