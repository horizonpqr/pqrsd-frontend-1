import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function DetalleSolicitud() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [solicitud, setSolicitud] = useState(null);
  const [responsables, setResponsables] = useState([]);
  const [responsableSeleccionado, setResponsableSeleccionado] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState("");
  const [tipoPQRS, setTipoPQRS] = useState(""); // 👈 Nuevo estado
  const [fechaVencimientoVisual, setFechaVencimientoVisual] = useState("");
  const [cargandoAsignar, setCargandoAsignar] = useState(false);
  const [asignacionExitosa, setAsignacionExitosa] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    obtenerSolicitud();
    obtenerResponsables();
  }, []);

  const obtenerSolicitud = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitud(res.data);
    } catch (error) {
      console.error("Error al obtener solicitud:", error);
    }
  };

  const obtenerResponsables = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const soloResponsables = res.data.filter((u) => u.rol === "responsable");
      setResponsables(soloResponsables);
    } catch (error) {
      console.error("Error al obtener responsables:", error);
    }
  };

  const calcularFechaVencimiento = (dias) => {
    let fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    let count = 0;

    const feriados = [
      new Date("2025-04-14"),
      new Date("2025-04-15"),
      new Date("2025-04-16"),
      new Date("2025-04-17"),
      new Date("2025-04-18"),
    ];

    const esFeriado = (fecha) =>
      feriados.some(
        (f) =>
          f.getDate() === fecha.getDate() &&
          f.getMonth() === fecha.getMonth() &&
          f.getFullYear() === fecha.getFullYear()
      );

    while (count < dias) {
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6 && !esFeriado(fecha)) {
        count++;
      }
      if (count < dias) {
        fecha.setDate(fecha.getDate() + 1);
      }
    }

    setFechaVencimientoVisual(fecha.toLocaleDateString());
  };

  const asignar = async () => {
    if (!responsableSeleccionado || !diasSeleccionados || !tipoPQRS.trim()) {
      toast.warn("⚠️ Debes seleccionar un responsable, un plazo y escribir el tipo de PQRSD.", {
        position: "top-right",
      });
      return;
    }

    try {
      setCargandoAsignar(true);
      const formData = new FormData();
      formData.append("termino_dias", diasSeleccionados);
      formData.append("tipo_pqrsd", tipoPQRS); // 👈 Nuevo dato enviado

      await axios.post(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}/asignar/${responsableSeleccionado}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTimeout(() => {
        setAsignacionExitosa(true);
      }, 300);
    } catch (error) {
      console.error("Error al asignar:", error);
      toast.error("❌ Error al asignar solicitud", {
        position: "top-right",
      });
    } finally {
      setCargandoAsignar(false);
    }
  };

  useEffect(() => {
    if (asignacionExitosa && solicitud) {
      toast.success(`✅ La PQRSD ${solicitud.radicado} fue asignada correctamente.`, {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/asignador");
      }, 3000);
    }
  }, [asignacionExitosa, solicitud, navigate]);

  if (!solicitud) return <p className="text-gray-600">Cargando solicitud...</p>;

  const fechaRadicacion = solicitud.fecha_creacion && !isNaN(Date.parse(solicitud.fecha_creacion))
    ? new Date(solicitud.fecha_creacion)
    : null;

  if (asignacionExitosa) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        <CheckCircle2 size={80} className="text-green-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">¡PQRSD asignada correctamente!</h1>
        <p className="text-gray-700 mb-6 text-center">
          El radicado <span className="font-semibold">{solicitud.radicado}</span> fue asignado exitosamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al panel de asignación...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 shadow rounded-lg border border-gray-200">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-blue-700 hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Volver atrás
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-6">Detalles de la Solicitud</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
        <p><strong>Radicado:</strong> <span className="font-mono">{solicitud.radicado}</span></p>
        <p><strong>Estado:</strong> {solicitud.estado}</p>
        <p>
          <strong>Fecha de radicación:</strong>{" "}
          {fechaRadicacion
            ? `${fechaRadicacion.toLocaleDateString()} – ${fechaRadicacion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "No disponible"}
        </p>
        <p><strong>Nombre:</strong> {solicitud.nombre} {solicitud.apellido}</p>
        <p><strong>Correo:</strong> {solicitud.correo}</p>
        <p><strong>Teléfono:</strong> {solicitud.celular}</p>
        <p><strong>Dirección:</strong> {solicitud.direccion}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Mensaje del peticionario:</h3>
        <div className="bg-gray-100 border border-gray-300 p-3 rounded text-sm text-gray-800">
          {solicitud.mensaje}
        </div>
      </div>

      {solicitud.archivo && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Archivo adjunto:</h3>
          <iframe
            src={`${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/${solicitud.archivo.replace(/^\/?/, "")}`}
            title="Archivo PDF"
            width="100%"
            height="1000px"
            className="border border-gray-300 rounded"
          />
        </div>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium block mb-2">Asignar a responsable:</label>
        <select
          className="border rounded w-full px-3 py-2 text-sm mb-4"
          onChange={(e) => setResponsableSeleccionado(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Seleccionar responsable</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>

        <label className="text-sm font-medium block mb-2">Plazo en días hábiles:</label>
        <input
          type="number"
          className="border rounded w-full px-3 py-2 text-sm mb-2"
          placeholder="Ej: 10"
          onChange={(e) => {
            const valor = e.target.value;
            setDiasSeleccionados(valor);
            if (valor && parseInt(valor) > 0) {
              calcularFechaVencimiento(parseInt(valor));
            } else {
              setFechaVencimientoVisual("");
            }
          }}
        />

        {fechaVencimientoVisual && (
          <p className="text-sm text-gray-600 mb-4">
            📅 Esta solicitud vencerá el:{" "}
            <span className="font-semibold">{fechaVencimientoVisual}</span>
          </p>
        )}

        <label className="text-sm font-medium block mb-2">Tipo de PQRSD:</label>
        <input
          type="text"
          className="border rounded w-full px-3 py-2 text-sm mb-4"
          placeholder="Ej: Derecho de petición de información"
          value={tipoPQRS}
          onChange={(e) => setTipoPQRS(e.target.value)}
        />

        <button
          onClick={asignar}
          disabled={cargandoAsignar}
          className={`px-4 py-2 rounded text-sm w-full flex justify-center items-center ${
            cargandoAsignar
              ? "bg-blue-400 cursor-wait"
              : "bg-blue-700 hover:bg-blue-800"
          } text-white transition`}
        >
          {cargandoAsignar ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} /> Asignando...
            </>
          ) : (
            "Asignar solicitud"
          )}
        </button>
      </div>
    </div>
  );
}

export default DetalleSolicitud;
