const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI= 'mongodb://vipul:v252490l@ds119651.mlab.com:19651/mongouploads';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
})

// Create storage engine

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET/
// @desc Loads form
app.get('/',(req, res) => {
  res.render('index');
});

// @route POST/ upload
// @desc uploads file to DB
app.post('/upload', upload.single('file'),(req,res) => {
 // res.json({file: req.file});
 res.redirect('/');
});

// @route GET /files
// @desc Display all files in JSON
app.get('/files',(req,res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if(!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }
    //  Files exists
    return res.json(files);
  })
});

// @route GET /files/:filename
// @desc Display single file in JSON
app.get('/files/:filename',(req,res) => {
  gfs.files.findOne({filename: req.params.filename},(err,file) => {
    // Check if file
    if(!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exist'
      });
    }
    // File exists
    return res.json(file);
  });
});


// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename',(req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    // Check if file
    if(!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // Check if Image
    if(file.contentType === 'image/jpeg' || file.contentType === 'img/png') {
      //  Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
         err: 'Not an image'
      });
    }
  });
});




const port = 5000;

app.listen(port, () => console.log('Server started on port ${port}'));
