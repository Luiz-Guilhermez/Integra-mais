
const multer = require('multer');
const path = require('path');

const tiposPermitidos = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm']
};

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/posts'));
    },

    filename: (req, file, cb) => {

        const nomeUnico =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        const extensao = path.extname(file.originalname).toLowerCase();

        cb(null, nomeUnico + extensao);
    }

});

const fileFilter = (req, file, cb) => {

    const extensao = path.extname(file.originalname).toLowerCase();

    const extensoesPermitidas = tiposPermitidos[file.mimetype];

    if (!extensoesPermitidas || !extensoesPermitidas.includes(extensao)) {
        return cb(new Error('Formato de arquivo não permitido.'));
    }

    cb(null, true);
};

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 5
    }

});

module.exports = upload;