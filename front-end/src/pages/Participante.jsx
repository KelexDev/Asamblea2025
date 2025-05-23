import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const ID_ASAMBLEA = 2;
const SOCKET_URL = "http://localhost:3001"; // Cambia el puerto si tu backend usa otro

function getAccionistaId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
}

export default function Participante() {
    const [mocion, setMocion] = useState(null);
    const [voto, setVoto] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [yaVoto, setYaVoto] = useState(false);
    const [votoPrevio, setVotoPrevio] = useState(null);

    const ID_ACCIONISTA = getAccionistaId();

    // Socket.io: conectar y escuchar eventos
    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('mocion-lanzada', async ({ id }) => {
            // Cargar la moción activa cuando se lance
            try {
                const res = await axios.get(`/api/asamblea/${ID_ASAMBLEA}/mocion-activa`);
                setMocion(res.data);
                setMensaje("");
                setYaVoto(false);
                setVoto("");
                setVotoPrevio(null);
                setEnviado(false);
                // Verificar si ya votó
                if (res.data) {
                    const resVoto = await axios.get(`/api/asamblea/mocion/${res.data.id_mocion}/voto/${ID_ACCIONISTA}`);
                    if (resVoto.data.yaVoto) {
                        setYaVoto(true);
                        setVotoPrevio(resVoto.data.voto.tipo_voto);
                        setMensaje("¡Ya has votado en esta moción!");
                        setEnviado(true);
                    }
                }
            } catch {
                setMocion(null);
            }
        });

        socket.on('mocion-finalizada', () => {
            setMocion(null);
            setMensaje("La moción ha sido finalizada.");
            setYaVoto(false);
            setVoto("");
            setVotoPrevio(null);
            setEnviado(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [ID_ACCIONISTA]);

    // Consulta inicial y polling (opcional)
    useEffect(() => {
        if (!ID_ACCIONISTA) return;
        const fetchMocion = async () => {
            try {
                const res = await axios.get(`/api/asamblea/${ID_ASAMBLEA}/mocion-activa`);
                setMocion(res.data);
                if (res.data) {
                    const resVoto = await axios.get(`/api/asamblea/mocion/${res.data.id_mocion}/voto/${ID_ACCIONISTA}`);
                    if (resVoto.data.yaVoto) {
                        setYaVoto(true);
                        setVotoPrevio(resVoto.data.voto.tipo_voto);
                        setMensaje("¡Ya has votado en esta moción!");
                        setEnviado(true);
                    } else {
                        setYaVoto(false);
                        setVotoPrevio(null);
                        setMensaje("");
                        setEnviado(false);
                        setVoto("");
                    }
                }
            } catch {
                setMocion(null);
            }
        };

        fetchMocion();
        const interval = setInterval(fetchMocion, 2000);
        return () => clearInterval(interval);
    }, [ID_ACCIONISTA]);

    const manejarVoto = async (e) => {
        e.preventDefault();
        if (!voto || !mocion) return;
        try {
            await axios.post(`/api/asamblea/mocion/${mocion.id_mocion}/votar`, {
                id_accionista: ID_ACCIONISTA,
                respuesta: voto
            });
            setEnviado(true);
            setMensaje("¡Voto enviado correctamente!");
            setYaVoto(true);
            setVotoPrevio(voto);
        } catch {
            setMensaje("Error al guardar el voto");
        }
    };

    if (!ID_ACCIONISTA) {
        return (
            <div className="container py-5 d-flex flex-column align-items-center">
                <div className="alert alert-danger mt-5">No se encontró el usuario autenticado. Por favor, inicia sesión.</div>
            </div>
        );
    }

    if (!mocion) {
        return (
            <div className="container py-5 d-flex flex-column align-items-center">
                <div className="alert alert-info mt-5">{mensaje || "No hay moción activa para votar."}</div>
            </div>
        );
    }

    return (
        <div className="container py-5 d-flex flex-column align-items-center">
            <div className="card shadow-lg rounded-4 p-4 w-100" style={{ maxWidth: "600px" }}>
                <h2 className="text-center mb-4">{mocion.titulo_mocion}</h2>
                {mocion.descripcion && (
                    <p className="text-center mb-4">{mocion.descripcion}</p>
                )}
                {yaVoto ? (
                    <div className="alert alert-success text-center" role="alert">
                        {mensaje} <br />
                        Tu voto fue: <strong>{votoPrevio}</strong>
                    </div>
                ) : (
                    <form onSubmit={manejarVoto}>
                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="voto"
                                id="acuerdo"
                                value="De acuerdo"
                                onChange={(e) => setVoto(e.target.value)}
                                checked={voto === "De acuerdo"}
                            />
                            <label className="form-check-label" htmlFor="acuerdo">
                                De acuerdo
                            </label>
                        </div>
                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="voto"
                                id="desacuerdo"
                                value="En desacuerdo"
                                onChange={(e) => setVoto(e.target.value)}
                                checked={voto === "En desacuerdo"}
                            />
                            <label className="form-check-label" htmlFor="desacuerdo">
                                En desacuerdo
                            </label>
                        </div>
                        <div className="form-check mb-4">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="voto"
                                id="blanco"
                                value="Voto en blanco"
                                onChange={(e) => setVoto(e.target.value)}
                                checked={voto === "Voto en blanco"}
                            />
                            <label className="form-check-label" htmlFor="blanco">
                                Voto en blanco
                            </label>
                        </div>
                        <button className="btn btn-success w-100" type="submit" disabled={!voto}>
                            Enviar Voto
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}