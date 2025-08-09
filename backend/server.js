createVideo = require('./create')
express = require('express');
cors = require('cors');
multer = require('multer');

const server = express();
const PORT = 3000;
const upload = multer();

server.use(cors());
server.use(express.json());

server.post('/', upload.none(), async (req, res) => {
  const finalBuffer = await createVideo(req.body);
  console.log(finalBuffer);
  res.setHeader('Content-Type', 'video/webm');
  res.send(finalBuffer);
});


 server.listen(PORT, () => {
    console.log(`Backend server running at https://localhost:${PORT}`);
 })
