import { getConnection, sql } from '../config/Connection.js';

export const login = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const pool = await getConnection;
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM accionista WHERE correo = @correo');
        if (result.recordset.length === 0) {
            return res.status(401).json({ msg: 'Usuario no encontrado' });
        }
        const user = result.recordset[0];
        // Contraseña: últimos 3 dígitos del accionista_id
        const last3 = user.accionista_id.toString().slice(-3);
        if (password !== last3) {
            return res.status(401).json({ msg: 'Contraseña incorrecta' });
        }
        res.json({
            id: user.accionista_id,
            nombre: user.nombre_completo,
            correo: user.correo
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error interno', error: err.message });
    }
};