import server from './server.js';

server.listen(process.env.PORT, () => console.log(`⚡ Listening on port ${process.env.PORT}`));
