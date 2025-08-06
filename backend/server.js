createVideo = require('./create')
express = require('express');
cors = require('cors');

const server = express();
const PORT = 3000;

server.use(cors());
server.use(express.json());

server.post('/', (req, res) => {
  createVideo(req.body);
  res.json({ reply: "Video has been made" });
});


 server.listen(PORT, () => {
    console.log(`Backend server running at https://localhost:${PORT}`);
 })
