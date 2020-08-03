const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const config = require('./config');
const dirExists = require('./mFiles');

const app = express();
app.set('port', process.env.PORT || config.port);

app.use('/uploads', express.static('./upload/'));
dirExists('./upload'); // 创建文件夹

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, './upload/images/'),
  filename(_req, file, callback) {
    callback(null, Date.now() + '_' + file.originalname);
  }
});
const fileFilter = function (_req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const err = new Error('只允许上传图片类型文件！');
    err.code = 'CODE_INVALID_FILE_TYPE';
    cb(err, false);
  }
};
const upload = multer({
  storage,
  limits: {
    fileSize: 1000 * 1024 * 1024
  },
  fileFilter
}).single('file');

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());
app.use(
  cors({
    origin: config.originUrl, //允许访问
    optionsSuccessStatus: 200
  })
);

app.post('/uploadImage', (req, res) => {
  upload(req, res, (error) => {
    let resp;
    if (error) {
      let message = '上传失败！';
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '图片太大了！';
      } else if (error.code === 'CODE_INVALID_FILE_TYPE') {
        message = error.message;
      }
      resp = {
        code: -1,
        message
      };
    } else {
      const fileName = encodeURIComponent(req.file.filename);
      const url = `${config.imgUrl}/images/${fileName}`;
      res.send(url);
    }
  });
});
app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${app.get('port')}!`);
});
