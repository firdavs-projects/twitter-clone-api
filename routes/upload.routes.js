const {Router} = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const cloudinary = require("cloudinary");
const router = Router()
const formidable = require("formidable");

router.post(
    '/image',
    authMiddleware,
    async (req, res) => {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            cloudinary.v2.uploader.upload(files.file.filepath,
                { public_id: files.file.newFilename },
                function(error, result) {
                    console.log(result);
                    return res.json({message: 'Файл успешно загружён', result})
                });
        });
    }
)



module.exports = router
