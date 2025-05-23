import { getConnection, sql } from '../config/Connection.js';

export const getAsambleaDetalle = async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getConnection;
        // Consulta la asamblea
        const asambleaResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT nombre_asamblea FROM asamblea WHERE id_asamblea = @id');
        if (asambleaResult.recordset.length === 0) {
            return res.status(404).json({ msg: 'Asamblea no encontrada' });
        }
        // Consulta las mociones
        const mocionesResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id_mocion, titulo_mocion FROM mocion WHERE id_asamblea_fk = @id');
        res.json({
            nombre_asamblea: asambleaResult.recordset[0].nombre_asamblea,
            mociones: mocionesResult.recordset
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error interno', error: err.message });
    }
};