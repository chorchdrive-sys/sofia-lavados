import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, writeBatch, query, where
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════════
const FB = {
  apiKey: "AIzaSyDBZS7KR8YIq8UzAhnq9WaPTh8wGTZ-SMI",
  authDomain: "sofia-lavados-99231.firebaseapp.com",
  projectId: "sofia-lavados-99231",
  storageBucket: "sofia-lavados-99231.firebasestorage.app",
  messagingSenderId: "738758410354",
  appId: "1:738758410354:web:0c07ee6f2906d8add402eb",
};

const app = initializeApp(FB);
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
//  CONSTANTES GLOBALES
// ═══════════════════════════════════════════════════════════════
const BASE_LAT = -34.5128;
const BASE_LNG = -58.4985;
const FRANJAS_BASE = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];
const FRANJA_DURACION = 90;

const DISTANCIAS_DEFAULT = {
  moto: { cerca: 25, lejos: 40, fz: 40 },
  bici: { cerca: 15, lejos: 25, fz: 25 },
  pie: { cerca: 7, lejos: 12, fz: 12 },
};

const TIEMPOS_LAVADO_BASE = {
  "Chico": 30,
  "Mediano": 45,
  "Camioneta": 60,
};

const TAMANOS_DEFAULT = [
  { id: "chico", label: "Chico", precio: 25000 },
  { id: "mediano", label: "Mediano", precio: 28000 },
  { id: "camioneta", label: "Camioneta", precio: 32000 },
];

const COLORES = [
  "#93c5fd", "#c4b5fd", "#fca5a5", "#fdba74", "#86efac", "#67e8f9",
  "#a5b4fc", "#f0abfc", "#fcd34d", "#a7f3d0", "#bae6fd", "#fecdd3",
  "#22d3ee", "#0ea5e9", "#38bdf8", "#7dd3fc", "#06b6d4", "#67e8f9",
];

const STAFF_SEED = [
  { nombre: "Jhony", transporte: "moto", color: "#93c5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Sergio", transporte: "moto", color: "#c4b5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Alexander", transporte: "moto", color: "#fca5a5", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Maxi", transporte: "moto", color: "#fdba74", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Rene", transporte: "moto", color: "#86efac", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Brandon", transporte: "moto", color: "#67e8f9", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Jorge", transporte: "moto", color: "#a5b4fc", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Emiliano", transporte: "moto", color: "#f0abfc", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Gaby", transporte: "moto", color: "#fcd34d", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Javi", transporte: "moto", color: "#a7f3d0", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Franco", transporte: "moto", color: "#bae6fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Fede", transporte: "moto", color: "#fecdd3", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Elias", transporte: "moto", color: "#93c5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Alvaro", transporte: "bici", color: "#c4b5fd", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Nestor", transporte: "bici", color: "#fca5a5", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Matias", transporte: "bici", color: "#fdba74", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Luis", transporte: "bici", color: "#86efac", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Bruno", transporte: "bici", color: "#67e8f9", whatsapp: true, rol: "lavador", especial: "", saldoPendiente: 0, telefono: "" },
  { nombre: "Nico Alto", transporte: "bici", color: "#a5b4fc", whatsapp: true, rol: "lavador", especial: "rapido", saldoPendiente: 0, telefono: "" },
  { nombre: "Hernán", transporte: "bici", color: "#f0abfc", whatsapp: false, rol: "lavador", especial: "avisar_presencia", saldoPendiente: 0, telefono: "" },
  { nombre: "Gastón", transporte: "bici", color: "#fcd34d", whatsapp: false, rol: "lavador", especial: "llamar_telefono", saldoPendiente: 0, telefono: "" },
];

const BARRIOS_INICIALES = {
  "olivos": "OLI", "martinez": "MAR", "florida": "FLO", "san isidro": "SIS",
  "acassuso": "ACA", "la lucila": "LAL", "boulogne": "BOU", "vicente lopez": "VLO",
  "munro": "MUN", "villa adelina": "VAD", "beccar": "BEC",
};
let LISTA_BARRIOS = Object.keys(BARRIOS_INICIALES).map(k => k.charAt(0).toUpperCase() + k.slice(1));

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

const NOTAS_PREDEFINIDAS = [
  "Cliente detallista", "Insectos de ruta", "Barro extremo", "Decir precio antes de empezar",
  "Avisar cuando va", "No usar revividor", "Llevar doble alargue", "Auto muy sucio", "Cliente nuevo",
];

const MOTIVOS_DESCUENTO = [
  "Error de cambio",
  "Descuento por queja",
  "Lavado gratis (compensación total)",
  "Lavado con descuento (compensación parcial)",
  "Cliente no pagó (deuda)",
  "Otro",
];

const MOTIVOS_OPERACION = [
  "Préstamo (lavador recibe)",
  "Adelanto de sueldo (lavador recibe)",
  "Regalo / Premio (lavador recibe)",
  "Devolución de préstamo (lavador paga)",
  "Aporte voluntario (lavador paga)",
  "Otro",
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

const fechaAR = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const horaAR = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ar = new Date(utc - 3 * 60 * 60000);
  return `${String(ar.getHours()).padStart(2, "0")}:${String(ar.getMinutes()).padStart(2, "0")}`;
};

const horaARFull = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ar = new Date(utc - 3 * 60 * 60000);
  return `${String(ar.getHours()).padStart(2, "0")}:${String(ar.getMinutes()).padStart(2, "0")}:${String(ar.getSeconds()).padStart(2, "0")}`;
};

const franjasValidas = () => {
  const ahora = new Date();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes() + 30;
  return FRANJAS_BASE.filter(h => {
    const [hr, mn] = h.split(":").map(Number);
    return hr * 60 + mn > minutos;
  });
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

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const kmToCuadras = km => km * 10;

function codigoBarrio(barrioNombre) {
  if (!barrioNombre || barrioNombre.trim() === "" || barrioNombre.toLowerCase() === "desconocido") return "DES";
  const limpio = barrioNombre.replace(/[\(\)\[\],]/g, " ").replace(/\s+/g, " ").trim();
  const b = limpio.toLowerCase().replace(/[áéíóúü]/g, m => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" }[m] || m));
  for (const [k, v] of Object.entries(BARRIOS_INICIALES)) {
    if (b.includes(k)) return v;
  }
  const cod = b.replace(/[\s,]+/g, "").substring(0, 3).toUpperCase();
  if (!LISTA_BARRIOS.find(x => x.toLowerCase() === limpio.toLowerCase())) LISTA_BARRIOS.push(limpio);
  return cod;
}

const _geocache = {};
async function geocodificar(dir) {
  const resultadoDefault = {
    lat: BASE_LAT, lng: BASE_LNG, barrio: "", codigoPostal: "",
    provincia: "", ciudad: "", encontrado: false
  };
  if (!dir || dir.trim().length < 5) return resultadoDefault;
  if (_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&viewbox=-58.55,-34.45,-58.40,-34.55&bounded=0`, {
      headers: { "Accept-Language": "es", "User-Agent": "SofiaLavados/8.2-Final" }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      let mejorResultado = data[0];
      let menorDistancia = Infinity;
      for (const item of data) {
        const addr = item.address || {};
        const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || "";
        if (barrio) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const dist = Math.sqrt(Math.pow(lat - BASE_LAT, 2) + Math.pow(lng - BASE_LNG, 2));
          if (dist < menorDistancia) {
            menorDistancia = dist;
            mejorResultado = item;
          }
        }
      }
      const addr = mejorResultado.address || {};
      const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || addr.village || "";
      const coords = {
        lat: parseFloat(mejorResultado.lat),
        lng: parseFloat(mejorResultado.lon),
        barrio: capitalizar(barrio),
        codigoPostal: addr.postcode || "",
        provincia: capitalizar(addr.state || ""),
        ciudad: capitalizar(addr.city || addr.town || addr.municipality || ""),
        encontrado: !!barrio
      };
      _geocache[dir] = coords;
      return coords;
    }
  } catch (err) {
    console.warn("Geocodificación falló:", err);
  }
  return resultadoDefault;
}

async function generarCodigoCliente(barrio, nombre, COL_CLIENTES, codigosExistentes = []) {
  const codBarrio = codigoBarrio(barrio);
  let existentes = codigosExistentes;
  if (existentes.length === 0) {
    const snap = await getDocs(collection(db, COL_CLIENTES));
    existentes = snap.docs.map(d => d.data().codigo || "");
  }
  const prefijo = `${codBarrio}-`;
  let maxNum = 0;
  existentes.forEach(c => {
    if (c && c.startsWith(prefijo)) {
      const num = parseInt(c.split("-")[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
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
  const hrFin = Math.floor(minutosFin / 60);
  const mnFin = minutosFin % 60;
  return {
    minutosFin,
    horaFin: `${String(hrFin).padStart(2, "0")}:${String(mnFin).padStart(2, "0")}`,
    duracion: duracionTotal,
    duracionBase,
    slotsOcupados: Math.ceil(duracionTotal / FRANJA_DURACION)
  };
}

function slotsOcupados(horaInicio, cantAutos, tipoVehiculo) {
  const idx = FRANJAS_BASE.indexOf(horaInicio);
  if (idx < 0) return [horaInicio];
  const fin = calcularFinTurno(horaInicio, tipoVehiculo, cantAutos);
  const slots = fin.slotsOcupados;
  const result = [];
  for (let i = 0; i < slots; i++) {
    const targetIdx = idx + i;
    if (targetIdx < FRANJAS_BASE.length) {
      result.push(FRANJAS_BASE[targetIdx]);
    } else {
      const lastBase = FRANJAS_BASE[FRANJAS_BASE.length - 1];
      const [lh, lm] = lastBase.split(":").map(Number);
      const extraMin = (lh * 60 + lm) + ((targetIdx - FRANJAS_BASE.length + 1) * FRANJA_DURACION);
      const eh = Math.floor(extraMin / 60);
      const em = extraMin % 60;
      result.push(`${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
    }
  }
  return result;
}

// FIX F2: calcula slots ocupados a partir de una duración en minutos (en lugar del tipo base)
function slotsOcupadosPorDuracion(horaInicio, duracionMinutos) {
  const idx = FRANJAS_BASE.indexOf(horaInicio);
  const cantSlots = Math.ceil(duracionMinutos / FRANJA_DURACION);
  if (idx < 0) return [horaInicio];
  const result = [];
  for (let i = 0; i < cantSlots; i++) {
    const targetIdx = idx + i;
    if (targetIdx < FRANJAS_BASE.length) {
      result.push(FRANJAS_BASE[targetIdx]);
    } else {
      const lastBase = FRANJAS_BASE[FRANJAS_BASE.length - 1];
      const [lh, lm] = lastBase.split(":").map(Number);
      const extraMin = (lh * 60 + lm) + ((targetIdx - FRANJAS_BASE.length + 1) * FRANJA_DURACION);
      const eh = Math.floor(extraMin / 60);
      const em = extraMin % 60;
      result.push(`${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
    }
  }
  return result;
}

function generarFranjasDinamicas(turnos) {
  let maxMinutos = 18 * 60 + 30;
  turnos.forEach(t => {
    const fin = calcularFinTurno(t.hora, t.auto, t.cantidadAutos);
    if (fin.minutosFin > maxMinutos) maxMinutos = fin.minutosFin;
  });
  const franjas = [...FRANJAS_BASE];
  let currentMin = 18 * 60 + 30;
  while (currentMin < maxMinutos) {
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    franjas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    currentMin += FRANJA_DURACION;
  }
  return franjas;
}

// ═══════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════
const fsGet = async (col, id) => {
  if (!db) return null;
  try {
    const s = await getDoc(doc(db, col, id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch { return null; }
};

const fsSave = async (col, id, data) => {
  if (!db) return;
  try {
    await setDoc(doc(db, col, id), { ...data, _ts: serverTimestamp() }, { merge: true });
  } catch { }
};

const fsAdd = async (col, data) => {
  if (!db) return null;
  try {
    const r = await addDoc(collection(db, col), { ...data, _ts: serverTimestamp() });
    return r.id;
  } catch { return null; }
};

const fsDel = async (col, id) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, col, id));
  } catch { }
};

const fsList = async (col) => {
  if (!db) return [];
  try {
    const s = await getDocs(collection(db, col));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

const fsUpdate = async (col, id, data) => {
  if (!db) return;
  try {
    await updateDoc(doc(db, col, id), data);
  } catch { }
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT HELPERS
// ═══════════════════════════════════════════════════════════════
function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(rows, headers, filename) {
  const csvContent = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(html, title) {
  const win = window.open("", "_blank");
  if (!win) { alert("Permití ventanas emergentes para imprimir"); return; }
  win.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#f0f0f0}h2{color:#333}</style>
    </head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
}

async function guardarBackupNube(nombre, data, mostrarToast) {
  try {
    await addDoc(collection(db, "backups"), {
      nombre,
      fecha: hoy(),
      timestamp: serverTimestamp(),
      dataJson: JSON.stringify(data),
      size: JSON.stringify(data).length
    });
    mostrarToast(`☁️ Backup "${nombre}" guardado en la nube`, "ok");
  } catch (err) {
    console.error(err);
    mostrarToast("Error al guardar backup en la nube", "error");
  }
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════
function Toast({ msg, tipo, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);
  const styles = {
    ok: { bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b", icon: "#059669" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "#dc2626" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#d97706" },
  };
  const s = styles[tipo] || styles.ok;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.icon}`,
      color: s.text, padding: "14px 20px", borderRadius: 14,
      fontSize: 13, fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif",
      boxShadow: "0 8px 30px rgba(0,0,0,.06)", maxWidth: 320,
      animation: "fadeInUp .3s ease-out", display: "flex", alignItems: "center", gap: 10
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 24, height: 24, borderRadius: "50%", background: `${s.icon}18`, color: s.icon, fontSize: 12
      }}>
        {tipo === "ok" ? "✓" : tipo === "error" ? "✗" : "⚠"}
      </span>
      {msg}
    </div>
  );
}

function AvisoFijo({ msg, tipo = "warn", onClose }) {
  const styles = {
    ok: { bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  };
  const s = styles[tipo] || styles.warn;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: 24, zIndex: 9998,
      background: s.bg, border: `2px solid ${s.border}`,
      color: s.text, padding: "12px 18px", borderRadius: 14,
      fontSize: 12, fontWeight: 700, fontFamily: "'Inter',system-ui,sans-serif",
      boxShadow: "0 8px 30px rgba(0,0,0,.08)", maxWidth: 340,
      display: "flex", alignItems: "center", gap: 10,
      animation: "fadeInUp .3s ease-out"
    }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      <span style={{ flex: 1 }}>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: "transparent", border: "none", color: s.text, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>✕</button>}
    </div>
  );
}

function Modal({ titulo, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(241,245,249,.6)", backdropFilter: "blur(12px)",
      zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      animation: "fadeIn .2s ease-out"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20,
        padding: 24, width: "100%", maxWidth: wide ? 640 : 440, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.06)", animation: "scaleIn .25s ease-out"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{titulo}</div>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", color: "#64748b", cursor: "pointer",
            fontSize: 16, lineHeight: 1, padding: "6px 10px", borderRadius: 10, transition: "all .15s"
          }} onMouseOver={e => e.target.style.background = "#e2e8f0"} onMouseOut={e => e.target.style.background = "#f1f5f9"}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = "primary", ghost, danger, disabled, full, sm, style = {} }) {
  const palettes = {
    primary: { bg: "#bfdbfe", hover: "#93c5fd", text: "#1e3a8a", shadow: "rgba(147,197,253,.3)" },
    secondary: { bg: "#ddd6fe", hover: "#c4b5fd", text: "#5b21b6", shadow: "rgba(196,181,253,.3)" },
    tertiary: { bg: "#a7f3d0", hover: "#6ee7b7", text: "#064e3b", shadow: "rgba(167,243,208,.3)" },
    success: { bg: "#bbf7d0", hover: "#86efac", text: "#14532d", shadow: "rgba(187,247,208,.3)" },
    warning: { bg: "#fed7aa", hover: "#fdba74", text: "#9a3412", shadow: "rgba(254,215,170,.3)" },
    danger: { bg: "#fecaca", hover: "#fca5a5", text: "#991b1b", shadow: "rgba(254,202,202,.3)" },
    gray: { bg: "#e2e8f0", hover: "#cbd5e1", text: "#334155", shadow: "rgba(0,0,0,.05)" },
  };
  const p = danger ? palettes.danger : (typeof color === "string" && palettes[color]) ? palettes[color] : { bg: color, hover: color, text: "#334155", shadow: "rgba(0,0,0,.05)" };

  const baseStyle = ghost ? {
    background: "transparent", border: `1.5px solid #cbd5e1`, color: "#475569", boxShadow: "none"
  } : disabled ? {
    background: "#f1f5f9", color: "#94a3b8", boxShadow: "none", border: "1px solid #e2e8f0"
  } : {
    background: p.bg, color: p.text, border: "1px solid transparent",
    boxShadow: `0 4px 14px ${p.shadow}`
  };

  return (
    <button style={{
      ...baseStyle,
      borderRadius: sm ? 10 : 14,
      padding: sm ? "7px 14px" : "11px 22px",
      fontSize: sm ? 12 : 13,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      width: full ? "100%" : "auto",
      transition: "all .2s ease",
      opacity: disabled ? 0.6 : 1,
      fontFamily: "'Inter',system-ui,sans-serif",
      transform: "translateY(0)",
      ...style
    }}
      onMouseOver={e => { if (!disabled && !ghost) { e.currentTarget.style.background = p.hover; e.currentTarget.style.transform = "translateY(-2px)" } }}
      onMouseOut={e => { if (!disabled && !ghost) { e.currentTarget.style.background = p.bg; e.currentTarget.style.transform = "translateY(0)" } }}
      onClick={!disabled ? onClick : undefined}>
      {children}
    </button>
  );
}

function RelojVivo() {
  const [hora, setHora] = useState(horaARFull());
  const [fecha, setFecha] = useState(fechaAR(hoy()));
  useEffect(() => {
    const tick = () => {
      setHora(horaARFull());
      setFecha(fechaAR(hoy()));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="reloj-desktop" style={{
      fontSize: 13, color: "#6b7280", fontWeight: 700,
      fontVariantNumeric: "tabular-nums", display: "flex",
      alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace"
    }}>
      {fecha} • {hora} hs
    </div>
  );
}

function BuscadorClientes({ clientes, value, onChange, placeholder, onCreateNew }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && clientes) {
      const c = clientes.find(cli => cli.id === value);
      if (c) setBusqueda(c.nombre);
    }
  }, [value, clientes]);

  const filtrados = busqueda.trim() === "" ? clientes : clientes.filter(c =>
    sinAcentos(c.nombre).includes(sinAcentos(busqueda)) ||
    sinAcentos(c.codigo || "").includes(sinAcentos(busqueda)) ||
    sinAcentos(c.barrio || "").includes(sinAcentos(busqueda))
  );

  const inputStyle = {
    background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none",
    transition: "border-color .2s, box-shadow .2s", width: "100%", boxSizing: "border-box",
    fontFamily: "'Inter',system-ui,sans-serif"
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        placeholder={placeholder || "Buscar cliente por nombre, código o barrio..."}
        style={inputStyle}
      />
      {abierto && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          marginTop: 4, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 8px 25px rgba(0,0,0,.08)"
        }}>
          {filtrados.length === 0 ? (
            busqueda.trim().length > 2 ? (
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>No se encontraron resultados</div>
                <Btn sm color="tertiary" full onClick={() => {
                  onCreateNew && onCreateNew(busqueda);
                  setAbierto(false);
                }}>
                  ➕ Crear "{busqueda}" como nuevo
                </Btn>
              </div>
            ) : (
              <div style={{ padding: 14, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Sin resultados</div>
            )
          ) : (
            filtrados.map(c => (
              <button key={c.id} onClick={() => { onChange(c.id); setBusqueda(c.nombre); setAbierto(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6", transition: "background .15s",
                  fontFamily: "'Inter',system-ui,sans-serif"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{c.codigo} • {c.barrio}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ModalNuevoCliente({ nombreInicial, onClose, COL_CLIENTES, mostrarToast, onClienteCreated, codigosExistentes }) {
  const [datos, setDatos] = useState({
    nombre: nombreInicial || "",
    telefono: "",
    direccion: "",
    barrio: "",
    codigoPostal: "",
    provincia: "",
    nota: ""
  });
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [error, setError] = useState("");
  const [avisoGeo, setAvisoGeo] = useState(null);

  const buscarDireccion = async () => {
    if (!datos.direccion || datos.direccion.trim().length < 5) {
      mostrarToast("Ingresá una dirección más completa (mín. 5 caracteres)", "warn");
      return;
    }
    setBuscandoDir(true);
    setAvisoGeo(null);
    const res = await geocodificar(datos.direccion);
    if (res && res.encontrado && res.barrio) {
      setDatos(prev => ({
        ...prev,
        barrio: res.barrio,
        codigoPostal: res.codigoPostal || prev.codigoPostal,
        provincia: res.provincia || prev.provincia,
      }));
      setAvisoGeo({ detectado: res.barrio, mensaje: `Se detectó: ${res.barrio}. ¿Es correcto?`, tipo: "ok" });
    } else {
      setAvisoGeo({ detectado: "", mensaje: "⚠️ No se pudo determinar el barrio. Preguntale al cliente e ingresalo manualmente.", tipo: "warn" });
    }
    setBuscandoDir(false);
  };

  const guardar = async () => {
    setError("");
    if (!datos.nombre || datos.nombre.trim().length < 2) return setError("El nombre es obligatorio");
    if (!datos.direccion || datos.direccion.trim().length < 5) return setError("La dirección debe tener al menos 5 caracteres");
    if (!datos.barrio || datos.barrio.trim() === "" || datos.barrio.toLowerCase() === "desconocido") {
      return setError("El barrio es obligatorio.");
    }
    try {
      const codigo = await generarCodigoCliente(datos.barrio, datos.nombre, COL_CLIENTES, codigosExistentes || []);
      const nuevoCliente = {
        nombre: capitalizar(datos.nombre),
        telefono: datos.telefono || "",
        direccion: datos.direccion,
        barrio: capitalizar(datos.barrio),
        codigoPostal: datos.codigoPostal || "",
        provincia: datos.provincia || "",
        autosHabituales: 1,
        nota: datos.nota || "",
        tipo: "💤 Ocasional",
        deuda: 0,
        codigo: codigo
      };
      const docRef = await addDoc(collection(db, COL_CLIENTES), { ...nuevoCliente, _ts: serverTimestamp() });
      mostrarToast(`Cliente creado: ${codigo}`, "ok");
      onClienteCreated({ id: docRef.id, ...nuevoCliente });
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al crear cliente", "error");
    }
  };

  const inputStyle = {
    background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif"
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };

  return (
    <Modal titulo="➕ Nuevo Cliente" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && <div style={{ color: "#dc2626", fontSize: 12, background: "#fef2f2", padding: 10, borderRadius: 8, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
        <div><label style={labelStyle}>Nombre *</label>
          <input value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} style={inputStyle} autoFocus />
        </div>
        <div><label style={labelStyle}>Teléfono</label>
          <input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Dirección *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={buscarDireccion} disabled={buscandoDir} style={{ background: buscandoDir ? "#e5e7eb" : "#bfdbfe", border: "none", borderRadius: 12, padding: "0 14px", cursor: buscandoDir ? "not-allowed" : "pointer", fontSize: 16 }}>{buscandoDir ? "⏳" : "📍"}</button>
          </div>
        </div>
        <div><label style={labelStyle}>Barrio *</label>
          <input value={datos.barrio} onChange={e => { setDatos({ ...datos, barrio: e.target.value }); setAvisoGeo(null); }} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Nota</label>
          <input value={datos.nota} onChange={e => setDatos({ ...datos, nota: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="success" full onClick={guardar}>💾 Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalEditarCliente({ cliente, onClose, COL_CLIENTES, mostrarToast }) {
  const [datos, setDatos] = useState({ ...cliente });
  const guardar = async () => {
    try {
      await fsUpdate(COL_CLIENTES, cliente.id, {
        telefono: datos.telefono || "", direccion: datos.direccion || "",
        barrio: datos.barrio || "", nota: datos.nota || "",
        tipo: datos.tipo || "", autosHabituales: Number(datos.autosHabituales) || 1,
      });
      mostrarToast("Cliente actualizado", "ok");
      onClose();
    } catch (err) { mostrarToast("Error al actualizar", "error"); }
  };
  const condonarDeuda = async () => {
    if (!window.confirm(`¿Condonar deuda de ${formatP(datos.deuda)} a ${datos.nombre}?`)) return;
    await fsUpdate(COL_CLIENTES, cliente.id, { deuda: 0 });
    setDatos({ ...datos, deuda: 0 });
    mostrarToast(`Deuda de ${datos.nombre} condonada ✓`, "ok");
  };
  const aplicarPunitorio = async () => {
    const monto = Number(prompt("¿Cuánto de punitorio/recargo sumás?"));
    if (!monto || monto <= 0) return;
    const nueva = (datos.deuda || 0) + monto;
    await fsUpdate(COL_CLIENTES, cliente.id, { deuda: nueva });
    setDatos({ ...datos, deuda: nueva });
    mostrarToast(`Punitorio de ${formatP(monto)} aplicado`, "warn");
  };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };

  return (
    <Modal titulo={`✏️ Editar: ${cliente.nombre}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {datos.deuda > 0 && (
          <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#991b1b", marginBottom: 8 }}>🔴 Deuda acumulada: {formatP(datos.deuda)}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn sm color="success" onClick={condonarDeuda}>✓ Condonar</Btn>
              <Btn sm color="warning" onClick={aplicarPunitorio}>+ Punitorio</Btn>
            </div>
          </div>
        )}
        <div><label style={labelStyle}>Teléfono</label><input value={datos.telefono || ""} onChange={e => setDatos({ ...datos, telefono: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Dirección</label><input value={datos.direccion || ""} onChange={e => setDatos({ ...datos, direccion: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Barrio</label><input value={datos.barrio || ""} onChange={e => setDatos({ ...datos, barrio: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Tipo</label>
          <select value={datos.tipo || ""} onChange={e => setDatos({ ...datos, tipo: e.target.value })} style={inputStyle}>
            <option value="⭐ Frecuente">⭐ Frecuente</option>
            <option value="🔥 Top">🔥 Top</option>
            <option value="💤 Ocasional">💤 Ocasional</option>
          </select>
        </div>
        <div><label style={labelStyle}>Autos Habituales</label><input type="number" value={datos.autosHabituales || 1} onChange={e => setDatos({ ...datos, autosHabituales: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Nota</label><input value={datos.nota || ""} onChange={e => setDatos({ ...datos, nota: e.target.value })} style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>💾 Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalGestionLavadores({ staff, onClose, COL_STAFF, mostrarToast }) {
  const [nuevoLavador, setNuevoLavador] = useState({ nombre: "", telefono: "", transporte: "moto", color: "#93c5fd", rol: "lavador", especial: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdit, setDatosEdit] = useState({});
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);

  const guardarNuevo = async () => {
    if (!nuevoLavador.nombre || nuevoLavador.nombre.trim().length < 2) return mostrarToast("El nombre es obligatorio", "warn");
    try {
      const coloresUsados = staff.map(s => s.color);
      const colorNuevo = COLORES.find(c => !coloresUsados.includes(c)) || "#94a3b8";
      await addDoc(collection(db, COL_STAFF), {
        nombre: capitalizar(nuevoLavador.nombre),
        telefono: nuevoLavador.telefono || "",
        transporte: nuevoLavador.transporte,
        whatsapp: true,
        color: nuevoLavador.color || colorNuevo,
        rol: nuevoLavador.rol,
        especial: nuevoLavador.especial || "",
        saldoPendiente: 0,
        _ts: serverTimestamp()
      });
      mostrarToast(`Lavador ${nuevoLavador.nombre} agregado`, "ok");
      setNuevoLavador({ nombre: "", telefono: "", transporte: "moto", color: "#93c5fd", rol: "lavador", especial: "" });
      setMostrarFormNuevo(false);
    } catch (err) { mostrarToast("Error al agregar", "error"); }
  };

  const eliminarLavador = async (lavador) => {
    if (!window.confirm(`¿Eliminar a ${lavador.nombre}?`)) return;
    try { await deleteDoc(doc(db, COL_STAFF, lavador.id)); mostrarToast(`${lavador.nombre} eliminado`, "ok"); }
    catch (err) { mostrarToast("Error al eliminar", "error"); }
  };

  const actualizarLavador = async (lavador) => {
    try {
      await fsUpdate(COL_STAFF, lavador.id, datosEdit);
      mostrarToast(`${lavador.nombre} actualizado`, "ok");
      setEditandoId(null);
    }
    catch (err) { mostrarToast("Error al actualizar", "error"); }
  };

  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <Modal titulo="⚙️ Gestión Completa de Lavadores" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!mostrarFormNuevo ? (
          <Btn color="success" full onClick={() => setMostrarFormNuevo(true)}>➕ Agregar Nuevo Lavador</Btn>
        ) : (
          <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#064e3b", marginBottom: 10 }}>Nuevo Lavador</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input placeholder="Nombre *" value={nuevoLavador.nombre} onChange={e => setNuevoLavador({ ...nuevoLavador, nombre: e.target.value })} style={inputStyle} />
              <input placeholder="Teléfono WhatsApp" value={nuevoLavador.telefono} onChange={e => setNuevoLavador({ ...nuevoLavador, telefono: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={nuevoLavador.transporte} onChange={e => setNuevoLavador({ ...nuevoLavador, transporte: e.target.value })} style={inputStyle}>
                <option value="moto">🏍️ Moto</option><option value="bici">🚲 Bici</option><option value="pie">🚶 A pie</option>
              </select>
              <select value={nuevoLavador.rol} onChange={e => setNuevoLavador({ ...nuevoLavador, rol: e.target.value })} style={inputStyle}>
                <option value="lavador">Lavador</option><option value="encargado">Encargado</option>
              </select>
              <select value={nuevoLavador.especial} onChange={e => setNuevoLavador({ ...nuevoLavador, especial: e.target.value })} style={inputStyle}>
                <option value="">Sin atributo</option>
                <option value="rapido">⚡ Rápido</option>
                <option value="avisar_presencia">🔴 Avisar presencia</option>
                <option value="llamar_telefono">📞 Llamar teléfono</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#064e3b" }}>Color:</label>
              <input type="color" value={nuevoLavador.color} onChange={e => setNuevoLavador({ ...nuevoLavador, color: e.target.value })} style={{ width: 50, height: 35, border: "none", background: "transparent" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn ghost onClick={() => setMostrarFormNuevo(false)} full>Cancelar</Btn>
              <Btn color="success" full onClick={guardarNuevo}>💾 Guardar</Btn>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "400px", overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lavadores registrados ({staff.length})</div>
          {staff.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(l => {
            const editando = editandoId === l.id;
            return (
              <div key={l.id} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,.02)" }}>
                {!editando ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: l.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>{l.nombre.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{l.nombre}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{l.transporte} • {l.rol}{l.especial && ` • ${l.especial}`}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setEditandoId(l.id); setDatosEdit({ ...l }); }} style={{ background: "#dbeafe", border: "none", borderRadius: 8, padding: "6px 10px", color: "#1e3a8a", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✏️ Editar</button>
                        <button onClick={() => eliminarLavador(l)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "6px 10px", color: "#991b1b", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>📱 {l.telefono || "Sin teléfono"}</div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <input value={datosEdit.nombre || ""} onChange={e => setDatosEdit({ ...datosEdit, nombre: e.target.value })} placeholder="Nombre" style={inputStyle} />
                      <input value={datosEdit.telefono || ""} onChange={e => setDatosEdit({ ...datosEdit, telefono: e.target.value })} placeholder="Teléfono" style={inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      <select value={datosEdit.transporte || "moto"} onChange={e => setDatosEdit({ ...datosEdit, transporte: e.target.value })} style={inputStyle}>
                        <option value="moto">🏍️ Moto</option><option value="bici">🚲 Bici</option><option value="pie">🚶 Pie</option>
                      </select>
                      <select value={datosEdit.rol || "lavador"} onChange={e => setDatosEdit({ ...datosEdit, rol: e.target.value })} style={inputStyle}>
                        <option value="lavador">Lavador</option><option value="encargado">Encargado</option>
                      </select>
                      <select value={datosEdit.especial || ""} onChange={e => setDatosEdit({ ...datosEdit, especial: e.target.value })} style={inputStyle}>
                        <option value="">Sin atributo</option>
                        <option value="rapido">⚡ Rápido</option>
                        <option value="avisar_presencia">🔴 Avisar</option>
                        <option value="llamar_telefono">📞 Llamar</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ fontSize: 11 }}>Color:</label>
                      <input type="color" value={datosEdit.color || "#93c5fd"} onChange={e => setDatosEdit({ ...datosEdit, color: e.target.value })} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn ghost sm onClick={() => setEditandoId(null)} full>Cancelar</Btn>
                      <Btn color="primary" sm onClick={() => actualizarLavador(l)} full>💾 Guardar</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function ModalOperacion({ lavador, onRegistrar, onClose }) {
  const [monto, setMonto] = useState(0);
  const [motivo, setMotivo] = useState("Préstamo (lavador recibe)");
  const [motivoManual, setMotivoManual] = useState("");
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };

  return (
    <Modal titulo={`💰 Operación: ${lavador.nombre}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Tipo de Operación</label>
          <select value={motivo} onChange={e => setMotivo(e.target.value)} style={inputStyle}>
            {MOTIVOS_OPERACION.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {motivo === "Otro" && (
          <div>
            <label style={labelStyle}>Describí la operación</label>
            <input value={motivoManual} onChange={e => setMotivoManual(e.target.value)} style={inputStyle} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Monto ($)</label>
          <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
        </div>
        <div style={{ padding: "10px 14px", background: "#f1f5f9", borderRadius: 10, fontSize: 11, color: "#64748b" }}>
          💡 {motivo.includes("recibe") ? "Este monto se registrará como 'DEBE' y se descontará de futuras rendiciones." : "Este monto se registrará como 'PAGO' y reducirá su deuda actual."}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="warning" full onClick={() => onRegistrar(lavador, monto, motivo === "Otro" ? motivoManual : motivo)}>Registrar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalServicioEsp({ onAplicar, onClose }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [slots, setSlots] = useState(1);
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };

  return (
    <Modal titulo="⚡ Servicio Especial Personalizado" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelStyle}>Nombre del Servicio</label><input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Limpieza de vómito" style={inputStyle} /></div>
        <div><label style={labelStyle}>Precio ($)</label><input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej: 45000" style={inputStyle} /></div>
        <div><label style={labelStyle}>Slots de Tiempo (1 slot = 90 min)</label><input type="number" value={slots} onChange={e => setSlots(Number(e.target.value))} style={inputStyle} /></div>
        <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 11, color: "#92400e" }}>
          ⏱ {slots} slot{slots > 1 ? "s" : ""} = {slots * 90} minutos de trabajo
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="secondary" full onClick={() => { if (!nombre.trim() || !precio) return; onAplicar({ nombre, precio: Number(precio), slotsPersonalizados: slots, esServicioEsp: true }); }}>Aplicar servicio</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalCobro({ turno, onRegistrar, onClose }) {
  const [importeReal, setImporteReal] = useState(turno.precio || 0);
  const [motivo, setMotivo] = useState("");
  const [motivoManual, setMotivoManual] = useState("");
  const [destinoExcedente, setDestinoExcedente] = useState("deuda");
  const importeEsperado = turno.precio || 0;
  const dif = importeReal - importeEsperado;
  const esDeudaCliente = importeReal === 0;
  const hayExcedente = dif > 0;
  const hayFaltante = dif < 0 && !esDeudaCliente;
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };

  return (
    <Modal titulo="💰 Registrar Cobro" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f0f9ff", borderRadius: 12, border: "1px solid #bae6fd" }}>
          <span style={{ color: "#0369a1", fontWeight: 600 }}>Precio del servicio:</span>
          <strong style={{ color: "#0284c7", fontSize: 18 }}>{formatP(importeEsperado)}</strong>
        </div>
        <div>
          <label style={labelStyle}>Importe Real Cobrado ($)</label>
          <input type="number" value={importeReal} onChange={e => setImporteReal(Number(e.target.value))} style={{ ...inputStyle, fontSize: 20, fontWeight: 800 }} autoFocus />
        </div>
        {esDeudaCliente && (
          <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#991b1b", fontSize: 12, fontWeight: 600 }}>
            🔴 No pagó — se registra como deuda del cliente
          </div>
        )}
        {hayFaltante && (
          <>
            <div style={{ padding: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, color: "#92400e", fontSize: 12 }}>
              ⚠️ Pagó {formatP(Math.abs(dif))} menos. ¿Qué hacemos con la diferencia?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["deuda", "📝 Registrar como deuda"], ["perdonar", "🎁 Perdonar"]].map(([v, l]) => (
                <button key={v} onClick={() => setDestinoExcedente(v)} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: destinoExcedente === v ? "#dbeafe" : "#f9fafb",
                  border: `1.5px solid ${destinoExcedente === v ? "#3b82f6" : "#e5e7eb"}`,
                  color: destinoExcedente === v ? "#1e3a8a" : "#64748b", fontWeight: 600
                }}>{l}</button>
              ))}
            </div>
          </>
        )}
        {hayExcedente && (
          <>
            <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, color: "#166534", fontSize: 12 }}>
              💰 Pagó {formatP(dif)} de más. ¿A quién va ese dinero?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["deuda", "📝 Salda deuda anterior"], ["propina", "🎩 Propina lavador"], ["perdonar", "🎁 Cortesía"]].map(([v, l]) => (
                <button key={v} onClick={() => setDestinoExcedente(v)} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: destinoExcedente === v ? "#dbeafe" : "#f9fafb",
                  border: `1.5px solid ${destinoExcedente === v ? "#3b82f6" : "#e5e7eb"}`,
                  color: destinoExcedente === v ? "#1e3a8a" : "#64748b", fontWeight: 600
                }}>{l}</button>
              ))}
            </div>
            {destinoExcedente === "propina" && (
              <div style={{ padding: "8px 12px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, fontSize: 11, color: "#065f46" }}>
                ✓ La propina queda para el lavador — no se suma a la caja de Sofía
              </div>
            )}
          </>
        )}
        {(hayFaltante || esDeudaCliente) && (
          <div>
            <label style={labelStyle}>Motivo</label>
            <select value={motivo} onChange={e => setMotivo(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS_DESCUENTO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {motivo === "Otro" && (
              <input value={motivoManual} onChange={e => setMotivoManual(e.target.value)} placeholder="Describí el motivo" style={{ ...inputStyle, marginTop: 6 }} />
            )}
          </div>
        )}
        <div style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11, color: "#64748b" }}>
          💡 El lavador queda en estado <strong>"Cobrado (sin rendir)"</strong> hasta que entregue el dinero.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="warning" full onClick={() => onRegistrar(turno, importeReal, dif, motivo === "Otro" ? motivoManual : motivo, destinoExcedente)}>Registrar Cobro</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalRendicion({ turno, onRegistrar, onClose }) {
  const [loading, setLoading] = useState(false);
  const montoARendir = turno.montoPagado || turno.precio || 0;
  return (
    <Modal titulo="💸 Rendir Dinero" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ padding: "16px", background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#065f46", fontWeight: 600 }}>Lavador:</span>
            <strong style={{ color: "#064e3b" }}>{turno.lavadorNombre || turno.staffNombre}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#065f46", fontWeight: 600 }}>Monto a rendir:</span>
            <strong style={{ color: "#059669", fontSize: 20 }}>{formatP(montoARendir)}</strong>
          </div>
        </div>
        <div style={{ padding: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
          ⚠️ Confirmá que el lavador entregó el dinero en la base.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="success" full disabled={loading} onClick={() => { setLoading(true); onRegistrar(turno); }}>
            {loading ? "⟳ Procesando..." : "✅ Confirmar Rendición"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalRutaLavador({ lavador, turnos, clientes, onClose }) {
  const turnosLavador = turnos
    .filter(t => t.lavadorId === lavador.id)
    .sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const pendientes = turnosLavador.filter(t => {
    const [h, m] = t.hora.split(":").map(Number);
    return (h * 60 + m) >= minutosAhora && t.estado !== "terminado";
  });
  const terminados = turnosLavador.filter(t => t.estado === "terminado");
  return (
    <Modal titulo={`🗺️ Ruta de ${lavador.nombre}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "linear-gradient(135deg,#dbeafe,#eff6ff)", padding: 14, borderRadius: 12, border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>📍 Próximos clientes ({pendientes.length})</div>
          {pendientes.length === 0 ? (
            <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Sin turnos pendientes</div>
          ) : (
            pendientes.map((t, i) => {
              const cli = clientes.find(c => c.id === t.clienteId);
              return (
                <div key={t.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < pendientes.length - 1 ? "1px dashed #cbd5e1" : "none" }}>
                  <div style={{ fontWeight: 800, color: "#1e3a8a", fontSize: 13, minWidth: 50 }}>{t.hora}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{t.clienteNombre}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>📍 {cli?.direccion || "—"}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ background: "#f9fafb", padding: 14, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 8 }}>✅ Ya atendidos hoy ({terminados.length})</div>
          {terminados.length === 0 ? (
            <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Aún no atendió clientes</div>
          ) : (
            terminados.map((t, i) => (
              <div key={t.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < terminados.length - 1 ? "1px dashed #e5e7eb" : "none" }}>
                <div style={{ fontSize: 11, color: "#6b7280", minWidth: 50 }}>{t.hora}</div>
                <div style={{ fontSize: 12, color: "#334155" }}>{t.clienteNombre}</div>
              </div>
            ))
          )}
        </div>
        <Btn ghost full onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

function ModalLluviaAvanzado({ turnos, staff, asistencias, onClose, onAplicar, clientes }) {
  const turnosPendientes = turnos.filter(t => t.estado === "lluvia");
  const lavConTurnos = staff.filter(s => asistencias[s.id]);
  const [estadoLav, setEstadoLav] = useState(
    Object.fromEntries(lavConTurnos.map(s => [s.id, "queda"]))
  );
  const [turnosCancelar, setTurnosCancelar] = useState({});
  const toggleTurnoCancelar = (lavId, turnoId) => {
    setTurnosCancelar(prev => ({
      ...prev,
      [lavId]: prev[lavId]?.includes(turnoId)
        ? prev[lavId].filter(x => x !== turnoId)
        : [...(prev[lavId] || []), turnoId]
    }));
  };
  const lavQuedan = lavConTurnos.filter(s => estadoLav[s.id] === "queda");
  const aplicar = () => {
    onAplicar(estadoLav, turnosCancelar, lavQuedan);
    onClose();
  };
  return (
    <Modal titulo="🌧️ Reorganizar tras la lluvia" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          Elegí qué hace cada lavador. Los turnos se reorganizan según tu selección.
        </div>
        {lavConTurnos.map(s => {
          const turnosDelLav = turnosPendientes.filter(t => t.lavadorId === s.id);
          return (
            <div key={s.id} style={{ padding: "12px 14px", background: "#f9fafb", border: `1.5px solid ${s.color}66`, borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{s.nombre.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{s.nombre}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{turnosDelLav.length} turno{turnosDelLav.length !== 1 ? "s" : ""} pendiente{turnosDelLav.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {[
                  ["queda", "✅ Se queda"],
                  ["liberar_reasignar", "🔄 Se va — reasignar"],
                  ["ausente", "🚪 Se va — cancelar"],
                ].map(([v, l]) => (
                  <button key={v} onClick={() => setEstadoLav(prev => ({ ...prev, [s.id]: v }))}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                      background: estadoLav[s.id] === v ? "#dbeafe" : "#fff",
                      border: `1.5px solid ${estadoLav[s.id] === v ? "#3b82f6" : "#e5e7eb"}`,
                      color: estadoLav[s.id] === v ? "#1e3a8a" : "#6b7280",
                      fontWeight: estadoLav[s.id] === v ? 700 : 500
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              {estadoLav[s.id] === "liberar_reasignar" && turnosDelLav.length > 0 && (
                <div style={{ padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#92400e", marginBottom: 6, fontWeight: 700 }}>
                    ¿Cuáles cancelar? (los no tildados se reasignan)
                  </div>
                  {turnosDelLav.map(t => {
                    const cli = clientes.find(c => c.id === t.clienteId);
                    return (
                      <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer" }}>
                        <input type="checkbox"
                          checked={turnosCancelar[s.id]?.includes(t.id) || false}
                          onChange={() => toggleTurnoCancelar(s.id, t.id)} />
                        <span style={{ fontSize: 11, color: "#1e293b" }}>{t.hora} - {t.clienteNombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {lavQuedan.length === 0 && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#991b1b", fontSize: 12, fontWeight: 600 }}>
            ⚠️ No quedan lavadores. Todos los turnos serán cancelados.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={aplicar}>☀️ Reanudar y reorganizar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalTurnoCreado({ turno, cliente, lavador, onClose, mostrarToast }) {
  const [copiado, setCopiado] = useState(false);
  const cantAutos = turno.cantidadAutos || 1;
  const textoTurno = `🚗 *NUEVO TURNO - SOFÍA LAVADOS*

👤 *Cliente:* ${cliente?.nombre || "Desconocido"}
🆔 *Código:* ${cliente?.codigo || "N/A"}
📞 *Teléfono:* ${cliente?.telefono || "Sin registrar"}
📍 *Dirección:* ${cliente?.direccion || "Sin dirección"}
🏘️ *Barrio:* ${cliente?.barrio || "N/A"}

🕐 *Horario:* ${turno.hora} hs
🚙 *Vehículo:* ${turno.auto}${cantAutos > 1 ? ` (×${cantAutos} autos)` : ""}
💵 *Precio:* ${formatP(turno.precio)}${turno.esFZ ? " (⬡ FZ)" : ""}
💳 *Pago:* ${turno.metodo === "mp" ? "Mercado Pago" : "Efectivo"}
👷 *Lavador:* ${lavador?.nombre || "Sin asignar"}
${turno.nota ? `📝 *Nota:* ${turno.nota}` : ""}
${cliente?.nota ? `⚠️ *Nota del cliente:* ${cliente.nota}` : ""}
${cliente?.deuda > 0 ? `🔴 *ATENCIÓN: Cliente debe ${formatP(cliente.deuda)}*` : ""}

📅 Fecha: ${fechaAR(hoy())}`;
  const copiarAlPortapapeles = async () => {
    try { await navigator.clipboard.writeText(textoTurno); setCopiado(true); mostrarToast("📋 Copiado", "ok"); setTimeout(() => setCopiado(false), 2000); }
    catch (err) { mostrarToast("Error al copiar", "error"); }
  };
  const telefonoLavador = lavador?.telefono ? lavador.telefono.replace(/\D/g, "") : "";
  const whatsappLink = telefonoLavador ? `https://wa.me/549${telefonoLavador}?text=${encodeURIComponent(textoTurno)}` : `https://wa.me/?text=${encodeURIComponent(textoTurno)}`;
  return (
    <Modal titulo="✅ Turno Creado Exitosamente" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0", borderRadius: 14, padding: 16 }}>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Inter',system-ui,sans-serif", fontSize: 12, color: "#1e293b", margin: 0, lineHeight: 1.6, background: "#ffffff", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>{textoTurno}</pre>
        </div>
        {lavador && lavador.especial === "avisar_presencia" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, fontSize: 12, color: "#991b1b", fontWeight: 600 }}>
            🔴 Hernán — Avisar en persona (sin celular)
          </div>
        )}
        {lavador && lavador.especial === "llamar_telefono" && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 12, fontSize: 12, color: "#9a3412", fontWeight: 600 }}>
            📞 Gastón — Llamar por teléfono
          </div>
        )}
        {lavador && !lavador.telefono && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, fontSize: 12, color: "#991b1b", fontWeight: 600 }}>
            ⚠️ {lavador.nombre} no tiene teléfono registrado. Asignale uno en Gestión de Lavadores.
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn color="primary" full onClick={copiarAlPortapapeles}>{copiado ? "✓ Copiado" : "📋 Copiar"}</Btn>
          <Btn color="success" full onClick={() => window.open(whatsappLink, "_blank")}>💬 WhatsApp</Btn>
        </div>
        {cliente?.telefono && (
          <Btn ghost full onClick={() => window.open(`tel:${cliente.telefono}`, "_self")}>📞 Llamar al cliente</Btn>
        )}
        <Btn ghost full onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

function ModalDetalleTurno({ turno, clientes, staff, onClose, onCambiarEstado, onCerrarTurno, onCobrar, onRendir, onReasignar, modoOculto }) {
  const [modo, setModo] = useState("detalle");
  const [nuevoLavador, setNuevoLavador] = useState(turno.lavadorId || "");
  const [nuevaHora, setNuevaHora] = useState(turno.hora || "");
  const cliente = clientes.find(c => c.id === turno.clienteId);
  const lavador = staff.find(s => s.id === turno.lavadorId);
  const cantAutos = turno.cantidadAutos || 1;
  const staffActivos = staff.filter(s => s.rol !== "encargado");
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  const confirmarReasignacion = () => {
    onReasignar(turno, nuevoLavador, nuevaHora);
    onClose();
  };
  return (
    <Modal titulo={modo === "detalle" ? `🔍 Turno: ${turno.hora} hs` : "🔄 Reasignar Turno"} onClose={onClose}>
      {modo === "detalle" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#f9fafb", padding: 14, borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>{turno.clienteNombre}</div>
            <div style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", marginBottom: 8 }}>{turno.clienteCodigo}</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
              <div>📍 {cliente?.direccion || "—"}</div>
              <div>🚙 {turno.auto} {cantAutos > 1 && `(×${cantAutos})`}</div>
              <div>👷 {lavador?.nombre || "Sin asignar"}</div>
              <div>💵 {formatP(turno.precio)} {turno.esFZ && "(⬡ FZ)"}</div>
              <div>💳 {turno.metodo === "mp" ? "Mercado Pago" : "Efectivo"}</div>
              <div>📊 Estado: {turno.estadoPago || turno.estado || "💰 Pendiente"}</div>
            </div>
            {turno.nota && <div style={{ marginTop: 8, padding: "6px 10px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e", fontWeight: 600 }}>📝 {turno.nota}</div>}
            {cliente?.deuda > 0 && <div style={{ marginTop: 8, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 11, color: "#991b1b", fontWeight: 600 }}>🔴 Cliente debe: {formatP(cliente.deuda)}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {modoOculto && (!turno.estadoPago || turno.estadoPago === "💰 Pendiente" || turno.estadoPago === "🔴 Cliente debe") && onCobrar && (
              <Btn color="warning" full onClick={() => onCobrar(turno)}>💰 Cobrar</Btn>
            )}
            {modoOculto && turno.estadoPago === "💵 Cobrado (sin rendir)" && onRendir && (
              <Btn color="success" full onClick={() => onRendir(turno)}>✅ Rendir</Btn>
            )}
            {turno.estado === "pendiente" && (
              <Btn color="primary" full onClick={() => { onCambiarEstado(turno.id, "en_progreso"); onClose(); }}>🚗 Marcar Llegó</Btn>
            )}
            {turno.estado === "en_progreso" && !turno.estadoPago && (
              <Btn color="success" full onClick={() => { onCerrarTurno(turno); onClose(); }}>✅ Marcar Terminado</Btn>
            )}
            <Btn color="secondary" full onClick={() => setModo("reasignar")}>🔄 Reasignar turno</Btn>
            {cliente?.telefono && (
              <Btn ghost full onClick={() => window.open(`tel:${cliente.telefono}`, "_self")}>📞 Llamar al cliente</Btn>
            )}
            {turno.estado !== "terminado" && turno.estado !== "cancelado" && (
              <Btn ghost full danger onClick={() => {
                if (window.confirm("¿Cancelar turno?")) {
                  onCambiarEstado(turno.id, "cancelado");
                  onClose();
                }
              }}>✕ Cancelar Turno</Btn>
            )}
          </div>
          <Btn ghost full onClick={onClose}>Cerrar</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Cambiá el lavador y/o el horario del turno.</div>
          <div>
            <label style={labelStyle}>Nuevo Lavador</label>
            <select value={nuevoLavador} onChange={e => setNuevoLavador(e.target.value)} style={inputStyle}>
              <option value="">-- Sin asignar --</option>
              {staffActivos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(s => (
                <option key={s.id} value={s.id}>{s.nombre} ({s.transporte})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nuevo Horario</label>
            <select value={nuevaHora} onChange={e => setNuevaHora(e.target.value)} style={inputStyle}>
              {FRANJAS_BASE.map(h => <option key={h} value={h}>{h} hs</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn ghost onClick={() => setModo("detalle")} full>← Volver</Btn>
            <Btn color="primary" full onClick={confirmarReasignacion}>Confirmar Reasignación</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ModalConfigCompleta({ config, onGuardar, onClose, mostrarToast, modoOculto }) {
  const [precios, setPrecios] = useState(config.precios || TAMANOS_DEFAULT);
  const [fzPct, setFzPct] = useState(config.fzPct || 20);
  const [distancias, setDistancias] = useState(config.distancias || DISTANCIAS_DEFAULT);
  const [modoPruebaLocal, setModoPruebaLocal] = useState(config.modoPrueba || false);
  const [backups, setBackups] = useState([]);
  const [cargandoBackups, setCargandoBackups] = useState(false);
  const guardar = () => {
    onGuardar({ precios, fzPct, distancias, modoPrueba: modoPruebaLocal });
    mostrarToast("Configuración guardada", "ok");
    onClose();
  };
  const cargarBackups = async () => {
    setCargandoBackups(true);
    try {
      const snap = await getDocs(query(collection(db, "backups"), where("fecha", "==", hoy())));
      setBackups(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    } catch (err) { console.error(err); }
    setCargandoBackups(false);
  };
  const restaurarBackup = async (backup) => {
    if (!window.confirm(`¿Restaurar backup "${backup.nombre}"? Esto sobrescribirá la configuración actual.`)) return;
    try {
      const data = JSON.parse(backup.dataJson);
      // Restaurar configuración (precios, fzPct, distancias)
      if (data.precios || data.fzPct !== undefined || data.distancias) {
        await fsSave("config", "general", data);
        mostrarToast(`✅ Backup "${backup.nombre}" restaurado`, "ok");
      } else {
        mostrarToast("⚠️ Este backup no contiene configuración restaurable", "warn");
      }
    } catch (err) { mostrarToast("Error al restaurar", "error"); }
  };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  return (
    <Modal titulo="⚙️ Configuración General" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>💰 Precios por Tamaño</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {precios.map((p, i) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 8 }}>
                <input value={p.label} onChange={e => {
                  const nuevos = [...precios];
                  nuevos[i].label = e.target.value;
                  setPrecios(nuevos);
                }} placeholder="Nombre" style={inputStyle} />
                <input type="number" value={p.precio} onChange={e => {
                  const nuevos = [...precios];
                  nuevos[i].precio = Number(e.target.value);
                  setPrecios(nuevos);
                }} placeholder="Precio" style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>⬡ Recargo Fuera de Zona</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" value={fzPct} onChange={e => setFzPct(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 120 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>% de recargo automático</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>📏 Distancias por Transporte (cuadras)</div>
          {["moto", "bici", "pie"].map(trans => (
            <div key={trans} style={{ marginBottom: 12, padding: 10, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                {trans === "moto" ? "🏍️ Moto" : trans === "bici" ? "🚲 Bici" : "🚶 A pie"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Cerca</label>
                  <input type="number" value={distancias[trans]?.cerca || 0}
                    onChange={e => setDistancias({ ...distancias, [trans]: { ...distancias[trans], cerca: Number(e.target.value) } })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lejos</label>
                  <input type="number" value={distancias[trans]?.lejos || 0}
                    onChange={e => setDistancias({ ...distancias, [trans]: { ...distancias[trans], lejos: Number(e.target.value) } })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>FZ</label>
                  <input type="number" value={distancias[trans]?.fz || 0}
                    onChange={e => setDistancias({ ...distancias, [trans]: { ...distancias[trans], fz: Number(e.target.value) } })}
                    style={inputStyle} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, background: "#eff6ff", borderRadius: 12, border: "1.5px solid #bfdbfe" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>☁️ Backup en la Nube</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn sm color="primary" onClick={() => guardarBackupNube(`Config-${hoy()}`, { precios, fzPct, distancias }, mostrarToast)}>Guardar Config Actual</Btn>
            <Btn sm ghost onClick={cargarBackups}>Ver Backups</Btn>
          </div>
          {backups.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 150, overflowY: "auto" }}>
              {backups.map(b => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #dbeafe" }}>
                  <span style={{ fontSize: 11, color: "#1e3a8a" }}>{b.nombre} ({fechaAR(b.fecha)})</span>
                  <Btn sm ghost onClick={() => restaurarBackup(b)}>Restaurar</Btn>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: 12, background: "#fffbeb", borderRadius: 12, border: "1.5px solid #fde68a" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={modoPruebaLocal} onChange={e => setModoPruebaLocal(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#7c3aed" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>🧪 Modo Prueba (Datos aislados)</span>
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>💾 Guardar Configuración</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ModalNuevoTurno({ onClose, clientes, staff, turnos, asistencias, COL_TURNOS, COL_CLIENTES, mostrarToast, clientePreseleccionado, onClienteCreated, onTurnoCreado, codigosExistentes, config, celdaPreseleccionada }) {
  const [clienteId, setClienteId] = useState(clientePreseleccionado?.id || "");
  const [hora, setHora] = useState(celdaPreseleccionada?.hora || franjasValidas()[0] || FRANJAS_BASE[0]);
  const [tamaño, setTamaño] = useState(TAMANOS_DEFAULT[1]);
  const [cantidadAutos, setCantidadAutos] = useState(clientePreseleccionado?.autosHabituales || 1);
  const [lavadorId, setLavadorId] = useState(celdaPreseleccionada?.lavadorId || "");
  const [nota, setNota] = useState("");
  const [manualFZ, setManualFZ] = useState(false);
  const [metodo, setMetodo] = useState("efectivo");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [servicioEsp, setServicioEsp] = useState(null);
  const [mostrarServicioEsp, setMostrarServicioEsp] = useState(false);
  const [mostrarSemafaro, setMostrarSemafaro] = useState(false);
  const [coordsCliente, setCoordsCliente] = useState(null);
  const [tiposMixtos, setTiposMixtos] = useState(Array(5).fill(TAMANOS_DEFAULT[1]));
  const clienteSel = clientes.find(c => c.id === clienteId);
  const presentes = staff.filter(s => asistencias[s.id]);
  const precioUnitario = servicioEsp ? servicioEsp.precio : tamaño.precio;
  const cantFinal = servicioEsp ? servicioEsp.slotsPersonalizados : cantidadAutos;
  let precioBaseTotal = 0;
  if (servicioEsp) {
    precioBaseTotal = servicioEsp.precio;
  } else if (cantidadAutos > 1) {
    for (let i = 0; i < cantidadAutos; i++) precioBaseTotal += tiposMixtos[i]?.precio || TAMANOS_DEFAULT[1].precio;
  } else {
    precioBaseTotal = precioUnitario;
  }
  const radioFZ = (trans) => {
    const dist = config?.distancias?.[trans] || DISTANCIAS_DEFAULT[trans] || DISTANCIAS_DEFAULT.moto;
    return dist.fz;
  };
  const lavadorSel = staff.find(s => s.id === lavadorId);
  const transActivo = lavadorSel?.transporte || "moto";
  const radio = radioFZ(transActivo);
  let cuadras = 0;
  let esFZAuto = false;
  if (coordsCliente && coordsCliente.encontrado) {
    cuadras = kmToCuadras(distKm(BASE_LAT, BASE_LNG, coordsCliente.lat, coordsCliente.lng));
    esFZAuto = cuadras > radio;
  }
  const esFZ = manualFZ || esFZAuto;
  const fzPct = config?.fzPct || 20;
  const precioFinal = esFZ ? Math.round(precioBaseTotal * (1 + fzPct / 100)) : precioBaseTotal;
  let tiempoBase = 0;
  if (servicioEsp) {
    tiempoBase = servicioEsp.slotsPersonalizados * FRANJA_DURACION;
  } else if (cantidadAutos > 1) {
    for (let i = 0; i < cantidadAutos; i++) tiempoBase += TIEMPOS_LAVADO_BASE[tiposMixtos[i]?.label] || 45;
  } else {
    tiempoBase = TIEMPOS_LAVADO_BASE[tamaño.label] || 45;
  }
  const formatoTiempo = tiempoBase >= 60
    ? `${Math.floor(tiempoBase / 60)}h ${tiempoBase % 60 > 0 ? `${tiempoBase % 60}min` : ""}`
    : `${tiempoBase} min`;
  const slotsOcupadosCount = servicioEsp ? servicioEsp.slotsPersonalizados : Math.ceil(tiempoBase / FRANJA_DURACION);
  useEffect(() => {
    if (clientePreseleccionado?.id) {
      setClienteId(clientePreseleccionado.id);
      if (clientePreseleccionado.autosHabituales) setCantidadAutos(clientePreseleccionado.autosHabituales);
      if (clientePreseleccionado.nota) setNota(`📋 ${clientePreseleccionado.nota}`);
    }
  }, [clientePreseleccionado]);
  useEffect(() => {
    if (clienteSel?.direccion) {
      geocodificar(clienteSel.direccion).then(coords => setCoordsCliente(coords));
    } else {
      setCoordsCliente(null);
    }
  }, [clienteId, clienteSel?.direccion]);
  const handleNewClientSuccess = (newClient) => {
    onClienteCreated(newClient);
    setClienteId(newClient.id);
    if (newClient.nota) setNota(`📋 ${newClient.nota}`);
    mostrarToast(`Cliente ${newClient.nombre} listo`, "ok");
  };
  const manejarSugerir = () => {
    if (!clienteSel?.direccion && !coordsCliente) return mostrarToast("Falta dirección del cliente", "warn");
    if (presentes.length === 0) return mostrarToast("No hay lavadores presentes", "warn");
    const rankings = presentes.map(s => {
      const trans = s.transporte;
      const radioS = radioFZ(trans);
      const dist = coordsCliente?.encontrado ? kmToCuadras(distKm(BASE_LAT, BASE_LNG, coordsCliente.lat, coordsCliente.lng)) : 0;
      let score = 0;
      const turnosHoy = turnos.filter(t => t.lavadorId === s.id).length;
      if (turnosHoy === 0) score += 500;
      if (dist <= radioS) score += 200;
      score -= turnosHoy * 30;
      const horasLibres = FRANJAS_BASE.filter(h => {
        const ocupado = turnos.some(t => {
          if (t.estado === "cancelado") return false;
          return t.lavadorId === s.id && t.horasOcupadas?.includes(h);
        });
        const [hr, mn] = h.split(":").map(Number);
        const pasada = hr * 60 + mn < (new Date().getHours() * 60 + new Date().getMinutes());
        return !ocupado && !pasada;
      });
      return { s, score, dist, hora: horasLibres[0], turnosHoy };
    }).filter(r => r.hora).sort((a, b) => b.score - a.score);
    if (rankings.length === 0) return mostrarToast("No hay horarios disponibles", "warn");
    const mejor = rankings[0];
    setLavadorId(mejor.s.id);
    setHora(mejor.hora);
    let razon = "más cercano";
    if (mejor.turnosHoy === 0) razon = "INACTIVO";
    else if (mejor.dist > radio) razon = "disponible (lejos)";
    mostrarToast(`🎯 Sugerido: ${mejor.s.nombre} (${razon})`, "ok");
  };
  const guardar = async () => {
    if (!clienteId) return mostrarToast("Seleccioná un cliente", "warn");
    try {
      // FIX F2: para multi-auto con tipos mixtos, calcular duración real y usar slotsOcupadosPorDuracion
      let horasOcupadas;
      if (!servicioEsp && cantidadAutos > 1) {
        let durMixta = 0;
        for (let i = 0; i < cantidadAutos; i++) durMixta += TIEMPOS_LAVADO_BASE[tiposMixtos[i]?.label] || 45;
        horasOcupadas = slotsOcupadosPorDuracion(hora, durMixta);
      } else {
        horasOcupadas = slotsOcupados(hora, cantFinal, servicioEsp ? "Especial" : tamaño.label);
      }
      const turnoData = {
        fecha: hoy(), hora, clienteId,
        clienteNombre: clienteSel?.nombre || "Desconocido",
        clienteCodigo: clienteSel?.codigo || "",
        auto: servicioEsp ? servicioEsp.nombre : (cantidadAutos > 1 ? `${cantidadAutos} Autos Mixtos` : tamaño.label),
        precioUnitario: precioUnitario,
        cantidadAutos: cantFinal,
        precio: precioFinal,
        lavadorId, estado: "pendiente", nota, metodo,
        esFZ, cuadras: Math.round(cuadras),
        horasOcupadas,
        servicioEsp: !!servicioEsp,
        tiposMixtos: cantidadAutos > 1 ? tiposMixtos.slice(0, cantidadAutos) : null,
        creadoEn: serverTimestamp()
      };
      const turnoRef = await addDoc(collection(db, COL_TURNOS), turnoData);
      const turnoCreado = { id: turnoRef.id, ...turnoData };
      mostrarToast(`Turno creado${esFZ ? " (⬡ FZ)" : ""}`, "ok");
      const lavador = staff.find(s => s.id === lavadorId);
      onTurnoCreado(turnoCreado, clienteSel, lavador);
      onClose();
    } catch (err) { mostrarToast("Error al crear turno", "error"); }
  };
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "11px 14px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
  const semaforoData = useMemo(() => {
    if (!mostrarSemafaro || !clienteSel?.direccion) return null;
    return presentes.map(s => {
      const trans = s.transporte;
      const radioS = radioFZ(trans);
      const dist = coordsCliente?.encontrado ? kmToCuadras(distKm(BASE_LAT, BASE_LNG, coordsCliente.lat, coordsCliente.lng)) : 0;
      let geo = "verde";
      if (dist <= radioS) geo = "verde";
      else if (dist <= radioS * 1.5) geo = "amarillo";
      else geo = "fz";
      const horariosLibres = FRANJAS_BASE.filter(h => {
        const ocupado = turnos.some(t => {
          if (t.estado === "cancelado") return false;
          return t.lavadorId === s.id && t.horasOcupadas?.includes(h);
        });
        return !ocupado;
      });
      return { ...s, geo, dist: Math.round(dist), horariosLibres };
    });
  }, [mostrarSemafaro, clienteSel, coordsCliente, presentes, turnos]);
  const opcionesLavadores = useMemo(() => {
    return presentes.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(s => {
      const ocupado = turnos.some(t => {
        if (t.estado === "cancelado") return false;
        // FIX F3: fallback para turnos viejos sin horasOcupadas
        const horas = t.horasOcupadas?.length ? t.horasOcupadas : [t.hora];
        return t.lavadorId === s.id && horas.includes(hora);
      });
      return { ...s, ocupado };
    });
  }, [presentes, turnos, hora]);
  return (
    <Modal titulo="➕ Nuevo Turno" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Cliente</label>
          <BuscadorClientes clientes={clientes} value={clienteId} onChange={(id) => setClienteId(id)}
            onCreateNew={(nombre) => { setNewClientName(nombre); setShowNewClient(true); }} />
        </div>
        {clienteSel ? (
          <div style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", padding: 16, borderRadius: 16, border: "2px solid #93c5fd" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1e3a8a" }}>{clienteSel.nombre}</div>
            <div style={{ fontSize: 12, color: "#7c3aed", fontFamily: "monospace", marginTop: 4, fontWeight: 800, background: "#ffffff", display: "inline-block", padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd6fe" }}>{clienteSel.codigo}</div>
            <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.7, marginTop: 8 }}>
              <div>📍 <strong>{clienteSel.direccion || "Sin dirección"}</strong> • {clienteSel.barrio}</div>
              <div>{mostrarTelefono(clienteSel)}</div>
            </div>
            {clienteSel.deuda > 0 && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#991b1b" }}>
                🔴 ATENCIÓN: Este cliente debe {formatP(clienteSel.deuda)}
              </div>
            )}
            {esFZAuto && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#92400e" }}>
                ⬡ FUERA DE ZONA - {Math.round(cuadras)} cuadras (radio: {radio}) - Se aplica +{fzPct}%
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#f9fafb", padding: 16, borderRadius: 14, border: "1.5px dashed #cbd5e1", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Buscá o creá un cliente</div>
        )}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={labelStyle}>Horario</label>
            <Btn sm color="secondary" onClick={manejarSugerir} disabled={!clienteSel}>🎯 Sugerir Lavador</Btn>
          </div>
          <select value={hora} onChange={e => setHora(e.target.value)} style={inputStyle}>
            {FRANJAS_BASE.map(h => {
              const ahora = new Date();
              const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
              const [hr, mn] = h.split(":").map(Number);
              const pasada = hr * 60 + mn < minutosAhora;
              return <option key={h} value={h} disabled={pasada}>{h} hs {pasada ? "(pasada)" : ""}</option>;
            })}
          </select>
        </div>
        {!servicioEsp && (
          <div>
            <label style={labelStyle}>Vehículo Base</label>
            <div style={{ display: "flex", gap: 8 }}>
              {TAMANOS_DEFAULT.map(t => (
                <button key={t.id} onClick={() => setTamaño(t)} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: tamaño.id === t.id ? "#dbeafe" : "#f9fafb",
                  border: tamaño.id === t.id ? "1.5px solid #93c5fd" : "1.5px solid #e5e7eb",
                  color: tamaño.id === t.id ? "#1e3a8a" : "#6b7280"
                }}>
                  {t.label}<br /><span style={{ fontSize: 11, opacity: .8 }}>{formatP(t.precio)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label style={labelStyle}>Cantidad de Autos</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setCantidadAutos(n)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer",
                background: cantidadAutos === n ? "#dbeafe" : "#f9fafb",
                border: cantidadAutos === n ? "2px solid #3b82f6" : "1.5px solid #e5e7eb",
                color: cantidadAutos === n ? "#1e3a8a" : "#6b7280"
              }}>
                {n}{n === 5 ? "+" : ""}
              </button>
            ))}
          </div>
          {cantidadAutos > 1 && !servicioEsp && (
            <div style={{ marginTop: 10, padding: 12, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>TIPO POR AUTO INDIVIDUAL</div>
              {Array.from({ length: cantidadAutos }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 50 }}>Auto {i + 1}:</span>
                  <select value={tiposMixtos[i]?.id || "mediano"} onChange={e => {
                    const nuevos = [...tiposMixtos];
                    nuevos[i] = TAMANOS_DEFAULT.find(t => t.id === e.target.value);
                    setTiposMixtos(nuevos);
                  }} style={{ ...inputStyle, padding: "6px 10px" }}>
                    {TAMANOS_DEFAULT.map(t => <option key={t.id} value={t.id}>{t.label} (${t.precio})</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Precio Base Calculado</label>
            <div style={{ ...inputStyle, fontWeight: 700, background: "#f0f9ff" }}>{formatP(precioBaseTotal)}</div>
          </div>
          <Btn sm color="secondary" onClick={() => setMostrarServicioEsp(true)} disabled={!!servicioEsp} style={{ marginBottom: 1 }}>
            {servicioEsp ? `⚡ ${servicioEsp.nombre}` : "⚡ Especial"}
          </Btn>
          <Btn sm color="secondary" onClick={() => setMostrarSemafaro(!mostrarSemafaro)} style={{ marginBottom: 1 }}>
            {mostrarSemafaro ? "🔽 Ocultar Semáforo" : "🚦 Ver Semáforo"}
          </Btn>
        </div>
        {mostrarServicioEsp && (
          <ModalServicioEsp
            onAplicar={(s) => { setServicioEsp(s); setMostrarServicioEsp(false); }}
            onClose={() => setMostrarServicioEsp(false)}
          />
        )}
        {slotsOcupadosCount > 1 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>
            📅 Ocupa {slotsOcupadosCount} franjas ({formatoTiempo})
          </div>
        )}
        <div style={{
          marginTop: 8, padding: "10px 14px", borderRadius: 12,
          background: esFZ ? "linear-gradient(135deg,#fef3c7,#fffbeb)" : "#f9fafb",
          border: esFZ ? "1.5px solid #fcd34d" : "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 13, fontWeight: 700
        }}>
          <span style={{ color: esFZ ? "#92400e" : "#1e3a8a" }}>
            💰 Total Final: <strong>{formatP(precioFinal)}</strong>
            {esFZ && <span style={{ fontSize: 11, fontWeight: 600 }}> (⬡ FZ +{fzPct}%)</span>}
          </span>
          <span style={{ color: "#059669" }}>⏱️ {formatoTiempo}</span>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, cursor: "pointer" }}>
          <input type="checkbox" checked={manualFZ} onChange={e => setManualFZ(e.target.checked)} />
          <span style={{ color: "#6b7280" }}>Forzar FZ manualmente</span>
        </label>
        {mostrarSemafaro && semaforoData && (
          <div style={{ padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>🚦 DISPONIBILIDAD POR LAVADOR</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {semaforoData.map(s => (
                <div key={s.id} onClick={() => { setLavadorId(s.id); if (s.horariosLibres.length > 0) setHora(s.horariosLibres[0]); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                    background: lavadorId === s.id ? "#dbeafe" : "#ffffff",
                    border: `1.5px solid ${lavadorId === s.id ? "#3b82f6" : s.geo === "verde" ? "#86efac" : s.geo === "amarillo" ? "#fcd34d" : "#c4b5fd"}`
                  }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.geo === "verde" ? "#22c55e" : s.geo === "amarillo" ? "#eab308" : "#a855f7" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.nombre}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{s.dist} cuadras • {s.horariosLibres.length} horarios libres</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{s.transporte}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} /> Libre/Cerca</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#eab308" }} /> Lejos</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7" }} /> FZ</span>
            </div>
          </div>
        )}
        <div>
          <label style={labelStyle}>Lavador Asignado</label>
          <select value={lavadorId} onChange={e => setLavadorId(e.target.value)} style={inputStyle}>
            <option value="">-- Sin asignar --</option>
            {opcionesLavadores.map(s => (
              <option key={s.id} value={s.id} disabled={s.ocupado} style={{ color: s.ocupado ? "#d1d5db" : "#1e293b" }}>
                {s.nombre} ({s.transporte}) {s.ocupado ? "(OCUPADO)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Método de Pago</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setMetodo("efectivo")} style={{
              flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: metodo === "efectivo" ? "#d1fae5" : "#f9fafb",
              border: `1.5px solid ${metodo === "efectivo" ? "#34d399" : "#e5e7eb"}`,
              color: metodo === "efectivo" ? "#065f46" : "#6b7280"
            }}>💵 Efectivo</button>
            <button onClick={() => setMetodo("mp")} style={{
              flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: metodo === "mp" ? "#dbeafe" : "#f9fafb",
              border: `1.5px solid ${metodo === "mp" ? "#3b82f6" : "#e5e7eb"}`,
              color: metodo === "mp" ? "#1e3a8a" : "#6b7280"
            }}>📱 Mercado Pago</button>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Notas</label>
          <input value={nota} onChange={e => setNota(e.target.value)} onFocus={() => setMostrarNotas(true)} placeholder="Observaciones..." style={inputStyle} />
          {mostrarNotas && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {NOTAS_PREDEFINIDAS.map(n => (
                <button key={n} onClick={() => setNota(prev => prev.includes(n) ? prev.replace(n + ", ", "").replace(n, "") : (prev ? prev + ", " + n : n))}
                  style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                    background: nota.includes(n) ? "#dbeafe" : "#f1f5f9",
                    border: `1px solid ${nota.includes(n) ? "#93c5fd" : "#e2e8f0"}`,
                    color: nota.includes(n) ? "#1e3a8a" : "#64748b"
                  }}>
                  {n}
                </button>
              ))}
            </div>
          )}
          {nota && ["detallista", "complicado", "insoportable", "ojo", "no usar revividor", "cuidado", "problematico"].some(k => nota.toLowerCase().includes(k)) && (
            <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef3c7", border: "2px solid #fcd34d", borderRadius: 10, color: "#92400e", fontWeight: 800, fontSize: 12, textAlign: "center" }}>
              ⚠️ ATENCIÓN: Cliente con requerimientos especiales. Informar al lavador.
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>✓ Crear Turno</Btn>
        </div>
      </div>
      {showNewClient && (
        <ModalNuevoCliente nombreInicial={newClientName} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} codigosExistentes={codigosExistentes} onClienteCreated={handleNewClientSuccess} onClose={() => setShowNewClient(false)} />
      )}
    </Modal>
  );
}

function TabLavadores({ staff, turnos, hoyStr, COL_ASISTENCIAS, COL_STAFF, asistencias, setAsistencias, mostrarToast, onVerRuta, onGestionar, onOperacion, registros, prestamos, modoOculto }) {
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>👷 Lavadores ({staff.length})</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn sm color="tertiary" onClick={() => {
            const datos = staff.map(s => ({
              nombre: s.nombre, transporte: s.transporte,
              presente: asistencias[s.id] ? "✅" : "❌",
              turnos: turnos.filter(t => t.lavadorId === s.id).length
            }));
            exportCSV(datos, ["nombre", "transporte", "presente", "turnos"], `lavadores-${hoyStr}`);
          }}>📥 Exportar CSV</Btn>
          <Btn sm color="secondary" onClick={onGestionar}>⚙️ Gestionar</Btn>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        💡 Marcá quién vino hoy ANTES de crear turnos. Hacé clic en un lavador para ver su ruta{modoOculto ? " o registrar operaciones." : "."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
        {staff.map(s => {
          const presente = asistencias[s.id];
          const turnosHoy = turnos.filter(t => t.lavadorId === s.id).length;
          const tieneTurnoActivo = turnos.some(t => t.lavadorId === s.id && (t.estado === "pendiente" || t.estado === "en_progreso"));
          let estadoColor = "#ffffff";
          let estadoLabel = "AUSENTE";
          if (presente) {
            if (tieneTurnoActivo) { estadoColor = "#fef3c7"; estadoLabel = "OCUPADO"; }
            else { estadoColor = "#d1fae5"; estadoLabel = "DISPONIBLE"; }
          }
          const saldoLav = modoOculto ? (prestamos[s.id] || 0) + registros.filter(r => r.staffNombre === s.nombre).reduce((acc, r) => acc + (r.diferencia || 0), 0) : 0;
          return (
            <div key={s.id} style={{
              background: presente ? "linear-gradient(135deg,#ecfdf5,#f0fdf4)" : "#ffffff",
              border: `1.5px solid ${presente ? "#a7f3d0" : "#e5e7eb"}`, borderRadius: 16, padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 8, transition: "all .2s",
              boxShadow: presente ? "0 4px 14px rgba(167,243,208,.2)" : "0 2px 8px rgba(0,0,0,.03)"
            }}>
              <button onClick={() => toggleAsistencia(s.id)} style={{
                background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, background: presente ? (tieneTurnoActivo ? "#eab308" : "#10b981") : "#d1d5db", boxShadow: presente ? "0 0 8px rgba(16,185,129,.4)" : "none" }} />
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{s.nombre.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: presente ? "#064e3b" : "#374151" }}>{s.nombre}</div>
                  <div style={{ fontSize: 11, color: presente ? "#059669" : "#9ca3af" }}>
                    {s.transporte === "moto" ? "🏍️" : s.transporte === "bici" ? "🚲" : "🚶"} {s.transporte}
                    {turnosHoy > 0 && ` • ${turnosHoy} turnos`}
                  </div>
                </div>
              </button>
              <div style={{
                padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textAlign: "center",
                background: estadoColor, border: `1px solid ${presente ? (tieneTurnoActivo ? "#fde68a" : "#a7f3d0") : "#e5e7eb"}`,
                color: presente ? (tieneTurnoActivo ? "#92400e" : "#065f46") : "#64748b"
              }}>
                {estadoLabel}
              </div>
              {modoOculto && (
                <>
                  <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                    Saldo: {formatP(-saldoLav)}
                    {saldoLav > 0 && <span style={{ color: "#d97706", marginLeft: 4 }}>⚠️ Debe</span>}
                    {saldoLav < 0 && <span style={{ color: "#7c3aed", marginLeft: 4 }}>📝 A favor</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onVerRuta(s)} style={{
                      flex: 1, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 10px",
                      color: "#1e3a8a", fontSize: 11, fontWeight: 700, cursor: "pointer"
                    }}>
                      🗺️ Ruta
                    </button>
                    <button onClick={() => onOperacion(s)} style={{
                      flex: 1, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px",
                      color: "#92400e", fontSize: 11, fontWeight: 700, cursor: "pointer"
                    }}>
                      💰 Operación
                    </button>
                  </div>
                </>
              )}
              {!modoOculto && (
                <button onClick={() => onVerRuta(s)} style={{
                  width: "100%", background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 10px",
                  color: "#1e3a8a", fontSize: 11, fontWeight: 700, cursor: "pointer"
                }}>
                  🗺️ Ver Ruta
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabSeguimientoTurnos({ turnos, clientes, staff, onMarcarTerminado, onCerrarTurno, onExportar }) {
  const estadosConfig = {
    pendiente: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", label: "⏳ Pendientes", headerBg: "#f9fafb" },
    en_progreso: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "🟡 En Progreso", headerBg: "#fef3c7" },
    terminado: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "🟢 Terminados", headerBg: "#d1fae5" },
    lluvia: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "🌧️ Lluvia", headerBg: "#fee2e2" },
  };
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
      <div key={t.id} style={{
        background: "#ffffff", border: `2px solid ${config.border}`, borderRadius: 16, padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,.03)", position: "relative", overflow: "hidden", marginBottom: 10
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: config.color }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>{t.hora} hs</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{t.clienteNombre}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, marginBottom: 10 }}>
          <div>🚙 {t.auto}{cant > 1 ? ` (×${cant})` : ""} • {formatP(t.precio)} {t.esFZ && "⬡"}</div>
          {lavador && <div>👷 {lavador.nombre}</div>}
          {cliente?.barrio && <div>📍 {cliente.barrio}</div>}
          {finEstimado && t.estado !== "terminado" && <div style={{ fontWeight: 600, color: "#6b7280", marginTop: 4 }}>⏱️ Fin: {finEstimado.horaFin}</div>}
        </div>
        {t.nota && <div style={{ fontSize: 11, fontStyle: "italic", color: "#92400e", background: "#fef3c7", padding: "4px 8px", borderRadius: 6, marginBottom: 10, border: "1px solid #fde68a" }}>📝 {t.nota}</div>}
        {t.estado === "pendiente" && <Btn sm color="warning" full onClick={() => onMarcarTerminado(t.id, "en_progreso")}>▶️ Iniciar</Btn>}
        {t.estado === "en_progreso" && <Btn sm color="success" full onClick={() => onCerrarTurno(t)}>✅ Terminar</Btn>}
        {t.estado === "terminado" && <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#059669", padding: "8px 0" }}>✅ Completado</div>}
        {t.estado === "lluvia" && (
          <div style={{ display: "flex", gap: 6 }}>
            <Btn sm color="primary" full onClick={() => onMarcarTerminado(t.id, "pendiente")}>🔄 Permanece</Btn>
            <Btn sm ghost danger full onClick={() => { if (window.confirm("¿Cancelar este turno definitivamente?")) onMarcarTerminado(t.id, "cancelado"); }}>🚫 Cancelar</Btn>
          </div>
        )}
      </div>
    );
  };
  const renderColumna = (titulo, items, config) => (
    <div style={{
      flex: 1, minWidth: 260, display: "flex", flexDirection: "column",
      background: config.headerBg, borderRadius: 16, padding: 12,
      border: `1px solid ${config.border}`
    }}>
      <div style={{
        fontSize: 14, fontWeight: 800, color: config.color,
        marginBottom: 12, padding: "6px 12px", borderRadius: 10,
        background: "rgba(255,255,255,.7)", display: "flex",
        justifyContent: "space-between", alignItems: "center"
      }}>
        <span>{titulo}</span>
        <span style={{ fontSize: 12, fontWeight: 800, background: config.bg, border: `1px solid ${config.border}`, borderRadius: 8, padding: "2px 8px" }}>{items.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, padding: 20, fontStyle: "italic" }}>Sin turnos</div>
        ) : items.map(renderTarjeta)}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📊 Seguimiento de Turnos</h3>
        <Btn sm color="tertiary" onClick={onExportar}>📥 Exportar</Btn>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, minHeight: "60vh" }}>
        {renderColumna("⏳ Pendientes", pendientes, estadosConfig.pendiente)}
        {renderColumna("🟡 En Progreso", enProgreso, estadosConfig.en_progreso)}
        {renderColumna("🟢 Terminados", terminados, estadosConfig.terminado)}
        {renderColumna("🌧️ Afectados por Lluvia", lluvia, estadosConfig.lluvia)}
      </div>
    </div>
  );
}

function TabAgenda({ turnos, staff, asistencias, clientes, mostrarToast, onCeldaClick, onTurnoClick, onCambiarEstado, onCerrarTurno, onExportar }) {
  const presentes = staff.filter(s => asistencias[s.id]);
  const franjasVisibles = useMemo(() => generarFranjasDinamicas(turnos), [turnos]);
  const turnosMap = {};
  turnos.forEach(t => {
    // FIX 2: Excluir turnos cancelados
    if (t.estado === "cancelado") return;
    if (!turnosMap[t.lavadorId]) turnosMap[t.lavadorId] = {};
    const horas = t.horasOcupadas || [t.hora];
    horas.forEach((h, idx) => {
      turnosMap[t.lavadorId][h] = { turno: t, esPrincipal: idx === 0 };
    });
  });
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📋 Agenda del Día</h3>
        <Btn sm color="tertiary" onClick={onExportar}>📥 Exportar</Btn>
      </div>
      {presentes.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 60, fontSize: 14, background: "#ffffff", borderRadius: 20, border: "1.5px dashed #e5e7eb" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
          No hay lavadores presentes.<br />
          <span style={{ fontWeight: 600 }}>Andá a la pestaña "Lavadores" para marcar asistencia.</span>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #e5e7eb", background: "#ffffff", padding: 12 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(${presentes.length}, minmax(140px, 1fr))`,
            gap: 0,
            minWidth: presentes.length * 140 + 80
          }}>
            <div style={{ padding: 8, background: "#f9fafb", fontWeight: 800, fontSize: 11, color: "#6b7280", borderBottom: "2px solid #e5e7eb", borderRight: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10 }}>HORA</div>
            {presentes.map(s => (
              <div key={s.id} style={{
                padding: "8px 10px", background: "#f9fafb", borderBottom: "2px solid #e5e7eb",
                borderRight: "1px solid #e5e7eb", textAlign: "center", position: "sticky", top: 0, zIndex: 10
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, margin: "0 auto 4px" }}>{s.nombre.charAt(0)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.nombre}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{s.transporte}</div>
              </div>
            ))}
            {franjasVisibles.map(hora => {
              const [hr, mn] = hora.split(":").map(Number);
              const pasada = hr * 60 + mn < minutosAhora;
              return (
                <div key={hora} style={{ display: "contents" }}>
                  <div style={{
                    padding: "12px 8px", background: pasada ? "#f1f5f9" : "#ffffff",
                    borderBottom: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb",
                    fontWeight: 800, fontSize: 12, color: pasada ? "#94a3b8" : "#1e293b",
                    textAlign: "center", textDecoration: pasada ? "line-through" : "none"
                  }}>
                    {hora}
                  </div>
                  {presentes.map(s => {
                    const info = turnosMap[s.id]?.[hora];
                    const turno = info?.turno;
                    const esPrincipal = info?.esPrincipal;
                    if (turno && !esPrincipal) return null;
                    if (turno) {
                      const slots = turno.horasOcupadas?.length || 1;
                      const configEstado = {
                        pendiente: { bg: "#f3f4f6", border: "#d1d5db", color: "#374151" },
                        en_progreso: { bg: "#fef3c7", border: "#fcd34d", color: "#92400e" },
                        terminado: { bg: "#d1fae5", border: "#6ee7b7", color: "#065f46" },
                        lluvia: { bg: "#fee2e2", border: "#fca5a5", color: "#991b1b" },
                      };
                      const cfg = configEstado[turno.estado] || configEstado.pendiente;
                      return (
                        <div key={`${s.id}-${hora}`} onClick={() => onTurnoClick(turno)}
                          style={{
                            gridColumn: "auto",
                            gridRow: `span ${slots}`,
                            background: cfg.bg,
                            borderBottom: `1px solid ${cfg.border}`,
                            borderRight: "1px solid #e5e7eb",
                            padding: "8px",
                            cursor: "pointer",
                            transition: "all .15s",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            position: "relative"
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
                          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{turno.hora} hs</div>
                            {turno.estado === "en_progreso" && (
                              <span style={{ fontSize: 8, fontWeight: 800, background: "#fcd34d", color: "#92400e", padding: "2px 4px", borderRadius: 4 }}>EN PROGRESO</span>
                            )}
                            {turno.estado === "terminado" && (
                              <span style={{ fontSize: 8, fontWeight: 800, background: "#86efac", color: "#065f46", padding: "2px 4px", borderRadius: 4 }}>TERMINADO</span>
                            )}
                            {turno.estado === "lluvia" && (
                              <span style={{ fontSize: 8, fontWeight: 800, background: "#fca5a5", color: "#991b1b", padding: "2px 4px", borderRadius: 4 }}>LLUVIA</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{turno.clienteNombre}</div>
                          <div style={{ fontSize: 10, color: cfg.color, opacity: 0.8 }}>
                            👷 {staff.find(st => st.id === turno.lavadorId)?.nombre || "Sin asignar"}
                          </div>
                          <div style={{ fontSize: 10, color: cfg.color, opacity: 0.8 }}>
                            {turno.auto} {turno.cantidadAutos > 1 && `(×${turno.cantidadAutos})`}
                          </div>
                          {turno.esFZ && <div style={{ fontSize: 10, fontWeight: 700, color: "#d97706" }}>⬡ FZ</div>}
                          <div style={{ marginTop: "auto", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {turno.estado === "pendiente" && (
                              <button onClick={(e) => { e.stopPropagation(); onCambiarEstado(turno.id, "en_progreso"); }}
                                style={{ background: "#fcd34d", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "#92400e", cursor: "pointer" }}>
                                🚗 Llegó
                              </button>
                            )}
                            {turno.estado === "en_progreso" && (
                              <button onClick={(e) => { e.stopPropagation(); onCerrarTurno(turno); }}
                                style={{ background: "#86efac", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "#065f46", cursor: "pointer" }}>
                                ✅ Terminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={`${s.id}-${hora}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!pasada) onCeldaClick(s.id, hora);
                          }}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            borderRight: "1px solid #e5e7eb",
                            padding: "8px",
                            background: pasada ? "#f1f5f9" : "#ffffff",
                            cursor: pasada ? "not-allowed" : "pointer",
                            minHeight: 60,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: pasada ? "#94a3b8" : "#94a3b8",
                            fontSize: 20,
                            transition: "all .15s"
                          }}
                          onMouseOver={e => { if (!pasada) { e.currentTarget.style.background = "#ecfdf5"; e.currentTarget.style.color = "#059669"; } }}
                          onMouseOut={e => { if (!pasada) { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#94a3b8"; } }}
                        >
                          {pasada ? "—" : "+"}
                        </div>
                      );
                    }
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TabCierre({ registros, turnos, clientes, staff, diaHoy, mostrarToast, onPagarDeuda, onCondonarDeuda, onPunitorio, onRendir, onCobrar, onEditarCobro, onRendirTodo, rangoC, setRangoC, regMulti, loadMulti, modoOculto }) {
  const regs = rangoC === "hoy" ? registros : regMulti;
  const tTotal = regs.reduce((s, r) => s + Number(r.precio || 0), 0);
  const tMP = regs.filter(r => r.metodo === "mp").reduce((s, r) => s + Number(r.precio || 0), 0);
  const tEf = regs.filter(r => r.metodo === "efectivo").reduce((s, r) => s + Number(r.precio || 0), 0);
  const pendientesRendir = turnos.filter(t => t.estadoPago === "💵 Cobrado (sin rendir)");
  const clientesConDeuda = clientes.filter(c => c.deuda > 0);
  const liquidacionPorLavador = useMemo(() => {
    const porLavador = {};
    regs.forEach(r => {
      const n = r.staffNombre || "?";
      if (!porLavador[n]) porLavador[n] = { nombre: n, total: 0, efectivo: 0, mp: 0, turnos: 0, debe: 0, favor: 0 };
      porLavador[n].total += Number(r.precio || 0);
      porLavador[n].efectivo += r.metodo === "efectivo" ? Number(r.precio || 0) : 0;
      porLavador[n].mp += r.metodo === "mp" ? Number(r.precio || 0) : 0;
      porLavador[n].turnos += 1;
      if (r.estadoPago === "⚠️ Debe" || r.estadoPago === "🔴 Cliente debe") porLavador[n].debe += Math.abs(r.diferencia || r.precioEsperado || 0);
      if (r.estadoPago === "📝 A favor") porLavador[n].favor += Math.abs(r.diferencia || 0);
    });
    return Object.values(porLavador).sort((a, b) => b.total - a.total);
  }, [regs]);
  const inputStyle = { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", color: "#1e293b", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  if (!modoOculto) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>📊 Resumen Operativo</h3>
        <div style={{ padding: 20, background: "#f9fafb", borderRadius: 14, border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>Modo Normal Activo</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>La información financiera sensible está oculta. Activá el Modo Oculto para acceder a cobros, rendiciones y deudas.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          <div style={{ textAlign: "center", padding: 16, background: "#eff6ff", borderRadius: 14, border: "1.5px solid #bfdbfe33" }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>TURNOS HOY</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#3b82f6", fontFamily: "'Inter',system-ui,sans-serif" }}>{turnos.length}</div>
          </div>
          <div style={{ textAlign: "center", padding: 16, background: "#ecfdf5", borderRadius: 14, border: "1.5px solid #a7f3d033" }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>TERMINADOS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#059669", fontFamily: "'Inter',system-ui,sans-serif" }}>{turnos.filter(t => t.estado === "terminado").length}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>💰 Cierre / Caja</h3>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["hoy", "semana", "mes"].map(r => (
            <button key={r} onClick={() => setRangoC(r)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 700,
              background: rangoC === r ? "#dbeafe" : "#f9fafb",
              border: `1.5px solid ${rangoC === r ? "#3b82f6" : "#e5e7eb"}`,
              color: rangoC === r ? "#1e3a8a" : "#6b7280"
            }}>
              {r === "hoy" ? "📅 Hoy" : r === "semana" ? "📆 Semana" : "🗓 Mes"}
            </button>
          ))}
          <Btn sm ghost onClick={() => exportJSON(regs, `cierre-${rangoC}-${diaHoy}`)}>📥 JSON</Btn>
          <Btn sm ghost onClick={() => {
            const html = `<h2>Cierre Sofía Lavados — ${rangoC}</h2>
              <table><thead><tr><th>Hora</th><th>Lavador</th><th>Cliente</th><th>Precio</th><th>Pago</th><th>Estado</th></tr></thead>
              <tbody>${regs.map(r => `<tr><td>${r.hora || "—"}</td><td>${r.staffNombre || "—"}</td><td>${r.clienteNombre || "—"}</td><td>${formatP(r.precio)}</td><td>${r.metodo === "mp" ? "MP" : "Ef."}</td><td>${r.estadoPago || "—"}</td></tr>`).join("")}</tbody>
              <tfoot><tr><td colspan="3"><strong>TOTAL</strong></td><td><strong>${formatP(tTotal)}</strong></td><td colspan="2"></td></tr></tfoot></table>`;
            exportPDF(html, `Cierre ${rangoC}`);
          }}>🖨️ Imprimir</Btn>
          <Btn sm color="primary" onClick={() => guardarBackupNube(`Cierre-${rangoC}-${diaHoy}`, regs, mostrarToast)}>☁️ Backup Nube</Btn>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: `TOTAL ${rangoC.toUpperCase()}`, v: formatP(tTotal), c: "#3b82f6", bg: "#eff6ff" },
          { l: "MERCADO PAGO", v: formatP(tMP), c: "#7c3aed", bg: "#f5f3ff" },
          { l: "EFECTIVO", v: formatP(tEf), c: "#059669", bg: "#ecfdf5" },
          { l: "SIN RENDIR", v: pendientesRendir.length, c: "#dc2626", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.l} style={{ textAlign: "center", padding: 16, background: s.bg, borderRadius: 14, border: `1.5px solid ${s.c}33` }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.c, fontFamily: "'Inter',system-ui,sans-serif" }}>{s.v}</div>
          </div>
        ))}
      </div>
      {clientesConDeuda.length > 0 && (
        <div style={{ padding: 16, background: "#fef2f2", borderRadius: 14, border: "1.5px solid #fecaca" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b", marginBottom: 10 }}>🔴 CLIENTES CON DEUDA ({clientesConDeuda.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {clientesConDeuda.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ffffff", borderRadius: 10, border: "1px solid #fecaca", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", fontFamily: "monospace" }}>{c.codigo}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", flex: 1 }}>{c.nombre}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>{formatP(c.deuda)}</span>
                <Btn sm color="primary" onClick={() => onPagarDeuda(c)}>💵 Pagar</Btn>
                <Btn sm color="success" onClick={() => onCondonarDeuda(c)}>✓ Condonar</Btn>
                <Btn sm color="warning" onClick={() => onPunitorio(c)}>+ Punitorio</Btn>
              </div>
            ))}
          </div>
        </div>
      )}
      {rangoC !== "hoy" && liquidacionPorLavador.length > 0 && (
        <div style={{ padding: 16, background: "#f5f3ff", borderRadius: 14, border: "1.5px solid #ddd6fe" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 10 }}>💼 LIQUIDACIÓN POR LAVADOR — {rangoC === "semana" ? "SEMANA" : "MES"}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: "2px solid #ddd6fe" }}>
                {["LAVADOR", "TURNOS", "TOTAL", "EFECTIVO", "DEBE", "A FAVOR"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6b7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {liquidacionPorLavador.map(l => (
                  <tr key={l.nombre} style={{ borderBottom: "1px solid #ede9fe" }}>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#1e293b" }}>{l.nombre}</td>
                    <td style={{ padding: "10px", textAlign: "center", color: "#6b7280" }}>{l.turnos}</td>
                    <td style={{ padding: "10px", color: "#3b82f6", fontWeight: 700 }}>{formatP(l.total)}</td>
                    <td style={{ padding: "10px", color: "#059669" }}>{formatP(l.efectivo)}</td>
                    <td style={{ padding: "10px", color: "#d97706" }}>{l.debe > 0 ? formatP(l.debe) : "—"}</td>
                    <td style={{ padding: "10px", color: "#7c3aed" }}>{l.favor > 0 ? formatP(l.favor) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {pendientesRendir.length > 0 && (
        <div style={{ padding: 16, background: "#fffbeb", borderRadius: 14, border: "1.5px solid #fde68a" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 10 }}>💰 PENDIENTES DE RENDICIÓN ({pendientesRendir.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendientesRendir.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ffffff", borderRadius: 10, border: "1px solid #fde68a", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#1e3a8a" }}>{t.hora}</span>
                <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>{t.lavadorNombre || t.staffNombre} → {t.clienteNombre}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{formatP(t.precio)}</span>
                <Btn sm color="warning" onClick={() => onEditarCobro(t)}>✏️ Editar</Btn>
                <Btn sm color="success" onClick={() => onRendir(t)}>💸 Rendir</Btn>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[...new Set(pendientesRendir.map(t => t.lavadorNombre || t.staffNombre))].map(n => (
              <Btn key={n} sm color="success" onClick={() => onRendirTodo(n)}>✅ Rendir todo de {n}</Btn>
            ))}
          </div>
        </div>
      )}
      {regs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
          {loadMulti ? "Cargando..." : "Sin registros para este período."}
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              {["HORA", "LAVADOR", "CLIENTE", "AUTOS", "PRECIO", "PAGO", "ESTADO", "DIF.", "MOTIVO"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {regs.map((r, i) => (
                <tr key={r.id || i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", color: "#3b82f6", fontWeight: 700 }}>{r.hora || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#1e293b" }}>{r.staffNombre || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>{r.clienteNombre || "—"}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{r.autos || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#059669", fontWeight: 700 }}>{formatP(r.precio)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: r.metodo === "mp" ? "#ede9fe" : "#ecfdf5",
                      color: r.metodo === "mp" ? "#7c3aed" : "#059669",
                      border: `1px solid ${r.metodo === "mp" ? "#ddd6fe" : "#a7f3d0"}`
                    }}>{r.metodo === "mp" ? "MP" : "Ef."}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 10 }}>{r.estadoPago || "—"}</td>
                  <td style={{ padding: "10px 12px", color: r.diferencia < 0 ? "#d97706" : r.diferencia > 0 ? "#7c3aed" : "#94a3b8", fontSize: 10 }}>{r.diferencia !== 0 ? formatP(r.diferencia) : "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: 10, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.motivo || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
                <td colSpan={4} style={{ padding: "12px", fontWeight: 800, color: "#6b7280" }}>TOTALES</td>
                <td style={{ padding: "12px", fontWeight: 900, color: "#3b82f6", fontSize: 14 }}>{formatP(tTotal)}</td>
                <td colSpan={4} style={{ padding: "12px", color: "#6b7280", fontSize: 10 }}>MP: {formatP(tMP)} | Ef: {formatP(tEf)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [modoPrueba, setModoPrueba] = useState(false);
  const [modoOculto, setModoOculto] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const COL_DIAS = modoPrueba ? "dias_prueba" : "dias";
  const COL_TURNOS = modoPrueba ? "turnos_prueba" : "turnos";
  const COL_CLIENTES = modoPrueba ? "clientes_prueba" : "clientes";
  const COL_STAFF = modoPrueba ? "staff_prueba" : "staff";
  const COL_ASISTENCIAS = modoPrueba ? "asistencias_prueba" : "asistencias";
  const COL_CIERRE = modoPrueba ? `cierre_${hoy()}_prueba` : `cierre_${hoy()}`;
  const COL_PRESTAMOS = modoPrueba ? "prestamos_prueba" : "prestamos";
  const [diaActual, setDiaActual] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);
  const [avisoFijo, setAvisoFijo] = useState(null);
  const [tab, setTab] = useState("agenda");
  const [modalOpen, setModalOpen] = useState(null);
  const [turnoSel, setTurnoSel] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [clienteParaTurno, setClienteParaTurno] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [busquedaClientes, setBusquedaClientes] = useState("");
  const [filtroBarrio, setFiltroBarrio] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDeuda, setFiltroDeuda] = useState(false);
  const [turnoCreadoData, setTurnoCreadoData] = useState(null);
  const [mostrarNuevoClienteDirecto, setMostrarNuevoClienteDirecto] = useState(false);
  const [celdaPreseleccionada, setCeldaPreseleccionada] = useState(null);
  const [lavadorRuta, setLavadorRuta] = useState(null);
  const [lavadorOperacion, setLavadorOperacion] = useState(null);
  const [mostrarLluvia, setMostrarLluvia] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarGestionLav, setMostrarGestionLav] = useState(false);
  const [turnoParaCobrar, setTurnoParaCobrar] = useState(null);
  const [turnoParaRendir, setTurnoParaRendir] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [prestamos, setPrestamos] = useState({});
  const [rangoC, setRangoC] = useState("hoy");
  const [regMulti, setRegMulti] = useState([]);
  const [loadMulti, setLoadMulti] = useState(false);
  const [config, setConfig] = useState({
    precios: TAMANOS_DEFAULT,
    fzPct: 20,
    distancias: DISTANCIAS_DEFAULT,
    modoPrueba: false
  });
  const mostrarToast = (msg, tipo = "ok") => setToast({ msg, tipo });

  useEffect(() => {
    const fechaHoy = hoy();
    setCargando(true);
    const unsubDia = onSnapshot(doc(db, COL_DIAS, fechaHoy), (snap) => {
      if (snap.exists()) {
        setDiaActual({ id: snap.id, ...snap.data() });
      } else {
        const nuevoDia = { fecha: fechaHoy, estado: "cerrado", apertura: null, cierre: null, lluvia: false };
        setDiaActual(nuevoDia);
        if (!modoPrueba) fsSave(COL_DIAS, fechaHoy, nuevoDia);
      }
      setCargando(false);
    }, (err) => {
      console.error("Error listener dia:", err);
      setCargando(false);
      mostrarToast("Sin conexión a base de datos", "error");
    });
    const qTurnos = query(collection(db, COL_TURNOS), where("fecha", "==", fechaHoy));
    const unsubTurnos = onSnapshot(qTurnos, (snap) => {
      const hoyTurnos = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => FRANJAS_BASE.indexOf(a.hora) - FRANJAS_BASE.indexOf(b.hora));
      setTurnos(hoyTurnos);
    });
    const unsubClientes = onSnapshot(collection(db, COL_CLIENTES), (snap) => {
      if (!snap.empty) {
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    const unsubStaff = onSnapshot(collection(db, COL_STAFF), (snap) => {
      if (!snap.empty) {
        setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    const unsubAsist = onSnapshot(doc(db, COL_ASISTENCIAS, fechaHoy), (snap) => {
      setAsistencias(snap.exists() ? (snap.data().registros || {}) : {});
    });
    const unsubConfig = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) {
        setConfig(prev => ({ ...prev, ...snap.data() }));
      }
    });
    let unsubCierre = () => { };
    try {
      unsubCierre = onSnapshot(collection(db, COL_CIERRE), (snap) => {
        setRegistros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } catch (e) { }
    let unsubPrestamos = () => { };
    try {
      unsubPrestamos = onSnapshot(doc(db, COL_PRESTAMOS, fechaHoy), (snap) => {
        if (snap.exists()) {
          const { _ts, ...rest } = snap.data();
          setPrestamos(rest);
        }
      });
    } catch (e) { }

    // FIX 3 & 4: Cleanup con todas las dependencias
    return () => {
      unsubDia();
      unsubTurnos();
      unsubClientes();
      unsubStaff();
      unsubAsist();
      unsubConfig();
      unsubCierre();
      unsubPrestamos();
    };
  }, [modoPrueba, COL_DIAS, COL_TURNOS, COL_CLIENTES, COL_STAFF, COL_ASISTENCIAS, COL_CIERRE, COL_PRESTAMOS]);

  // FIX 1: useEffect independiente para manejar cambio de tab
  useEffect(() => {
    if (!modoOculto && tab === "cierre") {
      setTab("agenda");
    }
  }, [modoOculto, tab]);

  useEffect(() => {
    const seedAndMigrate = async () => {
      try {
        const cliSnap = await getDocs(collection(db, COL_CLIENTES));
        if (cliSnap.empty) {
          const batch = writeBatch(db);
          CLIENTES_SEED.forEach(c => { const ref = doc(collection(db, COL_CLIENTES)); batch.set(ref, { ...c, _ts: serverTimestamp() }); });
          await batch.commit();
        }
        const staffSnap = await getDocs(collection(db, COL_STAFF));
        if (staffSnap.empty) {
          const batch = writeBatch(db);
          STAFF_SEED.forEach(s => { const ref = doc(collection(db, COL_STAFF)); batch.set(ref, { ...s, _ts: serverTimestamp() }); });
          await batch.commit();
        }
      } catch (err) { console.error("Error en seed:", err); }
    };
    seedAndMigrate();
  }, [modoPrueba, COL_CLIENTES, COL_STAFF]);

  useEffect(() => {
    const cargarMultiFecha = async () => {
      if (rangoC === "hoy") {
        setRegMulti([]);
        return;
      }
      setLoadMulti(true);
      try {
        const fechas = [];
        const hoyDate = new Date();
        if (rangoC === "semana") for (let i = 6; i >= 0; i--) { const d = new Date(hoyDate); d.setDate(d.getDate() - i); fechas.push(d.toISOString().split("T")[0]); }
        else if (rangoC === "mes") for (let i = 29; i >= 0; i--) { const d = new Date(hoyDate); d.setDate(d.getDate() - i); fechas.push(d.toISOString().split("T")[0]); }
        const todos = [];
        for (const f of fechas) {
          try {
            const colName = modoPrueba ? `cierre_${f}_prueba` : `cierre_${f}`;
            const snap = await getDocs(collection(db, colName));
            todos.push(...snap.docs.map(d => ({ id: d.id, ...d.data(), fecha: f })));
          } catch { }
        }
        setRegMulti(todos);
      } catch { }
      setLoadMulti(false);
    };
    cargarMultiFecha();
  }, [rangoC, modoPrueba]);

  useEffect(() => {
    const sinTel = staff.filter(s => !s.telefono || s.telefono === "");
    if (sinTel.length > 0 && !avisoFijo) {
      setAvisoFijo({
        msg: `${sinTel.length} lavador(es) sin teléfono: ${sinTel.slice(0, 3).map(s => s.nombre).join(", ")}${sinTel.length > 3 ? "..." : ""}`,
        tipo: "warn"
      });
    } else if (sinTel.length === 0 && avisoFijo) {
      setAvisoFijo(null);
    }
  }, [staff, avisoFijo]);

  const cerrarTurno = async (turno) => {
    await fsUpdate(COL_TURNOS, turno.id, { estado: "terminado", rendidoEn: serverTimestamp() });
    mostrarToast("Turno terminado correctamente", "ok");
  };

  const cambiarEstadoTurno = async (turnoId, nuevoEstado) => {
    try {
      await fsUpdate(COL_TURNOS, turnoId, { estado: nuevoEstado });
      mostrarToast(`Turno marcado como ${nuevoEstado}`, "ok");
    }
    catch (err) { mostrarToast("Error al actualizar estado", "error"); }
  };

  const activarLluvia = async () => {
    if (!diaActual?.id) return;
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia: true, lluviaInicio: serverTimestamp() });
    const pendientes = turnos.filter(t => t.estado === "pendiente");
    await Promise.all(pendientes.map(t => fsUpdate(COL_TURNOS, t.id, { estado: "lluvia" })));
    mostrarToast("🌧️ Modo lluvia activado", "warn");
  };

  const aplicarReorganizacionLluvia = async (estadoLav, turnosCancelar, lavQuedan) => {
    const turnosPendientes = turnos.filter(t => t.estado === "lluvia");
    let cancelados = 0, reasignados = 0;
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    // FIX N1: mapa local para rastrear slots asignados durante este loop async
    // key: `${lavadorId}:${hora}` → true
    const mapaSlotsLocal = new Map();
    // Inicializar con los turnos existentes NO cancelados
    turnos.forEach(tt => {
      if (tt.estado === "cancelado") return;
      const horas = tt.horasOcupadas?.length ? tt.horasOcupadas : [tt.hora];
      horas.forEach(h => mapaSlotsLocal.set(`${tt.lavadorId}:${h}`, true));
    });

    for (const lavId of Object.keys(estadoLav)) {
      const estado = estadoLav[lavId];
      const turnosDelLav = turnosPendientes.filter(t => t.lavadorId === lavId);
      if (estado === "ausente") {
        for (const t of turnosDelLav) {
          await fsUpdate(COL_TURNOS, t.id, { estado: "cancelado" });
          // Liberar slots del mapa local
          const horas = t.horasOcupadas?.length ? t.horasOcupadas : [t.hora];
          horas.forEach(h => mapaSlotsLocal.delete(`${lavId}:${h}`));
          cancelados++;
        }
        setAsistencias(prev => ({ ...prev, [lavId]: false }));
        await fsSave(COL_ASISTENCIAS, hoy(), { registros: { ...asistencias, [lavId]: false }, fecha: hoy() });
      }
      if (estado === "liberar_reasignar") {
        const cancelarIds = turnosCancelar[lavId] || [];
        for (const t of turnosDelLav) {
          // Liberar slots originales del turno en el mapa
          const horasOri = t.horasOcupadas?.length ? t.horasOcupadas : [t.hora];
          horasOri.forEach(h => mapaSlotsLocal.delete(`${lavId}:${h}`));

          if (cancelarIds.includes(t.id)) {
            await fsUpdate(COL_TURNOS, t.id, { estado: "cancelado" });
            cancelados++;
          } else if (lavQuedan.length > 0) {
            const idx = reasignados % lavQuedan.length;
            const nuevoLav = lavQuedan[idx];
            let nuevaHora = t.hora;
            const [hOri, mOri] = t.hora.split(":").map(Number);
            if (hOri * 60 + mOri < minutosAhora) {
              const franjasFuturas = FRANJAS_BASE.filter(h => {
                const [hh, mm] = h.split(":").map(Number);
                return hh * 60 + mm >= minutosAhora;
              });
              for (const h of franjasFuturas) {
                if (!mapaSlotsLocal.has(`${nuevoLav.id}:${h}`)) { nuevaHora = h; break; }
              }
            }
            await fsUpdate(COL_TURNOS, t.id, { lavadorId: nuevoLav.id, hora: nuevaHora });
            // Registrar nueva asignación en el mapa local
            mapaSlotsLocal.set(`${nuevoLav.id}:${nuevaHora}`, true);
            reasignados++;
          }
        }
      }
      if (estado === "queda") {
        for (const t of turnosDelLav) {
          const [hOri, mOri] = t.hora.split(":").map(Number);
          if (hOri * 60 + mOri < minutosAhora) {
            const franjasFuturas = FRANJAS_BASE.filter(h => {
              const [hh, mm] = h.split(":").map(Number);
              return hh * 60 + mm >= minutosAhora;
            });
            // Liberar slot original antes de buscar nuevo
            const horasOri = t.horasOcupadas?.length ? t.horasOcupadas : [t.hora];
            horasOri.forEach(h => mapaSlotsLocal.delete(`${lavId}:${h}`));
            let nuevaHora = t.hora;
            for (const h of franjasFuturas) {
              if (!mapaSlotsLocal.has(`${lavId}:${h}`)) { nuevaHora = h; break; }
            }
            await fsUpdate(COL_TURNOS, t.id, { hora: nuevaHora, estado: "pendiente" });
            mapaSlotsLocal.set(`${lavId}:${nuevaHora}`, true);
          } else {
            await fsUpdate(COL_TURNOS, t.id, { estado: "pendiente" });
          }
        }
      }
    }
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia: false, lluviaFin: serverTimestamp() });
    mostrarToast(`Reanudado: ${cancelados} cancelados, ${reasignados} reasignados`, "ok");
  };

  const registrarCobro = async (turno, importeReal, dif, motivo, destinoExcedente = "deuda") => {
    const estadoFinal = importeReal === 0 ? "🔴 Cliente debe" : "💵 Cobrado (sin rendir)";
    let motivoFinal = motivo || "";
    let precioParaCaja = importeReal;
    if (!motivoFinal) {
      if (importeReal === 0) motivoFinal = "Cliente no pagó (deuda)";
      else if (dif < 0 && destinoExcedente === "perdonar") motivoFinal = "🎁 Diferencia perdonada";
      else if (dif < 0) motivoFinal = "Cobro parcial — registrado como deuda";
      else if (dif > 0 && destinoExcedente === "propina") motivoFinal = "🎩 Propina para el lavador";
      else if (dif > 0 && destinoExcedente === "deuda") motivoFinal = `📝 Abona deuda anterior (${formatP(dif)})`;
      else if (dif > 0 && destinoExcedente === "perdonar") motivoFinal = "🎁 Cortesía — sin impacto en caja";
    }
    if (dif > 0 && destinoExcedente === "propina") precioParaCaja = turno.precio;
    if (dif > 0 && destinoExcedente === "perdonar") precioParaCaja = turno.precio;
    const reg = {
      turnoId: turno.id, hora: turno.hora,
      staffNombre: turno.lavadorNombre || staff.find(s => s.id === turno.lavadorId)?.nombre || "—",
      clienteNombre: turno.clienteNombre, direccion: clientes.find(c => c.id === turno.clienteId)?.direccion || "",
      autos: turno.cantidadAutos, tamano: turno.auto,
      precio: precioParaCaja, precioEsperado: turno.precio,
      metodo: turno.metodo || "efectivo", esFZ: turno.esFZ, notas: turno.nota,
      fecha: hoy(), estadoPago: estadoFinal, diferencia: dif, motivo: motivoFinal,
      destinoExcedente, ts: horaAR()
    };
    await fsAdd(COL_CIERRE, reg);
    await fsUpdate(COL_TURNOS, turno.id, { estadoPago: estadoFinal, diferencia: dif, motivo: motivoFinal, montoPagado: importeReal });
    const clienteObj = clientes.find(c => c.id === turno.clienteId);
    if (importeReal === 0 && clienteObj) {
      const nuevaDeuda = (clienteObj.deuda || 0) + turno.precio;
      await fsUpdate(COL_CLIENTES, clienteObj.id, { deuda: nuevaDeuda });
    }
    if (dif < 0 && destinoExcedente === "deuda" && clienteObj) {
      const nuevaDeuda = (clienteObj.deuda || 0) + Math.abs(dif);
      await fsUpdate(COL_CLIENTES, clienteObj.id, { deuda: nuevaDeuda });
    }
    if (dif > 0 && destinoExcedente === "deuda" && clienteObj && (clienteObj.deuda || 0) > 0) {
      const deudaReducida = Math.max(0, (clienteObj.deuda || 0) - dif);
      await fsUpdate(COL_CLIENTES, clienteObj.id, { deuda: deudaReducida });
    }
    mostrarToast(`Cobro registrado ✓`, "ok");
  };

  const registrarRendicion = async (turno) => {
    await fsUpdate(COL_TURNOS, turno.id, { estadoPago: "✅ Rendido", fechaRendicion: hoy() });
    try {
      const todos = await fsList(COL_CIERRE);
      const regFirestore = todos.find(r => r.turnoId === turno.id);
      if (regFirestore?.id) {
        await fsUpdate(COL_CIERRE, regFirestore.id, { estadoPago: "✅ Rendido", fechaRendicion: hoy() });
      }
    } catch { }
    mostrarToast(`✅ ${turno.lavadorNombre || "Lavador"} rindió ${formatP(turno.montoPagado || turno.precio)}`, "ok");
  };

  const registrarOperacion = async (lavador, monto, motivo) => {
    if (monto <= 0) { mostrarToast("⚠️ Ingresá un monto válido", "warn"); return; }
    const esRecibe = motivo.includes("recibe");
    const saldoActual = prestamos[lavador.id] || 0;
    let nuevoSaldo = esRecibe ? saldoActual + monto : Math.max(0, saldoActual - monto);
    const upd = { ...prestamos, [lavador.id]: nuevoSaldo };
    setPrestamos(upd);
    await fsSave(COL_PRESTAMOS, hoy(), upd);
    const reg = {
      hora: horaAR(), staffNombre: lavador.nombre, clienteNombre: "—",
      direccion: "Operación interna", autos: 0, tamano: "—",
      precio: monto, precioEsperado: 0, metodo: "efectivo",
      estadoPago: esRecibe ? "⚠️ Debe" : "✅ Pagado",
      diferencia: esRecibe ? monto : -monto, motivo: motivo || "Operación",
      fecha: hoy(), ts: horaAR()
    };
    await fsAdd(COL_CIERRE, reg);
    mostrarToast(`✓ ${motivo}: ${formatP(monto)} → Saldo actual ${formatP(nuevoSaldo)}`, "ok");
  };

  const reasignarTurno = async (turno, nuevoLavadorId, nuevaHora) => {
    const ns = staff.find(s => s.id === nuevoLavadorId);
    const horasOcupadas = slotsOcupados(nuevaHora, turno.cantidadAutos, turno.auto);
    const upd = {
      lavadorId: nuevoLavadorId,
      lavadorNombre: ns?.nombre,
      hora: nuevaHora,
      horasOcupadas
    };
    await fsUpdate(COL_TURNOS, turno.id, upd);
    mostrarToast(`Reasignado a ${ns?.nombre} a las ${nuevaHora} ✓`, "ok");
  };

  const pagarDeuda = async (cliente) => {
    const monto = Number(prompt(`¿Cuánto pagó ${cliente.nombre}? (deuda actual: ${formatP(cliente.deuda)})`));
    if (!monto || monto <= 0) return;
    const nueva = Math.max(0, (cliente.deuda || 0) - monto);
    await fsUpdate(COL_CLIENTES, cliente.id, { deuda: nueva });
    const reg = {
      turnoId: "pago_deuda", hora: "—", staffNombre: "Sofía",
      clienteNombre: cliente.nombre, direccion: "Pago de deuda",
      autos: 0, tamano: "—", precio: monto, precioEsperado: cliente.deuda,
      metodo: "efectivo", estadoPago: "✅ Pagó deuda",
      diferencia: nueva === 0 ? 0 : -(cliente.deuda - monto),
      motivo: `Pago de deuda: ${formatP(monto)}`, fecha: hoy(), ts: horaAR()
    };
    await fsAdd(COL_CIERRE, reg);
    mostrarToast(`✓ Pago de ${formatP(monto)} registrado para ${cliente.nombre}`, "ok");
  };

  const condonarDeuda = async (cliente) => {
    if (!window.confirm(`¿Condonar deuda de ${formatP(cliente.deuda)} a ${cliente.nombre}?`)) return;
    await fsUpdate(COL_CLIENTES, cliente.id, { deuda: 0 });
    const reg = {
      turnoId: "condonacion", hora: "—", staffNombre: "Sofía",
      clienteNombre: cliente.nombre, direccion: "Gestión interna",
      autos: 0, tamano: "—", precio: 0, precioEsperado: cliente.deuda,
      metodo: "efectivo", estadoPago: "🎁 Condonado",
      diferencia: -cliente.deuda, motivo: `Deuda condonada: ${formatP(cliente.deuda)}`,
      fecha: hoy(), ts: horaAR()
    };
    await fsAdd(COL_CIERRE, reg);
    mostrarToast(`Deuda de ${cliente.nombre} condonada ✓`, "ok");
  };

  const aplicarPunitorio = async (cliente) => {
    const monto = Number(prompt(`¿Cuánto de punitorio sumás a ${cliente.nombre}?`));
    if (!monto || monto <= 0) return;
    const nueva = (cliente.deuda || 0) + monto;
    await fsUpdate(COL_CLIENTES, cliente.id, { deuda: nueva });
    const reg = {
      turnoId: "punitorio", hora: "—", staffNombre: "Sofía",
      clienteNombre: cliente.nombre, direccion: "Gestión interna",
      autos: 0, tamano: "—", precio: monto, precioEsperado: 0,
      metodo: "efectivo", estadoPago: "⚡ Punitorio",
      diferencia: monto, motivo: `Punitorio aplicado: ${formatP(monto)}`,
      fecha: hoy(), ts: horaAR()
    };
    await fsAdd(COL_CIERRE, reg);
    mostrarToast(`Punitorio de ${formatP(monto)} aplicado a ${cliente.nombre}`, "warn");
  };

  const rendirTodoLavador = async (nombreLavador) => {
    const pendLav = turnos.filter(t => t.estadoPago === "💵 Cobrado (sin rendir)" && (t.lavadorNombre || staff.find(s => s.id === t.lavadorId)?.nombre) === nombreLavador);
    for (const t of pendLav) { await registrarRendicion(t); }
    mostrarToast(`Todos los turnos de ${nombreLavador} rendidos ✓`, "ok");
  };

  const editarCobro = async (turno) => {
    const montoActual = turno.montoPagado || turno.precio;
    const nuevo = Number(prompt(`Turno: ${turno.clienteNombre}\nMonto actual: ${formatP(montoActual)}\nIngresá el monto correcto:`));
    if (!nuevo || nuevo <= 0) return;
    const dif = nuevo - montoActual;
    const motivoEdit = dif > 0 ? `Corrección: +${formatP(dif)}` : `Corrección: ${formatP(dif)}`;
    await fsUpdate(COL_TURNOS, turno.id, { montoPagado: nuevo, precio: nuevo, diferencia: dif, motivo: motivoEdit });
    try {
      const todos = await fsList(COL_CIERRE);
      const reg = todos.find(r => r.turnoId === turno.id);
      if (reg?.id) await fsUpdate(COL_CIERRE, reg.id, { precio: nuevo, diferencia: dif, motivo: motivoEdit });
    } catch { }
    mostrarToast(`Monto corregido a ${formatP(nuevo)}`, "ok");
  };

  const toggleDia = async () => {
    if (!diaActual?.id) return;
    const nuevoEstado = diaActual?.estado === "abierto" ? "cerrado" : "abierto";
    await fsUpdate(COL_DIAS, diaActual.id, { estado: nuevoEstado, apertura: nuevoEstado === "abierto" ? serverTimestamp() : diaActual.apertura, cierre: nuevoEstado === "cerrado" ? serverTimestamp() : null });
    mostrarToast(nuevoEstado === "abierto" ? "☀️ Día ABIERTO" : "🌙 Día CERRADO", "ok");
  };

  // FIX 1: Quitar setTab inline
  const salirModoOculto = () => {
    setModoOculto(false);
    setModoPrueba(false);
    mostrarToast("🔒 Modo Normal Restaurado", "ok");
  };

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setModoOculto(true);
      setModoPrueba(true);
      mostrarToast("🧪 MODO OCULTO ACTIVADO", "warn");
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filtroDeuda && !(c.deuda > 0)) return false;
    if (filtroBarrio && c.barrio !== filtroBarrio) return false;
    if (filtroTipo && c.tipo !== filtroTipo) return false;
    if (!busquedaClientes) return true;
    const b = sinAcentos(busquedaClientes);
    return sinAcentos(c.nombre).includes(b) ||
      sinAcentos(c.codigo || "").includes(b) ||
      sinAcentos(c.barrio || "").includes(b) ||
      sinAcentos(c.direccion || "").includes(b) ||
      (c.telefono || "").includes(b);
  });

  const codigosExistentes = clientes.map(c => c.codigo || "").filter(Boolean);

  const handleCeldaClick = (lavadorId, hora) => {
    setCeldaPreseleccionada({ lavadorId, hora });
    setClienteParaTurno(null);
    setModalOpen("nuevoTurno");
  };

  const handleTurnoClick = (turno) => {
    setTurnoSel(turno);
    setModalOpen("detalleTurno");
  };

  if (cargando) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9fafb", color: "#6b7280", fontWeight: 600, fontSize: 14 }}>⟳ Sincronizando Sofia Lavados...</div>);

  if (diaActual?.estado !== "abierto") {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ animation: "fadeInUp .5s ease-out", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🚗</div>
          <h1 style={{ color: "#1e293b", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Sofía Lavados</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 40 }}>{fechaAR(hoy())} • {horaAR()} hs</p>
          <button onClick={toggleDia} style={{ background: "linear-gradient(135deg,#bbf7d0,#a7f3d0)", color: "#14532d", border: "1px solid #86efac", borderRadius: 20, padding: "22px 56px", fontSize: 20, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(167,243,208,.3)" }}>🟢 ABRIR DÍA</button>
        </div>
        {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const tabsVisibles = [
    { id: "agenda", label: "📋 Agenda", color: "#3b82f6", bg: "#dbeafe", border: "#bfdbfe" },
    { id: "seguimiento", label: "📊 Seguimiento", color: "#0891b2", bg: "#cffafe", border: "#a5f3fc" },
    { id: "nuevoTurno", label: "➕ Nuevo Turno", color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
    { id: "lavadores", label: "👷 Lavadores", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    { id: "clientes", label: "👥 Clientes", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    { id: "cierre", label: `💰 Cierre${registros.length ? ` (${registros.length})` : ""}`, color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
    { id: "config", label: "⚙️ Configuración", color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", color: "#1e293b", fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: 90 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'); @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeIn { from{opacity:0} to{opacity:1} } @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} } @media (max-width:768px) { .reloj-desktop { display:none !important; } .nav-tabs { overflow-x:auto !important; scrollbar-width:none; } .nav-tabs::-webkit-scrollbar { display:none; } }`}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div onClick={handleLogoTap} style={{ fontSize: 18, fontWeight: 900, cursor: "pointer", userSelect: "none", color: "#1e293b" }}>🚗 Sofía</div>
          <div style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 10, background: diaActual?.lluvia ? "#fef2f2" : "#ecfdf5", color: diaActual?.lluvia ? "#991b1b" : "#064e3b", border: diaActual?.lluvia ? "1px solid #fecaca" : "1px solid #a7f3d0" }}>{diaActual?.lluvia ? "🌧️ LLUVIA" : "🟢 ABIERTO"}</div>
          {modoOculto && <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e", background: "#fffbeb", padding: "3px 8px", borderRadius: 8, border: "1px solid #fde68a" }}>🧪 OCULTO</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {diaActual?.lluvia ? (
            <Btn sm color="success" onClick={() => setMostrarLluvia(true)}>☀️ Reorganizar</Btn>
          ) : (
            <Btn sm color="warning" onClick={activarLluvia}>🌧️ Lluvia</Btn>
          )}
          {modoOculto && (
            <Btn sm color="danger" onClick={salirModoOculto}>🔒 Salir del Modo Oculto</Btn>
          )}
          <RelojVivo />
        </div>
      </header>
      <nav className="nav-tabs" style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", alignItems: "center", background: "rgba(255,255,255,.85)", backdropFilter: "blur(8px)", position: "sticky", top: "58px", zIndex: 90 }}>
        {tabsVisibles.map(t => (
          <button key={t.id} onClick={() => {
            if (t.id === "nuevoTurno") { setClienteParaTurno(null); setCeldaPreseleccionada(null); setModalOpen("nuevoTurno"); }
            else if (t.id === "config") { setMostrarConfig(true); }
            else { setTab(t.id); }
          }} style={{
            background: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? t.bg : (t.id === "nuevoTurno" || t.id === "config" ? t.bg : "transparent"),
            color: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? t.color : (t.id === "nuevoTurno" || t.id === "config" ? t.color : "#6b7280"),
            border: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? `1.5px solid ${t.border}` : (t.id === "nuevoTurno" || t.id === "config" ? `1.5px solid ${t.border}` : "1.5px solid transparent"),
            borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all .2s"
          }}>{t.label}</button>
        ))}
        <button onClick={toggleDia} style={{ marginLeft: "auto", flexShrink: 0, background: "#fecaca", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>🔴 Cerrar Día</button>
      </nav>
      <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto", animation: "fadeInUp .4s ease-out" }}>
        {tab === "agenda" && <TabAgenda turnos={turnos} staff={staff} asistencias={asistencias} clientes={clientes} mostrarToast={mostrarToast} onCeldaClick={handleCeldaClick} onTurnoClick={handleTurnoClick} onCambiarEstado={cambiarEstadoTurno} onCerrarTurno={cerrarTurno} onExportar={() => {
          const datos = turnos.map(t => ({ hora: t.hora, cliente: t.clienteNombre, lavador: staff.find(s => s.id === t.lavadorId)?.nombre || "—", auto: t.auto, precio: t.precio, estado: t.estado }));
          exportCSV(datos, ["hora", "cliente", "lavador", "auto", "precio", "estado"], `agenda-${hoy()}`);
        }} />}
        {tab === "seguimiento" && <TabSeguimientoTurnos turnos={turnos} clientes={clientes} staff={staff} onMarcarTerminado={cambiarEstadoTurno} onCerrarTurno={cerrarTurno} onExportar={() => {
          const datos = turnos.map(t => ({ hora: t.hora, cliente: t.clienteNombre, estado: t.estado, precio: t.precio }));
          exportCSV(datos, ["hora", "cliente", "estado", "precio"], `seguimiento-${hoy()}`);
        }} />}
        {tab === "lavadores" && <TabLavadores staff={staff} turnos={turnos} hoyStr={hoy()} COL_ASISTENCIAS={COL_ASISTENCIAS} COL_STAFF={COL_STAFF} asistencias={asistencias} setAsistencias={setAsistencias} mostrarToast={mostrarToast} onVerRuta={(l) => setLavadorRuta(l)} onGestionar={() => setMostrarGestionLav(true)} onOperacion={(l) => setLavadorOperacion(l)} registros={registros} prestamos={prestamos} modoOculto={modoOculto} />}
        {tab === "clientes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ position: "sticky", top: "110px", zIndex: 80, background: "rgba(249,250,251,.97)", backdropFilter: "blur(12px)", padding: "8px 0 12px 0", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>👥 Clientes ({clientesFiltrados.length})</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn sm color="tertiary" onClick={() => exportCSV(clientesFiltrados.map(c => ({ nombre: c.nombre, codigo: c.codigo, barrio: c.barrio, telefono: c.telefono, deuda: c.deuda, tipo: c.tipo })), ["nombre", "codigo", "barrio", "telefono", "deuda", "tipo"], `clientes-${hoy()}`)}>📥 Exportar</Btn>
                  <Btn sm color="success" onClick={() => setMostrarNuevoClienteDirecto(true)}>➕ Nuevo</Btn>
                </div>
              </div>
              <input type="text" value={busquedaClientes} onChange={e => setBusquedaClientes(e.target.value)} placeholder="🔍 Buscar por nombre, código, barrio..."
                style={{ background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "12px 16px", color: "#1e293b", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={filtroBarrio} onChange={e => setFiltroBarrio(e.target.value)} style={{ background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#1e293b", outline: "none" }}>
                  <option value="">Todos los barrios</option>
                  {LISTA_BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#1e293b", outline: "none" }}>
                  <option value="">Todos los tipos</option>
                  <option value="⭐ Frecuente">⭐ Frecuente</option>
                  <option value="🔥 Top">🔥 Top</option>
                  <option value="💤 Ocasional">💤 Ocasional</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", padding: "8px 12px", background: filtroDeuda ? "#fef2f2" : "#ffffff", border: `1.5px solid ${filtroDeuda ? "#fecaca" : "#e5e7eb"}`, borderRadius: 10 }}>
                  <input type="checkbox" checked={filtroDeuda} onChange={e => setFiltroDeuda(e.target.checked)} />
                  <span style={{ color: filtroDeuda ? "#991b1b" : "#6b7280", fontWeight: 600 }}>Solo con deuda</span>
                </label>
              </div>
            </div>
            {clientesFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, fontSize: 13, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb" }}>Sin resultados</div>
            ) : (
              clientesFiltrados.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).map(c => (
                <div key={c.id} style={{ background: "#ffffff", borderRadius: 18, padding: 18, border: `1.5px solid ${c.deuda > 0 ? "#fecaca" : "#e5e7eb"}`, boxShadow: "0 2px 8px rgba(0,0,0,.02)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", marginTop: 4, fontFamily: "monospace", background: "#f3e8ff", padding: "3px 10px", borderRadius: 6, display: "inline-block", border: "1px solid #ddd6fe" }}>{c.codigo}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {c.deuda > 0 && <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>Deuda: {formatP(c.deuda)}</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" }}>{c.tipo}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    <div>📍 {c.direccion || "Sin dirección"} • {c.barrio}</div>
                    <div>{mostrarTelefono(c)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <Btn sm color="primary" onClick={() => { setClienteParaTurno(c); setModalOpen("nuevoTurno"); }}>➕ Turno</Btn>
                    <Btn sm color="secondary" onClick={() => setClienteParaEditar(c)}>✏️ Editar</Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "cierre" && (
          <TabCierre registros={registros} turnos={turnos} clientes={clientes} staff={staff} diaHoy={hoy()} mostrarToast={mostrarToast}
            onPagarDeuda={pagarDeuda} onCondonarDeuda={condonarDeuda} onPunitorio={aplicarPunitorio}
            onRendir={(t) => setTurnoParaRendir(t)} onCobrar={(t) => setTurnoParaCobrar(t)}
            onEditarCobro={editarCobro} onRendirTodo={rendirTodoLavador}
            rangoC={rangoC} setRangoC={setRangoC} regMulti={regMulti} loadMulti={loadMulti} modoOculto={modoOculto} />
        )}
        {tab === "config" && (
          <div style={{ padding: 20, background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>La configuración se gestiona desde el modal principal. Hacé clic en ⚙️ Configuración en la barra superior.</div>
          </div>
        )}
      </main>
      {modalOpen === "nuevoTurno" && (
        <ModalNuevoTurno clientes={clientes} staff={staff} turnos={turnos} asistencias={asistencias}
          COL_TURNOS={COL_TURNOS} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast}
          clientePreseleccionado={clienteParaTurno} config={config} codigosExistentes={codigosExistentes}
          celdaPreseleccionada={celdaPreseleccionada}
          onClienteCreated={(c) => setClientes(prev => [...prev, c])}
          onTurnoCreado={(t, c, l) => setTurnoCreadoData({ turno: t, cliente: c, lavador: l })}
          onClose={() => { setModalOpen(null); setCeldaPreseleccionada(null); }} />
      )}
      {modalOpen === "detalleTurno" && turnoSel && (
        <ModalDetalleTurno turno={turnoSel} clientes={clientes} staff={staff}
          onClose={() => { setModalOpen(null); setTurnoSel(null); }}
          onCambiarEstado={cambiarEstadoTurno}
          onCerrarTurno={cerrarTurno}
          onCobrar={(t) => { setModalOpen(null); setTurnoParaCobrar(t); }}
          onRendir={(t) => { setModalOpen(null); setTurnoParaRendir(t); }}
          onReasignar={reasignarTurno}
          modoOculto={modoOculto} />
      )}
      {turnoCreadoData && (
        <ModalTurnoCreado turno={turnoCreadoData.turno} cliente={turnoCreadoData.cliente} lavador={turnoCreadoData.lavador}
          mostrarToast={mostrarToast} onClose={() => setTurnoCreadoData(null)} />
      )}
      {mostrarNuevoClienteDirecto && (
        <ModalNuevoCliente COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} codigosExistentes={codigosExistentes}
          onClienteCreated={(c) => setClientes(prev => [...prev, c])} onClose={() => setMostrarNuevoClienteDirecto(false)} />
      )}
      {clienteParaEditar && (
        <ModalEditarCliente cliente={clienteParaEditar} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast}
          onClose={() => setClienteParaEditar(null)} />
      )}
      {mostrarLluvia && (
        <ModalLluviaAvanzado turnos={turnos} staff={staff} asistencias={asistencias} clientes={clientes}
          onAplicar={aplicarReorganizacionLluvia} onClose={() => setMostrarLluvia(false)} />
      )}
      {mostrarConfig && (
        <ModalConfigCompleta config={config} mostrarToast={mostrarToast} modoOculto={modoOculto}
          onGuardar={async (nuevaConfig) => {
            setConfig(nuevaConfig);
            await fsSave("config", "general", nuevaConfig);
            setModoPrueba(nuevaConfig.modoPrueba);
          }}
          onClose={() => setMostrarConfig(false)} />
      )}
      {mostrarGestionLav && (
        <ModalGestionLavadores staff={staff} COL_STAFF={COL_STAFF} mostrarToast={mostrarToast}
          onClose={() => setMostrarGestionLav(false)} />
      )}
      {lavadorRuta && (
        <ModalRutaLavador lavador={lavadorRuta} turnos={turnos} clientes={clientes}
          onClose={() => setLavadorRuta(null)} />
      )}
      {lavadorOperacion && modoOculto && (
        <ModalOperacion lavador={lavadorOperacion} onRegistrar={registrarOperacion}
          onClose={() => setLavadorOperacion(null)} />
      )}
      {turnoParaCobrar && modoOculto && (
        <ModalCobro turno={turnoParaCobrar} onRegistrar={registrarCobro}
          onClose={() => setTurnoParaCobrar(null)} />
      )}
      {turnoParaRendir && modoOculto && (
        <ModalRendicion turno={turnoParaRendir} onRegistrar={registrarRendicion}
          onClose={() => setTurnoParaRendir(null)} />
      )}
      {avisoFijo && <AvisoFijo msg={avisoFijo.msg} tipo={avisoFijo.tipo} onClose={() => setAvisoFijo(null)} />}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
