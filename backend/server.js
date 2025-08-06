createVideo = require('./create')
express = require('express');
cors = require('cors');

const server = express();
const PORT = 3000;

server.use(cors());
server.use(express.json());

server.post('/', async (req, res) => {
  const finalBuffer = await createVideo(req.body);
  res.setHeader('Content-Type', 'video/mp4');
  res.send(finalBuffer);
});


 server.listen(PORT, () => {
    console.log(`Backend server running at https://localhost:${PORT}`);
 })
