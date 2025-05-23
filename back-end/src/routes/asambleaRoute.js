import express from 'express';
import { sql, getConnection } from '../config/Connection.js';
import { getAsambleaDetalle } from '../controller/asambleaController.js';

const router = express.Router();
router.get('/:id/detalle', getAsambleaDetalle);

// Obtener asamblea por id
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM asamblea WHERE id_asamblea = @id');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener mociones por id_asamblea
router.get('/:id/mociones', async (req, res) => {
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM mocion WHERE id_asamblea_fk = @id');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lanzar moción (solo deja una activa por asamblea)
router.post('/mocion/:id/lanzar', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection;
        // Obtener la asamblea de la moción
        const mocionResult = await pool.request()
            .input('id_mocion', sql.Int, id)
            .query('SELECT id_asamblea_fk FROM mocion WHERE id_mocion = @id_mocion');
        const id_asamblea = mocionResult.recordset[0].id_asamblea_fk;

        // Poner todas las mociones de la asamblea en "Pendiente"
        await pool.request()
            .input('id_asamblea', sql.Int, id_asamblea)
            .query("UPDATE mocion SET estado = 'Pendiente' WHERE id_asamblea_fk = @id_asamblea");

        // Poner la moción seleccionada en "Activa"
        await pool.request()
            .input('id_mocion', sql.Int, id)
            .query("UPDATE mocion SET estado = 'Activa' WHERE id_mocion = @id_mocion");

        // Emitir evento por socket.io
        req.app.get('io').emit('mocion-lanzada', { id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Finalizar moción (cambiar estado a 'Finalizada')
router.post('/mocion/:id/finalizar', async (req, res) => {
    try {
        const pool = await getConnection;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE mocion SET estado = 'Finalizada' WHERE id_mocion = @id");

        // Emitir evento por socket.io
        req.app.get('io').emit('mocion-finalizada', { id: req.params.id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener moción activa de una asamblea
router.get('/:id/mocion-activa', async (req, res) => {
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("SELECT id_mocion, titulo_mocion, descripcion_mocion AS descripcion FROM mocion WHERE id_asamblea_fk = @id AND estado = 'Activa'");
        if (result.recordset.length === 0) {
            return res.json(null);
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error en /api/asamblea/:id/mocion-activa:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verificar si el accionista ya votó en la moción
router.get('/mocion/:id/voto/:id_accionista', async (req, res) => {
    const { id, id_accionista } = req.params;
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('id_mocion', sql.Int, id)
            .input('id_accionista', sql.Int, id_accionista)
            .query(`
                SELECT vi.*
                FROM votacion_individual vi
                INNER JOIN votacion v ON vi.id_votacion_fk = v.id_votacion
                WHERE v.id_mocion_fk = @id_mocion AND vi.accionista_id_fk = @id_accionista
            `);
        if (result.recordset.length > 0) {
            res.json({ yaVoto: true, voto: result.recordset[0] });
        } else {
            res.json({ yaVoto: false });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener votos de una moción con datos de accionista y moción
router.get('/mocion/:id/votos', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('id_mocion', sql.Int, id)
            .query(`
                SELECT 
                    a.accionista_id AS id,
                    a.nombre_completo AS nombre,
                    v.tipo_voto AS respuesta,
                    m.titulo_mocion AS titulo_mocion
                FROM votacion_individual v
                INNER JOIN accionista a ON v.accionista_id_fk = a.accionista_id
                INNER JOIN votacion vt ON v.id_votacion_fk = vt.id_votacion
                INNER JOIN mocion m ON vt.id_mocion_fk = m.id_mocion
                WHERE vt.id_mocion_fk = @id_mocion
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener votos:', err);
        res.status(500).json({ error: err.message });
    }
});

// Guardar voto en votacion y votacion_individual
router.post('/mocion/:id/votar', async (req, res) => {
    const { id } = req.params;
    const { id_accionista, respuesta } = req.body;
    console.log('Datos recibidos:', { id, id_accionista, respuesta }); // Para depuración
    try {
        const pool = await getConnection;

        // 1. Insertar en votacion (si no existe para esta moción)
        let votacionId;
        const votacionResult = await pool.request()
            .input('id_mocion', sql.Int, id)
            .query('SELECT TOP 1 id_votacion FROM votacion WHERE id_mocion_fk = @id_mocion');
        if (votacionResult.recordset.length === 0) {
            const insertVotacion = await pool.request()
                .input('id_mocion', sql.Int, id)
                .input('resultado', sql.VarChar, '')
                .input('fecha_votacion', sql.DateTime, new Date())
                .query('INSERT INTO votacion (resultado, fecha_votacion, id_mocion_fk) OUTPUT INSERTED.id_votacion VALUES (@resultado, @fecha_votacion, @id_mocion)');
            votacionId = insertVotacion.recordset[0].id_votacion;
        } else {
            votacionId = votacionResult.recordset[0].id_votacion;
        }

        // 2. Insertar en votacion_individual
        await pool.request()
            .input('id_votacion_fk', sql.Int, votacionId)
            .input('accionista_id_fk', sql.Int, id_accionista)
            .input('tipo_voto', sql.VarChar, respuesta)
            .input('fecha_hora_voto', sql.DateTime, new Date())
            .query('INSERT INTO votacion_individual (id_votacion_fk, accionista_id_fk, tipo_voto, fecha_hora_voto) VALUES (@id_votacion_fk, @accionista_id_fk, @tipo_voto, @fecha_hora_voto)');

        res.json({ success: true });
    } catch (err) {
        console.error('Error al guardar voto:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;