import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// En desarrollo, servir desde el directorio src/client
if (process.env.NODE_ENV === 'development') {
    app.use(express.static(path.join(__dirname, '../../src/client')));
} else {
    // En producción, servir desde el directorio dist/client
    app.use(express.static(path.join(__dirname, '../../dist/client')));
}

// Ruta principal
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        res.sendFile(path.join(__dirname, '../../src/client/index.html'));
    } else {
        res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
    }
});

// Configuración de Socket.io
io.on('connection', (socket) => {
    console.log('Un jugador se ha conectado');

    socket.on('disconnect', () => {
        console.log('Un jugador se ha desconectado');
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
}); 