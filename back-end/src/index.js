import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as socketIo } from 'socket.io';
import asambleaRoutes from './routes/asambleaRoute.js';
import authRoutes from './routes/authRoute.js';

const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {
    cors: {
        origin: "*", // Permite cualquier origen en desarrollo
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

// Habilitar CORS para todas las rutas HTTP
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware y rutas
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/asamblea', asambleaRoutes);

// Compartir io con las rutas
app.set('io', io);

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});