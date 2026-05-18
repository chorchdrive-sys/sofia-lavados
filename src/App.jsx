import React, { useState, useEffect, useCallback, useMemo } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FIREBASE (Ajustada para compatibilidad Vercel)
// ═══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyFakeKey_SofLavadosV5",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sofia-lavados.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sofia-lavados",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sofia-lavados.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1234567890:web:fakeappiddone"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
// CONSTANTES LOGÍSTICAS DE NEGOCIO
// ═══════════════════════════════════════════════════════════════
const BASE_LAT = -34.5128;
const BASE_LNG = -58.4985; // Juan Bautista Alberdi 1620, Olivos

const FRANJAS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

const RADIOS_COBERTURA = {
  moto: 2.5, // 25 cuadras
  bici: 1.5, // 15 cuadras
  apie: 0.7  // 7 cuadras
};

const PRECIO_BASE_AUTO = 25000;

const PALABRAS_ALERTA = ["detallista", "complicado", "insoportable", "no poner revividor", "ojo"];

const STAFF_PREDEFINIDO = [
  { id: "1", nombre: "Jhony", color: "#22d3ee", rol: "lavador", transporteBase: "moto" },
  { id: "2", nombre: "Sergio", color: "#0ea5e9", rol: "lavador", transporteBase: "moto" },
  { id: "3", nombre: "Alexander", color: "#38bdf8", rol: "lavador", transporteBase: "moto" },
  { id: "4", nombre: "Maxi", color: "#7dd3fc", rol: "lavador", transporteBase: "bici" },
  { id: "5", nombre: "Rene", color: "#06b6d4", rol: "lavador", transporteBase: "moto" },
  { id: "6", nombre: "Brandon", color: "#67e8f9", rol: "lavador", transporteBase: "moto" },
  { id: "7", nombre: "Jorge", color: "#a5f3fc", rol: "lavador", transporteBase: "moto" },
  { id: "8", nombre: "Emiliano", color: "#2dd4bf", rol: "lavador", transporteBase: "moto" },
  { id: "9", nombre: "Gaby", color: "#5eead4", rol: "lavador", transporteBase: "apie" },
  { id: "10", nombre: "Fede (Encargado)", color: "#f59e0b", rol: "encargado", transporteBase: "moto" }
];

// FÓRMULA HAVERSINE (Cálculo de Km reales)
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function App() {
  // Estados de navegación e interfaz
  const [vista, setVista] = useState("agenda"); // agenda | clientes | staff | cierre
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split("T")[0]);
  const [notificacion, setNotificacion] = useState(null);

  // Estados de Datos de Firebase
  const [staff, setStaff] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Estados para Formularios / Modales
  const [modalNuevoTurno, setModalNuevoTurno] = useState(null); // { conductorId, hora }
  const [modalDetalleTurno, setModalDetalleTurno] = useState(null); // turno objeto
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [modalNuevoStaff, setModalNuevoStaff] = useState(false);
  
  // Inputs del nuevo turno
  const [formTurno, setFormTurno] = useState({
    clienteId: "",
    nombreManual: "",
    telefonoManual: "",
    direccionManual: "",
    cantAutos: 1,
    notas: "",
    metodoPago: "efectivo",
    montoManual: ""
  });

  // Geocodificación y semáforo logística en vivo
  const [geoCargando, setGeoCargando] = useState(false);
  const [logisticaInfo, setLogisticaInfo] = useState(null);

  // Inputs nuevo cliente
  const [formCliente, setFormCliente] = useState({ nombre: "", tel: "", direccion: "", habituales: "", notas: "" });
  // Inputs nuevo staff
  const [formStaff, setFormStaff] = useState({ nombre: "", rol: "lavador", transporteBase: "moto", color: "#38bdf8" });
  // Filtro Contable
  const [filtroCierre, setFiltroCierre] = useState("hoy"); // hoy | semana | mes

  // Disparar una alerta Toast efímera
  const mostrarToast = (msg, tipo = "info") => {
    setNotificacion({ msg, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // ═══════════════════════════════════════════════════════════════
  // ESCUCHAS EN TIEMPO REAL (FIREBASE FIRESTORE)
  // ═══════════════════════════════════════════════════════════════
  
  // 1. Carga inicial Semillas de Staff si está vacío, o escucha staff
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), (snap) => {
      if (snap.empty) {
        // Ejecutar sembrado si está vacío
        STAFF_PREDEFINIDO.forEach(async (member) => {
          await setDoc(doc(db, "staff", member.id), member);
        });
      } else {
        const lista = [];
        snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
        setStaff(lista);
      }
    });
    return () => unsub();
  }, []);

  // 2. Escucha Clientes permanente
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clientes"), (snap) => {
      const lista = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      setClientes(lista);
    });
    return () => unsub();
  }, []);

  // 3. Escucha Asistencia de la fecha seleccionada
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "asistencia", fechaSeleccionada), (snap) => {
      if (snap.exists()) {
        setAsistencia(snap.data());
      } else {
        // Fallback dinámico inicial: Todos presentes con su transporte base
        const inicial = {};
        staff.forEach(s => {
          inicial[s.id] = { presente: true, transporteHoy: s.transporteBase };
        });
        setAsistencia(inicial);
      }
    });
    return () => unsub();
  }, [fechaSeleccionada, staff]);

  // 4. Escucha Turnos de la fecha seleccionada
  useEffect(() => {
    const unsub = onSnapshot(collection(db, `turnos_${fechaSeleccionada}`), (snap) => {
      const lista = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      setTurnos(lista);
    });
    return () => unsub();
  }, [fechaSeleccionada]);

  // Filtrar lavadores presentes hoy para renderizar la Agenda
  const lavadoresPresentes = useMemo(() => {
    return staff.filter(s => {
      if (s.role === "encargado" || s.rol === "encargado") return false;
      const asist = asistencia[s.id];
      return asist ? asist.presente : false;
    });
  }, [staff, asistencia]);

  // Verificar si hay alertas proactivas críticas en textos
  const detectarAlertasCriticas = (texto) => {
    if (!texto) return false;
    const lower = texto.toLowerCase();
    return PALABRAS_ALERTA.some(palabra => lower.includes(palabra));
  };

  const mostrarBannerAlertaLive = useMemo(() => {
    // Alertas en el input actual o notas del cliente seleccionado
    if (detectarAlertasCriticas(formTurno.notas)) return true;
    if (formTurno.clienteId) {
      const c = clientes.find(item => item.id === formTurno.clienteId);
      if (c && (detectarAlertasCriticas(c.notas) || detectarAlertasCriticas(c.habituales))) return true;
    }
    if (detectarAlertasCriticas(formTurno.nombreManual) || detectarAlertasCriticas(formTurno.direccionManual)) return true;
    return false;
  }, [formTurno, clientes]);

  // ═══════════════════════════════════════════════════════════════
  // GEOPOSICIONAMIENTO Y ANALIZADOR LOGÍSTICO (Semáforo Inteligente)
  // ═══════════════════════════════════════════════════════════════
  
  // Buscar ubicación de dirección en el turno anterior o en Base
  const obtenerDireccionPreviaCoordenadas = (conductorId, horaActual) => {
    const turnosDelLavador = turnos
      .filter(t => t.conductorId === conductorId && t.hora < horaActual)
      .sort((a, b) => b.hora.localeCompare(a.hora)); // El más reciente primero

    if (turnosDelLavador.length > 0) {
      const u = turnosDelLavador[0];
      if (u.lat && u.lng) {
        return { lat: u.lat, lng: u.lng, descripcion: `Turno previo de las ${u.hora} (${u.direccion})` };
      }
    }
    return { lat: BASE_LAT, lng: BASE_LNG, descripcion: "Base Operaciones Olivos" };
  };

  // Disparar validación logística al cambiar dirección o cliente
  const evaluarLogisticaDestino = async (direccionTexto, conductorId, hora) => {
    if (!direccionTexto || !conductorId || !hora) return;
    setGeoCargando(true);
    try {
      // Llamada limpia y segura a API de Nominatim OpenStreetMap
      const queryGeo = encodeURIComponent(`${direccionTexto}, Buenos Aires, Argentina`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryGeo}&limit=1`);
      const data = await res.json();

      let destLat = BASE_LAT;
      let destLng = BASE_LNG;
      let encontrado = false;

      if (data && data.length > 0) {
        destLat = parseFloat(data[0].lat);
        destLng = parseFloat(data[0].lon);
        encontrado = true;
      }

      // Origen logístico (Fórmula de negocio: desde base o turno previo)
      const origen = obtenerDireccionPreviaCoordenadas(conductorId, hora);
      const distancia = calcularDistanciaKm(origen.lat, origen.lng, destLat, destLng);

      // Determinar radio según transporte asignado HOY
      const transporteHoy = asistencia[conductorId]?.transporteHoy || "moto";
      const radioMax = RADIOS_COBERTURA[transporteHoy] || 2.5;

      const esFueraZona = distancia > radioMax;

      setLogisticaInfo({
        encontrado,
        lat: destLat,
        lng: destLng,
        distanciaKm: distancia,
        origenDescripcion: origen.descripcion,
        esFueraZona,
        transporteHoy,
        radioMax
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGeoCargando(false);
    }
  };

  // Escucha cambios de dirección en el formulario de turnos para actualizar semáforo
  useEffect(() => {
    if (!modalNuevoTurno) return;
    let dir = formTurno.direccionManual;
    if (formTurno.clienteId) {
      const c = clientes.find(item => item.id === formTurno.clienteId);
      if (c) dir = c.direccion;
    }
    
    const delayDebounce = setTimeout(() => {
      if (dir && dir.trim().length > 4) {
        evaluarLogisticaDestino(dir, modalNuevoTurno.conductorId, modalNuevoTurno.hora);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [formTurno.direccionManual, formTurno.clienteId, modalNuevoTurno, clientes]);

  // Al seleccionar un cliente cargado, rellenamos datos
  const handleSeleccionarClienteTurno = (id) => {
    if (!id) {
      setFormTurno(prev => ({ ...prev, clienteId: "", nombreManual: "", telefonoManual: "", direccionManual: "" }));
      setLogisticaInfo(null);
      return;
    }
    const c = clientes.find(item => item.id === id);
    if (c) {
      setFormTurno(prev => ({
        ...prev,
        clienteId: id,
        nombreManual: c.nombre,
        telefonoManual: c.tel,
        direccionManual: c.direccion
      }));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES CRUD (ACCIONES DIRECTAS FIRESTORE)
  // ═══════════════════════════════════════════════════════════════

  // Guardar Turno (Soporta bloqueo de bloques múltiples según cantidad de autos)
  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    if (!modalNuevoTurno) return;
    const { conductorId, hora } = modalNuevoTurno;

    // Obtener datos finales limpios
    let nombre = formTurno.nombreManual.trim();
    let tel = formTurno.telefonoManual.trim();
    let dir = formTurno.direccionManual.trim();
    let notas = formTurno.notas.trim();

    if (formTurno.clienteId) {
      const c = clientes.find(item => item.id === formTurno.clienteId);
      if (c) {
        nombre = c.nombre;
        tel = c.tel;
        dir = c.direccion;
      }
    }

    if (!nombre || !dir) {
      mostrarToast("Nombre y Dirección son requeridos", "error");
      return;
    }

    // Validar teléfono móvil (8 a 12 dígitos numéricos)
    const telLimpio = tel.replace(/\D/g, "");
    if (telLimpio.length < 8 || telLimpio.length > 12) {
      mostrarToast("Teléfono inválido. Debe poseer entre 8 y 12 dígitos numéricos.", "error");
      return;
    }

    // Cálculo Contable de tarifas del turno
    let subtotal = PRECIO_BASE_AUTO * parseInt(formTurno.cantAutos);
    if (formTurno.montoManual) {
      subtotal = parseFloat(formTurno.montoManual);
    }

    const esFZ = logisticaInfo ? logisticaInfo.esFueraZona : false;
    let recargo = 0;
    if (esFZ) {
      recargo = subtotal * 0.20; // 20% Recargo innegociable por fuera de zona
    }
    const total = subtotal + recargo;

    // Calcular franjas a ocupar de acuerdo al total de vehículos
    const indiceHoraInicial = FRANJAS.indexOf(hora);
    const slotsAOcupar = [];
    const nAutos = parseInt(formTurno.cantAutos);
    
    // Si limpia 1 o 2 autos consume 1 bloque, si son 3 autos ocupa 2 bloques, etc.
    const bloquesNecesarios = nAutos <= 1 ? 1 : nAutos === 2 ? 2 : 3;

    for (let i = 0; i < bloquesNecesarios; i++) {
      if (indiceHoraInicial + i < FRANJAS.length) {
        slotsAOcupar.push(FRANJAS[indiceHoraInicial + i]);
      }
    }

    const conductorObj = staff.find(s => s.id === conductorId);
    const turnoIdPrimario = `${conductorId}_${hora}_${Date.now()}`;

    try {
      // Guardar todos los bloques asociados en la sub-colección del día
      const batch = writeBatch(db);

      slotsAOcupar.forEach((hBlock, index) => {
        const idDocumento = `${conductorId}_${hBlock}`;
        const dataTurno = {
          id: idDocumento,
          idGrupo: turnoIdPrimario,
          conductorId,
          conductorNombre: conductorObj ? conductorObj.nombre : "Lavador",
          hora: hBlock,
          esBloqueoSecundario: index > 0,
          bloqueOriginal: hora,
          clienteNombre: nombre,
          clienteTel: telLimpio,
          direccion: dir,
          cantAutos: nAutos,
          notas: notas,
          metodoPago: formTurno.metodoPago,
          total: index === 0 ? total : 0, // El monto total se le adjudica al bloque principal
          esFZ,
          pagado: false,
          lat: logisticaInfo ? logisticaInfo.lat : BASE_LAT,
          lng: logisticaInfo ? logisticaInfo.lng : BASE_LNG,
          fecha: fechaSeleccionada
        };
        batch.set(doc(db, `turnos_${fechaSeleccionada}`, idDocumento), dataTurno);
      });

      // Si es un cliente nuevo y manual, guardarlo automáticamente en CRM para el futuro
      if (!formTurno.clienteId) {
        const nuevoClienteId = `cli_${Date.now()}`;
        batch.set(doc(db, "clientes", nuevoClienteId), {
          id: nuevoClienteId,
          nombre,
          tel: telLimpio,
          direccion: dir,
          habituales: `${nAutos} auto/s`,
          notas: "Registrado desde agenda automática"
        });
      }

      await batch.commit();
      mostrarToast("Turno y agenda configurados con éxito", "ok");
      
      // Reset formularios
      setModalNuevoTurno(null);
      setLogisticaInfo(null);
      setFormTurno({
        clienteId: "", nombreManual: "", telefonoManual: "", direccionManual: "",
        cantAutos: 1, notas: "", metodoPago: "efectivo", montoManual: ""
      });
    } catch (err) {
      console.error(err);
      mostrarToast("Error guardando agenda en Base de datos", "error");
    }
  };

  // Eliminar / Cancelar Turno Completo (Libera slots ocupados por el mismo grupo)
  const handleCancelarTurno = async (turno) => {
    try {
      const grupoId = turno.idGrupo || turno.id;
      // Buscar todos los bloques que coincidan con este grupo de turno
      const turnosCoincidentes = turnos.filter(t => t.idGrupo === grupoId || t.id === grupoId || (t.bloqueOriginal === turno.bloqueOriginal && t.conductorId === turno.conductorId));
      
      const batch = writeBatch(db);
      turnosCoincidentes.forEach(t => {
        batch.delete(doc(db, `turnos_${fechaSeleccionada}`, t.id));
      });

      await batch.commit();
      mostrarToast("Turno cancelado y slots liberados", "ok");
      setModalDetalleTurno(null);
    } catch (err) {
      mostrarToast("Error al cancelar turno", "error");
    }
  };

  // Registrar pago inmediato desde la agenda rápida
  const handleMarcarPagado = async (turno) => {
    try {
      await setDoc(doc(db, `turnos_${fechaSeleccionada}`, turno.id), { pagado: true }, { merge: true });
      mostrarToast("Pago registrado con éxito", "ok");
      setModalDetalleTurno(null);
    } catch (err) {
      mostrarToast("Error actualizando cobro", "error");
    }
  };

  // Guardar nuevo cliente desde pestaña CRM
  const handleCrearClienteCRM = async (e) => {
    e.preventDefault();
    if (!formCliente.nombre || !formCliente.direccion) return;
    const cleanTel = formCliente.tel.replace(/\D/g, "");
    const id = `cli_${Date.now()}`;
    try {
      await setDoc(doc(db, "clientes", id), {
        id,
        nombre: formCliente.nombre,
        tel: cleanTel,
        direccion: formCliente.direccion,
        habituales: formCliente.habituales,
        notas: formCliente.notas
      });
      mostrarToast("Cliente agendado en CRM", "ok");
      setFormCliente({ nombre: "", tel: "", direccion: "", habituales: "", notas: "" });
      setModalNuevoCliente(false);
    } catch (e) {
      mostrarToast("Error guardando cliente", "error");
    }
  };

  // Guardar nuevo miembro de Staff
  const handleCrearStaff = async (e) => {
    e.preventDefault();
    if (!formStaff.nombre) return;
    const id = `staff_${Date.now()}`;
    try {
      await setDoc(doc(db, "staff", id), {
        id,
        nombre: formStaff.nombre,
        rol: formStaff.rol,
        transporteBase: formStaff.transporteBase,
        color: formStaff.color
      });
      mostrarToast("Miembro añadido al staff", "ok");
      setFormStaff({ nombre: "", rol: "lavador", transporteBase: "moto", color: "#38bdf8" });
      setModalNuevoStaff(false);
    } catch (err) {
      mostrarToast("Error guardando staff", "error");
    }
  };

  // Actualizar asistencia de hoy en tiempo real
  const cambiarAsistenciaEstado = async (staffId, presente, transporteHoy) => {
    const actual = { ...asistencia };
    actual[staffId] = { presente, transporteHoy };
    try {
      await setDoc(doc(db, "asistencia", fechaSeleccionada), actual);
    } catch (e) {
      mostrarToast("Error actualizando asistencia", "error");
    }
  };

  // Generador de Mensaje Profesional de WhatsApp para Coordinación de Lavadores
  const lanzarWhatsAppConductor = (turno) => {
    const texto = `*SOFÍA LAVADOS MÓVIL 🧼*\n\n` +
                  `Hola *${turno.conductorNombre}*, tenés un turno asignado:\n` +
                  `⏰ *Franja:* ${turno.hora} hs\n` +
                  `👤 *Cliente:* ${turno.clienteNombre}\n` +
                  `📍 *Dirección:* ${turno.direccion}\n` +
                  `🚗 *Cantidad:* ${turno.cantAutos} Vehículo(s)\n` +
                  `💰 *Cobrar:* $${turno.total?.toLocaleString() || "0"} (${turno.metodoPago.toUpperCase()})\n` +
                  `${turno.esFZ ? "⚠️ *Nota:* Dirección Fuera de Zona (Recargo ya sumado)\n" : ""}` +
                  `📝 *Notas:* ${turno.notas || "Sin especificaciones."}\n\n` +
                  `Por favor, avisar al arribar al domicilio. ¡Buen viaje! 🚀`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // ═══════════════════════════════════════════════════════════════
  // EXPORTADOR BACKUP JSON CONTRA ERRORES
  // ═══════════════════════════════════════════════════════════════
  const descargarBackupCompletoJSON = async () => {
    try {
      const backup = {
        clientes,
        staff,
        asistenciaDeHoy: asistencia,
        turnosDeHoy: turnos,
        fechaExportacion: fechaSeleccionada,
        sistema: "Sofía Lavados v5.0",
        timestamp: Date.now()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sofia_lavados_backup_${fechaSeleccionada}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      mostrarToast("Copia de seguridad descargada", "ok");
    } catch (e) {
      mostrarToast("Error generando descarga", "error");
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // LÓGICA DE CIERRE CONTABLE AVANZADO (Para Jorge)
  // ═══════════════════════════════════════════════════════════════
  const metricasContables = useMemo(() => {
    // Para simplificar localmente en Vercel, calculamos sobre el espectro de turnos del día cargado
    // En producción masiva Jorge puede cambiar la fecha para mapear cierres acumulados
    let bruto = 0;
    let transferenciasMP = 0;
    let efectivoTotal = 0;
    let fzContador = 0;

    const tablaComisiones = {}; // id_lavador -> { nombre, totalLavado, comision, efectivoAgarrado, saldo }

    // Inicializar staff lavador
    staff.forEach(s => {
      if (s.rol === "lavador") {
        tablaComisiones[s.id] = { nombre: s.nombre, bruto: 0, comision: 0, efectivoCobrado: 0 };
      }
    });

    turnos.forEach(t => {
      // Solo sumamos el total al bloque maestro (donde esBloqueoSecundario no es true)
      if (t.esBloqueoSecundario) return;

      const monto = t.total || 0;
      bruto += monto;

      if (t.metodoPago === "transferencia" || t.metodoPago === "mp") {
        transferenciasMP += monto;
      } else {
        efectivoTotal += monto;
      }

      if (t.esFZ) fzContador++;

      if (tablaComisiones[t.conductorId]) {
        tablaComisiones[t.conductorId].bruto += monto;
        // Lógica de comisión de la casa: 50% para el lavador sobre el servicio
        tablaComisiones[t.conductorId].comision += (monto * 0.50);
        if (t.metodoPago === "efectivo") {
          tablaComisiones[t.conductorId].efectivoCobrado += monto;
        }
      }
    });

    return { bruto, transferenciasMP, efectivoTotal, fzContador, comisiones: Object.values(tablaComisiones) };
  }, [turnos, staff]);


  return (
    <div className="min-h-screen bg-[#080c18] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* HEADER DE CONTROL INTEGRADO */}
      <header className="border-b border-slate-800 bg-[#0c1324] sticky top-0 z-40 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xl font-bold shadow-cyan-500/20 shadow-md">
              🧼
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                SOFÍA LAVADOS <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">v5.0</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Cerebro Logístico de Alta Gama</p>
            </div>
          </div>

          {/* FECHADOR MOBILE FIRST */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input 
              type="date" 
              className="bg-slate-900 border border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-bold text-cyan-400 max-w-[160px]"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
          </div>

        </div>

        {/* MENÚ DE PESTAÑAS (Único, Grande y Accesible "Dedo") */}
        <nav className="max-w-6xl mx-auto mt-3 grid grid-cols-4 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setVista("agenda")} 
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${vista === "agenda" ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}
          >
            🗓 Agenda
          </button>
          <button 
            onClick={() => setVista("clientes")} 
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${vista === "clientes" ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}
          >
            👥 CRM Clientes
          </button>
          <button 
            onClick={() => setVista("staff")} 
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${vista === "staff" ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}
          >
            🚶 Staff/Asist
          </button>
          <button 
            onClick={() => setVista("cierre")} 
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${vista === "cierre" ? "bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}
          >
            📊 Cierre Jorge
          </button>
        </nav>
      </header>

      {/* NOTIFICACIONES TOAST */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-50 animate-bounce flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold border border-white/10 text-white bg-slate-900">
          <span className={notificacion.tipo === "ok" ? "text-emerald-400" : notificacion.tipo === "error" ? "text-rose-500" : "text-amber-400"}>
            {notificacion.tipo === "ok" ? "✓" : "⚠️"}
          </span>
          {notificacion.msg}
        </div>
      )}

      {/* CUERPO CENTRAL DE LA APLICACIÓN */}
      <main className="max-w-6xl mx-auto p-4 pb-24">

        {/* ═══════════════════════════════════════════════════════════════
            VISTA 1: AGENDA DE REALIDAD OPERATIVA
            ═══════════════════════════════════════════════════════════════ */}
        {vista === "agenda" && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">
                Lavadores Operativos Hoy: <span className="text-cyan-400">{lavadoresPresentes.length}</span>
              </span>
              <p className="text-xs text-slate-500 italic">Toca un casillero vacío para asignar bloque real de 90 minutos.</p>
            </div>

            {lavadoresPresentes.length === 0 ? (
              <div className="text-center py-16 bg-[#0c1324] rounded-2xl border border-dashed border-slate-800 space-y-3">
                <span className="text-4xl">😴</span>
                <h3 className="text-base font-bold text-slate-300">No hay lavadores marcados como PRESENTES</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Dirigite a la pestaña de "Staff/Asist" para activar los chicos que vinieron a trabajar hoy.</p>
                <button onClick={() => setVista("staff")} className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-bold text-cyan-400">
                  Ir a marcar asistencia
                </button>
              </div>
            ) : (
              /* GRILLA HORARIA LOGÍSTICA */
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0c1324]">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-3 w-24 border-r border-slate-800 bg-slate-900 sticky left-0 z-10">Bloque (90m)</th>
                      {lavadoresPresentes.map(l => (
                        <th key={l.id} className="p-3 border-r border-slate-800 text-center min-w-[140px]" style={{ borderTop: `3px solid ${l.color}` }}>
                          <div className="font-black text-slate-100">{l.nombre}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tight flex items-center justify-center gap-1 mt-0.5">
                            <span>{asistencia[l.id]?.transporteHoy === "moto" ? "🏍 Moto" : asistencia[l.id]?.transporteHoy === "bici" ? "🚲 Bici" : "🚶 A pie"}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FRANJAS.map(hora => (
                      <tr key={hora} className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                        <td className="p-3 font-black text-slate-300 text-xs bg-slate-900/80 border-r border-slate-800 sticky left-0 z-10 text-center">
                          {hora} hs
                        </td>
                        {lavadoresPresentes.map(l => {
                          // Buscar si este lavador tiene un turno ocupado en esta franja
                          const turnoEnSlot = turnos.find(t => t.conductorId === l.id && t.hora === hora);

                          if (turnoEnSlot) {
                            if (turnoEnSlot.esBloqueoSecundario) {
                              return (
                                <td 
                                  key={`${l.id}_${hora}`} 
                                  onClick={() => setModalDetalleTurno(turnoEnSlot)}
                                  className="p-2 border-r border-slate-800/60 bg-indigo-950/20 text-center cursor-pointer group"
                                >
                                  <div className="text-[10px] text-indigo-400 font-bold group-hover:underline">
                                    ⏳ [Ocupado por Auto Extra]
                                  </div>
                                  <div className="text-[9px] text-slate-500 truncate max-w-[130px]">
                                    {turnoEnSlot.clienteNombre}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={`${l.id}_${hora}`}
                                onClick={() => setModalDetalleTurno(turnoEnSlot)}
                                className={`p-2 border-r border-slate-800/60 cursor-pointer transition-all ${turnoEnSlot.pagado ? "bg-emerald-950/30 border-l-4 border-l-emerald-500" : "bg-cyan-950/30 border-l-4 border-l-cyan-500"} hover:brightness-125`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className="font-bold text-slate-200 text-xs truncate max-w-[100px] block">
                                    {turnoEnSlot.clienteNombre}
                                  </span>
                                  {turnoEnSlot.esFZ && (
                                    <span className="text-[9px] font-black bg-amber-500 text-slate-900 px-1 rounded">FZ</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                                  📍 {turnoEnSlot.direccion}
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                                  <span>🚗 x{turnoEnSlot.cantAutos}</span>
                                  <span className="font-bold text-slate-300">${turnoEnSlot.total?.toLocaleString()}</span>
                                </div>
                              </td>
                            );
                          }

                          // Slot Libre vacio
                          return (
                            <td 
                              key={`${l.id}_${hora}`}
                              onClick={() => {
                                setModalNuevoTurno({ conductorId: l.id, hora });
                                setFormTurno(prev => ({ ...prev, notas: "" }));
                              }}
                              className="p-3 border-r border-slate-800/40 text-center cursor-pointer text-slate-700 hover:bg-slate-800/40 hover:text-cyan-500 transition-all text-xs font-medium"
                            >
                              + Libre
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* ═══════════════════════════════════════════════════════════════
            VISTA 2: CRM BASE DE DATOS DE CLIENTES
            ═══════════════════════════════════════════════════════════════ */}
        {vista === "clientes" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-white">CRM Clientes Frecuentes</h2>
                <p className="text-xs text-slate-400">Listado histórico para llamadas y asignaciones rápidas.</p>
              </div>
              <button 
                onClick={() => setModalNuevoCliente(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs px-3 py-2 rounded-lg"
              >
                + Nuevo Cliente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clientes.map(c => {
                const esPeligro = detectarAlertasCriticas(c.notas) || detectarAlertasCriticas(c.habituales);
                return (
                  <div key={c.id} className={`p-3 rounded-xl border ${esPeligro ? "bg-amber-950/20 border-amber-600/50" : "bg-slate-900/60 border-slate-800"} flex flex-col justify-between gap-2`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm text-slate-100">{c.nombre}</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                          📞 {c.tel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium">📍 {c.direccion}</p>
                      {c.habituales && (
                        <p className="text-[11px] text-cyan-400 mt-1">✨ Frecuencia/Autos: {c.habituales}</p>
                      )}
                      {c.notas && (
                        <p className="text-xs text-slate-400 bg-slate-950/40 p-1.5 rounded mt-2 italic">
                          💡 {c.notas}
                        </p>
                      )}
                    </div>
                    {esPeligro && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-1 text-[10px] font-bold text-amber-400 text-center uppercase tracking-wider">
                        ⚠️ Alerta Crítica en Historial
                      </div>
                    )}
                  </div>
                );
              })}
              {clientes.length === 0 && (
                <p className="text-slate-500 text-xs py-6 text-center col-span-2">Ningún cliente registrado aún.</p>
              )}
            </div>
          </div>
        )}


        {/* ═══════════════════════════════════════════════════════════════
            VISTA 3: GESTIÓN DE STAFF, ASISTENCIA Y BACKUP
            ═══════════════════════════════════════════════════════════════ */}
        {vista === "staff" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#0c1324] p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Panel de Control Operativo</h2>
                <p className="text-xs text-slate-400">Controlá quién vino hoy a trabajar y modificá sus vehículos asignados.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={descargarBackupCompletoJSON}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5"
                >
                  ⬇ Descargar Backup
                </button>
                <button 
                  onClick={() => setModalNuevoStaff(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-3 py-2 rounded-lg font-bold text-xs"
                >
                  + Agregar Staff
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asistencia Diaria del Personal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {staff.map(member => {
                  const asistObj = asistencia[member.id] || { presente: false, transporteHoy: member.transporteBase };
                  
                  return (
                    <div key={member.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-10 rounded-full" style={{ backgroundColor: member.color }} />
                        <div>
                          <h4 className="font-black text-sm text-white">{member.nombre}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold uppercase">
                            {member.rol}
                          </span>
                        </div>
                      </div>

                      {/* SELECTOR BIG TOUCH PARA ASISTENCIA */}
                      <div className="flex items-center gap-2">
                        {/* Tipo de transporte hoy */}
                        <select 
                          className="bg-slate-950 text-xs p-1.5 rounded-lg border border-slate-700 text-slate-300 font-bold focus:outline-none"
                          value={asistObj.transporteHoy}
                          onChange={(e) => cambiarAsistenciaState(member.id, asistObj.presente, e.target.value)}
                        >
                          <option value="moto">🏍 Moto</option>
                          <option value="bici">🚲 Bici</option>
                          <option value="apie">🚶 A pie</option>
                        </select>

                        {/* Botón Switch Presente / Ausente */}
                        <button
                          type="button"
                          onClick={() => cambiarAsistenciaEstado(member.id, !asistObj.presente, asistObj.transporteHoy)}
                          className={`px-3 py-2 rounded-lg font-bold text-xs min-w-[85px] transition-all text-center ${asistObj.presente ? "bg-emerald-500 text-slate-950" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}
                        >
                          {asistObj.presente ? "● PRESENTE" : "○ AUSENTE"}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}


        {/* ═══════════════════════════════════════════════════════════════
            VISTA 4: MÓDULO CONTABLE PARA JORGE (TRIPLE CIERRE + LIQUIDACIÓN)
            ═══════════════════════════════════════════════════════════════ */}
        {vista === "cierre" && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="bg-[#0c1324] border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-white">Módulo de Auditoría y Liquidaciones</h2>
                  <p className="text-xs text-slate-400">Métricas en vivo de la fecha seleccionada.</p>
                </div>
                {/* TRIPLE CIERRE SELECTOR */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                  {["hoy", "semana", "mes"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setFiltroCierre(opt);
                        mostrarToast(`Filtrado contable por ${opt} simulado`, "info");
                      }}
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${filtroCierre === opt ? "bg-cyan-500 text-slate-900" : "text-slate-400"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTADORES FINANCIEROS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">TOTAL BRUTO</span>
                  <span className="text-lg font-black text-cyan-400">${metricasContables.bruto.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">EFECTIVO CAJA</span>
                  <span className="text-lg font-black text-emerald-400">${metricasContables.efectivoTotal.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">TRANSFERENCIAS / MP</span>
                  <span className="text-lg font-black text-indigo-400">${metricasContables.transferenciasMP.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">TURNOS FUERA ZONA</span>
                  <span className="text-lg font-black text-amber-400">⚡ {metricasContables.fzContador} FZ</span>
                </div>
              </div>
            </div>

            {/* TABLA DE LIQUIDACIÓN DE COMISIONES */}
            <div className="bg-[#0c1324] border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Cálculo Automático de Comisiones (50% Lavador)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase">
                      <th className="p-3">Lavador</th>
                      <th className="p-3">Producción Bruta</th>
                      <th className="p-3">Comisión Neto (50%)</th>
                      <th className="p-3">Efectivo en Mano</th>
                      <th className="p-3 text-right">Saldo a Transferir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricasContables.comisiones.map(c => {
                      // Saldo = lo que ganó de comision - el efectivo físico que ya retuvo del cliente
                      const saldoATransferir = c.comision - c.efectivoCobrado;
                      return (
                        <tr key={c.nombre} className="border-b border-slate-800 hover:bg-slate-900/40">
                          <td className="p-3 font-black text-slate-200">{c.nombre}</td>
                          <td className="p-3 font-mono text-slate-300">${c.bruto.toLocaleString()}</td>
                          <td className="p-3 font-mono text-cyan-400 font-bold">${c.comision.toLocaleString()}</td>
                          <td className="p-3 font-mono text-amber-500">${c.efectivoCobrado.toLocaleString()}</td>
                          <td className={`p-3 font-mono text-right font-black ${saldoATransferir >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {saldoATransferir >= 0 ? `$${saldoATransferir.toLocaleString()}` : `-$${Math.abs(saldoATransferir).toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: AGENDAR NUEVO TURNO / INTELIGENCIA DE SEMÁFORO LOGÍSTICO
          ═══════════════════════════════════════════════════════════════ */}
      {modalNuevoTurno && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-2">
          <div className="bg-[#0c1324] border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
            
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white">Nuevo Turno Asignado</h3>
                <p className="text-xs text-slate-400">Bloque inicial de las {modalNuevoTurno.hora} hs</p>
              </div>
              <button 
                onClick={() => { setModalNuevoTurno(null); setLogisticaInfo(null); }}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarTurno} className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* SELECTOR INTEGRADO CRM */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vincular Cliente del CRM (Opcional)</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  value={formTurno.clienteId}
                  onChange={(e) => handleSeleccionarClienteTurno(e.target.value)}
                >
                  <option value="">-- Cargar de forma Manual o Nuevo --</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nombre} - {cli.direccion}</option>
                  ))}
                </select>
              </div>

              {/* CAMPOS MANUALES */}
              {!formTurno.clienteId && (
                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo del Cliente</label>
                    <input 
                      type="text" required placeholder="Ej: Carlos Bianchi"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      value={formTurno.nombreManual}
                      onChange={(e) => setFormTurno({...formTurno, nombreManual: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono (8-12 nros)</label>
                    <input 
                      type="tel" required placeholder="1123456789"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      value={formTurno.telefonoManual}
                      onChange={(e) => setFormTurno({...formTurno, telefonoManual: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección Completa</label>
                    <input 
                      type="text" required placeholder="Ej: Maipú 2400, Olivos"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      value={formTurno.direccionManual}
                      onChange={(e) => setFormTurno({...formTurno, direccionManual: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* CONFIGURACIÓN DEL SERVICIO */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Cantidad Vehículos</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
                    value={formTurno.cantAutos}
                    onChange={(e) => setFormTurno({...formTurno, cantAutos: parseInt(e.target.value)})}
                  >
                    <option value={1}>1 Auto (Ocupa 90m)</option>
                    <option value={2}>2 Autos (Ocupa 180m consecutivos)</option>
                    <option value={3}>3 Autos (Ocupa 270m consecutivos)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Método de Pago</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    value={formTurno.metodoPago}
                    onChange={(e) => setFormTurno({...formTurno, metodoPago: e.target.value})}
                  >
                    <option value="efectivo">💵 Efectivo al Chico</option>
                    <option value="transferencia">🏛 Transferencia Bancaria</option>
                    <option value="mp">📱 Mercado Pago (Sofi)</option>
                  </select>
                </div>
              </div>

              {/* PRECIO EXCEPCIONAL MANUAL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Precio Customizado (Opcional, Base: $25.000 p/auto)</label>
                <input 
                  type="number" placeholder="Dejar vacío para cálculo automático"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  value={formTurno.montoManual}
                  onChange={(e) => setFormTurno({...formTurno, montoManual: e.target.value})}
                />
              </div>

              {/* NOTAS OPERATIVAS */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Notas del Turno</label>
                <textarea 
                  rows={2} placeholder="Detalles de lavado, llaves, restricciones..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  value={formTurno.notas}
                  onChange={(e) => setFormTurno({...formTurno, notas: e.target.value})}
                />
              </div>

              {/* 🧭 CORAZÓN GEOGRÁFICO: MONITOR DE LOGÍSTICA EN VIVO */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-[10px] font-black tracking-wider uppercase text-slate-400">Verificador Logístico en Tiempo Real</h4>
                
                {geoCargando && (
                  <div className="text-xs text-cyan-400 animate-pulse font-medium">🌐 Analizando geoposicionamiento y cuadrantes de cobertura...</div>
                )}

                {logisticaInfo && !geoCargando && (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Punto Origen:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[240px]">{logisticaInfo.origenDescripcion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distancia Estimada:</span>
                      <span className="text-cyan-400 font-bold">{logisticaInfo.distanciaKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Radio Límite ({logisticaInfo.transporteHoy.toUpperCase()}):</span>
                      <span className="text-slate-300 font-mono">{logisticaInfo.radioMax} km</span>
                    </div>

                    {/* SEMÁFORO DE COBERTURA */}
                    {logisticaInfo.esFueraZona ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded p-2 text-rose-400 font-bold text-[11px] uppercase tracking-wide">
                        🚨 FUERA DE ZONA: Supera radio permitido. Se aplicará recargo innegociable del +20% al confirmar.
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wide">
                        ✅ DENTRO DE ZONA: Trayecto logístico óptimo y seguro.
                      </div>
                    )}
                  </div>
                )}
                {!logisticaInfo && !geoCargando && (
                  <p className="text-[10px] text-slate-500 italic">Escribí una dirección arriba para auditar distancias por satélite.</p>
                )}
              </div>

              {/* 🎨 ALERTAS PROACTIVAS: BANNER AMARILLO VIBRANTE INNEGOCIABLE */}
              {mostrarBannerAlertaLive && (
                <div className="bg-amber-400 text-slate-950 p-3 rounded-xl font-black text-xs space-y-1 shadow-lg border-2 border-amber-500 uppercase tracking-wide animate-pulse">
                  <div>⚠️ ALERTA DE SEGURIDAD OPERATIVA CRÍTICA:</div>
                  <div className="font-bold text-[11px] normal-case tracking-normal">
                    Se detectaron palabras restrictivas ("ojo", "detallista", "complicado", "no poner revividor"). Informar detalladamente al lavador antes de iniciar el servicio móvil.
                  </div>
                </div>
              )}

              {/* BOTÓN GRANDE DEDO PARA CREACIÓN */}
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-widest shadow-md transition-all mt-2"
              >
                Confirmar y Bloquear Slots
              </button>

            </form>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════
          MODAL: DETALLE Y ACCIONES DE TURNO EXISTENTE
          ═══════════════════════════════════════════════════════════════ */}
      {modalDetalleTurno && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-2">
          <div className="bg-[#0c1324] border border-slate-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-white">Gestión de Turno Agendado</h3>
                <p className="text-xs text-slate-400">Lavador: {modalDetalleTurno.conductorNombre}</p>
              </div>
              <button onClick={() => setModalDetalleTurno(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Cliente</span>
                  <div className="font-black text-sm text-slate-200">{modalDetalleTurno.clienteNombre}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Contacto</span>
                  <div className="font-mono text-cyan-400">{modalDetalleTurno.clienteTel}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Dirección de Destino</span>
                  <div className="text-slate-300 font-medium">📍 {modalDetalleTurno.direccion}</div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Monto Total</span>
                    <span className="font-black text-base text-slate-100">${modalDetalleTurno.total?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Forma de Pago</span>
                    <span className="font-bold text-indigo-400 uppercase">{modalDetalleTurno.metodoPago}</span>
                  </div>
                </div>
              </div>

              {modalDetalleTurno.notas && (
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 italic text-slate-400">
                  <span className="text-[9px] text-slate-500 block not-italic font-bold uppercase">Notas:</span>
                  "{modalDetalleTurno.notas}"
                </div>
              )}

              {/* BOTONES ACCIÓN RÁPIDA - MOBILE FIRST */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                
                {/* BOTÓN WHATSAPP COORDINACIÓN */}
                <button
                  type="button"
                  onClick={() => lanzarWhatsAppConductor(modalDetalleTurno)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  💬 Despachar por WhatsApp
                </button>

                {/* MARCAR COMO COBRADO */}
                {!modalDetalleTurno.pagado && (
                  <button
                    type="button"
                    onClick={() => handleMarcarPagado(modalDetalleTurno)}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider"
                  >
                    💰 Registrar Pago Recibido
                  </button>
                )}

                {/* ELIMINAR / CANCELAR SLOT */}
                <button
                  type="button"
                  onClick={() => {
                    if(confirm("¿Estás seguro de que deseas cancelar este turno? Se liberarán todos los bloques reservados.")) {
                      handleCancelarTurno(modalDetalleTurno);
                    }
                  }}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  🚫 Cancelar Turno Completo
                </button>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* MODAL MÁSCARA: NUEVO CLIENTE CRM */}
      {modalNuevoCliente && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-[#0c1324] border border-slate-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase">Crear Ficha Cliente CRM</h3>
              <button onClick={() => setModalNuevoCliente(false)} className="text-slate-400 text-sm">✕</button>
            </div>
            <form onSubmit={handleCrearClienteCRM} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Nombre</label>
                <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formCliente.nombre} onChange={e=>setFormCliente({...formCliente, nombre: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Teléfono móvil</label>
                <input type="tel" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formCliente.tel} onChange={e=>setFormCliente({...formCliente, tel: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Dirección Habitual</label>
                <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formCliente.direccion} onChange={e=>setFormCliente({...formCliente, direccion: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Vehículos Habituales</label>
                <input type="text" placeholder="Ej: 2 Camionetas" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formCliente.habituales} onChange={e=>setFormCliente({...formCliente, habituales: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Notas o Restricciones Históricas</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formCliente.notas} onChange={e=>setFormCliente({...formCliente, notas: e.target.value})}/>
              </div>
              <button type="submit" className="w-full bg-cyan-500 text-slate-950 font-bold py-2.5 rounded uppercase mt-2">Guardar Cliente</button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL MÁSCARA: NUEVO EMPLEADO STAFF */}
      {modalNuevoStaff && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-[#0c1324] border border-slate-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase">Añadir Personal de Trabajo</h3>
              <button onClick={() => setModalNuevoStaff(false)} className="text-slate-400 text-sm">✕</button>
            </div>
            <form onSubmit={handleCrearStaff} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Nombre</label>
                <input type="text" required placeholder="Ej: Javier" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formStaff.nombre} onChange={e=>setFormStaff({...formStaff, nombre: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Rol Operativo</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formStaff.rol} onChange={e=>setFormStaff({...formStaff, rol: e.target.value})}>
                  <option value="lavador">Lavador Múltiple (Aparece en Agenda)</option>
                  <option value="encargado">Encargado Logístico / Supervisor</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Transporte Default</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={formStaff.transporteBase} onChange={e=>setFormStaff({...formStaff, transporteBase: e.target.value})}>
                  <option value="moto">🏍 Moto (Radio 25c)</option>
                  <option value="bici">🚲 Bici (Radio 15c)</option>
                  <option value="apie">🚶 A pie (Radio 7c)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Color Identificador</label>
                <input type="color" className="w-full h-8 bg-slate-900 border border-slate-700 rounded p-1" value={formStaff.color} onChange={e=>setFormStaff({...formStaff, color: e.target.value})}/>
              </div>
              <button type="submit" className="w-full bg-cyan-500 text-slate-950 font-bold py-2.5 rounded uppercase mt-2">Dar de Alta</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
