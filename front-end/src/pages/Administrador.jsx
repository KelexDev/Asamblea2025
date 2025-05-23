import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ID_ASAMBLEA = 2;

function Administrador() {
    const [asamblea, setAsamblea] = useState('');
    const [mociones, setMociones] = useState([]);
    const [mocionSeleccionada, setMocionSeleccionada] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(true);
    const [votos, setVotos] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);

    useEffect(() => {
        setCargando(true);
        axios.get(`/api/asamblea/${ID_ASAMBLEA}/detalle`)
            .then(res => {
                setAsamblea(res.data.nombre_asamblea);
                setMociones(Array.isArray(res.data.mociones) ? res.data.mociones : []);
            })
            .catch(() => {
                setAsamblea('');
                setMociones([]);
            })
            .finally(() => setCargando(false));
    }, []);

    // Evita el scroll de fondo cuando el modal está abierto
    useEffect(() => {
        if (mostrarModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mostrarModal]);

    const handleLanzar = async () => {
        if (!mocionSeleccionada) return;
        try {
            await axios.post(`/api/asamblea/mocion/${mocionSeleccionada}/lanzar`);
            setMensaje('¡Moción lanzada!');
        } catch {
            setMensaje('Error al lanzar la moción');
        }
    };

    const handleFinalizar = async () => {
        if (!mocionSeleccionada) return;
        try {
            await axios.post(`/api/asamblea/mocion/${mocionSeleccionada}/finalizar`);
            setMensaje('¡Moción finalizada!');
        } catch {
            setMensaje('Error al finalizar la moción');
        }
    };

    const handleVerVotos = async () => {
        if (!mocionSeleccionada) return;
        try {
            const res = await axios.get(`/api/asamblea/mocion/${mocionSeleccionada}/votos`);
            setVotos(res.data);
            setMostrarModal(true);
        } catch {
            setVotos([]);
            setMostrarModal(true);
        }
    };

    if (cargando) {
        return (
            <div className="container mt-4">
                <h2>Panel de Administración</h2>
                <div>Cargando asamblea...</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2>Panel de Administración</h2>
            {asamblea ? (
                <div>
                    <h4>Asamblea: <span style={{ fontWeight: 'normal' }}>{asamblea}</span></h4>
                    <div className="mb-3">
                        <label className="form-label">Mociones de la Asamblea:</label>
                        <select
                            className="form-select"
                            value={mocionSeleccionada}
                            onChange={e => setMocionSeleccionada(e.target.value)}
                        >
                            <option value="">Seleccione una moción</option>
                            {mociones.length === 0 ? (
                                <option disabled value="">No hay mociones disponibles</option>
                            ) : (
                                mociones.map(m => (
                                    <option key={m.id_mocion} value={m.id_mocion}>
                                        {m.titulo_mocion}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <button className="btn btn-success me-2" onClick={handleLanzar} disabled={!mocionSeleccionada}>
                        Lanzar moción
                    </button>
                    <button className="btn btn-danger" onClick={handleFinalizar} disabled={!mocionSeleccionada}>
                        Finalizar moción
                    </button>
                    <button className="btn btn-primary ms-2" onClick={handleVerVotos} disabled={!mocionSeleccionada}>
                        Ver votos
                    </button>
                    {mensaje && <div className="alert alert-info mt-3">{mensaje}</div>}

                    {/* Modal de votos */}
                    {mostrarModal && (
                        <>
                            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Votos registrados</h5>
                                            <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            {votos.length > 0 ? (
                                                <table className="table table-striped">
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Nombre</th>
                                                            <th>Respuesta</th>
                                                            <th>Moción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {votos.map((v, i) => (
                                                            <tr key={i}>
                                                                <td>{v.id}</td>
                                                                <td>{v.nombre}</td>
                                                                <td>{v.respuesta}</td>
                                                                <td>{v.titulo_mocion}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div>No hay votos registrados.</div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Fondo del modal solo cuando está abierto */}
                            <div
                                className="modal-backdrop fade show"
                                onClick={() => setMostrarModal(false)}
                                style={{ cursor: "pointer" }}
                            ></div>
                        </>
                    )}
                </div>
            ) : (
                <div>No se pudo cargar la asamblea.</div>
            )}
        </div>
    );
}

export default Administrador;