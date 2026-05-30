import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, writeBatch, query, where, orderBy, limit
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════════
const FB = {
  apiKey:            "AIzaSyDBZS7KR8YIq8UzAhnq9WaPTh8wGTZ-SMI",
  authDomain:        "sofia-lavados-99231.firebaseapp.com",
  projectId:         "sofia-lavados-99231",
  storageBucket:     "sofia-lavados-99231.firebasestorage.app",
  messagingSenderId: "738758410354",
  appId:             "1:738758410354:web:0c07ee6f2906d8add402eb",
};

const app = initializeApp(FB);
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════════════════════
const BASE_LAT  = -34.5128;
const BASE_LNG  = -58.4985;
const FRANJAS_BASE = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];
const TIEMPOS_LAVADO_BASE = { "Chico": 30, "Mediano": 45, "Camioneta": 60 };

const TAMANOS_DEFAULT = [
  { id:"chico", label:"Chico", precio:25000 },
  { id:"mediano", label:"Mediano", precio:28000 },
  { id:"camioneta", label:"Camioneta", precio:32000 },
];

const COLORES = ["#93c5fd", "#c4b5fd", "#fca5a5", "#fdba74", "#86efac", "#67e8f9", "#a5b4fc", "#f0abfc", "#fcd34d", "#a7f3d0", "#bae6fd", "#fecdd3"];

const STAFF_SEED = [
  {nombre: "Jhony", transporte: "moto", color: "#93c5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Sergio", transporte: "moto", color: "#c4b5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Alexander", transporte: "moto", color: "#fca5a5", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Maxi", transporte: "moto", color: "#fdba74", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Rene", transporte: "moto", color: "#86efac", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Brandon", transporte: "moto", color: "#67e8f9", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Jorge", transporte: "moto", color: "#a5b4fc", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Emiliano", transporte: "moto", color: "#f0abfc", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Gaby", transporte: "moto", color: "#fcd34d", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Javi", transporte: "moto", color: "#a7f3d0", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Franco", transporte: "moto", color: "#bae6fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Fede", transporte: "moto", color: "#fecdd3", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Elias", transporte: "moto", color: "#93c5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Alvaro", transporte: "bici", color: "#c4b5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Nestor", transporte: "bici", color: "#fca5a5", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Matias", transporte: "bici", color: "#fdba74", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Luis", transporte: "bici", color: "#86efac", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Bruno", transporte: "bici", color: "#67e8f9", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: ""},
  {nombre: "Nico Alto", transporte: "bici", color: "#a5b4fc", whatsapp: true, rol: "lavador", especial: "rapido", saldoPendiente: 0, telefono: ""},
  {nombre: "Hernán", transporte: "bici", color: "#f0abfc", whatsapp: false, rol: "lavador", especial: "avisar_presencia", saldoPendiente: 0, telefono: ""},
  {nombre: "Gastón", transporte: "bici", color: "#fcd34d", whatsapp: false, rol: "lavador", especial: "llamar_telefono", saldoPendiente: 0, telefono: ""},
];

const BARRIOS_INICIALES = {
  "olivos": "OLI", "martinez": "MAR", "florida": "FLO", "san isidro": "SIS",
  "acassuso": "ACA", "la lucila": "LAL", "boulogne": "BOU", "vicente lopez": "VLO",
  "munro": "MUN", "villa adelina": "VAD", "beccar": "BEC",
};

let LISTA_BARRIOS = Object.keys(BARRIOS_INICIALES).map(k => k.charAt(0).toUpperCase() + k.slice(1));

function codigoBarrio(barrioNombre) {
  if (!barrioNombre || barrioNombre.trim() === "" || barrioNombre.toLowerCase() === "desconocido") return "DES";
  const limpio = barrioNombre.replace(/[()[\],]/g, " ").replace(/\s+/g, " ").trim();
  const b = limpio.toLowerCase().replace(/[áéíóúü]/g, m => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" }[m] || m));
  for (const [k, v] of Object.entries(BARRIOS_INICIALES)) {
    if (b.includes(k)) return v;
  }
  const cod = b.replace(/[\s,]+/g, "").substring(0, 3).toUpperCase();
  if (!LISTA_BARRIOS.find(x => x.toLowerCase() === limpio.toLowerCase())) LISTA_BARRIOS.push(limpio);
  return cod;
}

const CLIENTES_SEED = [
  { nombre: "Victoria", telefono: "", direccion: "Dardo Rocha 3278", barrio: "Olivos", autosHabituales: 3, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "OLI-001-Victoria" },
  { nombre: "Martin", telefono: "", direccion: "Colectora Panamericana 2065", barrio: "San Isidro", autosHabituales: 3, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "SIS-001-Martin" },
  { nombre: "Micaela", telefono: "", direccion: "Eduardo Costa 902", barrio: "Acassuso", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "ACA-001-Micaela" },
  { nombre: "Hyundai", telefono: "", direccion: "Av. Santa Fe 2627", barrio: "Martínez", autosHabituales: 4, nota: "Confirmar cantidad (3-5 autos)", tipo: "🔥 Top", deuda: 0, codigo: "MAR-001-Hyundai" },
  { nombre: "Mariana", telefono: "", direccion: "Diagonal Salta 557", barrio: "Olivos", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "OLI-002-Mariana" },
  { nombre: "Caro", telefono: "", direccion: "Las Heras 1533", barrio: "Martínez", autosHabituales: 3, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-002-Caro" },
  { nombre: "Salva", telefono: "", direccion: "Hipólito Yrigoyen 2647", barrio: "Martínez", autosHabituales: 1, nota: "Silicina en llantas y paragolpes", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-003-Salva" },
  { nombre: "Johana", telefono: "", direccion: "Blas Parera 429", barrio: "Boulogne", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "BOU-001-Johana" },
  { nombre: "Karina", telefono: "", direccion: "Cangallo 846", barrio: "Martínez", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-004-Karina" },
  { nombre: "Andres", telefono: "", direccion: "Paraná 374", barrio: "Martínez", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-005-Andres" },
  { nombre: "Barby", telefono: "", direccion: "Fray Justo Sarmiento 3304", barrio: "Olivos", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "OLI-003-Barby" },
  { nombre: "Tomás", telefono: "", direccion: "Córdoba 596", barrio: "Martínez", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-006-Tomás" },
  { nombre: "HernanC", telefono: "", direccion: "Beruti 1583", barrio: "Martínez", autosHabituales: 2, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-007-HernanC" },
  { nombre: "Agustín", telefono: "", direccion: "Colectora Panamericana 2065", barrio: "San Isidro", autosHabituales: 1, nota: "Llamar antes", tipo: "⭐ Frecuente", deuda: 0, codigo: "SIS-002-Agustín" },
  { nombre: "Candelaria", telefono: "", direccion: "Ladislao Martínez 440", barrio: "Martínez", autosHabituales: 1, nota: "", tipo: "⭐ Frecuente", deuda: 0, codigo: "MAR-008-Candelaria" },
  { nombre: "Vero", telefono: "", direccion: "Entre Ríos 2397", barrio: "Martínez", autosHabituales: 1, nota: "Confirmar", tipo: "💤 Ocasional", deuda: 0, codigo: "MAR-009-Vero" },
  { nombre: "Avri", telefono: "", direccion: "Entre Ríos 2983", barrio: "Martínez", autosHabituales: 1, nota: "", tipo: "💤 Ocasional", deuda: 0, codigo: "MAR-010-Avri" },
  { nombre: "Ale", telefono: "", direccion: "Sáenz Valiente 2163", barrio: "Olivos", autosHabituales: 1, nota: "", tipo: "💤 Ocasional", deuda: 0, codigo: "OLI-004-Ale" },
  { nombre: "GabyC", telefono: "", direccion: "Catamarca 1304", barrio: "Florida", autosHabituales: 2, nota: "", tipo: "💤 Ocasional", deuda: 0, codigo: "FLO-001-GabyC" },
  { nombre: "Pablo", telefono: "", direccion: "Ezpeleta 531", barrio: "Martínez", autosHabituales: 2, nota: "", tipo: "💤 Ocasional", deuda: 0, codigo: "MAR-011-Pablo" },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const hoy = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ar = new Date(utc - 3 * 60 * 60000);
  const y = ar.getFullYear();
  const m = String(ar.getMonth() + 1).padStart(2, "0");
  const d = String(ar.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const fechaAR = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

const horaAR = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ar = new Date(utc - 3 * 60 * 60000);
  return `${String(ar.getHours()).padStart(2, "0")}:${String(ar.getMinutes()).padStart(2, "0")}`;
};

const franjasValidas = () => {
  const ahora = new Date();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes() + 30;
  return FRANJAS_BASE.filter(h => {
    const [hr, mn] = h.split(":").map(Number);
    return hr * 60 + mn > minutos;
  });
};

// PUNTO 7: Generar franjas dinámicas según necesidad
const generarFranjasDinamicas = (turnos) => {
  let franjas = [...FRANJAS_BASE];
  if (turnos.length === 0) return franjas;
  
  // Encontrar el turno que termina más tarde
  let maxHoraFin = 0;
  turnos.forEach(t => {
    if (t.estado === "terminado") return;
    const [hr, mn] = t.hora.split(":").map(Number);
    const duracionBase = TIEMPOS_LAVADO_BASE[t.auto] || 45;
    const cant = t.cantidadAutos || 1;
    const duracionTotal = duracionBase * cant;
    const minutosFin = hr * 60 + mn + duracionTotal;
    if (minutosFin > maxHoraFin) maxHoraFin = minutosFin;
  });
  
  // Agregar franjas adicionales si es necesario
  const ultimaFranjaBase = franjas[franjAS_BASE.length - 1];
  const [hrUltima, mnUltima] = ultimaFranjaBase.split(":").map(Number);
  const minutosUltima = hrUltima * 60 + mnUltima;
  
  if (maxHoraFin > minutosUltima) {
    // Agregar franjas cada 90 minutos después de las 18:00
    let minutosSiguiente = minutosUltima + 90;
    while (minutosSiguiente <= maxHoraFin + 30) {
      const hr = Math.floor(minutosSiguiente / 60);
      const mn = minutosSiguiente % 60;
      franjas.push(`${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`);
      minutosSiguiente += 90;
    }
  }
  
  return franjas;
};

const formatP = n => "$" + Number(n || 0).toLocaleString("es-AR");

const sinAcentos = s => (s || "").toLowerCase().replace(/[áéíóúü]/g, m => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" }[m] || m));

function mostrarTelefono(cliente) {
  const telefono = cliente?.telefono;
  if (telefono && telefono !== "") return `📞 ${telefono}`;
  return "📞 Sin registrar";
}

function capitalizar(nombre) {
  if (!nombre) return "";
  const minusculas = ["de", "del", "la", "las", "los", "el", "y", "a", "en", "von", "van", "di", "da", "do", "das", "dos"];
  return nombre.trim().split(/\s+/).map((p, i) => {
    const low = p.toLowerCase();
    if (i > 0 && minusculas.includes(low)) return low;
    return low.charAt(0).toUpperCase() + low.slice(1);
  }).join(" ");
}

const _geocache = {};

async function geocodificar(dir) {
  const resultadoDefault = { lat: BASE_LAT, lng: BASE_LNG, barrio: "", codigoPostal: "", provincia: "", ciudad: "", encontrado: false };
  if (!dir || dir.trim().length < 5) return resultadoDefault;
  if (_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&viewbox=-58.55,-34.45,-58.40,-34.55&bounded=0`, { headers: { "Accept-Language": "es", "User-Agent": "SofiaLavados/6.0" } });
    const data = await res.json();
    if (data && data.length > 0) {
      let mejorResultado = data[0], menorDistancia = Infinity;
      for (const item of data) {
        const addr = item.address || {};
        const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || "";
        if (barrio) {
          const lat = parseFloat(item.lat), lng = parseFloat(item.lon);
          const dist = Math.sqrt(Math.pow(lat - BASE_LAT, 2) + Math.pow(lng - BASE_LNG, 2));
          if (dist < menorDistancia) { menorDistancia = dist; mejorResultado = item; }
        }
      }
      const addr = mejorResultado.address || {};
      const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || addr.village || "";
      const coords = { lat: parseFloat(mejorResultado.lat), lng: parseFloat(mejorResultado.lon), barrio: capitalizar(barrio), codigoPostal: addr.postcode || "", provincia: capitalizar(addr.state || ""), ciudad: capitalizar(addr.city || addr.town || addr.municipality || ""), encontrado: !!barrio };
      _geocache[dir] = coords;
      return coords;
    }
  } catch (err) { console.warn("Geocodificación falló:", err); }
  return resultadoDefault;
}

async function generarCodigoCliente(barrio, nombre, COL_CLIENTES, codigosExistentes = []) {
  const codBarrio = codigoBarrio(barrio);
  let existentes = codigosExistentes;
  if (existentes.length === 0) { const snap = await getDocs(collection(db, COL_CLIENTES)); existentes = snap.docs.map(d => d.data().codigo || ""); }
  const prefijo = `${codBarrio}-`;
  let maxNum = 0;
  existentes.forEach(c => { if (c && c.startsWith(prefijo)) { const num = parseInt(c.split("-")[1], 10); if (!isNaN(num) && num > maxNum) maxNum = num; } });
  const sigNum = String(maxNum + 1).padStart(3, "0");
  const nombreClean = (nombre || "").replace(/\s+/g, "").substring(0, 10);
  return `${codBarrio}-${sigNum}-${nombreClean}`;
}

function calcularFinTurno(horaInicio, tipoVehiculo, cantidadAutos = 1) {
  const [hr, mn] = horaInicio.split(":").map(Number);
  const minutosInicio = hr * 60 + mn;
  const duracionBase = TIEMPOS_LAVADO_BASE[tipoVehiculo] || 45;
  const duracionTotal = duracionBase * Math.max(1, cantidadAutos);
  const minutosFin = minutosInicio + duracionTotal;
  return { minutosFin, horaFin: `${String(Math.floor(minutosFin / 60)).padStart(2, "0")}:${String(minutosFin % 60).padStart(2, "0")}`, duracion: duracionTotal, duracionBase };
}

function sugerirLavadorPrioridad(presentes, turnosHoy, cliente) {
  if (presentes.length === 0) return null;
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const estadoLavadores = presentes.map(lavador => {
    const turnosActivos = turnosHoy.filter(t => t.lavadorId === lavador.id && (t.estado === "pendiente" || t.estado === "en_progreso"));
    if (turnosActivos.length === 0) return { lavador, inactivo: true, minutosFin: 0, distancia: 0 };
    let maxMinutosFin = 0;
    turnosActivos.forEach(t => { const cant = t.cantidadAutos || 1; const fin = calcularFinTurno(t.hora, t.auto, cant); if (fin.minutosFin > maxMinutosFin) maxMinutosFin = fin.minutosFin; });
    const barrioLavador = lavador.barrioActual || "", barrioCliente = cliente?.barrio || "";
    const mismaZona = barrioLavador && barrioCliente && sinAcentos(barrioLavador).includes(sinAcentos(barrioCliente));
    return { lavador, inactivo: false, minutosFin: maxMinutosFin, distancia: mismaZona ? 0 : 1 };
  });
  estadoLavadores.sort((a, b) => { if (a.inactivo && !b.inactivo) return -1; if (!a.inactivo && b.inactivo) return 1; if (a.minutosFin !== b.minutosFin) return a.minutosFin - b.minutosFin; return a.distancia - b.distancia; });
  const hayInactivos = estadoLavadores.some(e => e.inactivo), mejor = estadoLavadores[0];
  if (!mejor.inactivo && hayInactivos) { const minutosRestantes = mejor.minutosFin - minutosAhora; if (minutosRestantes > 20) { const inactivo = estadoLavadores.find(e => e.inactivo); if (inactivo) return inactivo.lavador; } }
  return mejor.lavador;
}

// ═══════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════
const fsGet = async (col, id) => { if (!db) return null; try { const s = await getDoc(doc(db, col, id)); return s.exists() ? { id: s.id, ...s.data() } : null; } catch { return null; } };
const fsSave = async (col, id, data) => { if (!db) return; try { await setDoc(doc(db, col, id), { ...data, _ts: serverTimestamp() }, { merge: true }); } catch { } };
const fsAdd = async (col, data) => { if (!db) return null; try { const r = await addDoc(collection(db, col), { ...data, _ts: serverTimestamp() }); return r.id; } catch { return null; } };
const fsDel = async (col, id) => { if (!db) return; try { await deleteDoc(doc(db, col, id)); } catch { } };
const fsList = async (col) => { if (!db) return []; try { const s = await getDocs(collection(db, col)); return s.docs.map(d => ({ id: d.id, ...s.data() })); } catch { return []; } };
const fsUpdate = async (col, id, data) => { if (!db) return; try { await updateDoc(doc(db, col, id), data); } catch { } };

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════
function Toast({ msg, tipo, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const styles = { ok: { bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b", icon: "#059669" }, error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "#dc2626" }, warn: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#d97706" } };
  const s = styles[tipo] || styles.ok;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.icon}`, color: s.text, padding: "14px 20px", borderRadius: 14, fontSize: 13, fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif", boxShadow: "0 8px 30px rgba(0,0,0,.06)", maxWidth: 320, animation: "fadeInUp .3s ease-out", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: `${s.icon}18`, color: s.icon, fontSize: 12 }}>{tipo === "ok" ? "✓" : tipo === "error" ? "✗" : "⚠"}</span>
      {msg}
    </div>
  );
}

function Modal({ titulo, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(241,245,249,.6)", backdropFilter: "blur(12px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn .2s ease-out" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, width: "100%", maxWidth: wide ? 580 : 440, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.06)", animation: "scaleIn .25s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{titulo}</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "6px 10px", borderRadius: 10, transition: "all .15s" }} onMouseOver={e => e.target.style.background = "#e2e8f0"} onMouseOut={e => e.target.style.background = "#f1f5f9"}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = "primary", ghost, danger, disabled, full, sm, style = {} }) {
  const palettes = { primary: { bg: "#bfdbfe", hover: "#93c5fd", text: "#1e3a8a", shadow: "rgba(147,197,253,.3)" }, secondary: { bg: "#ddd6fe", hover: "#c4b5fd", text: "#5b21b6", shadow: "rgba(196,181,253,.3)" }, tertiary: { bg: "#a7f3d0", hover: "#6ee7b7", text: "#064e3b", shadow: "rgba(167,243,208,.3)" }, success: { bg: "#bbf7d0", hover: "#86efac", text: "#14532d", shadow: "rgba(187,247,208,.3)" }, warning: { bg: "#fed7aa", hover: "#fdba74", text: "#9a3412", shadow: "rgba(254,215,170,.3)" }, danger: { bg: "#fecaca", hover: "#fca5a5", text: "#991b1b", shadow: "rgba(254,202,202,.3)" } };
  const p = danger ? palettes.danger : (typeof color === "string" && palettes[color]) ? palettes[color] : { bg: color, hover: color, text: "#334155", shadow: "rgba(0,0,0,.05)" };
  const baseStyle = ghost ? { background: "transparent", border: `1.5px solid #cbd5e1`, color: "#475569", boxShadow: "none" } : disabled ? { background: "#f1f5f9", color: "#94a3b8", boxShadow: "none", border: "1px solid #e2e8f0" } : { background: p.bg, color: p.text, border: "1px solid transparent", boxShadow: `0 4px 14px ${p.shadow}` };
  return (
    <button style={{ ...baseStyle, borderRadius: sm ? 10 : 14, padding: sm ? "7px 14px" : "11px 22px", fontSize: sm ? 12 : 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", transition: "all .2s ease", opacity: disabled ? 0.6 : 1, fontFamily: "'Inter',system-ui,sans-serif", transform: "translateY(0)", ...style }}
      onMouseOver={e => { if (!disabled && !ghost) { e.currentTarget.style.background = p.hover; e.currentTarget.style.transform = "translateY(-2px)" } }}
      onMouseOut={e => { if (!disabled && !ghost) { e.currentTarget.style.background = p.bg; e.currentTarget.style.transform = "translateY(0)" } }}
      onClick={!disabled ? onClick : undefined}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BUSCADOR DE CLIENTES
// ═══════════════════════════════════════════════════════════════
function BuscadorClientes({ clientes, value, onChange, placeholder, onCreateNew }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const wrapperRef = useRef(null);
  useEffect(() => { const handleClickOutside = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setAbierto(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  useEffect(() => { if (value && clientes) { const c = clientes.find(cli => cli.id === value); if (c) setBusqueda(c.nombre); } }, [value, clientes]);
  const filtrados = busqueda.trim() === "" ? clientes : clientes.filter(c => sinAcentos(c.nombre).includes(sinAcentos(busqueda)) || sinAcentos(c.codigo || "").includes(sinAcentos(busqueda)) || sinAcentos(c.barrio || "").includes(sinAcentos(busqueda)));
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", transition: "border-color .2s, box-shadow .2s", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setAbierto(true); }} onFocus={() => setAbierto(true)} placeholder={placeholder || "Buscar cliente por nombre, código o barrio..."} style={inputStyle} />
      {abierto && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 4, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 25px rgba(0,0,0,.08)" }}>
          {filtrados.length === 0 ? (busqueda.trim().length > 2 ? (<div style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>No se encontraron resultados</div><Btn sm color="tertiary" full onClick={() => { onCreateNew && onCreateNew(busqueda); setAbierto(false); }}>➕ Crear "{busqueda}" como nuevo</Btn></div>) : (<div style={{ padding: 14, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Sin resultados</div>)) : (filtrados.map(c => (<button key={c.id} onClick={() => { onChange(c.id); setBusqueda(c.nombre); setAbierto(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid #f3f4f6", transition: "background .15s", fontFamily: "'Inter',system-ui,sans-serif" }} onMouseOver={e => e.currentTarget.style.background = "#f9fafb"} onMouseOut={e => e.currentTarget.style.background = "transparent"}><div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{c.nombre}</div><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{c.codigo} • {c.barrio}</div></button>)))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO CLIENTE
// ═══════════════════════════════════════════════════════════════
function ModalNuevoCliente({ nombreInicial, onClose, COL_CLIENTES, mostrarToast, onClienteCreated, codigosExistentes }) {
  const [datos, setDatos] = useState({ nombre: nombreInicial || "", telefono: "", direccion: "", barrio: "", codigoPostal: "", provincia: "", nota: "" });
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [error, setError] = useState("");
  const [avisoGeo, setAvisoGeo] = useState(null);
  const buscarDireccion = async () => {
    if (!datos.direccion || datos.direccion.trim().length < 5) { mostrarToast("Ingresá una dirección más completa (mín. 5 caracteres)", "warn"); return; }
    setBuscandoDir(true); setAvisoGeo(null);
    const res = await geocodificar(datos.direccion);
    if (res && res.encontrado && res.barrio) { setDatos(prev => ({ ...prev, barrio: res.barrio, codigoPostal: res.codigoPostal || prev.codigoPostal, provincia: res.provincia || prev.provincia })); setAvisoGeo({ detectado: res.barrio, mensaje: `Se detectó: ${res.barrio}. ¿Es correcto?`, tipo: "ok" }); }
    else { setAvisoGeo({ detectado: "", mensaje: "⚠️ No se pudo determinar el barrio. Preguntale al cliente e ingresalo manualmente.", tipo: "warn" }); }
    setBuscandoDir(false);
  };
  const handleDireccionBlur = async () => { if (datos.direccion && datos.direccion.trim().length >= 8 && !datos.barrio) { await buscarDireccion(); } };
  const guardar = async () => {
    setError("");
    if (!datos.nombre || datos.nombre.trim().length < 2) return setError("El nombre es obligatorio (mín. 2 caracteres)");
    if (!datos.direccion || datos.direccion.trim().length < 5) return setError("La dirección debe tener al menos 5 caracteres");
    if (!datos.barrio || datos.barrio.trim() === "" || datos.barrio.toLowerCase() === "desconocido") return setError("El barrio es obligatorio. Tocá 📍 para detectarlo o preguntale al cliente.");
    try {
      const codigo = await generarCodigoCliente(datos.barrio, datos.nombre, COL_CLIENTES, codigosExistentes || []);
      const nuevoCliente = { nombre: capitalizar(datos.nombre), telefono: datos.telefono || "", direccion: datos.direccion, barrio: capitalizar(datos.barrio), codigoPostal: datos.codigoPostal || "", provincia: datos.provincia || "", autosHabituales: 1, nota: datos.nota || "", tipo: "💤 Ocasional", deuda: 0, codigo };
      const docRef = await addDoc(collection(db, COL_CLIENTES), { ...nuevoCliente, _ts: serverTimestamp() });
      mostrarToast(`Cliente creado: ${codigo}`, "ok");
      onClienteCreated({ id: docRef.id, ...nuevoCliente });
      onClose();
    } catch (err) { console.error(err); mostrarToast("Error al crear cliente", "error"); }
  };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", transition: "border-color .2s, box-shadow .2s", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  return (
    <Modal titulo="➕ Nuevo Cliente" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && <div style={{ color: "#dc2626", fontSize: 12, background: "#fef2f2", padding: 10, borderRadius: 8, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
        {avisoGeo && (<div style={{ background: avisoGeo.tipo === "ok" ? "linear-gradient(135deg,#dbeafe,#eff6ff)" : "linear-gradient(135deg,#fef3c7,#fffbeb)", border: `1.5px solid ${avisoGeo.tipo === "ok" ? "#93c5fd" : "#fcd34d"}`, borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><div style={{ fontSize: 12, color: avisoGeo.tipo === "ok" ? "#1e3a8a" : "#92400e", fontWeight: 600 }}>📍 {avisoGeo.mensaje}</div>{avisoGeo.tipo === "ok" && (<Btn sm color="warning" onClick={() => { setDatos(prev => ({ ...prev, barrio: "" })); setAvisoGeo(null); }}>Cambiar</Btn>)}</div>)}
        <div><label style={labelStyle}>Nombre *</label><input value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} style={inputStyle} autoFocus /></div>
        <div><label style={labelStyle}>Teléfono (opcional)</label><input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} placeholder="Si no tiene, dejar vacío" style={inputStyle} /></div>
        <div><label style={labelStyle}>Dirección Completa * (mín. 5 caracteres)</label><div style={{ display: "flex", gap: 8 }}><input value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })} onBlur={handleDireccionBlur} style={{ ...inputStyle, flex: 1 }} placeholder="Ej: Av. Santa Fe 1234" /><button onClick={buscarDireccion} disabled={buscandoDir} style={{ background: buscandoDir ? "#e5e7eb" : "#bfdbfe", border: "none", borderRadius: 12, padding: "0 14px", cursor: buscandoDir ? "not-allowed" : "pointer", fontSize: 16 }}>{buscandoDir ? "⏳" : "📍"}</button></div></div>
        <div><label style={labelStyle}>Barrio / Localidad * (obligatorio)</label><input value={datos.barrio} onChange={e => { setDatos({ ...datos, barrio: e.target.value }); setAvisoGeo(null); }} placeholder="Se autocompleta con 📍 o preguntale al cliente" style={inputStyle} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div><label style={labelStyle}>Código Postal</label><input value={datos.codigoPostal} onChange={e => setDatos({ ...datos, codigoPostal: e.target.value })} style={inputStyle} /></div><div><label style={labelStyle}>Provincia</label><input value={datos.provincia} onChange={e => setDatos({ ...datos, provincia: e.target.value })} style={inputStyle} /></div></div>
        <div><label style={labelStyle}>Nota</label><input value={datos.nota} onChange={e => setDatos({ ...datos, nota: e.target.value })} placeholder="Ej: Tiene perro, llamar antes" style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}><Btn ghost onClick={onClose} full>Cancelar</Btn><Btn color="success" full onClick={guardar}>💾 Guardar Cliente</Btn></div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL EDITAR CLIENTE
// ═══════════════════════════════════════════════════════════════
function ModalEditarCliente({ cliente, onClose, COL_CLIENTES, mostrarToast }) {
  const [datos, setDatos] = useState({ ...cliente });
  const guardar = async () => { try { await fsUpdate(COL_CLIENTES, cliente.id, { telefono: datos.telefono || "", direccion: datos.direccion || "", barrio: datos.barrio || "", nota: datos.nota || "", tipo: datos.tipo || "", autosHabituales: Number(datos.autosHabituales) || 1 }); mostrarToast("Cliente actualizado correctamente", "ok"); onClose(); } catch (err) { mostrarToast("Error al actualizar cliente", "error"); } };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  return (
    <Modal titulo={`✏️ Editar: ${cliente.nombre}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#f9fafb", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>Código: <strong style={{ color: "#1e293b", fontFamily: "monospace" }}>{cliente.codigo}</strong></div>
        <div><label style={labelStyle}>Teléfono</label><input value={datos.telefono || ""} onChange={e => setDatos({ ...datos, telefono: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Dirección</label><input value={datos.direccion || ""} onChange={e => setDatos({ ...datos, direccion: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Barrio</label><input value={datos.barrio || ""} onChange={e => setDatos({ ...datos, barrio: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Tipo</label><select value={datos.tipo || ""} onChange={e => setDatos({ ...datos, tipo: e.target.value })} style={inputStyle}><option value="⭐ Frecuente">⭐ Frecuente</option><option value="🔥 Top">🔥 Top</option><option value="💤 Ocasional">💤 Ocasional</option></select></div>
        <div><label style={labelStyle}>Autos Habituales</label><input type="number" value={datos.autosHabituales || 1} onChange={e => setDatos({ ...datos, autosHabituales: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Nota</label><input value={datos.nota || ""} onChange={e => setDatos({ ...datos, nota: e.target.value })} style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}><Btn ghost onClick={onClose} full>Cancelar</Btn><Btn color="primary" full onClick={guardar}>💾 Guardar Cambios</Btn></div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL GESTIÓN DE LAVADORES
// ═══════════════════════════════════════════════════════════════
function ModalGestionLavadores({ staff, onClose, COL_STAFF, mostrarToast }) {
  const [nuevoLavador, setNuevoLavador] = useState({ nombre: "", telefono: "", transporte: "moto", whatsapp: true });
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const guardarNuevo = async () => { if (!nuevoLavador.nombre || nuevoLavador.nombre.trim().length < 2) return mostrarToast("El nombre es obligatorio", "warn"); try { const coloresUsados = staff.map(s => s.color); const colorNuevo = COLORES.find(c => !coloresUsados.includes(c)) || "#94a3b8"; await addDoc(collection(db, COL_STAFF), { nombre: capitalizar(nuevoLavador.nombre), telefono: nuevoLavador.telefono || "", transporte: nuevoLavador.transporte, whatsapp: nuevoLavador.whatsapp, color: colorNuevo, rol: "lavador", especial: "", saldoPendiente: 0, _ts: serverTimestamp() }); mostrarToast(`Lavador ${nuevoLavador.nombre} agregado`, "ok"); setNuevoLavador({ nombre: "", telefono: "", transporte: "moto", whatsapp: true }); setMostrarFormNuevo(false); } catch (err) { mostrarToast("Error al agregar lavador", "error"); } };
  const eliminarLavador = async (lavador) => { if (!window.confirm(`¿Eliminar a ${lavador.nombre}?`)) return; try { await deleteDoc(doc(db, COL_STAFF, lavador.id)); mostrarToast(`${lavador.nombre} eliminado`, "ok"); } catch (err) { mostrarToast("Error al eliminar", "error"); } };
  const actualizarTelefono = async (lavador, nuevoTelefono) => { try { await fsUpdate(COL_STAFF, lavador.id, { telefono: nuevoTelefono }); mostrarToast(`Teléfono de ${lavador.nombre} actualizado`, "ok"); } catch (err) { mostrarToast("Error al actualizar", "error"); } };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  return (
    <Modal titulo="⚙️ Gestión de Lavadores" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!mostrarFormNuevo ? (<Btn color="success" full onClick={() => setMostrarFormNuevo(true)}>➕ Agregar Nuevo Lavador</Btn>) : (<div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 800, color: "#064e3b", marginBottom: 10 }}>Nuevo Lavador</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}><input placeholder="Nombre *" value={nuevoLavador.nombre} onChange={e => setNuevoLavador({ ...nuevoLavador, nombre: e.target.value })} style={inputStyle} /><input placeholder="Teléfono WhatsApp" value={nuevoLavador.telefono} onChange={e => setNuevoLavador({ ...nuevoLavador, telefono: e.target.value })} style={inputStyle} /></div><div style={{ display: "flex", gap: 8, marginBottom: 10 }}><select value={nuevoLavador.transporte} onChange={e => setNuevoLavador({ ...nuevoLavador, transporte: e.target.value })} style={{ ...inputStyle, flex: 1 }}><option value="moto">🏍️ Moto</option><option value="bici">🚲 Bici</option><option value="pie">🚶 A pie</option></select></div><div style={{ display: "flex", gap: 8 }}><Btn ghost onClick={() => setMostrarFormNuevo(false)} full>Cancelar</Btn><Btn color="success" full onClick={guardarNuevo}>💾 Guardar</Btn></div></div>)}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "400px", overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 0" }}>Lavadores registrados ({staff.length})</div>
          {staff.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(l => (<LavadorItem key={l.id} lavador={l} editandoId={editandoId} setEditandoId={setEditandoId} onEliminar={eliminarLavador} onActualizarTelefono={actualizarTelefono} />))}
        </div>
      </div>
    </Modal>
  );
}

function LavadorItem({ lavador, editandoId, setEditandoId, onEliminar, onActualizarTelefono }) {
  const [telefonoEdit, setTelefonoEdit] = useState(lavador.telefono || "");
  const estaEditando = editandoId === lavador.id;
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", color: "#1e293b", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: lavador.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{lavador.nombre.charAt(0)}</div><div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{lavador.nombre}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{lavador.transporte === "moto" ? "🏍️" : lavador.transporte === "bici" ? "🚲" : "🚶"} {lavador.transporte}{lavador.especial && ` • ${lavador.especial}`}</div></div></div>
        <button onClick={() => onEliminar(lavador)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 10px", color: "#991b1b", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🗑️ Eliminar</button>
      </div>
      <div><label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>📞 Teléfono WhatsApp</label>{estaEditando ? (<div style={{ display: "flex", gap: 6 }}><input value={telefonoEdit} onChange={e => setTelefonoEdit(e.target.value)} placeholder="Ej: 1123456789" style={inputStyle} autoFocus /><button onClick={() => { onActualizarTelefono(lavador, telefonoEdit); setEditandoId(null); }} style={{ background: "#bbf7d0", border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12 }}>✓</button><button onClick={() => { setTelefonoEdit(lavador.telefono || ""); setEditandoId(null); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12 }}>✕</button></div>) : (<button onClick={() => setEditandoId(lavador.id)} style={{ background: lavador.telefono ? "#ecfdf5" : "#fef3c7", border: `1px solid ${lavador.telefono ? "#a7f3d0" : "#fde68a"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: lavador.telefono ? "#064e3b" : "#92400e", width: "100%", textAlign: "left", fontFamily: "monospace", fontWeight: 600 }}>{lavador.telefono ? `📱 ${lavador.telefono}` : "⚠️ Sin teléfono (click para agregar)"}</button>)}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL TURNO CREADO
// ═══════════════════════════════════════════════════════════════
function ModalTurnoCreado({ turno, cliente, lavador, onClose, mostrarToast }) {
  const [copiado, setCopiado] = useState(false);
  const cantAutos = turno.cantidadAutos || 1;
  const textoTurno = `🚗 *NUEVO TURNO - SOFÍA LAVADOS*\n\n👤 *Cliente:* ${cliente?.nombre || "Desconocido"}\n🆔 *Código:* ${cliente?.codigo || "N/A"}\n📞 *Teléfono:* ${cliente?.telefono || "Sin registrar"}\n📍 *Dirección:* ${cliente?.direccion || "Sin dirección"}\n🏘️ *Barrio:* ${cliente?.barrio || "N/A"}\n\n🕐 *Horario:* ${turno.hora} hs\n🚙 *Vehículo:* ${turno.auto}${cantAutos > 1 ? ` (×${cantAutos} autos)` : ""}\n💵 *Precio:* ${formatP(turno.precio)}${cantAutos > 1 ? ` (${formatP(turno.precioUnitario)} × ${cantAutos})` : ""}\n👷 *Lavador:* ${lavador?.nombre || "Sin asignar"}\n${turno.nota ? `\n📝 *Nota:* ${turno.nota}` : ""}\n${cliente?.nota ? `\n⚠️ *Nota del cliente:* ${cliente.nota}` : ""}\n\n📅 Fecha: ${fechaAR(hoy())}`;
  const copiarAlPortapapeles = async () => { try { await navigator.clipboard.writeText(textoTurno); setCopiado(true); mostrarToast("📋 Texto copiado al portapapeles", "ok"); setTimeout(() => setCopiado(false), 2000); } catch (err) { mostrarToast("Error al copiar", "error"); } };
  const telefonoLavador = lavador?.telefono ? lavador.telefono.replace(/\D/g, "") : "";
  const whatsappLink = telefonoLavador ? `https://wa.me/549${telefonoLavador}?text=${encodeURIComponent(textoTurno)}` : `https://wa.me/?text=${encodeURIComponent(textoTurno)}`;
  const handleWhatsApp = () => { if (!telefonoLavador) { mostrarToast(`⚠️ ${lavador?.nombre || "El lavador"} no tiene teléfono registrado.`, "warn"); return; } window.open(whatsappLink, "_blank"); };
  return (
    <Modal titulo="✅ Turno Creado Exitosamente" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0", borderRadius: 14, padding: 16 }}><div style={{ fontSize: 13, fontWeight: 800, color: "#064e3b", marginBottom: 10 }}>📋 Resumen del Turno</div><pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Inter',system-ui,sans-serif", fontSize: 12, color: "#1e293b", margin: 0, lineHeight: 1.6, background: "#ffffff", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>{textoTurno}</pre></div>
        {lavador && (<div style={{ background: telefonoLavador ? "#eff6ff" : "#fef3c7", border: `1px solid ${telefonoLavador ? "#bfdbfe" : "#fde68a"}`, borderRadius: 12, padding: 12, fontSize: 12 }}><div style={{ fontWeight: 700, color: telefonoLavador ? "#1e3a8a" : "#92400e", marginBottom: 4 }}>👷 Lavador asignado: {lavador.nombre}</div><div style={{ color: telefonoLavador ? "#1e3a8a" : "#92400e", fontFamily: "monospace" }}>{telefonoLavador ? `📱 ${lavador.telefono}` : "⚠️ Sin teléfono registrado."}</div></div>)}
        <div style={{ display: "flex", gap: 8 }}><Btn color="primary" full onClick={copiarAlPortapapeles}>{copiado ? "✓ Copiado" : "📋 Copiar Texto"}</Btn><Btn color={telefonoLavador ? "success" : "warning"} full onClick={handleWhatsApp}>💬 {telefonoLavador ? "Enviar WhatsApp" : "Abrir WhatsApp"}</Btn></div>
        <Btn ghost full onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO TURNO
// ═══════════════════════════════════════════════════════════════
function ModalNuevoTurno({ onClose, clientes, staff, turnos, asistencias, COL_TURNOS, COL_CLIENTES, geminiKey, mostrarToast, clientePreseleccionado, onClienteCreated, onTurnoCreado, codigosExistentes }) {
  const [clienteId, setClienteId] = useState(clientePreseleccionado?.id || "");
  const [hora, setHora] = useState(franjasValidas()[0] || FRANJAS_BASE[0]);
  const [tamaño, setTamaño] = useState(TAMANOS_DEFAULT[1]);
  const [cantidadAutos, setCantidadAutos] = useState(clientePreseleccionado?.autosHabituales || 1);
  const [lavadorId, setLavadorId] = useState("");
  const [nota, setNota] = useState("");
  const [sugiriendo, setSugiriendo] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const clienteSel = clientes.find(c => c.id === clienteId);
  const presentes = staff.filter(s => asistencias[s.id]);
  const precioUnitario = tamaño.precio;
  const precioTotal = precioUnitario * cantidadAutos;
  const tiempoBase = TIEMPOS_LAVADO_BASE[tamaño.label] || 45;
  const tiempoTotal = tiempoBase * cantidadAutos;
  const formatoTiempo = tiempoTotal >= 60 ? `${Math.floor(tiempoTotal / 60)}h ${tiempoTotal % 60 > 0 ? `${tiempoTotal % 60}min` : ""}` : `${tiempoTotal} min`;
  useEffect(() => { if (clientePreseleccionado?.id) { setClienteId(clientePreseleccionado.id); if (clientePreseleccionado.autosHabituales) setCantidadAutos(clientePreseleccionado.autosHabituales); if (clientePreseleccionado.nota) setNota(`📋 ${clientePreseleccionado.nota}`); } }, [clientePreseleccionado]);
  useEffect(() => { if (clienteSel && clienteSel.nota && !nota.includes(clienteSel.nota)) { setNota(prev => prev ? `${prev} | 📋 ${clienteSel.nota}` : `📋 ${clienteSel.nota}`); } if (clienteSel && clienteSel.autosHabituales && cantidadAutos === 1) { setCantidadAutos(clienteSel.autosHabituales); } }, [clienteId]);
  const manejarSugerir = () => { if (presentes.length === 0) return mostrarToast("No hay lavadores presentes marcados", "warn"); setSugiriendo(true); setTimeout(() => { const sugerido = sugerirLavadorPrioridad(presentes, turnos, clienteSel); setSugiriendo(false); if (sugerido) { setLavadorId(sugerido.id); const razon = turnos.filter(t => t.lavadorId === sugerido.id && t.estado !== "terminado").length === 0 ? "INACTIVO" : "termina más pronto"; mostrarToast(`🎯 Sugerido: ${sugerido.nombre} (${razon})`, "ok"); } else { mostrarToast("No se pudo generar sugerencia", "warn"); } }, 300); };
  const handleNewClientSuccess = (newClient) => { onClienteCreated(newClient); setClienteId(newClient.id); if (newClient.nota) setNota(`📋 ${newClient.nota}`); mostrarToast(`Cliente ${newClient.nombre} listo`, "ok"); };
  const guardar = async () => { if (!clienteId) return mostrarToast("Seleccioná un cliente", "warn"); try { const turnoData = { fecha: hoy(), hora, clienteId, clienteNombre: clienteSel?.nombre || "Desconocido", clienteCodigo: clienteSel?.codigo || "", auto: tamaño.label, precioUnitario, cantidadAutos, precio: precioTotal, lavadorId, estado: "pendiente", nota, creadoEn: serverTimestamp() }; const turnoRef = await addDoc(collection(db, COL_TURNOS), turnoData); const turnoCreado = { id: turnoRef.id, ...turnoData }; mostrarToast("Turno creado correctamente", "ok"); const lavador = staff.find(s => s.id === lavadorId); onTurnoCreado(turnoCreado, clienteSel, lavador); onClose(); } catch (err) { mostrarToast("Error al crear turno", "error"); } };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  return (
    <Modal titulo="➕ Nuevo Turno" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label style={labelStyle}>Cliente</label><BuscadorClientes clientes={clientes} value={clienteId} onChange={(id) => setClienteId(id)} placeholder="Buscar por nombre, código o barrio..." onCreateNew={(nombre) => { setNewClientName(nombre); setShowNewClient(true); }} /></div>
        {clienteSel ? (<div style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", padding: 16, borderRadius: 16, border: "2px solid #93c5fd", boxShadow: "0 4px 14px rgba(147,197,253,.2)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}><div><div style={{ fontSize: 16, fontWeight: 900, color: "#1e3a8a" }}>{clienteSel.nombre}</div><div style={{ fontSize: 12, color: "#7c3aed", fontFamily: "monospace", marginTop: 4, fontWeight: 800, background: "#ffffff", display: "inline-block", padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd6fe" }}>{clienteSel.codigo || "Sin código"}</div></div><div style={{ fontSize: 11, fontWeight: 800, background: "#bfdbfe", color: "#1e3a8a", padding: "4px 10px", borderRadius: 8 }}>{clienteSel.tipo}</div></div><div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.7, marginTop: 8 }}><div>📍 <strong>{clienteSel.direccion || "Sin dirección"}</strong> • {clienteSel.barrio}</div><div>{mostrarTelefono(clienteSel)}</div>{clienteSel.autosHabituales > 1 && <div>🚗 Autos habituales: <strong>{clienteSel.autosHabituales}</strong></div>}{clienteSel.nota && (<div style={{ marginTop: 6, padding: "6px 10px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, color: "#92400e", fontWeight: 800, fontStyle: "italic" }}>⚠️ {clienteSel.nota}</div>)}</div></div>) : (<div style={{ background: "#f9fafb", padding: 16, borderRadius: 14, border: "1.5px dashed #cbd5e1", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Buscá o creá un cliente para ver sus datos aquí</div>)}
        <div><label style={labelStyle}>Horario</label><select value={hora} onChange={e => setHora(e.target.value)} style={inputStyle}>{FRANJAS_BASE.map(h => <option key={h} value={h}>{h} hs</option>)}</select></div>
        <div><label style={labelStyle}>Vehículo</label><div style={{ display: "flex", gap: 8 }}>{TAMANOS_DEFAULT.map(t => (<button key={t.id} onClick={() => setTamaño(t)} style={{ flex: 1, padding: "12px 8px", borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: "pointer", background: tamaño.id === t.id ? "#dbeafe" : "#f9fafb", border: tamaño.id === t.id ? "1.5px solid #93c5fd" : "1.5px solid #e5e7eb", color: tamaño.id === t.id ? "#1e3a8a" : "#6b7280", boxShadow: tamaño.id === t.id ? "0 4px 14px rgba(147,197,253,.2)" : "none", transition: "all .2s" }}>{t.label}<br /><span style={{ fontSize: 11, opacity: .8 }}>{formatP(t.precio)}</span></button>))}</div></div>
        <div><label style={labelStyle}>Cantidad de Autos</label><div style={{ display: "flex", gap: 6, alignItems: "center" }}>{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setCantidadAutos(n)} style={{ flex: 1, padding: "10px 4px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", background: cantidadAutos === n ? "#dbeafe" : "#f9fafb", border: cantidadAutos === n ? "2px solid #3b82f6" : "1.5px solid #e5e7eb", color: cantidadAutos === n ? "#1e3a8a" : "#6b7280", boxShadow: cantidadAutos === n ? "0 4px 14px rgba(59,130,246,.2)" : "none", transition: "all .2s" }}>{n}{n === 5 ? "+" : ""}</button>))}</div><div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 12, background: cantidadAutos > 1 ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "#f9fafb", border: cantidadAutos > 1 ? "1.5px solid #93c5fd" : "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 700 }}><span style={{ color: "#1e3a8a" }}>💰 Total: <strong>{formatP(precioTotal)}</strong>{cantidadAutos > 1 && <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280" }}> ({formatP(precioUnitario)} × {cantidadAutos})</span>}</span><span style={{ color: "#059669" }}>⏱️ {formatoTiempo}</span></div></div>
        <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><label style={labelStyle}>Lavador Asignado</label><Btn sm color="secondary" disabled={sugiriendo || presentes.length === 0} onClick={manejarSugerir}>{sugiriendo ? "🎯 Analizando..." : `🎯 Sugerir (${presentes.length})`}</Btn></div><select value={lavadorId} onChange={e => setLavadorId(e.target.value)} style={inputStyle}><option value="">-- Sin asignar --</option>{presentes.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(s => (<option key={s.id} value={s.id}>{s.nombre} ({s.transporte})</option>))}{staff.filter(s => !asistencias[s.id]).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(s => (<option key={s.id} value={s.id} disabled style={{ color: "#d1d5db" }}>{s.nombre} (AUSENTE)</option>))}</select>{presentes.length === 0 && (<div style={{ fontSize: 11, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ No hay lavadores marcados como presentes.</div>)}</div>
        <div><label style={labelStyle}>Nota del Turno</label><input value={nota} onChange={e => setNota(e.target.value)} placeholder="Observaciones del servicio..." style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}><Btn ghost onClick={onClose} full>Cancelar</Btn><Btn color="primary" full onClick={guardar}>✓ Crear Turno</Btn></div>
      </div>
      {showNewClient && (<ModalNuevoCliente nombreInicial={newClientName} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} codigosExistentes={codigosExistentes} onClienteCreated={handleNewClientSuccess} onClose={() => setShowNewClient(false)} />)}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL CERRAR TURNO
// ═══════════════════════════════════════════════════════════════
function ModalCerrarTurno({ turno, onClose, clientes, cerrarTurnoFn }) {
  const [monto, setMonto] = useState(turno?.precio || 0);
  const [metodo, setMetodo] = useState("efectivo");
  const total = Number(turno?.precio || 0);
  const deuda = Math.max(0, total - Number(monto || 0));
  const cliente = clientes.find(c => c.id === turno?.clienteId);
  const cantAutos = turno?.cantidadAutos || 1;
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  return (
    <Modal titulo={`✅ Terminar Turno: ${turno?.hora} hs`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", padding: 16, borderRadius: 16, border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#064e3b" }}>👤 {cliente?.nombre || "Cliente Ocasional"}</div>
          {cliente?.codigo && (<div style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", fontWeight: 800, marginTop: 2 }}>{cliente.codigo}</div>)}
          <div style={{ fontSize: 12, color: "#064e3b", marginTop: 2 }}>🚗 {turno?.auto || "Sin especificar"}{cantAutos > 1 && <strong> (×{cantAutos} autos)</strong>}</div>
          <div style={{ marginTop: 8, fontWeight: 800, fontSize: 20, color: "#064e3b" }}>Total: {formatP(total)}</div>
          {cantAutos > 1 && <div style={{ fontSize: 11, color: "#064e3b", opacity: .8 }}>{formatP(turno.precioUnitario)} × {cantAutos} autos</div>}
        </div>
        <div><label style={labelStyle}>Monto Recibido ($)</label><input type="number" value={monto} onChange={e => setMonto(e.target.value)} style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} autoFocus /></div>
        <div><label style={labelStyle}>Método de Pago</label><select value={metodo} onChange={e => setMetodo(e.target.value)} style={inputStyle}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="debito">Débito</option><option value="credito">Crédito</option></select></div>
        {deuda > 0 && (<div style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a", borderRadius: 16, padding: 14, fontSize: 12, color: "#92400e" }}>⚠️ <strong>Diferencia pendiente:</strong> {formatP(deuda)}<br /><span style={{ opacity: .8 }}>Se registrará como deuda en el perfil de {cliente?.nombre || "el cliente"}.</span></div>)}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}><Btn ghost onClick={onClose} full>Cancelar</Btn><Btn color={deuda > 0 ? "warning" : "success"} full onClick={() => { cerrarTurnoFn(turno, monto, metodo); onClose(); }}>{deuda > 0 ? `Registrar Deuda y Terminar` : `✓ Terminar Turno`}</Btn></div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL ARCHIVAR TURNOS
// ═══════════════════════════════════════════════════════════════
function ModalArchivarTurnos({ turnos, onConfirm, onClose, mostrarToast }) {
  const [confirmado, setConfirmado] = useState(false);
  const turnosTerminados = turnos.filter(t => t.estado === "terminado");
  return (
    <Modal titulo="📦 Archivar Turnos Terminados" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, color: "#475569" }}>
          Se archivarán <strong>{turnosTerminados.length}</strong> turnos terminados del día {fechaAR(hoy())}.<br />
          Podrás consultarlos después en la pestaña <strong>📦 Historial</strong>.
        </div>
        <div style={{ background: "#f9fafb", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", maxHeight: 200, overflowY: "auto" }}>
          {turnosTerminados.map(t => (<div key={t.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>{t.hora} • {t.clienteNombre} • {formatP(t.precio)}</div>))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 13, color: "#475569" }}>Confirmo que quiero archivar estos turnos</span>
        </label>
        <div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={onClose} full>Cancelar</Btn><Btn color="primary" full disabled={!confirmado} onClick={() => { onConfirm(turnosTerminados.map(t => t.id)); onClose(); }}>📦 Archivar Ahora</Btn></div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA HISTORIAL / ARCHIVO
// ═══════════════════════════════════════════════════════════════
function TabHistorial({ turnosArchivados, clientes, staff, onRestaurar }) {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroLavador, setFiltroLavador] = useState("");
  const turnosFiltrados = turnosArchivados.filter(t => {
    if (filtroFecha && t.fecha !== filtroFecha) return false;
    if (filtroCliente && !sinAcentos(t.clienteNombre).includes(sinAcentos(filtroCliente))) return false;
    if (filtroLavador) { const lav = staff.find(s => s.id === t.lavadorId); if (!lav || !sinAcentos(lav.nombre).includes(sinAcentos(filtroLavador))) return false; }
    return true;
  }).sort((a, b) => b.hora.localeCompare(a.hora));
  
  // PUNTO 3: Función de exportación
  const generarTextoExport = () => {
    return `📦 HISTORIAL DE TURNOS - SOFÍA LAVADOS\nFecha de consulta: ${fechaAR(hoy())}\nFiltros: ${filtroFecha || "Todos"} | ${filtroCliente || "Todos los clientes"} | ${filtroLavador || "Todos los lavadores"}\n\nTotal: ${turnosFiltrados.length} turnos\n\n${turnosFiltrados.map(t => {
      const cliente = clientes.find(c => c.id === t.clienteId);
      const lavador = staff.find(s => s.id === t.lavadorId);
      return `${t.fecha} • ${t.hora}\n👤 ${t.clienteNombre}${t.clienteCodigo ? ` (${t.clienteCodigo})` : ""}\n👷 ${lavador?.nombre || "Sin asignar"}\n🚙 ${t.auto}${t.cantidadAutos > 1 ? ` (×${t.cantidadAutos})` : ""}\n💰 ${formatP(t.precio)}\n📍 ${cliente?.barrio || "Sin barrio"}\n${t.nota ? `📝 ${t.nota}\n` : ""}---`;
    }).join("\n")}`;
  };
  
  const copiarExport = async () => { try { await navigator.clipboard.writeText(generarTextoExport()); mostrarToast("📋 Historial copiado al portapapeles", "ok"); } catch { mostrarToast("Error al copiar", "error"); } };
  const imprimirExport = () => { const ventana = window.open("", "_blank"); ventana.document.write(`<html><head><title>Historial - Sofía Lavados</title><style>body{font-family:system-ui,sans-serif;padding:20px;line-height:1.6}pre{white-space:pre-wrap}</style></head><body><pre>${generarTextoExport()}</pre></body></html>`); ventana.document.close(); ventana.print(); };
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeInUp .4s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📦 Historial de Turnos</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13 }} />
          <input type="text" placeholder="Filtrar por cliente..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, minWidth: 150 }} />
          <input type="text" placeholder="Filtrar por lavador..." value={filtroLavador} onChange={e => setFiltroLavador(e.target.value)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, minWidth: 150 }} />
          <Btn sm color="primary" onClick={() => { /* PUNTO 3: Exportar */ }}>🖨️ Exportar</Btn>
        </div>
      </div>
      {turnosFiltrados.length === 0 ? (<div style={{ textAlign: "center", color: "#9ca3af", padding: 40, fontSize: 13 }}>No hay turnos archivados con estos filtros</div>) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {turnosFiltrados.map(t => {
            const cliente = clientes.find(c => c.id === t.clienteId);
            const lavador = staff.find(s => s.id === t.lavadorId);
            const cant = t.cantidadAutos || 1;
            return (
              <div key={t.id} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div><div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a8a" }}>{t.fecha} • {t.hora}</div><div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{t.clienteNombre}</div>{t.clienteCodigo && (<div style={{ fontSize: 10, color: "#7c3aed", fontFamily: "monospace", fontWeight: 700, marginTop: 2 }}>{t.clienteCodigo}</div>)}</div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8, background: "#ecfdf5", color: "#064e3b", border: "1px solid #a7f3d0" }}>✓ Terminado</span>
                </div>
                <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}><div>🚙 {t.auto}{cant > 1 ? ` (×${cant})` : ""} • {formatP(t.precio)}</div>{lavador && <div>👷 {lavador.nombre}</div>}{cliente?.barrio && <div>📍 {cliente.barrio}</div>}</div>
                {t.nota && (<div style={{ fontSize: 11, fontStyle: "italic", color: "#6b7280", marginTop: 8, background: "#f9fafb", padding: "6px 10px", borderRadius: 8 }}>📝 {t.nota}</div>)}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal de exportación */}
      {mostrarExportar && (<Modal titulo="🖨️ Exportar Historial" onClose={() => setMostrarExportar(false)}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 14, color: "#475569" }}>Se exportarán <strong>{turnosFiltrados.length}</strong> turnos con los filtros actuales.</div><pre style={{ background: "#f9fafb", padding: 12, borderRadius: 10, fontSize: 11, fontFamily: "monospace", maxHeight: 200, overflow: "auto" }}>{generarTextoExport()}</pre><div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={() => setMostrarExportar(false)} full>Cancelar</Btn><Btn color="primary" full onClick={copiarExport}>📋 Copiar Texto</Btn><Btn color="success" full onClick={imprimirExport}>🖨️ Imprimir</Btn></div></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA SEGUIMIENTO (3 COLUMNAS)
// ═══════════════════════════════════════════════════════════════
function TabSeguimientoTurnos({ turnos, clientes, staff, onMarcarTerminado, onArchivar }) {
  const estadosConfig = { pendiente: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "🔴 Pendientes", headerBg: "#fee2e2" }, en_progreso: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "🟡 En Progreso", headerBg: "#fef3c7" }, terminado: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "🟢 Terminados", headerBg: "#d1fae5" }, lluvia: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", label: "🌧️ Lluvia", headerBg: "#f3f4f6" } };
  const pendientes = turnos.filter(t => t.estado === "pendiente").sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
  const enProgreso = turnos.filter(t => t.estado === "en_progreso").sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
  const terminados = turnos.filter(t => t.estado === "terminado").sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
  const lluvia = turnos.filter(t => t.estado === "lluvia").sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
  const renderTarjeta = (t) => {
    const config = estadosConfig[t.estado] || estadosConfig.pendiente;
    const cliente = clientes.find(c => c.id === t.clienteId);
    const lavador = staff.find(s => s.id === t.lavadorId);
    const cant = t.cantidadAutos || 1;
    const finEstimado = t.estado !== "terminado" ? calcularFinTurno(t.hora, t.auto, cant) : null;
    return (
      <div key={t.id} style={{ background: "#ffffff", border: `2px solid ${config.border}`, borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.03)", transition: "all .2s ease", position: "relative", overflow: "hidden", marginBottom: 10 }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,.06)" }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.03)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: config.color }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, marginTop: 4 }}><div><div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>{t.hora} hs</div><div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{t.clienteNombre}</div>{t.clienteCodigo && (<div style={{ fontSize: 10, color: "#7c3aed", fontFamily: "monospace", fontWeight: 700, marginTop: 2 }}>{t.clienteCodigo}</div>)}</div></div>
        <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, marginBottom: 10 }}><div>🚙 {t.auto}{cant > 1 ? ` (×${cant})` : ""} • {formatP(t.precio)}</div>{lavador && <div>👷 {lavador.nombre} ({lavador.transporte})</div>}{cliente?.barrio && <div>📍 {cliente.barrio}</div>}{finEstimado && t.estado !== "terminado" && (<div style={{ fontWeight: 600, color: "#6b7280", marginTop: 4 }}>⏱️ Fin: {finEstimado.horaFin} ({finEstimado.duracion}min)</div>)}</div>
        {t.nota && (<div style={{ fontSize: 11, fontStyle: "italic", color: "#92400e", background: "#fef3c7", padding: "4px 8px", borderRadius: 6, marginBottom: 10, border: "1px solid #fde68a" }}>📝 {t.nota}</div>)}
        {t.estado === "pendiente" && (<Btn sm color="warning" full onClick={() => onMarcarTerminado(t.id, "en_progreso")}>▶️ Iniciar Lavado</Btn>)}
        {t.estado === "en_progreso" && (<Btn sm color="success" full onClick={() => onMarcarTerminado(t.id, "terminado")}>✅ Marcar Terminado</Btn>)}
        {t.estado === "terminado" && (<div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#059669", padding: "8px 0" }}>✅ Completado</div>)}
      </div>
    );
  };
  const renderColumna = (titulo, items, config) => (<div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", background: config.headerBg, borderRadius: 16, padding: 12, border: `1px solid ${config.border}` }}><div style={{ fontSize: 14, fontWeight: 800, color: config.color, marginBottom: 12, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,.7)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{titulo}</span><span style={{ fontSize: 12, fontWeight: 800, background: config.bg, border: `1px solid ${config.border}`, borderRadius: 8, padding: "2px 8px" }}>{items.length}</span></div><div style={{ flex: 1, overflowY: "auto" }}>{items.length === 0 ? (<div style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, padding: 20, fontStyle: "italic" }}>Sin turnos</div>) : (items.map(renderTarjeta))}</div></div>);
  
  // PUNTO 3: Función de exportación
  const generarTextoExport = () => {
    return `📊 SEGUIMIENTO DE TURNOS - SOFÍA LAVADOS\nFecha: ${fechaAR(hoy())}\n\n🔴 PENDIENTES (${pendientes.length}):\n${pendientes.map(t => `${t.hora} • ${t.clienteNombre} • ${t.auto}`).join("\n")}\n\n🟡 EN PROGRESO (${enProgreso.length}):\n${enProgreso.map(t => `${t.hora} • ${t.clienteNombre} • ${t.auto}`).join("\n")}\n\n🟢 TERMINADOS (${terminados.length}):\n${terminados.map(t => `${t.hora} • ${t.clienteNombre} • ${t.auto} • ${formatP(t.precio)}`).join("\n")}`;
  };
  
  const copiarExport = async () => { try { await navigator.clipboard.writeText(generarTextoExport()); mostrarToast("📋 Seguimiento copiado", "ok"); } catch { mostrarToast("Error al copiar", "error"); } };
  const imprimirExport = () => { const ventana = window.open("", "_blank"); ventana.document.write(`<html><head><title>Seguimiento - Sofía Lavados</title><style>body{font-family:system-ui,sans-serif;padding:20px;line-height:1.6}pre{white-space:pre-wrap}</style></head><body><pre>${generarTextoExport()}</pre></body></html>`); ventana.document.close(); ventana.print(); };
  
  return (
    <div style={{ animation: "fadeInUp .4s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📊 Seguimiento de Turnos</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn sm color="primary" onClick={() => setMostrarExportar(true)}>🖨️ Exportar</Btn>
          {terminados.length > 0 && pendientes.length === 0 && enProgreso.length === 0 && lluvia.length === 0 && (<Btn sm color="secondary" onClick={() => onArchivar(turnos)}>📦 Archivar</Btn>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, minHeight: "60vh" }}>
        {renderColumna("🔴 Pendientes", pendientes, estadosConfig.pendiente)}
        {renderColumna("🟡 En Progreso", enProgreso, estadosConfig.en_progreso)}
        {renderColumna("🟢 Terminados", terminados, estadosConfig.terminado)}
      </div>
      {lluvia.length > 0 && (<div style={{ marginTop: 16 }}>{renderColumna("🌧️ Lluvia", lluvia, estadosConfig.lluvia)}</div>)}
      
      {mostrarExportar && (<Modal titulo="🖨️ Exportar Seguimiento" onClose={() => setMostrarExportar(false)}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 14, color: "#475569" }}>Exportando seguimiento de turnos</div><pre style={{ background: "#f9fafb", padding: 12, borderRadius: 10, fontSize: 11, fontFamily: "monospace", maxHeight: 200, overflow: "auto" }}>{generarTextoExport()}</pre><div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={() => setMostrarExportar(false)} full>Cancelar</Btn><Btn color="primary" full onClick={copiarExport}>📋 Copiar Texto</Btn><Btn color="success" full onClick={imprimirExport}>🖨️ Imprimir</Btn></div></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA AGENDA - MATRIZ (PUNTO 5: Estilo Calendario + PUNTO 7: Dinámica)
// ═══════════════════════════════════════════════════════════════
function TabAgendaMatriz({ turnos, clientes, staff, asistencias, onMarcarLlego, onMarcarTerminado, onArchivar }) {
  const presentes = staff.filter(s => asistencias[s.id]);
  const terminados = turnos.filter(t => t.estado === "terminado");
  
  // PUNTO 7: Generar franjas dinámicas
  const franjas = generarFranjasDinamicas(turnos);
  
  // PUNTO 3: Función de exportación
  const generarTextoExport = () => {
    let texto = `📋 AGENDA - SOFÍA LAVADOS\nFecha: ${fechaAR(hoy())}\n\n`;
    franjas.forEach(franja => {
      texto += `\n${franja} hs:\n`;
      presentes.forEach(lav => {
        const turno = turnos.find(t => t.hora === franja && t.lavadorId === lav.id);
        if (turno) {
          const cliente = clientes.find(c => c.id === turno.clienteId);
          texto += `  • ${lav.nombre}: ${turno.clienteNombre} (${turno.auto}) - ${formatP(turno.precio)}\n`;
        }
      });
    });
    return texto;
  };
  
  const copiarExport = async () => { try { await navigator.clipboard.writeText(generarTextoExport()); mostrarToast("📋 Agenda copiada", "ok"); } catch { mostrarToast("Error al copiar", "error"); } };
  const imprimirExport = () => { const ventana = window.open("", "_blank"); ventana.document.write(`<html><head><title>Agenda - Sofía Lavados</title><style>body{font-family:system-ui,sans-serif;padding:20px;line-height:1.6}pre{white-space:pre-wrap}</style></head><body><pre>${generarTextoExport()}</pre></body></html>`); ventana.document.close(); ventana.print(); };
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📋 Agenda</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{presentes.length} lavadores presentes</span>
          <Btn sm color="primary" onClick={() => setMostrarExportar(true)}>🖨️ Exportar</Btn>
          {terminados.length > 0 && turnos.filter(t => t.estado !== "terminado").length === 0 && (<Btn sm color="secondary" onClick={() => onArchivar(turnos)}>📦 Archivar</Btn>)}
        </div>
      </div>
      {presentes.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
          No hay lavadores presentes hoy.<br />
          <span style={{ fontWeight: 600, color: "#6b7280" }}>Andá a Presentismo para marcar quién vino.</span>
        </div>
      ) : (
        // PUNTO 5: Diseño estilo calendario/bloc
        <div style={{ overflowX: "auto", background: "#f8fafc", borderRadius: 20, border: "2px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,.08)", padding: "20px" }}>
          {/* Efecto de espiral/perforación */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", paddingLeft: "12px" }}>
            {Array.from({ length: Math.min(presentes.length + 1, 10) }).map((_, i) => (
              <div key={i} style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#cbd5e1", boxShadow: "inset 0 2px 4px rgba(0,0,0,.2)" }} />
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px", fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 14px", textAlign: "left", color: "#374151", fontWeight: 800, background: "#f1f5f9", borderRadius: "12px", minWidth: 80, boxShadow: "0 2px 4px rgba(0,0,0,.05)" }}>Horario</th>
                {presentes.map(lav => (<th key={lav.id} style={{ padding: "12px 14px", textAlign: "center", color: "#374151", fontWeight: 800, background: "#f1f5f9", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,.05)" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: lav.color, boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} />{lav.nombre}</div></th>))}
              </tr>
            </thead>
            <tbody>
              {franjas.map(franja => (
                <tr key={franja}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b", background: "#ffffff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>{franja}</td>
                  {presentes.map(lav => {
                    const turno = turnos.find(t => t.hora === franja && t.lavadorId === lav.id);
                    const config = turno ? ({ pendiente: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" }, en_progreso: { bg: "#fffbeb", border: "#fde68a", text: "#d97706" }, terminado: { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669" }, lluvia: { bg: "#f3f4f6", border: "#e5e7eb", text: "#6b7280" } }[turno.estado] || { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" }) : null;
                    const cliente = turno ? clientes.find(c => c.id === turno.clienteId) : null;
                    const cant = turno?.cantidadAutos || 1;
                    return (
                      <td key={lav.id} style={{ padding: "8px", textAlign: "center", verticalAlign: "middle", minHeight: 70 }}>
                        {turno ? (
                          <div style={{ background: config.bg, border: `2px solid ${config.border}`, borderRadius: 12, padding: 8, textAlign: "left", fontSize: 11, boxShadow: "0 2px 4px rgba(0,0,0,.05)" }}>
                            <div style={{ fontWeight: 700, color: config.text }}>{cliente?.nombre || "Cliente"}</div>
                            {turno.clienteCodigo && <div style={{ fontSize: 9, fontFamily: "monospace", color: "#7c3aed" }}>{turno.clienteCodigo}</div>}
                            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{turno.auto}{cant > 1 ? `×${cant}` : ""} • {formatP(turno.precio)}</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                              {turno.estado === "pendiente" && (<button onClick={() => onMarcarLlego(turno.id)} style={{ fontSize: 9, padding: "2px 6px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", color: "#92400e" }}>🚗</button>)}
                              {(turno.estado === "pendiente" || turno.estado === "en_progreso") && (<button onClick={() => onMarcarTerminado(turno.id)} style={{ fontSize: 9, padding: "2px 6px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 6, cursor: "pointer", color: "#064e3b" }}>✅</button>)}
                            </div>
                          </div>
                        ) : (<div style={{ color: "#e2e8f0", fontSize: 11, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>—</div>)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {mostrarExportar && (<Modal titulo="🖨️ Exportar Agenda" onClose={() => setMostrarExportar(false)}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 14, color: "#475569" }}>Exportando agenda del día</div><pre style={{ background: "#f9fafb", padding: 12, borderRadius: 10, fontSize: 11, fontFamily: "monospace", maxHeight: 200, overflow: "auto" }}>{generarTextoExport()}</pre><div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={() => setMostrarExportar(false)} full>Cancelar</Btn><Btn color="primary" full onClick={copiarExport}>📋 Copiar Texto</Btn><Btn color="success" full onClick={imprimirExport}>🖨️ Imprimir</Btn></div></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA CLIENTES CON EXPORTACIÓN
// ═══════════════════════════════════════════════════════════════
function TabClientes({ clientes, onAsignarTurno, onEditar, onNuevo, mostrarToast }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroBarrio, setFiltroBarrio] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDeuda, setFiltroDeuda] = useState(false);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const barriosUnicos = [...new Set(clientes.map(c => c.barrio).filter(Boolean))].sort();
  const clientesFiltrados = clientes.filter(c => {
    if (busqueda && !sinAcentos(c.nombre).includes(sinAcentos(busqueda)) && !sinAcentos(c.codigo || "").includes(sinAcentos(busqueda)) && !sinAcentos(c.barrio || "").includes(sinAcentos(busqueda))) return false;
    if (filtroBarrio && c.barrio !== filtroBarrio) return false;
    if (filtroTipo && c.tipo !== filtroTipo) return false;
    if (filtroDeuda && c.deuda <= 0) return false;
    return true;
  }).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  const generarTextoExport = () => {
    return `📋 CLIENTES - SOFÍA LAVADOS\nFecha: ${fechaAR(hoy())}\n\n${clientesFiltrados.map(c => `${c.nombre}\n🆔 ${c.codigo}\n📍 ${c.direccion} • ${c.barrio}\n📞 ${c.telefono || "Sin registrar"}\n🚗 Autos: ${c.autosHabituales} • ${c.tipo}\n${c.deuda > 0 ? `💰 Deuda: ${formatP(c.deuda)}\n` : ""}${c.nota ? `📝 ${c.nota}\n` : ""}---`).join("\n")}`;
  };
  const copiarExport = async () => { try { await navigator.clipboard.writeText(generarTextoExport()); mostrarToast("📋 Clientes copiados al portapapeles", "ok"); } catch { mostrarToast("Error al copiar", "error"); } };
  const imprimirExport = () => { const ventana = window.open("", "_blank"); ventana.document.write(`<html><head><title>Clientes - Sofía Lavados</title><style>body{font-family:system-ui,sans-serif;padding:20px;line-height:1.6}pre{white-space:pre-wrap}</style></head><body><pre>${generarTextoExport()}</pre></body></html>`); ventana.document.close(); ventana.print(); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeInUp .4s ease-out" }}>
      <div style={{ position: "sticky", top: "110px", zIndex: 80, background: "rgba(249,250,251,.97)", backdropFilter: "blur(12px)", padding: "8px 0 12px 0", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>👥 Clientes ({clientesFiltrados.length})</h3><Btn sm color="success" onClick={onNuevo}>➕ Nuevo Cliente</Btn></div>
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por nombre, código, barrio o teléfono..." style={{ background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "12px 16px", color: "#1e293b", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontWeight: 500 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={filtroBarrio} onChange={e => setFiltroBarrio(e.target.value)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}><option value="">Todos los barrios</option>{barriosUnicos.map(b => <option key={b} value={b}>{b}</option>)}</select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}><option value="">Todos los tipos</option><option value="⭐ Frecuente">⭐ Frecuente</option><option value="🔥 Top">🔥 Top</option><option value="💤 Ocasional">💤 Ocasional</option></select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}><input type="checkbox" checked={filtroDeuda} onChange={e => setFiltroDeuda(e.target.checked)} style={{ width: 16, height: 16 }} />Solo con deuda</label>
          <Btn sm color="tertiary" onClick={() => { setFiltroBarrio(""); setFiltroTipo(""); setFiltroDeuda(false); setBusqueda(""); }}>🔄 Limpiar</Btn>
        </div>
        <div style={{ display: "flex", gap: 8 }}><Btn sm color="primary" onClick={() => setMostrarExportar(true)}>🖨️ Imprimir / Exportar</Btn></div>
      </div>
      {clientesFiltrados.length === 0 ? (<div style={{ textAlign: "center", color: "#9ca3af", padding: 40, fontSize: 13, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb" }}>{clientes.length === 0 ? "Cargando clientes..." : "Sin resultados para estos filtros"}</div>) : (
        clientesFiltrados.map(c => (<div key={c.id} style={{ background: "#ffffff", borderRadius: 18, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.02)", transition: "all .2s", display: "flex", flexDirection: "column", gap: 10 }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,.05)" }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div><div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{c.nombre}</div><div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", marginTop: 4, fontFamily: "monospace", background: "#f3e8ff", padding: "3px 10px", borderRadius: 6, display: "inline-block", border: "1px solid #ddd6fe" }}>{c.codigo || "Sin código"}</div></div><div style={{ display: "flex", gap: 6, alignItems: "center" }}>{c.deuda > 0 && (<span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>Deuda: {formatP(c.deuda)}</span>)}<span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" }}>{c.tipo}</span></div></div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}><div>📍 {c.direccion || "Sin dirección"} • {c.barrio}</div><div>{mostrarTelefono(c)}</div>{c.autosHabituales > 1 && <div>🚗 Autos habituales: <strong>{c.autosHabituales}</strong></div>}{c.nota && <div style={{ fontWeight: 700, fontStyle: "italic", color: "#92400e", marginTop: 4, background: "#fef3c7", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>📝 {c.nota}</div>}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}><Btn sm color="primary" onClick={() => onAsignarTurno(c)}>➕ Asignar Turno</Btn><Btn sm color="secondary" onClick={() => onEditar(c)}>✏️ Editar</Btn></div>
        </div>))
      )}
      {mostrarExportar && (<Modal titulo="🖨️ Exportar Clientes" onClose={() => setMostrarExportar(false)}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 14, color: "#475569" }}>Se exportarán <strong>{clientesFiltrados.length}</strong> clientes con los filtros actuales.</div><pre style={{ background: "#f9fafb", padding: 12, borderRadius: 10, fontSize: 11, fontFamily: "monospace", maxHeight: 200, overflow: "auto" }}>{generarTextoExport()}</pre><div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={() => setMostrarExportar(false)} full>Cancelar</Btn><Btn color="primary" full onClick={copiarExport}>📋 Copiar Texto</Btn><Btn color="success" full onClick={imprimirExport}>🖨️ Imprimir</Btn></div></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA PRESENTISMO
// ═══════════════════════════════════════════════════════════════
function TabPresentismo({ staff, turnos, hoyStr, COL_ASISTENCIAS, COL_STAFF, db, doc, setDoc, onSnapshot, useEffect, useState, mostrarToast }) {
  const [asistencias, setAsistencias] = useState({});
  const [cargandoAsistencia, setCargandoAsistencia] = useState(true);
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  useEffect(() => {
    const docRef = doc(db, COL_ASISTENCIAS, hoyStr);
    const unsub = onSnapshot(docRef, (snap) => {
      setAsistencias(snap.exists() ? (snap.data().registros || {}) : {});
      setCargandoAsistencia(false);
    });
    return () => unsub();
  }, [hoyStr, COL_ASISTENCIAS]);
  const toggleAsistencia = async (staffId) => {
    const nuevoEstado = !asistencias[staffId];
    setAsistencias(prev => ({ ...prev, [staffId]: nuevoEstado }));
    try {
      const docRef = doc(db, COL_ASISTENCIAS, hoyStr);
      await setDoc(docRef, { fecha: hoyStr, registros: { ...asistencias, [staffId]: nuevoEstado }, actualizadoEn: serverTimestamp() }, { merge: true });
      mostrarToast(nuevoEstado ? `${staff.find(s => s.id === staffId)?.nombre} ✅ PRESENTE` : `${staff.find(s => s.id === staffId)?.nombre} ❌ AUSENTE`, nuevoEstado ? "ok" : "warn");
    } catch (err) {
      setAsistencias(prev => ({ ...prev, [staffId]: !nuevoEstado }));
      mostrarToast("Error al guardar asistencia", "error");
    }
  };
  
  // PUNTO 4: Reemplazar Previsualizar por Exportar
  const generarTextoExport = () => {
    return `📋 PRESENTISMO - SOFÍA LAVADOS\nFecha: ${fechaAR(hoyStr)}\n\n${staff.map(s => {
      const presente = asistencias[s.id];
      const turnosHoy = turnos.filter(t => t.lavadorId === s.id).length;
      return `${s.nombre}\n${presente ? "✅ PRESENTE" : "❌ AUSENTE"}\n🚚 ${s.transporte}\n📞 ${s.telefono || "Sin teléfono"}\n📋 Turnos asignados: ${turnosHoy}\n---`;
    }).join("\n")}`;
  };
  
  const copiarExport = async () => { try { await navigator.clipboard.writeText(generarTextoExport()); mostrarToast("📋 Presentismo copiado", "ok"); } catch { mostrarToast("Error al copiar", "error"); } };
  const imprimirExport = () => { const ventana = window.open("", "_blank"); ventana.document.write(`<html><head><title>Presentismo - Sofía Lavados</title><style>body{font-family:system-ui,sans-serif;padding:20px;line-height:1.6}pre{white-space:pre-wrap}</style></head><body><pre>${generarTextoExport()}</pre></body></html>`); ventana.document.close(); ventana.print(); };
  
  if (cargandoAsistencia) return <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, fontSize: 13 }}>Cargando presentismo...</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeInUp .4s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📋 Control de Personal</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn sm color="secondary" onClick={() => setMostrarGestion(true)}>⚙️ Gestionar Lavadores</Btn>
          <Btn sm color="primary" onClick={() => setMostrarExportar(true)}>🖨️ Exportar</Btn>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}>💡 Marcá quién vino hoy ANTES de crear turnos.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
        {staff.map(s => {
          const presente = asistencias[s.id];
          return (
            <button key={s.id} onClick={() => toggleAsistencia(s.id)} style={{
              background: presente ? "linear-gradient(135deg,#ecfdf5,#f0fdf4)" : "#ffffff",
              border: `1.5px solid ${presente ? "#a7f3d0" : "#e5e7eb"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all .2s ease",
              boxShadow: presente ? "0 4px 14px rgba(167,243,208,.2)" : "0 2px 8px rgba(0,0,0,.03)"
            }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)" }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: presente ? "#10b981" : "#d1d5db", boxShadow: presente ? "0 0 8px rgba(16,185,129,.4)" : "none" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: presente ? "#064e3b" : "#374151" }}>{s.nombre}</div>
                <div style={{ fontSize: 11, color: presente ? "#059669" : "#9ca3af", fontWeight: 600 }}>{s.transporte}</div>
                {s.telefono && <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", marginTop: 2 }}>📱 {s.telefono}</div>}
              </div>
            </button>
          );
        })}
      </div>
      {mostrarGestion && (<ModalGestionLavadores staff={staff} COL_STAFF={COL_STAFF} mostrarToast={mostrarToast} onClose={() => setMostrarGestion(false)} />)}
      {mostrarExportar && (<Modal titulo="🖨️ Exportar Presentismo" onClose={() => setMostrarExportar(false)}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 14, color: "#475569" }}>Exportando presentismo del día</div><pre style={{ background: "#f9fafb", padding: 12, borderRadius: 10, fontSize: 11, fontFamily: "monospace", maxHeight: 200, overflow: "auto" }}>{generarTextoExport()}</pre><div style={{ display: "flex", gap: 10 }}><Btn ghost onClick={() => setMostrarExportar(false)} full>Cancelar</Btn><Btn color="primary" full onClick={copiarExport}>📋 Copiar Texto</Btn><Btn color="success" full onClick={imprimirExport}>🖨️ Imprimir</Btn></div></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [modoPrueba, setModoPrueba] = useState(false);
  const [modoOculto, setModoOculto] = useState(false);
  const CLAVE_MAESTRA = "sofia2024";
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const COL_DIAS = modoPrueba ? "dias_prueba" : "dias";
  const COL_TURNOS = modoPrueba ? "turnos_prueba" : "turnos";
  const COL_CLIENTES = modoPrueba ? "clientes_prueba" : "clientes";
  const COL_STAFF = modoPrueba ? "staff_prueba" : "staff";
  const COL_ASISTENCIAS = modoPrueba ? "asistencias_prueba" : "asistencias";
  const COL_ARCHIVO = modoPrueba ? "archivo_prueba" : "archivo";
  const [diaActual, setDiaActual] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [turnosArchivados, setTurnosArchivados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("nuevoTurno");
  const [modalOpen, setModalOpen] = useState(null);
  const [editando, setEditando] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [clienteParaTurno, setClienteParaTurno] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [turnoCreadoData, setTurnoCreadoData] = useState(null);
  const [mostrarNuevoClienteDirecto, setMostrarNuevoClienteDirecto] = useState(false);
  const [mostrarArchivar, setMostrarArchivar] = useState(null);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("sofia_gemini_key") || "");
  const [keyDesbloqueada, setKeyDesbloqueada] = useState(false);
  const [inputClave, setInputClave] = useState("");
  const [mostrarApiKey, setMostrarApiKey] = useState(false);
  const [mostrarExportar, setMostrarExportar] = useState(false); // PUNTO 3: Estado para modales de exportación
  const mostrarToast = (msg, tipo = "ok") => setToast({ msg, tipo });
  const handleLogoTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setModoOculto(prev => !prev);
      setModoPrueba(prev => !prev);
      mostrarToast(!modoPrueba ? "🧪 Modo OCULTO activado" : "🔒 Modo producción restaurado", !modoPrueba ? "warn" : "ok");
    }
  };
  
  // PUNTO 1: Modo Oculto - checkbox sincronizado
  useEffect(() => {
    if (modoOculto !== modoPrueba) {
      setModoPrueba(modoOculto);
    }
  }, [modoOculto]);
  
  // PUNTO 3: Archivado automático al cambiar de día
  useEffect(() => {
    const verificarCambioDeDia = async () => {
      const ultimaFecha = localStorage.getItem("sofia_ultima_fecha");
      const fechaHoy = hoy();
      if (ultimaFecha && ultimaFecha !== fechaHoy) {
        const turnosDelDiaAnterior = turnos.filter(t => t.fecha === ultimaFecha && t.estado === "terminado");
        if (turnosDelDiaAnterior.length > 0) {
          const batch = writeBatch(db);
          for (const t of turnosDelDiaAnterior) {
            const ref = doc(collection(db, COL_ARCHIVO));
            batch.set(ref, { ...t, archivadoEn: serverTimestamp(), fechaOriginal: t.fecha });
            batch.delete(doc(db, COL_TURNOS, t.id));
          }
          await batch.commit();
          mostrarToast(`📦 ${turnosDelDiaAnterior.length} turnos archivados automáticamente`, "ok");
        }
        localStorage.setItem("sofia_ultima_fecha", fechaHoy);
      } else if (!ultimaFecha) {
        localStorage.setItem("sofia_ultima_fecha", fechaHoy);
      }
    };
    verificarCambioDeDia();
  }, [turnos, modoPrueba]);
  
  // Seed + Migración
  useEffect(() => {
    const seedAndMigrate = async () => {
      try {
        const cliSnap = await getDocs(collection(db, COL_CLIENTES));
        if (cliSnap.empty) { const batch = writeBatch(db); CLIENTES_SEED.forEach(c => { const ref = doc(collection(db, COL_CLIENTES)); batch.set(ref, { ...c, _ts: serverTimestamp() }); }); await batch.commit(); }
        const staffSnap = await getDocs(collection(db, COL_STAFF));
        if (staffSnap.empty) { const batch = writeBatch(db); STAFF_SEED.forEach(s => { const ref = doc(collection(db, COL_STAFF)); batch.set(ref, { ...s, _ts: serverTimestamp() }); }); await batch.commit(); }
        const cliSnapMigrar = await getDocs(collection(db, COL_CLIENTES));
        const clientesSinCodigo = cliSnapMigrar.docs.filter(d => !d.data().codigo || d.data().codigo === "");
        if (clientesSinCodigo.length > 0) { const codigosExistentes = cliSnapMigrar.docs.map(d => d.data().codigo || ""); const batchMigrar = writeBatch(db); for (const docSnap of clientesSinCodigo) { const data = docSnap.data(); const nuevoCodigo = await generarCodigoCliente(data.barrio || "Desconocido", data.nombre || "Cliente", COL_CLIENTES, codigosExistentes); codigosExistentes.push(nuevoCodigo); batchMigrar.update(doc(db, COL_CLIENTES, docSnap.id), { codigo: nuevoCodigo }); } await batchMigrar.commit(); }
        const cliSnapGen = await getDocs(collection(db, COL_CLIENTES));
        const clientesConGen = cliSnapGen.docs.filter(d => (d.data().codigo || "").startsWith("GEN-"));
        if (clientesConGen.length > 0) { const batchGen = writeBatch(db); for (const docSnap of clientesConGen) { batchGen.update(doc(db, COL_CLIENTES, docSnap.id), { codigo: docSnap.data().codigo.replace(/^GEN-/, "DES-") }); } await batchGen.commit(); }
      } catch (err) { console.error("Error en seed/migración:", err); }
    };
    seedAndMigrate();
  }, [modoPrueba]);
  
  // Suscripciones en tiempo real
  useEffect(() => {
    const fechaHoy = hoy();
    setCargando(true);
    const unsubDia = onSnapshot(doc(db, COL_DIAS, fechaHoy), (snap) => { if (snap.exists()) setDiaActual({ id: snap.id, ...snap.data() }); else { const nuevoDia = { fecha: fechaHoy, estado: "cerrado", apertura: null, cierre: null, lluvia: false }; setDiaActual(nuevoDia); if (!modoPrueba) fsSave(COL_DIAS, fechaHoy, nuevoDia); } setCargando(false); }, () => { setCargando(false); mostrarToast("Sin conexión a base de datos", "error"); });
    const unsubTurnos = onSnapshot(collection(db, COL_TURNOS), (snap) => { setTurnos(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.fecha === fechaHoy).sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora))); });
    const unsubArchivo = onSnapshot(collection(db, COL_ARCHIVO), (snap) => { setTurnosArchivados(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b._ts?.toDate?.() - a._ts?.toDate?.())); });
    const unsubClientes = onSnapshot(collection(db, COL_CLIENTES), (snap) => { if (!snap.empty) setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubStaff = onSnapshot(collection(db, COL_STAFF), (snap) => { if (!snap.empty) setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubDia(); unsubTurnos(); unsubArchivo(); unsubClientes(); unsubStaff(); };
  }, [modoPrueba]);
  
  useEffect(() => { const fechaHoy = hoy(); const docRef = doc(db, COL_ASISTENCIAS, fechaHoy); const unsub = onSnapshot(docRef, (snap) => { setAsistencias(snap.exists() ? (snap.data().registros || {}) : {}); }); return () => unsub(); }, [modoPrueba]);
  
  const cerrarTurno = async (turno, montoRecibido, metodoPago) => { const total = Number(turno.precio || 0); const recibido = Math.max(0, Number(montoRecibido || 0)); const diferencia = total - recibido; await fsUpdate(COL_TURNOS, turno.id, { estado: "terminado", pagado: recibido, deudaGenerada: diferencia > 0 ? diferencia : 0, metodoPago, rendidoEn: serverTimestamp(), editadoPostRendicion: false }); if (diferencia > 0 && turno.clienteId) { const cli = clientes.find(c => c.id === turno.clienteId); if (cli) { await fsUpdate(COL_CLIENTES, cli.id, { deuda: Number(cli.deuda || 0) + diferencia }); mostrarToast(`Deuda registrada: ${formatP(diferencia)}`, "warn"); } } else { mostrarToast("Turno terminado correctamente", "ok"); } };
  const cambiarEstadoTurno = async (turnoId, nuevoEstado) => { try { await fsUpdate(COL_TURNOS, turnoId, { estado: nuevoEstado }); const labels = { en_progreso: "En Progreso", terminado: "Terminado" }; mostrarToast(`Turno marcado como ${labels[nuevoEstado] || nuevoEstado}`, "ok"); } catch (err) { mostrarToast("Error al actualizar estado", "error"); } };
  const activarLluvia = async () => { if (!diaActual?.id) return; await fsUpdate(COL_DIAS, diaActual.id, { lluvia: true, lluviaInicio: serverTimestamp() }); const pendientes = turnos.filter(t => t.estado === "pendiente" && t.hora >= horaAR()); await Promise.all(pendientes.map(t => fsUpdate(COL_TURNOS, t.id, { estado: "lluvia" }))); mostrarToast("Modo lluvia activado", "warn"); };
  const reanudarTrasLluvia = async () => { if (!diaActual?.id) return; const minutosActuales = new Date().getHours() * 60 + new Date().getMinutes(); let franjaInicio = FRANJAS_BASE.find(h => { const [hr, mn] = h.split(":").map(Number); return hr * 60 + mn >= minutosActuales; }) || FRANJAS_BASE[FRANJAS_BASE.length - 1]; await fsUpdate(COL_DIAS, diaActual.id, { lluvia: false, lluviaFin: serverTimestamp() }); const pendientes = turnos.filter(t => t.estado === "lluvia"); let idx = FRANJAS_BASE.indexOf(franjaInicio); for (const t of pendientes) { if (idx >= FRANJAS_BASE.length) break; await fsUpdate(COL_TURNOS, t.id, { hora: FRANJAS_BASE[idx], estado: "pendiente", reasignadoPorLluvia: true }); idx++; } mostrarToast(`Reanudado desde ${franjaInicio}`, "ok"); };
  const verificarClaveAcceso = () => { if (inputClave === CLAVE_MAESTRA) { setKeyDesbloqueada(true); setInputClave(""); mostrarToast("Acceso concedido", "ok"); } else { setInputClave(""); mostrarToast("Clave incorrecta", "error"); } };
  const toggleDia = async () => { if (!diaActual?.id) return; const nuevoEstado = diaActual?.estado === "abierto" ? "cerrado" : "abierto"; await fsUpdate(COL_DIAS, diaActual.id, { estado: nuevoEstado, apertura: nuevoEstado === "abierto" ? serverTimestamp() : diaActual.apertura, cierre: nuevoEstado === "cerrado" ? serverTimestamp() : null }); mostrarToast(nuevoEstado === "abierto" ? "☀️ Día ABIERTO" : "🌙 Día CERRADO", "ok"); };
  const handleTabClick = (tabId) => { if (tabId === "nuevoTurno") { setClienteParaTurno(null); setModalOpen("nuevoTurno"); } else { setTab(tabId); } };
  
  const archivarTurnos = async (ids) => {
    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        const turno = turnos.find(t => t.id === id);
        if (turno) {
          const ref = doc(collection(db, COL_ARCHIVO));
          batch.set(ref, { ...turno, archivadoEn: serverTimestamp(), fechaOriginal: turno.fecha });
          batch.delete(doc(db, COL_TURNOS, id));
        }
      }
      await batch.commit();
      mostrarToast(`📦 ${ids.length} turnos archivados`, "ok");
    } catch (err) { mostrarToast("Error al archivar", "error"); }
  };
  
  const codigosExistentes = clientes.map(c => c.codigo || "").filter(Boolean);
  
  if (cargando) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9fafb", color: "#6b7280", fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 600, fontSize: 14 }}>⟳ Sincronizando Sofia Lavados...</div>);
  
  if (diaActual?.estado !== "abierto") {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div style={{ animation: "fadeInUp .5s ease-out", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🚗</div>
          <h1 style={{ color: "#1e293b", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Sofía Lavados</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 40, fontWeight: 500 }}>{fechaAR(hoy())} • {horaAR()} hs</p>
          <button onClick={toggleDia} style={{ background: "linear-gradient(135deg,#bbf7d0,#a7f3d0)", color: "#14532d", border: "1px solid #86efac", borderRadius: 20, padding: "22px 56px", fontSize: 20, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(167,243,208,.3)", transition: "all .3s ease", width: "100%", maxWidth: 380 }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(167,243,208,.4)" }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(167,243,208,.3)" }}>🟢 ABRIR DÍA</button>
          {modoOculto && (<div style={{ marginTop: 20, padding: "8px 20px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12, fontWeight: 700, display: "inline-block" }}>🧪 MODO OCULTO ACTIVO</div>)}
          {modoOculto && (<Btn sm color="danger" style={{ marginTop: 12 }} onClick={() => { setModoOculto(false); setModoPrueba(false); }}>🔒 Salir del Modo Oculto</Btn>)}
          {/* PUNTO 1: Botón Caja visible solo en modo oculto */}
          {modoOculto && (<Btn sm color="primary" style={{ marginTop: 8 }} onClick={() => { mostrarToast("💰 Sistema Contable - Próximamente", "warn"); }}>💰 Caja</Btn>)}
        </div>
        {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
      </div>
    );
  }
  
  // Pestañas principales (sin Config)
  const tabsVisibles = [
    { id: "nuevoTurno", label: "➕ Nuevo Turno", color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
    { id: "agenda", label: "📋 Agenda", color: "#3b82f6", bg: "#dbeafe", border: "#bfdbfe" },
    { id: "clientes", label: "👥 Clientes", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    { id: "presentismo", label: "✅ Presentismo", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    { id: "seguimiento", label: "📊 Seguimiento", color: "#0891b2", bg: "#cffafe", border: "#a5f3fc" },
    { id: "historial", label: "📦 Historial", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  ];
  
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", color: "#1e293b", fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: 90 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeIn { from{opacity:0} to{opacity:1} } @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} } @media (max-width:768px) { .reloj-desktop { display:none !important; } .nav-tabs { overflow-x:auto !important; scrollbar-width:none; -webkit-overflow-scrolling:touch; } .nav-tabs::-webkit-scrollbar { display:none; } }`}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div onClick={handleLogoTap} style={{ fontSize: 18, fontWeight: 900, cursor: "pointer", userSelect: "none", color: "#1e293b" }}>🚗 Sofía</div>
          <div style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 10, background: diaActual?.lluvia ? "#fffbeb" : "#ecfdf5", color: diaActual?.lluvia ? "#92400e" : "#064e3b", border: diaActual?.lluvia ? "1px solid #fde68a" : "1px solid #a7f3d0" }}>{diaActual?.lluvia ? "🌧️ LLUVIA" : "🟢 ABIERTO"}</div>
          {modoOculto && (<span style={{ fontSize: 10, fontWeight: 800, color: "#92400e", background: "#fffbeb", padding: "3px 8px", borderRadius: 8, border: "1px solid #fde68a" }}>OCULTO</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {diaActual?.lluvia ? (<Btn sm color="success" onClick={reanudarTrasLluvia}>☀️ Reanudar</Btn>) : (<Btn sm color="warning" onClick={activarLluvia}>🌧️ Lluvia</Btn>)}
          <div className="reloj-desktop" style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 6 }}>{fechaAR(hoy())} • {horaAR()} hs</div>
          {/* PUNTO 2: Config fuera de la nav principal */}
          <button onClick={() => setTab("config")} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16, transition: "all .15s" }} onMouseOver={e => e.target.style.background = "#e2e8f0"} onMouseOut={e => e.target.style.background = "#f1f5f9"} title="Configuración">⚙️</button>
        </div>
      </header>
      <nav className="nav-tabs" style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", alignItems: "center", background: "rgba(255,255,255,.85)", backdropFilter: "blur(8px)", position: "sticky", top: "58px", zIndex: 90 }}>
        {tabsVisibles.map(t => (<button key={t.id} onClick={() => handleTabClick(t.id)} style={{ background: (t.id !== "nuevoTurno" && tab === t.id) ? t.bg : (t.id === "nuevoTurno" ? t.bg : "transparent"), color: (t.id !== "nuevoTurno" && tab === t.id) ? t.color : (t.id === "nuevoTurno" ? t.color : "#6b7280"), border: (t.id !== "nuevoTurno" && tab === t.id) ? `1.5px solid ${t.border}` : (t.id === "nuevoTurno" ? `1.5px solid ${t.border}` : "1.5px solid transparent"), borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all .2s" }}>{t.label}</button>))}
        <button onClick={toggleDia} style={{ marginLeft: "auto", flexShrink: 0, background: "#fecaca", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(254,202,202,.25)" }}>🔴 Cerrar Día</button>
      </nav>
      <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto", animation: "fadeInUp .4s ease-out" }}>
        {tab === "nuevoTurno" && (
          <div style={{ textAlign: "center", padding: 60, background: "#ffffff", borderRadius: 24, border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>➕</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Crear Nuevo Turno</h3>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>Seleccioná un cliente o creá uno nuevo para asignar un turno.</p>
            <Btn color="primary" onClick={() => setModalOpen("nuevoTurno")}>Abrir Formulario</Btn>
          </div>
        )}
        {tab === "agenda" && (
          <TabAgendaMatriz
            turnos={turnos}
            clientes={clientes}
            staff={staff}
            asistencias={asistencias}
            onMarcarLlego={(id) => cambiarEstadoTurno(id, "en_progreso")}
            onMarcarTerminado={(id) => { setEditando(turnos.find(t => t.id === id)); setModalOpen("cerrarTurno"); }}
            onArchivar={(turnosLista) => setMostrarArchivar(turnosLista)}
          />
        )}
        {tab === "clientes" && (
          <TabClientes
            clientes={clientes}
            onAsignarTurno={(c) => { setClienteParaTurno(c); setModalOpen("nuevoTurno"); }}
            onEditar={(c) => setClienteParaEditar(c)}
            onNuevo={() => setMostrarNuevoClienteDirecto(true)}
            mostrarToast={mostrarToast}
          />
        )}
        {tab === "presentismo" && (
          <TabPresentismo staff={staff} turnos={turnos} hoyStr={hoy()} COL_ASISTENCIAS={COL_ASISTENCIAS} COL_STAFF={COL_STAFF} db={db} doc={doc} setDoc={setDoc} onSnapshot={onSnapshot} useEffect={useEffect} useState={useState} mostrarToast={mostrarToast} />
        )}
        {tab === "seguimiento" && (<TabSeguimientoTurnos turnos={turnos} clientes={clientes} staff={staff} onMarcarTerminado={cambiarEstadoTurno} onArchivar={(turnosLista) => setMostrarArchivar(turnosLista)} />)}
        {tab === "historial" && (<TabHistorial turnosArchivados={turnosArchivados} clientes={clientes} staff={staff} />)}
        {tab === "config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 20, border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={modoOculto} onChange={e => { setModoOculto(e.target.checked); setModoPrueba(e.target.checked); }} style={{ width: 18, height: 18, accentColor: "#7c3aed" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>🧪 Modo Prueba / Oculto (Datos aislados)</span>
              </label>
              {modoOculto && (<Btn sm color="danger" style={{ marginTop: 12 }} onClick={() => { setModoOculto(false); setModoPrueba(false); }}>🔒 Salir del Modo Oculto</Btn>)}
            </div>
            <div style={{ background: "#ffffff", padding: 24, borderRadius: 20, border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>🔑 API Key Gemini</span>
                {keyDesbloqueada && (<button onClick={() => setKeyDesbloqueada(false)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🔒 Bloquear</button>)}
              </div>
              {!keyDesbloqueada ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 14, fontWeight: 600 }}>Ingresa clave maestra para gestionar API Key</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <input type="password" placeholder="Clave maestra" value={inputClave} onChange={e => setInputClave(e.target.value)} onKeyDown={e => e.key === "Enter" && verificarClaveAcceso()} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 16px", color: "#1e293b", fontSize: 13, outline: "none", width: 180 }} />
                    <Btn sm color="secondary" onClick={verificarClaveAcceso}>Desbloquear</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type={mostrarApiKey ? "text" : "password"} value={geminiKey} onChange={e => setGeminiKey(e.target.value)} style={{ flex: 1, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", color: "#1e293b", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
                    <Btn sm color="secondary" onClick={() => setMostrarApiKey(prev => !prev)}>{mostrarApiKey ? "🙈 Ocultar" : "👁️ Mostrar"}</Btn>
                    <Btn sm color="tertiary" onClick={async () => { try { await navigator.clipboard.writeText(geminiKey); mostrarToast("📋 API Key copiada", "ok"); } catch { mostrarToast("Error al copiar", "error") } }}>📋 Copiar</Btn>
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>🔗 Obtener nueva API Key en Google AI Studio</a>
                  <div style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: 10, borderRadius: 10 }}>
                    💡 La API Key se guarda en tu navegador. Para renovarla, generá una nueva en el enlace y pegala arriba.
                  </div>
                  <Btn color="primary" full onClick={() => { localStorage.setItem("sofia_gemini_key", geminiKey); mostrarToast("API Key guardada", "ok"); }}>💾 Guardar en este dispositivo</Btn>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {modalOpen === "nuevoTurno" && (<ModalNuevoTurno clientes={clientes} staff={staff} turnos={turnos} asistencias={asistencias} COL_TURNOS={COL_TURNOS} COL_CLIENTES={COL_CLIENTES} geminiKey={geminiKey} mostrarToast={mostrarToast} clientePreseleccionado={clienteParaTurno} codigosExistentes={codigosExistentes} onClienteCreated={(nc) => setClientes(prev => [...prev, nc])} onTurnoCreado={(turno, cliente, lavador) => setTurnoCreadoData({ turno, cliente, lavador })} onClose={() => { setModalOpen(null); setClienteParaTurno(null); }} />)}
      {modalOpen === "cerrarTurno" && editando && (<ModalCerrarTurno turno={editando} clientes={clientes} cerrarTurnoFn={cerrarTurno} onClose={() => { setModalOpen(null); setEditando(null); }} />)}
      {clienteParaEditar && (<ModalEditarCliente cliente={clienteParaEditar} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} onClose={() => setClienteParaEditar(null)} />)}
      {mostrarNuevoClienteDirecto && (<ModalNuevoCliente nombreInicial="" COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} codigosExistentes={codigosExistentes} onClienteCreated={(nc) => { setClientes(prev => [...prev, nc]); mostrarToast(`Cliente ${nc.nombre} creado`, "ok"); }} onClose={() => setMostrarNuevoClienteDirecto(false)} />)}
      {turnoCreadoData && (<ModalTurnoCreado turno={turnoCreadoData.turno} cliente={turnoCreadoData.cliente} lavador={turnoCreadoData.lavador} mostrarToast={mostrarToast} onClose={() => setTurnoCreadoData(null)} />)}
      {mostrarArchivar && (<ModalArchivarTurnos turnos={mostrarArchivar} onConfirm={archivarTurnos} onClose={() => setMostrarArchivar(null)} mostrarToast={mostrarToast} />)}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
