import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, writeBatch, query, where, orderBy
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
const FRANJAS = ["09:00","10:30","12:00","13:30","15:00","16:30","18:00"];
const FRANJA_DURACION = 90;

const DISTANCIAS_DEFAULT = {
  moto: { cerca: 25, lejos: 40, fz: 40 },
  bici: { cerca: 15, lejos: 25, fz: 25 },
  pie:  { cerca: 7,  lejos: 12, fz: 12 },
};

const TIEMPOS_LAVADO_BASE = {
  "Chico": 30,
  "Mediano": 45,
  "Camioneta": 60,
};

const TAMANOS_DEFAULT = [
  { id:"chico",     label:"Chico",     precio:25000 },
  { id:"mediano",   label:"Mediano",   precio:28000 },
  { id:"camioneta", label:"Camioneta", precio:32000 },
];

const COLORES = [
  "#93c5fd","#c4b5fd","#fca5a5","#fdba74","#86efac","#67e8f9",
  "#a5b4fc","#f0abfc","#fcd34d","#a7f3d0","#bae6fd","#fecdd3",
];

const STAFF_SEED = [
  {nombre:"Jhony",     transporte:"moto",color:"#93c5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Sergio",    transporte:"moto",color:"#c4b5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Alexander", transporte:"moto",color:"#fca5a5",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Maxi",      transporte:"moto",color:"#fdba74",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Rene",      transporte:"moto",color:"#86efac",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Brandon",   transporte:"moto",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Jorge",     transporte:"moto",color:"#a5b4fc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Emiliano",  transporte:"moto",color:"#f0abfc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Gaby",      transporte:"moto",color:"#fcd34d",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Javi",      transporte:"moto",color:"#a7f3d0",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Franco",    transporte:"moto",color:"#bae6fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Fede",      transporte:"moto",color:"#fecdd3",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Elias",     transporte:"moto",color:"#93c5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Alvaro",    transporte:"bici",color:"#c4b5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Nestor",    transporte:"bici",color:"#fca5a5",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Matias",    transporte:"bici",color:"#fdba74",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Luis",      transporte:"bici",color:"#86efac",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Bruno",     transporte:"bici",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0, telefono:""},
  {nombre:"Nico Alto", transporte:"bici",color:"#a5b4fc",whatsapp:true, rol:"lavador",especial:"rapido", saldoPendiente:0, telefono:""},
  {nombre:"Hernán",    transporte:"bici",color:"#f0abfc",whatsapp:false,rol:"lavador",especial:"avisar_presencia", saldoPendiente:0, telefono:""},
  {nombre:"Gastón",    transporte:"bici",color:"#fcd34d",whatsapp:false,rol:"lavador",especial:"llamar_telefono", saldoPendiente:0, telefono:""},
];

const BARRIOS_INICIALES = {
  "olivos":"OLI","martinez":"MAR","florida":"FLO","san isidro":"SIS",
  "acassuso":"ACA","la lucila":"LAL","boulogne":"BOU","vicente lopez":"VLO",
  "munro":"MUN","villa adelina":"VAD","beccar":"BEC",
};
let LISTA_BARRIOS = Object.keys(BARRIOS_INICIALES).map(k=>k.charAt(0).toUpperCase()+k.slice(1));

const CLIENTES_SEED = [
  {nombre:"Victoria",  telefono:"", direccion:"Dardo Rocha 3278",              barrio:"Olivos",     autosHabituales:3, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-001-Victoria"},
  {nombre:"Martin",    telefono:"", direccion:"Colectora Panamericana 2065",   barrio:"San Isidro", autosHabituales:3, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"SIS-001-Martin"},
  {nombre:"Micaela",   telefono:"", direccion:"Eduardo Costa 902",             barrio:"Acassuso",   autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"ACA-001-Micaela"},
  {nombre:"Hyundai",   telefono:"", direccion:"Av. Santa Fe 2627",             barrio:"Martínez",   autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)", tipo:"🔥 Top", deuda:0, codigo:"MAR-001-Hyundai"},
];

const NOTAS_PREDEFINIDAS = [
  "Cliente detallista","Insectos de ruta","Barro extremo","Decir precio antes",
  "Avisar cuando va","No usar revividor","Llevar doble alargue","Auto muy sucio","Cliente nuevo",
];

function codigoBarrio(barrioNombre) {
  if(!barrioNombre || barrioNombre.trim() === "" || barrioNombre.toLowerCase() === "desconocido") return "DES";
  const limpio = barrioNombre.replace(/[\(\)\[\],]/g," ").replace(/\s+/g," ").trim();
  const b = limpio.toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));
  for(const [k,v] of Object.entries(BARRIOS_INICIALES)) {
    if(b.includes(k)) return v;
  }
  const cod = b.replace(/[\s,]+/g,"").substring(0,3).toUpperCase();
  if(!LISTA_BARRIOS.find(x=>x.toLowerCase()===limpio.toLowerCase())) LISTA_BARRIOS.push(limpio);
  return cod;
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const hoy = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ar = new Date(utc - 3 * 60 * 60000);
  const y = ar.getFullYear();
  const m = String(ar.getMonth()+1).padStart(2,"0");
  const d = String(ar.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
};
const fechaAR     = (iso) => { if(!iso) return ""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; };
const horaAR      = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const ar = new Date(utc - 3*60*60000);
  return `${String(ar.getHours()).padStart(2,"0")}:${String(ar.getMinutes()).padStart(2,"0")}`;
};
const horaARFull  = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const ar = new Date(utc - 3*60*60000);
  return `${String(ar.getHours()).padStart(2,"0")}:${String(ar.getMinutes()).padStart(2,"0")}:${String(ar.getSeconds()).padStart(2,"0")}`;
};
const franjasValidas = () => {
  const ahora = new Date();
  const minutos = ahora.getHours()*60 + ahora.getMinutes() + 30;
  return FRANJAS.filter(h => {
    const [hr,mn] = h.split(":").map(Number);
    return hr*60+mn > minutos;
  });
};
const formatP     = n  => "$" + Number(n||0).toLocaleString("es-AR");
const sinAcentos  = s  => (s||"").toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));

function mostrarTelefono(cliente) {
  const telefono = cliente?.telefono;
  if (telefono && telefono !== "") return `📞 ${telefono}`;
  return "📞 Sin registrar";
}

function capitalizar(nombre) {
  if(!nombre) return "";
  const minusculas = ["de","del","la","las","los","el","y","a","en","von","van","di","da","do","das","dos"];
  return nombre.trim().split(/\s+/).map((p,i)=>{
    const low = p.toLowerCase();
    if(i>0 && minusculas.includes(low)) return low;
    return low.charAt(0).toUpperCase()+low.slice(1);
  }).join(" ");
}

function distKm(lat1,lng1,lat2,lng2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
const kmToCuadras = km => km * 10;

const _geocache = {};
async function geocodificar(dir) {
  const resultadoDefault = { 
    lat:BASE_LAT, lng:BASE_LNG, barrio:"", codigoPostal:"", 
    provincia:"", ciudad:"", encontrado:false 
  };
  if(!dir || dir.trim().length < 5) return resultadoDefault;
  if(_geocache[dir]) return _geocache[dir];
  
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&viewbox=-58.55,-34.45,-58.40,-34.55&bounded=0`,{
      headers:{"Accept-Language":"es","User-Agent":"SofiaLavados/7.0"}
    });
    const data = await res.json();
    
    if(data && data.length>0) {
      let mejorResultado = data[0];
      let menorDistancia = Infinity;
      
      for(const item of data) {
        const addr = item.address || {};
        const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || "";
        if(barrio) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const dist = Math.sqrt(Math.pow(lat-BASE_LAT,2) + Math.pow(lng-BASE_LNG,2));
          if(dist < menorDistancia) {
            menorDistancia = dist;
            mejorResultado = item;
          }
        }
      }
      
      const addr = mejorResultado.address || {};
      const barrio = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || addr.village || "";
      
      const coords = { 
        lat:parseFloat(mejorResultado.lat), 
        lng:parseFloat(mejorResultado.lon), 
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
    horaFin: `${String(hrFin).padStart(2,"0")}:${String(mnFin).padStart(2,"0")}`,
    duracion: duracionTotal,
    duracionBase,
    slotsOcupados: Math.ceil(duracionTotal / FRANJA_DURACION)
  };
}

function slotsOcupados(horaInicio, cantAutos, tipoVehiculo) {
  const idx = FRANJAS.indexOf(horaInicio);
  if (idx < 0) return [horaInicio];
  const fin = calcularFinTurno(horaInicio, tipoVehiculo, cantAutos);
  const slots = fin.slotsOcupados;
  return Array.from({length: slots}, (_, i) => FRANJAS[idx + i]).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════
const fsGet    = async (col,id)       => { if(!db)return null; try{const s=await getDoc(doc(db,col,id));return s.exists()?{id:s.id,...s.data()}:null;}catch{return null;} };
const fsSave   = async (col,id,data)  => { if(!db)return; try{await setDoc(doc(db,col,id),{...data,_ts:serverTimestamp()},{merge:true});}catch{} };
const fsAdd    = async (col,data)     => { if(!db)return null; try{const r=await addDoc(collection(db,col),{...data,_ts:serverTimestamp()});return r.id;}catch{return null;} };
const fsDel    = async (col,id)       => { if(!db)return; try{await deleteDoc(doc(db,col,id));}catch{} };
const fsList   = async (col)          => { if(!db)return []; try{const s=await getDocs(collection(db,col));return s.docs.map(d=>({id:d.id,...d.data()}));}catch{return[];} };
const fsUpdate = async (col,id,data)  => { if(!db)return; try{await updateDoc(doc(db,col,id),data);}catch{} };

// ═══════════════════════════════════════════════════════════════
//  EXPORT HELPERS (JSON / CSV / PDF)
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
  win.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#f0f0f0}h2{color:#333}</style>
    </head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 300);
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
//  COMPONENTES BASE (SOFT PASTELS)
// ═══════════════════════════════════════════════════════════════
function Toast({msg,tipo,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const styles = {
    ok:   {bg:"#ecfdf5", border:"#a7f3d0", text:"#064e3b", icon:"#059669"},
    error:{bg:"#fef2f2", border:"#fecaca", text:"#991b1b", icon:"#dc2626"},
    warn: {bg:"#fffbeb", border:"#fde68a", text:"#92400e", icon:"#d97706"},
  };
  const s = styles[tipo] || styles.ok;
  return (
    <div style={{
      position:"fixed",bottom:24,right:24,zIndex:9999,
      background:s.bg, border:`1px solid ${s.border}`, borderLeft:`4px solid ${s.icon}`,
      color:s.text, padding:"14px 20px", borderRadius:14,
      fontSize:13, fontWeight:600, fontFamily:"'Inter',system-ui,sans-serif",
      boxShadow:"0 8px 30px rgba(0,0,0,.06)", maxWidth:320,
      animation:"fadeInUp .3s ease-out", display:"flex", alignItems:"center", gap:10
    }}>
      <span style={{
        display:"inline-flex",alignItems:"center",justifyContent:"center",
        width:24,height:24,borderRadius:"50%",background:`${s.icon}18`,color:s.icon,fontSize:12
      }}>
        {tipo==="ok"?"✓":tipo==="error"?"✗":"⚠"}
      </span>
      {msg}
    </div>
  );
}

function AvisoFijo({msg, tipo="warn", onClose}) {
  const styles = {
    ok:   {bg:"#ecfdf5", border:"#a7f3d0", text:"#064e3b"},
    warn: {bg:"#fffbeb", border:"#fde68a", text:"#92400e"},
    error:{bg:"#fef2f2", border:"#fecaca", text:"#991b1b"},
  };
  const s = styles[tipo] || styles.warn;
  return (
    <div style={{
      position:"fixed",bottom:24,left:24,zIndex:9998,
      background:s.bg, border:`2px solid ${s.border}`, 
      color:s.text, padding:"12px 18px", borderRadius:14,
      fontSize:12, fontWeight:700, fontFamily:"'Inter',system-ui,sans-serif",
      boxShadow:"0 8px 30px rgba(0,0,0,.08)", maxWidth:340,
      display:"flex", alignItems:"center", gap:10,
      animation:"fadeInUp .3s ease-out"
    }}>
      <span style={{fontSize:16}}>⚠️</span>
      <span style={{flex:1}}>{msg}</span>
      {onClose && <button onClick={onClose} style={{background:"transparent",border:"none",color:s.text,cursor:"pointer",fontSize:16,fontWeight:700}}>✕</button>}
    </div>
  );
}

function Modal({titulo,onClose,children,wide}) {
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(241,245,249,.6)",backdropFilter:"blur(12px)",
      zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,
      animation:"fadeIn .2s ease-out"
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,
        padding:24,width:"100%",maxWidth:wide?640:440,maxHeight:"92vh",overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,.06)",animation:"scaleIn .25s ease-out"
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{titulo}</div>
          <button onClick={onClose} style={{
            background:"#f1f5f9",border:"none",color:"#64748b",cursor:"pointer",
            fontSize:16,lineHeight:1,padding:"6px 10px",borderRadius:10,transition:"all .15s"
          }} onMouseOver={e=>e.target.style.background="#e2e8f0"} onMouseOut={e=>e.target.style.background="#f1f5f9"}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({children,onClick,color="primary",ghost,danger,disabled,full,sm,style={}}) {
  const palettes = {
    primary:  {bg:"#bfdbfe", hover:"#93c5fd", text:"#1e3a8a", shadow:"rgba(147,197,253,.3)"},
    secondary:{bg:"#ddd6fe", hover:"#c4b5fd", text:"#5b21b6", shadow:"rgba(196,181,253,.3)"},
    tertiary: {bg:"#a7f3d0", hover:"#6ee7b7", text:"#064e3b", shadow:"rgba(167,243,208,.3)"},
    success:  {bg:"#bbf7d0", hover:"#86efac", text:"#14532d", shadow:"rgba(187,247,208,.3)"},
    warning:  {bg:"#fed7aa", hover:"#fdba74", text:"#9a3412", shadow:"rgba(254,215,170,.3)"},
    danger:   {bg:"#fecaca", hover:"#fca5a5", text:"#991b1b", shadow:"rgba(254,202,202,.3)"},
    gray:     {bg:"#e2e8f0", hover:"#cbd5e1", text:"#334155", shadow:"rgba(0,0,0,.05)"},
  };
  const p = danger ? palettes.danger : (typeof color === "string" && palettes[color]) ? palettes[color] : {bg:color, hover:color, text:"#334155", shadow:"rgba(0,0,0,.05)"};

  const baseStyle = ghost ? {
    background:"transparent", border:`1.5px solid #cbd5e1`, color:"#475569", boxShadow:"none"
  } : disabled ? {
    background:"#f1f5f9", color:"#94a3b8", boxShadow:"none", border:"1px solid #e2e8f0"
  } : {
    background:p.bg, color:p.text, border:"1px solid transparent",
    boxShadow:`0 4px 14px ${p.shadow}`
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
    onMouseOver={e=>{if(!disabled&&!ghost){e.currentTarget.style.background=p.hover;e.currentTarget.style.transform="translateY(-2px)"}}}
    onMouseOut={e=>{if(!disabled&&!ghost){e.currentTarget.style.background=p.bg;e.currentTarget.style.transform="translateY(0)"}}}
    onClick={!disabled ? onClick : undefined}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  RELOJ EN VIVO
// ═══════════════════════════════════════════════════════════════
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
      fontSize:13, color:"#6b7280", fontWeight:700, 
      fontVariantNumeric:"tabular-nums", display:"flex", 
      alignItems:"center", gap:6, fontFamily:"'JetBrains Mono',monospace"
    }}>
      {fecha} • {hora} hs
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BUSCADOR DE CLIENTES
// ═══════════════════════════════════════════════════════════════
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
    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12,
    padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none",
    transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box",
    fontFamily:"'Inter',system-ui,sans-serif"
  };

  return (
    <div ref={wrapperRef} style={{position:"relative"}}>
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
          position:"absolute", top:"100%", left:0, right:0, zIndex:60,
          background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
          marginTop:4, maxHeight:220, overflowY:"auto",
          boxShadow:"0 8px 25px rgba(0,0,0,.08)"
        }}>
          {filtrados.length === 0 ? (
            busqueda.trim().length > 2 ? (
              <div style={{padding:14}}>
                <div style={{fontSize:12, color:"#9ca3af", marginBottom:8}}>No se encontraron resultados</div>
                <Btn sm color="tertiary" full onClick={()=>{
                  onCreateNew && onCreateNew(busqueda);
                  setAbierto(false);
                }}>
                  ➕ Crear "{busqueda}" como nuevo
                </Btn>
              </div>
            ) : (
              <div style={{padding:14, textAlign:"center", color:"#9ca3af", fontSize:12}}>Sin resultados</div>
            )
          ) : (
            filtrados.map(c => (
              <button key={c.id} onClick={() => { onChange(c.id); setBusqueda(c.nombre); setAbierto(false); }}
                style={{
                  display:"block", width:"100%", textAlign:"left", padding:"10px 14px",
                  background:"transparent", border:"none", cursor:"pointer",
                  borderBottom:"1px solid #f3f4f6", transition:"background .15s",
                  fontFamily:"'Inter',system-ui,sans-serif"
                }}
                onMouseOver={e=>e.currentTarget.style.background="#f9fafb"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:13, fontWeight:700, color:"#1e293b"}}>{c.nombre}</div>
                <div style={{fontSize:11, color:"#6b7280", fontFamily:"monospace"}}>{c.codigo} • {c.barrio}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO CLIENTE
// ═══════════════════════════════════════════════════════════════
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
    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12,
    padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"'Inter',system-ui,sans-serif"
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo="➕ Nuevo Cliente" onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        {error && <div style={{color:"#dc2626", fontSize:12, background:"#fef2f2", padding:10, borderRadius:8, border:"1px solid #fecaca"}}>⚠️ {error}</div>}
        
        <div><label style={labelStyle}>Nombre *</label>
          <input value={datos.nombre} onChange={e=>setDatos({...datos, nombre:e.target.value})} style={inputStyle} autoFocus />
        </div>
        <div><label style={labelStyle}>Teléfono</label>
          <input value={datos.telefono} onChange={e=>setDatos({...datos, telefono:e.target.value})} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Dirección *</label>
          <div style={{display:"flex", gap:8}}>
            <input value={datos.direccion} onChange={e=>setDatos({...datos, direccion:e.target.value})} style={{...inputStyle, flex:1}} />
            <button onClick={buscarDireccion} disabled={buscandoDir} style={{background:buscandoDir?"#e5e7eb":"#bfdbfe", border:"none", borderRadius:12, padding:"0 14px", cursor:buscandoDir?"not-allowed":"pointer", fontSize:16}}>{buscandoDir ? "⏳" : "📍"}</button>
          </div>
        </div>
        <div><label style={labelStyle}>Barrio *</label>
          <input value={datos.barrio} onChange={e=>{setDatos({...datos, barrio:e.target.value}); setAvisoGeo(null);}} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Nota</label>
          <input value={datos.nota} onChange={e=>setDatos({...datos, nota:e.target.value})} style={inputStyle} />
        </div>

        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="success" full onClick={guardar}>💾 Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL EDITAR CLIENTE
// ═══════════════════════════════════════════════════════════════
function ModalEditarCliente({ cliente, onClose, COL_CLIENTES, mostrarToast }) {
  const [datos, setDatos] = useState({...cliente});
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
  const inputStyle = { background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo={`✏️ Editar: ${cliente.nombre}`} onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div><label style={labelStyle}>Teléfono</label><input value={datos.telefono||""} onChange={e=>setDatos({...datos, telefono:e.target.value})} style={inputStyle} /></div>
        <div><label style={labelStyle}>Dirección</label><input value={datos.direccion||""} onChange={e=>setDatos({...datos, direccion:e.target.value})} style={inputStyle} /></div>
        <div><label style={labelStyle}>Barrio</label><input value={datos.barrio||""} onChange={e=>setDatos({...datos, barrio:e.target.value})} style={inputStyle} /></div>
        <div><label style={labelStyle}>Tipo</label>
          <select value={datos.tipo||""} onChange={e=>setDatos({...datos, tipo:e.target.value})} style={inputStyle}>
            <option value="⭐ Frecuente">⭐ Frecuente</option>
            <option value="🔥 Top">🔥 Top</option>
            <option value="💤 Ocasional">💤 Ocasional</option>
          </select>
        </div>
        <div><label style={labelStyle}>Autos Habituales</label><input type="number" value={datos.autosHabituales||1} onChange={e=>setDatos({...datos, autosHabituales:e.target.value})} style={inputStyle} /></div>
        <div><label style={labelStyle}>Nota</label><input value={datos.nota||""} onChange={e=>setDatos({...datos, nota:e.target.value})} style={inputStyle} /></div>
        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>💾 Guardar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL GESTIÓN DE LAVADORES (COMPLETO)
// ═══════════════════════════════════════════════════════════════
function ModalGestionLavadores({ staff, onClose, COL_STAFF, mostrarToast }) {
  const [nuevoLavador, setNuevoLavador] = useState({ nombre:"", telefono:"", transporte:"moto", color:"#93c5fd", rol:"lavador", especial:"" });
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
      setNuevoLavador({ nombre:"", telefono:"", transporte:"moto", color:"#93c5fd", rol:"lavador", especial:"" });
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

  const inputStyle = { background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"8px 12px", color:"#1e293b", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <Modal titulo="⚙️ Gestión Completa de Lavadores" onClose={onClose} wide>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        {!mostrarFormNuevo ? (
          <Btn color="success" full onClick={() => setMostrarFormNuevo(true)}>➕ Agregar Nuevo Lavador</Btn>
        ) : (
          <div style={{background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1.5px solid #a7f3d0", borderRadius:14, padding:16}}>
            <div style={{fontSize:13, fontWeight:800, color:"#064e3b", marginBottom:10}}>Nuevo Lavador</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
              <input placeholder="Nombre *" value={nuevoLavador.nombre} onChange={e=>setNuevoLavador({...nuevoLavador, nombre:e.target.value})} style={inputStyle} />
              <input placeholder="Teléfono WhatsApp" value={nuevoLavador.telefono} onChange={e=>setNuevoLavador({...nuevoLavador, telefono:e.target.value})} style={inputStyle} />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8}}>
              <select value={nuevoLavador.transporte} onChange={e=>setNuevoLavador({...nuevoLavador, transporte:e.target.value})} style={inputStyle}>
                <option value="moto">🏍️ Moto</option><option value="bici">🚲 Bici</option><option value="pie">🚶 A pie</option>
              </select>
              <select value={nuevoLavador.rol} onChange={e=>setNuevoLavador({...nuevoLavador, rol:e.target.value})} style={inputStyle}>
                <option value="lavador">Lavador</option><option value="encargado">Encargado</option>
              </select>
              <select value={nuevoLavador.especial} onChange={e=>setNuevoLavador({...nuevoLavador, especial:e.target.value})} style={inputStyle}>
                <option value="">Sin atributo</option>
                <option value="rapido">⚡ Rápido</option>
                <option value="avisar_presencia">🔴 Avisar presencia</option>
                <option value="llamar_telefono">📞 Llamar teléfono</option>
              </select>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
              <label style={{fontSize:11, fontWeight:700, color:"#064e3b"}}>Color:</label>
              <input type="color" value={nuevoLavador.color} onChange={e=>setNuevoLavador({...nuevoLavador, color:e.target.value})} style={{width:50, height:35, border:"none", background:"transparent"}} />
            </div>
            <div style={{display:"flex", gap:8}}>
              <Btn ghost onClick={() => setMostrarFormNuevo(false)} full>Cancelar</Btn>
              <Btn color="success" full onClick={guardarNuevo}>💾 Guardar</Btn>
            </div>
          </div>
        )}
        <div style={{display:"flex", flexDirection:"column", gap:8, maxHeight:"400px", overflowY:"auto"}}>
          <div style={{fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px"}}>Lavadores registrados ({staff.length})</div>
          {staff.sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"")).map(l => {
            const editando = editandoId === l.id;
            return (
              <div key={l.id} style={{background:"#ffffff", border:"1px solid #e5e7eb", borderRadius:12, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,.02)"}}>
                {!editando ? (
                  <>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <div style={{width:36, height:36, borderRadius:"50%", background:l.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff"}}>{l.nombre.charAt(0)}</div>
                        <div>
                          <div style={{fontSize:14, fontWeight:700, color:"#1e293b"}}>{l.nombre}</div>
                          <div style={{fontSize:11, color:"#6b7280"}}>{l.transporte} • {l.rol}{l.especial && ` • ${l.especial}`}</div>
                        </div>
                      </div>
                      <div style={{display:"flex", gap:4}}>
                        <button onClick={() => { setEditandoId(l.id); setDatosEdit({...l}); }} style={{background:"#dbeafe", border:"none", borderRadius:8, padding:"6px 10px", color:"#1e3a8a", cursor:"pointer", fontSize:11, fontWeight:700}}>✏️ Editar</button>
                        <button onClick={() => eliminarLavador(l)} style={{background:"#fef2f2", border:"none", borderRadius:8, padding:"6px 10px", color:"#991b1b", cursor:"pointer", fontSize:11, fontWeight:700}}>🗑️</button>
                      </div>
                    </div>
                    <div style={{fontSize:11, color:"#6b7280", fontFamily:"monospace"}}>📱 {l.telefono || "Sin teléfono"}</div>
                  </>
                ) : (
                  <div style={{display:"flex", flexDirection:"column", gap:8}}>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                      <input value={datosEdit.nombre||""} onChange={e=>setDatosEdit({...datosEdit, nombre:e.target.value})} placeholder="Nombre" style={inputStyle} />
                      <input value={datosEdit.telefono||""} onChange={e=>setDatosEdit({...datosEdit, telefono:e.target.value})} placeholder="Teléfono" style={inputStyle} />
                    </div>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6}}>
                      <select value={datosEdit.transporte||"moto"} onChange={e=>setDatosEdit({...datosEdit, transporte:e.target.value})} style={inputStyle}>
                        <option value="moto">🏍️ Moto</option><option value="bici">🚲 Bici</option><option value="pie">🚶 Pie</option>
                      </select>
                      <select value={datosEdit.rol||"lavador"} onChange={e=>setDatosEdit({...datosEdit, rol:e.target.value})} style={inputStyle}>
                        <option value="lavador">Lavador</option><option value="encargado">Encargado</option>
                      </select>
                      <select value={datosEdit.especial||""} onChange={e=>setDatosEdit({...datosEdit, especial:e.target.value})} style={inputStyle}>
                        <option value="">Sin atributo</option>
                        <option value="rapido">⚡ Rápido</option>
                        <option value="avisar_presencia">🔴 Avisar</option>
                        <option value="llamar_telefono">📞 Llamar</option>
                      </select>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <label style={{fontSize:11}}>Color:</label>
                      <input type="color" value={datosEdit.color||"#93c5fd"} onChange={e=>setDatosEdit({...datosEdit, color:e.target.value})} />
                    </div>
                    <div style={{display:"flex", gap:6}}>
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

// ═══════════════════════════════════════════════════════════════
//  MODAL RUTA DEL LAVADOR
// ═══════════════════════════════════════════════════════════════
function ModalRutaLavador({ lavador, turnos, clientes, onClose }) {
  const turnosLavador = turnos
    .filter(t => t.lavadorId === lavador.id)
    .sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
  
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  
  const pendientes = turnosLavador.filter(t => {
    const [h,m] = t.hora.split(":").map(Number);
    return (h*60+m) >= minutosAhora && t.estado !== "terminado";
  });
  
  const terminados = turnosLavador.filter(t => t.estado === "terminado");

  return (
    <Modal titulo={`🗺️ Ruta de ${lavador.nombre}`} onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{background:"linear-gradient(135deg,#dbeafe,#eff6ff)", padding:14, borderRadius:12, border:"1px solid #bfdbfe"}}>
          <div style={{fontSize:12, fontWeight:800, color:"#1e3a8a", marginBottom:8}}>📍 Próximos clientes ({pendientes.length})</div>
          {pendientes.length === 0 ? (
            <div style={{fontSize:12, color:"#64748b", fontStyle:"italic"}}>Sin turnos pendientes</div>
          ) : (
            pendientes.map((t, i) => {
              const cli = clientes.find(c => c.id === t.clienteId);
              return (
                <div key={t.id} style={{display:"flex", gap:10, padding:"8px 0", borderBottom: i < pendientes.length-1 ? "1px dashed #cbd5e1" : "none"}}>
                  <div style={{fontWeight:800, color:"#1e3a8a", fontSize:13, minWidth:50}}>{t.hora}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:700, color:"#1e293b"}}>{t.clienteNombre}</div>
                    <div style={{fontSize:11, color:"#6b7280"}}>📍 {cli?.direccion || "—"}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div style={{background:"#f9fafb", padding:14, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <div style={{fontSize:12, fontWeight:800, color:"#059669", marginBottom:8}}>✅ Ya atendidos hoy ({terminados.length})</div>
          {terminados.length === 0 ? (
            <div style={{fontSize:12, color:"#64748b", fontStyle:"italic"}}>Aún no atendió clientes</div>
          ) : (
            terminados.map((t, i) => (
              <div key={t.id} style={{display:"flex", gap:10, padding:"6px 0", borderBottom: i < terminados.length-1 ? "1px dashed #e5e7eb" : "none"}}>
                <div style={{fontSize:11, color:"#6b7280", minWidth:50}}>{t.hora}</div>
                <div style={{fontSize:12, color:"#334155"}}>{t.clienteNombre}</div>
              </div>
            ))
          )}
        </div>
        
        <Btn ghost full onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL LLUVIA AVANZADO (3 FLUJOS)
// ═══════════════════════════════════════════════════════════════
function ModalLluviaAvanzado({ turnos, staff, asistencias, onClose, onAplicar, clientes }) {
  const turnosPendientes = turnos.filter(t => t.estado === "pendiente" || t.estado === "en_progreso");
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
      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        <div style={{fontSize:12, color:"#6b7280", marginBottom:8}}>
          Elegí qué hace cada lavador. Los turnos se reorganizan según tu selección.
        </div>
        
        {lavConTurnos.map(s => {
          const turnosDelLav = turnosPendientes.filter(t => t.lavadorId === s.id);
          return (
            <div key={s.id} style={{padding:"12px 14px", background:"#f9fafb", border:`1.5px solid ${s.color}66`, borderRadius:12}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <div style={{width:32, height:32, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14}}>{s.nombre.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color:"#1e293b"}}>{s.nombre}</div>
                  <div style={{fontSize:11, color:"#6b7280"}}>{turnosDelLav.length} turno{turnosDelLav.length !== 1 ? "s" : ""} pendiente{turnosDelLav.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              
              <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
                {[
                  ["queda", "✅ Se queda"],
                  ["liberar_reasignar", "🔄 Se va — reasignar"],
                  ["ausente", "🚪 Se va — cancelar"],
                ].map(([v, l]) => (
                  <button key={v} onClick={() => setEstadoLav(prev => ({...prev, [s.id]: v}))}
                    style={{
                      padding:"6px 12px", borderRadius:8, fontSize:11, cursor:"pointer",
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
                <div style={{padding:"8px 10px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8}}>
                  <div style={{fontSize:10, color:"#92400e", marginBottom:6, fontWeight:700}}>
                    ¿Cuáles cancelar? (los no tildados se reasignan)
                  </div>
                  {turnosDelLav.map(t => {
                    const cli = clientes.find(c => c.id === t.clienteId);
                    return (
                      <label key={t.id} style={{display:"flex", alignItems:"center", gap:6, padding:"4px 0", cursor:"pointer"}}>
                        <input type="checkbox"
                          checked={turnosCancelar[s.id]?.includes(t.id) || false}
                          onChange={() => toggleTurnoCancelar(s.id, t.id)} />
                        <span style={{fontSize:11, color:"#1e293b"}}>{t.hora} - {t.clienteNombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {lavQuedan.length === 0 && (
          <div style={{padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#991b1b", fontSize:12, fontWeight:600}}>
            ⚠️ No quedan lavadores. Todos los turnos serán cancelados.
          </div>
        )}
        
        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={aplicar}>☀️ Reanudar y reorganizar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL TURNO CREADO
// ═══════════════════════════════════════════════════════════════
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
👷 *Lavador:* ${lavador?.nombre || "Sin asignar"}
${turno.nota ? `📝 *Nota:* ${turno.nota}` : ""}
${cliente?.nota ? `⚠️ *Nota del cliente:* ${cliente.nota}` : ""}

📅 Fecha: ${fechaAR(hoy())}`;

  const copiarAlPortapapeles = async () => {
    try { await navigator.clipboard.writeText(textoTurno); setCopiado(true); mostrarToast("📋 Copiado", "ok"); setTimeout(() => setCopiado(false), 2000); }
    catch (err) { mostrarToast("Error al copiar", "error"); }
  };

  const telefonoLavador = lavador?.telefono ? lavador.telefono.replace(/\D/g, "") : "";
  const whatsappLink = telefonoLavador ? `https://wa.me/549${telefonoLavador}?text=${encodeURIComponent(textoTurno)}` : `https://wa.me/?text=${encodeURIComponent(textoTurno)}`;

  return (
    <Modal titulo="✅ Turno Creado Exitosamente" onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div style={{background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #a7f3d0", borderRadius:14, padding:16}}>
          <pre style={{whiteSpace:"pre-wrap", fontFamily:"'Inter',system-ui,sans-serif", fontSize:12, color:"#1e293b", margin:0, lineHeight:1.6, background:"#ffffff", padding:12, borderRadius:10, border:"1px solid #e5e7eb"}}>{textoTurno}</pre>
        </div>
        
        {lavador && !lavador.telefono && (
          <div style={{background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:12, fontSize:12, color:"#991b1b", fontWeight:600}}>
            ⚠️ {lavador.nombre} no tiene teléfono registrado. Asignale uno en Gestión de Lavadores.
          </div>
        )}
        
        <div style={{display:"flex", gap:8}}>
          <Btn color="primary" full onClick={copiarAlPortapapeles}>{copiado ? "✓ Copiado" : "📋 Copiar"}</Btn>
          <Btn color="success" full onClick={() => window.open(whatsappLink, "_blank")}>💬 WhatsApp</Btn>
        </div>
        <Btn ghost full onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO TURNO (CON FZ Y MULTI-SLOT)
// ═══════════════════════════════════════════════════════════════
function ModalNuevoTurno({ onClose, clientes, staff, turnos, asistencias, COL_TURNOS, COL_CLIENTES, mostrarToast, clientePreseleccionado, onClienteCreated, onTurnoCreado, codigosExistentes, config }) {
  const [clienteId, setClienteId] = useState(clientePreseleccionado?.id || "");
  const [hora, setHora] = useState(franjasValidas()[0] || FRANJAS[0]);
  const [tamaño, setTamaño] = useState(TAMANOS_DEFAULT[1]);
  const [cantidadAutos, setCantidadAutos] = useState(clientePreseleccionado?.autosHabituales || 1);
  const [lavadorId, setLavadorId] = useState("");
  const [nota, setNota] = useState("");
  const [manualFZ, setManualFZ] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);
  
  // Estado de coordenadas para FZ
  const [coordsCliente, setCoordsCliente] = useState(null);

  const clienteSel = clientes.find(c => c.id === clienteId);
  const presentes = staff.filter(s => asistencias[s.id]);

  const precioUnitario = tamaño.precio;
  const precioBaseTotal = precioUnitario * cantidadAutos;
  
  // Cálculo de FZ
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
  const precioFinal = esFZ ? Math.round(precioBaseTotal * (1 + fzPct/100)) : precioBaseTotal;
  
  const tiempoBase = TIEMPOS_LAVADO_BASE[tamaño.label] || 45;
  const tiempoTotal = tiempoBase * cantidadAutos;
  const formatoTiempo = tiempoTotal >= 60 
    ? `${Math.floor(tiempoTotal/60)}h ${tiempoTotal%60 > 0 ? `${tiempoTotal%60}min` : ""}` 
    : `${tiempoTotal} min`;
  
  const slotsOcupadosCount = Math.ceil(tiempoTotal / FRANJA_DURACION);

  useEffect(() => {
    if (clientePreseleccionado?.id) {
      setClienteId(clientePreseleccionado.id);
      if (clientePreseleccionado.autosHabituales) setCantidadAutos(clientePreseleccionado.autosHabituales);
      if (clientePreseleccionado.nota) setNota(`📋 ${clientePreseleccionado.nota}`);
    }
  }, [clientePreseleccionado]);

  // Geocodificar dirección cuando cambia el cliente
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

  const guardar = async () => {
    if (!clienteId) return mostrarToast("Seleccioná un cliente", "warn");
    try {
      const horasOcupadas = slotsOcupados(hora, cantidadAutos, tamaño.label);
      const turnoData = {
        fecha: hoy(), hora, clienteId,
        clienteNombre: clienteSel?.nombre || "Desconocido",
        clienteCodigo: clienteSel?.codigo || "",
        auto: tamaño.label,
        precioUnitario: precioUnitario,
        cantidadAutos: cantidadAutos,
        precio: precioFinal,
        lavadorId, estado: "pendiente", nota,
        esFZ, cuadras: Math.round(cuadras),
        horasOcupadas,
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

  const inputStyle = { background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo="➕ Nuevo Turno" onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        
        <div>
          <label style={labelStyle}>Cliente</label>
          <BuscadorClientes clientes={clientes} value={clienteId} onChange={(id) => setClienteId(id)}
            onCreateNew={(nombre) => { setNewClientName(nombre); setShowNewClient(true); }} />
        </div>

        {clienteSel ? (
          <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", padding:16, borderRadius:16, border:"2px solid #93c5fd" }}>
            <div style={{fontSize:16, fontWeight:900, color:"#1e3a8a"}}>{clienteSel.nombre}</div>
            <div style={{fontSize:12, color:"#7c3aed", fontFamily:"monospace", marginTop:4, fontWeight:800, background:"#ffffff", display:"inline-block", padding:"4px 10px", borderRadius:6, border:"1px solid #ddd6fe"}}>{clienteSel.codigo}</div>
            <div style={{fontSize:12, color:"#1e3a8a", lineHeight:1.7, marginTop:8}}>
              <div>📍 <strong>{clienteSel.direccion || "Sin dirección"}</strong> • {clienteSel.barrio}</div>
              <div>{mostrarTelefono(clienteSel)}</div>
            </div>
            {esFZAuto && (
              <div style={{marginTop:8, padding:"8px 12px", background:"#fef3c7", border:"1.5px solid #fcd34d", borderRadius:8, fontSize:11, fontWeight:700, color:"#92400e"}}>
                ⬡ FUERA DE ZONA - {Math.round(cuadras)} cuadras (radio: {radio}) - Se aplica +{fzPct}%
              </div>
            )}
          </div>
        ) : (
          <div style={{background:"#f9fafb", padding:16, borderRadius:14, border:"1.5px dashed #cbd5e1", textAlign:"center", color:"#94a3b8", fontSize:12}}>Buscá o creá un cliente</div>
        )}

        <div>
          <label style={labelStyle}>Horario</label>
          <select value={hora} onChange={e=>setHora(e.target.value)} style={inputStyle}>
            {FRANJAS.map(h => {
              const ahora = new Date();
              const minutosAhora = ahora.getHours()*60 + ahora.getMinutes();
              const [hr,mn] = h.split(":").map(Number);
              const pasada = hr*60+mn < minutosAhora;
              return <option key={h} value={h} disabled={pasada}>{h} hs {pasada ? "(pasada)" : ""}</option>;
            })}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Vehículo</label>
          <div style={{ display:"flex", gap:8 }}>
            {TAMANOS_DEFAULT.map(t=>(
              <button key={t.id} onClick={()=>setTamaño(t)} style={{
                flex:1, padding:"12px 8px", borderRadius:14, fontSize:12, fontWeight:700, cursor:"pointer",
                background: tamaño.id===t.id ? "#dbeafe" : "#f9fafb",
                border: tamaño.id===t.id ? "1.5px solid #93c5fd" : "1.5px solid #e5e7eb",
                color: tamaño.id===t.id ? "#1e3a8a" : "#6b7280"
              }}>
                {t.label}<br/><span style={{fontSize:11,opacity:.8}}>{formatP(t.precio)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Cantidad de Autos</label>
          <div style={{ display:"flex", gap:6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={()=>setCantidadAutos(n)} style={{
                flex:1, padding:"10px 4px", borderRadius:12, fontSize:14, fontWeight:800, cursor:"pointer",
                background: cantidadAutos===n ? "#dbeafe" : "#f9fafb",
                border: cantidadAutos===n ? "2px solid #3b82f6" : "1.5px solid #e5e7eb",
                color: cantidadAutos===n ? "#1e3a8a" : "#6b7280"
              }}>
                {n}{n===5 ? "+" : ""}
              </button>
            ))}
          </div>
          {slotsOcupadosCount > 1 && (
            <div style={{marginTop:6, fontSize:11, color:"#7c3aed", fontWeight:700}}>
              📅 Ocupa {slotsOcupadosCount} franjas ({formatoTiempo})
            </div>
          )}
          <div style={{
            marginTop:8, padding:"10px 14px", borderRadius:12,
            background: esFZ ? "linear-gradient(135deg,#fef3c7,#fffbeb)" : "#f9fafb",
            border: esFZ ? "1.5px solid #fcd34d" : "1px solid #e5e7eb",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            fontSize:13, fontWeight:700
          }}>
            <span style={{color: esFZ ? "#92400e" : "#1e3a8a"}}>
              💰 Total: <strong>{formatP(precioFinal)}</strong>
              {esFZ && <span style={{fontSize:11, fontWeight:600}}> (⬡ FZ +{fzPct}%)</span>}
            </span>
            <span style={{color:"#059669"}}>⏱️ {formatoTiempo}</span>
          </div>
          <label style={{display:"flex", alignItems:"center", gap:8, marginTop:8, fontSize:11, cursor:"pointer"}}>
            <input type="checkbox" checked={manualFZ} onChange={e=>setManualFZ(e.target.checked)} />
            <span style={{color:"#6b7280"}}>Forzar FZ manualmente</span>
          </label>
        </div>

        <div>
          <label style={labelStyle}>Lavador Asignado</label>
          <select value={lavadorId} onChange={e=>setLavadorId(e.target.value)} style={inputStyle}>
            <option value="">-- Sin asignar --</option>
            {presentes.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(s=>(<option key={s.id} value={s.id}>{s.nombre} ({s.transporte})</option>))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notas</label>
          <input value={nota} onChange={e=>setNota(e.target.value)} onFocus={()=>setMostrarNotas(true)} placeholder="Observaciones..." style={inputStyle} />
          {mostrarNotas && (
            <div style={{display:"flex", flexWrap:"wrap", gap:4, marginTop:6}}>
              {NOTAS_PREDEFINIDAS.map(n => (
                <button key={n} onClick={()=>setNota(prev => prev.includes(n) ? prev.replace(n+", ","").replace(n,"") : (prev ? prev + ", " + n : n))}
                  style={{padding:"4px 8px", borderRadius:6, fontSize:10, cursor:"pointer",
                    background: nota.includes(n) ? "#dbeafe" : "#f1f5f9",
                    border: `1px solid ${nota.includes(n) ? "#93c5fd" : "#e2e8f0"}`,
                    color: nota.includes(n) ? "#1e3a8a" : "#64748b"}}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
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

// ═══════════════════════════════════════════════════════════════
//  MODAL DETALLE TURNO (GRILLA)
// ═══════════════════════════════════════════════════════════════
function ModalDetalleTurno({ turno, clientes, staff, onClose, onCambiarEstado, onCerrarTurno }) {
  const cliente = clientes.find(c => c.id === turno.clienteId);
  const lavador = staff.find(s => s.id === turno.lavadorId);
  const cantAutos = turno.cantidadAutos || 1;
  
  return (
    <Modal titulo={`🔍 Turno: ${turno.hora} hs`} onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div style={{background:"#f9fafb", padding:14, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <div style={{fontSize:15, fontWeight:800, color:"#1e293b", marginBottom:6}}>{turno.clienteNombre}</div>
          <div style={{fontSize:11, color:"#7c3aed", fontFamily:"monospace", marginBottom:8}}>{turno.clienteCodigo}</div>
          <div style={{fontSize:12, color:"#475569", lineHeight:1.7}}>
            <div>📍 {cliente?.direccion || "—"}</div>
            <div>🚙 {turno.auto} {cantAutos > 1 && `(×${cantAutos})`}</div>
            <div>👷 {lavador?.nombre || "Sin asignar"}</div>
            <div>💵 {formatP(turno.precio)} {turno.esFZ && "(⬡ FZ)"}</div>
          </div>
          {turno.nota && <div style={{marginTop:8, padding:"6px 10px", background:"#fef3c7", border:"1px solid #fde68a", borderRadius:8, fontSize:11, color:"#92400e", fontWeight:600}}>📝 {turno.nota}</div>}
        </div>
        
        <div style={{display:"flex", flexDirection:"column", gap:6}}>
          {turno.estado === "pendiente" && (
            <Btn color="warning" full onClick={() => { onCambiarEstado(turno.id, "en_progreso"); onClose(); }}>🚗 Marcar Llegó</Btn>
          )}
          {turno.estado === "en_progreso" && (
            <Btn color="success" full onClick={() => { onCerrarTurno(turno); onClose(); }}>✅ Marcar Terminado</Btn>
          )}
          {turno.estado !== "terminado" && turno.estado !== "lluvia" && (
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
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL CONFIGURACIÓN COMPLETO
// ═══════════════════════════════════════════════════════════════
function ModalConfigCompleta({ config, onGuardar, onClose, mostrarToast }) {
  const [precios, setPrecios] = useState(config.precios || TAMANOS_DEFAULT);
  const [fzPct, setFzPct] = useState(config.fzPct || 20);
  const [distancias, setDistancias] = useState(config.distancias || DISTANCIAS_DEFAULT);
  const [modoPrueba, setModoPrueba] = useState(config.modoPrueba || false);

  const guardar = () => {
    onGuardar({ precios, fzPct, distancias, modoPrueba });
    mostrarToast("Configuración guardada", "ok");
    onClose();
  };

  const inputStyle = { background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"8px 12px", color:"#1e293b", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo="⚙️ Configuración General" onClose={onClose} wide>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        
        <div>
          <div style={{fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:10}}>💰 Precios por Tamaño</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {precios.map((p, i) => (
              <div key={p.id} style={{display:"grid", gridTemplateColumns:"1fr 150px", gap:8}}>
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
          <div style={{fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:10}}>⬡ Recargo Fuera de Zona</div>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <input type="number" value={fzPct} onChange={e => setFzPct(Number(e.target.value))} style={{...inputStyle, maxWidth:120}} />
            <span style={{fontSize:12, color:"#6b7280"}}>% de recargo automático</span>
          </div>
        </div>

        <div>
          <div style={{fontSize:13, fontWeight:800, color:"#1e293b", marginBottom:10}}>📏 Distancias por Transporte (cuadras)</div>
          {["moto", "bici", "pie"].map(trans => (
            <div key={trans} style={{marginBottom:12, padding:10, background:"#f9fafb", borderRadius:10, border:"1px solid #e5e7eb"}}>
              <div style={{fontSize:12, fontWeight:700, color:"#1e293b", marginBottom:8}}>
                {trans === "moto" ? "🏍️ Moto" : trans === "bici" ? "🚲 Bici" : "🚶 A pie"}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
                <div>
                  <label style={labelStyle}>Cerca</label>
                  <input type="number" value={distancias[trans]?.cerca || 0} 
                    onChange={e => setDistancias({...distancias, [trans]: {...distancias[trans], cerca: Number(e.target.value)}})} 
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lejos</label>
                  <input type="number" value={distancias[trans]?.lejos || 0} 
                    onChange={e => setDistancias({...distancias, [trans]: {...distancias[trans], lejos: Number(e.target.value)}})} 
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>FZ</label>
                  <input type="number" value={distancias[trans]?.fz || 0} 
                    onChange={e => setDistancias({...distancias, [trans]: {...distancias[trans], fz: Number(e.target.value)}})} 
                    style={inputStyle} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:12, background:"#fffbeb", borderRadius:12, border:"1.5px solid #fde68a"}}>
          <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer"}}>
            <input type="checkbox" checked={modoPrueba} onChange={e => setModoPrueba(e.target.checked)} style={{width:18, height:18, accentColor:"#7c3aed"}} />
            <span style={{fontSize:13, fontWeight:700, color:"#92400e"}}>🧪 Modo Prueba (Datos aislados)</span>
          </label>
        </div>

        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>💾 Guardar Configuración</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB LAVADORES (ex-Presentismo)
// ═══════════════════════════════════════════════════════════════
function TabLavadores({ staff, turnos, hoyStr, COL_ASISTENCIAS, COL_STAFF, asistencias, setAsistencias, mostrarToast, onVerRuta, onGestionar }) {
  const toggleAsistencia = async (staffId) => {
    const nuevoEstado = !asistencias[staffId];
    setAsistencias(prev => ({ ...prev, [staffId]: nuevoEstado }));
    try {
      const docRef = doc(db, COL_ASISTENCIAS, hoyStr);
      await setDoc(docRef, { fecha: hoyStr, registros: { ...asistencias, [staffId]: nuevoEstado }, actualizadoEn: serverTimestamp() }, { merge: true });
      mostrarToast(nuevoEstado ? `${staff.find(s=>s.id===staffId)?.nombre} ✅ PRESENTE` : `${staff.find(s=>s.id===staffId)?.nombre} ❌ AUSENTE`, nuevoEstado ? "ok" : "warn");
    } catch (err) {
      setAsistencias(prev => ({ ...prev, [staffId]: !nuevoEstado }));
      mostrarToast("Error al guardar asistencia", "error");
    }
  };

  const sinTelefono = staff.filter(s => !s.telefono || s.telefono === "");
  
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"#1e293b" }}>👷 Lavadores ({staff.length})</h3>
        <Btn sm color="secondary" onClick={onGestionar}>⚙️ Gestionar</Btn>
      </div>
      
      <div style={{ fontSize:12, color:"#6b7280", background:"#f9fafb", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb" }}>
        💡 Marcá quién vino hoy ANTES de crear turnos. Hacé clic en un lavador para ver su ruta.
      </div>
      
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
        {staff.map(s => {
          const presente = asistencias[s.id];
          const turnosHoy = turnos.filter(t => t.lavadorId === s.id).length;
          return (
            <div key={s.id} style={{
              background: presente ? "linear-gradient(135deg,#ecfdf5,#f0fdf4)" : "#ffffff",
              border: `1.5px solid ${presente ? "#a7f3d0" : "#e5e7eb"}`, borderRadius:16, padding:"14px 16px",
              display:"flex", flexDirection:"column", gap:8, transition:"all .2s",
              boxShadow: presente ? "0 4px 14px rgba(167,243,208,.2)" : "0 2px 8px rgba(0,0,0,.03)"
            }}>
              <button onClick={()=>toggleAsistencia(s.id)} style={{
                background:"transparent", border:"none", cursor:"pointer", textAlign:"left", padding:0,
                display:"flex", alignItems:"center", gap:12
              }}>
                <div style={{width:14, height:14, borderRadius:"50%", flexShrink:0, background: presente ? "#10b981" : "#d1d5db", boxShadow: presente ? "0 0 8px rgba(16,185,129,.4)" : "none"}} />
                <div style={{width:32, height:32, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14}}>{s.nombre.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{ fontSize:13, fontWeight:700, color: presente ? "#064e3b" : "#374151" }}>{s.nombre}</div>
                  <div style={{ fontSize:11, color: presente ? "#059669" : "#9ca3af" }}>
                    {s.transporte === "moto" ? "🏍️" : s.transporte === "bici" ? "🚲" : "🚶"} {s.transporte}
                    {turnosHoy > 0 && ` • ${turnosHoy} turnos`}
                  </div>
                </div>
              </button>
              <button onClick={() => onVerRuta(s)} style={{
                background:"#dbeafe", border:"1px solid #bfdbfe", borderRadius:8, padding:"6px 10px",
                color:"#1e3a8a", fontSize:11, fontWeight:700, cursor:"pointer"
              }}>
                🗺️ Ver Ruta
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB SEGUIMIENTO CON COLUMNA LLUVIA
// ═══════════════════════════════════════════════════════════════
function TabSeguimientoTurnos({ turnos, clientes, staff, onMarcarTerminado, onCerrarTurno }) {
  // PUNTO 15: Rojo solo para lluvia
  const estadosConfig = {
    pendiente:     { color:"#6b7280", bg:"#f3f4f6", border:"#e5e7eb", label:"⏳ Pendientes", headerBg:"#f9fafb" },
    en_progreso:   { color:"#d97706", bg:"#fffbeb", border:"#fde68a", label:"🟡 En Progreso", headerBg:"#fef3c7" },
    terminado:     { color:"#059669", bg:"#ecfdf5", border:"#a7f3d0", label:"🟢 Terminados", headerBg:"#d1fae5" },
    lluvia:        { color:"#dc2626", bg:"#fef2f2", border:"#fecaca", label:"🌧️ Lluvia", headerBg:"#fee2e2" },
  };

  const pendientes = turnos.filter(t => t.estado === "pendiente").sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
  const enProgreso = turnos.filter(t => t.estado === "en_progreso").sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
  const terminados = turnos.filter(t => t.estado === "terminado").sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
  const lluvia = turnos.filter(t => t.estado === "lluvia").sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));

  const renderTarjeta = (t) => {
    const config = estadosConfig[t.estado] || estadosConfig.pendiente;
    const cliente = clientes.find(c => c.id === t.clienteId);
    const lavador = staff.find(s => s.id === t.lavadorId);
    const cant = t.cantidadAutos || 1;
    const finEstimado = t.estado !== "terminado" ? calcularFinTurno(t.hora, t.auto, cant) : null;

    return (
      <div key={t.id} style={{
        background:"#ffffff", border:`2px solid ${config.border}`, borderRadius:16, padding:16,
        boxShadow:"0 2px 10px rgba(0,0,0,.03)", position:"relative", overflow:"hidden", marginBottom:10
      }}>
        <div style={{position:"absolute", top:0, left:0, right:0, height:4, background:config.color}} />
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, marginTop:4}}>
          <div>
            <div style={{fontSize:16, fontWeight:800, color:"#1e3a8a"}}>{t.hora} hs</div>
            <div style={{fontSize:13, fontWeight:700, color:"#1e293b", marginTop:2}}>{t.clienteNombre}</div>
          </div>
        </div>
        <div style={{fontSize:12, color:"#4b5563", lineHeight:1.6, marginBottom:10}}>
          <div>🚙 {t.auto}{cant > 1 ? ` (×${cant})` : ""} • {formatP(t.precio)} {t.esFZ && "⬡"}</div>
          {lavador && <div>👷 {lavador.nombre}</div>}
          {cliente?.barrio && <div>📍 {cliente.barrio}</div>}
          {finEstimado && t.estado !== "terminado" && <div style={{fontWeight:600, color:"#6b7280", marginTop:4}}>⏱️ Fin: {finEstimado.horaFin}</div>}
        </div>
        {t.nota && <div style={{fontSize:11, fontStyle:"italic", color:"#92400e", background:"#fef3c7", padding:"4px 8px", borderRadius:6, marginBottom:10, border:"1px solid #fde68a"}}>📝 {t.nota}</div>}
        {t.estado === "pendiente" && <Btn sm color="warning" full onClick={() => onMarcarTerminado(t.id, "en_progreso")}>▶️ Iniciar</Btn>}
        {t.estado === "en_progreso" && <Btn sm color="success" full onClick={() => onCerrarTurno(t)}>✅ Terminar</Btn>}
        {t.estado === "terminado" && <div style={{textAlign:"center", fontSize:12, fontWeight:700, color:"#059669", padding:"8px 0"}}>✅ Completado</div>}
        {t.estado === "lluvia" && (
          <div style={{display:"flex", gap:6}}>
            <Btn sm color="primary" full onClick={() => onMarcarTerminado(t.id, "pendiente")}>♻️ Reanudar</Btn>
            <Btn sm ghost danger full onClick={() => onMarcarTerminado(t.id, "cancelado")}>✕</Btn>
          </div>
        )}
      </div>
    );
  };

  const renderColumna = (titulo, items, config) => (
    <div style={{
      flex:1, minWidth:260, display:"flex", flexDirection:"column",
      background:config.headerBg, borderRadius:16, padding:12,
      border:`1px solid ${config.border}`
    }}>
      <div style={{
        fontSize:14, fontWeight:800, color:config.color,
        marginBottom:12, padding:"6px 12px", borderRadius:10,
        background:"rgba(255,255,255,.7)", display:"flex",
        justifyContent:"space-between", alignItems:"center"
      }}>
        <span>{titulo}</span>
        <span style={{fontSize:12, fontWeight:800, background:config.bg, border:`1px solid ${config.border}`, borderRadius:8, padding:"2px 8px"}}>{items.length}</span>
      </div>
      <div style={{flex:1, overflowY:"auto"}}>
        {items.length === 0 ? (
          <div style={{textAlign:"center", color:"#9ca3af", fontSize:12, padding:20, fontStyle:"italic"}}>Sin turnos</div>
        ) : items.map(renderTarjeta)}
      </div>
    </div>
  );

  return (
    <div>
      <h3 style={{ margin:"0 0 16px 0", fontSize:18, fontWeight:800, color:"#1e293b" }}>📊 Seguimiento de Turnos</h3>
      
      <div style={{display:"flex", gap:12, overflowX:"auto", paddingBottom:8, minHeight:"60vh"}}>
        {renderColumna("⏳ Pendientes", pendientes, estadosConfig.pendiente)}
        {renderColumna("🟡 En Progreso", enProgreso, estadosConfig.en_progreso)}
        {renderColumna("🟢 Terminados", terminados, estadosConfig.terminado)}
      </div>

      {/* Columna Lluvia en ROJO (alarma) */}
      {lluvia.length > 0 && (
        <div style={{marginTop:16}}>
          {renderColumna("🌧️ Afectados por Lluvia", lluvia, estadosConfig.lluvia)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB AGENDA (GRILLA CLICKEABLE CON MULTI-SLOT)
// ═══════════════════════════════════════════════════════════════
function TabAgenda({ turnos, staff, asistencias, clientes, mostrarToast, onCeldaClick, onTurnoClick, onCambiarEstado, onCerrarTurno }) {
  const presentes = staff.filter(s => asistencias[s.id]);
  
  // Crear mapa de turnos por lavador y franja
  const turnosMap = {};
  turnos.forEach(t => {
    if (!turnosMap[t.lavadorId]) turnosMap[t.lavadorId] = {};
    const horas = t.horasOcupadas || [t.hora];
    horas.forEach((h, idx) => {
      turnosMap[t.lavadorId][h] = { turno: t, esPrincipal: idx === 0 };
    });
  });
  
  const ahora = new Date();
  const minutosAhora = ahora.getHours()*60 + ahora.getMinutes();
  
  return (
    <div>
      <h3 style={{ margin:"0 0 16px 0", fontSize:18, fontWeight:800, color:"#1e293b" }}>📋 Agenda del Día</h3>
      
      {presentes.length === 0 ? (
        <div style={{textAlign:"center", color:"#9ca3af", padding:60, fontSize:14, background:"#ffffff", borderRadius:20, border:"1.5px dashed #e5e7eb"}}>
          <div style={{fontSize:32, marginBottom:12}}>👷</div>
          No hay lavadores presentes.<br/>
          <span style={{fontWeight:600}}>Andá a la pestaña "Lavadores" para marcar asistencia.</span>
        </div>
      ) : (
        <div style={{overflowX:"auto", borderRadius:16, border:"1px solid #e5e7eb", background:"#ffffff", padding:12}}>
          <div style={{
            display:"grid",
            gridTemplateColumns: `80px repeat(${presentes.length}, minmax(140px, 1fr))`,
            gap:0,
            minWidth: presentes.length * 140 + 80
          }}>
            {/* Header */}
            <div style={{padding:8, background:"#f9fafb", fontWeight:800, fontSize:11, color:"#6b7280", borderBottom:"2px solid #e5e7eb", borderRight:"1px solid #e5e7eb"}}>HORA</div>
            {presentes.map(s => (
              <div key={s.id} style={{
                padding:"8px 10px", background:"#f9fafb", borderBottom:"2px solid #e5e7eb",
                borderRight:"1px solid #e5e7eb", textAlign:"center"
              }}>
                <div style={{width:28, height:28, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, margin:"0 auto 4px"}}>{s.nombre.charAt(0)}</div>
                <div style={{fontSize:12, fontWeight:700, color:"#1e293b"}}>{s.nombre}</div>
                <div style={{fontSize:10, color:"#6b7280"}}>{s.transporte}</div>
              </div>
            ))}
            
            {/* Filas */}
            {FRANJAS.map(hora => {
              const [hr,mn] = hora.split(":").map(Number);
              const pasada = hr*60+mn < minutosAhora;
              return (
                <div key={hora} style={{display:"contents"}}>
                  <div style={{
                    padding:"12px 8px", background: pasada ? "#f9fafb" : "#ffffff",
                    borderBottom:"1px solid #e5e7eb", borderRight:"1px solid #e5e7eb",
                    fontWeight:700, fontSize:12, color: pasada ? "#cbd5e1" : "#6b7280",
                    textAlign:"center", textDecoration: pasada ? "line-through" : "none"
                  }}>
                    {hora}
                  </div>
                  {presentes.map(s => {
                    const info = turnosMap[s.id]?.[hora];
                    const turno = info?.turno;
                    const esPrincipal = info?.esPrincipal;
                    
                    // Si no es principal y hay turno, es continuación (no renderizar)
                    if (turno && !esPrincipal) return null;
                    
                    if (turno) {
                      // Celda ocupada
                      const slots = turno.horasOcupadas?.length || 1;
                      const configEstado = {
                        pendiente: { bg:"#f3f4f6", border:"#d1d5db", color:"#374151" },
                        en_progreso: { bg:"#fef3c7", border:"#fcd34d", color:"#92400e" },
                        terminado: { bg:"#d1fae5", border:"#6ee7b7", color:"#065f46" },
                        lluvia: { bg:"#fee2e2", border:"#fca5a5", color:"#991b1b" },
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
                            padding:"8px",
                            cursor:"pointer",
                            transition:"all .15s",
                            overflow:"hidden",
                            display:"flex",
                            flexDirection:"column",
                            gap:4
                          }}
                          onMouseOver={e => e.currentTarget.style.transform="scale(1.02)"}
                          onMouseOut={e => e.currentTarget.style.transform="scale(1)"}>
                          <div style={{fontSize:11, fontWeight:800, color:cfg.color}}>{turno.hora} hs</div>
                          <div style={{fontSize:12, fontWeight:700, color:cfg.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{turno.clienteNombre}</div>
                          <div style={{fontSize:10, color:cfg.color, opacity:0.8}}>
                            {turno.auto} {turno.cantidadAutos > 1 && `(×${turno.cantidadAutos})`}
                          </div>
                          {turno.esFZ && <div style={{fontSize:10, fontWeight:700, color:"#d97706"}}>⬡ FZ</div>}
                          {turno.estado === "en_progreso" && (
                            <span style={{fontSize:9, fontWeight:800, background:"#fcd34d", color:"#92400e", padding:"2px 6px", borderRadius:4, alignSelf:"flex-start"}}>🟡 EN PROGRESO</span>
                          )}
                        </div>
                      );
                    } else {
                      // Celda libre clickeable
                      return (
                        <div key={`${s.id}-${hora}`} onClick={() => pasada ? null : onCeldaClick(s.id, hora)}
                          style={{
                            borderBottom:"1px solid #e5e7eb",
                            borderRight:"1px solid #e5e7eb",
                            padding:"8px",
                            background: pasada ? "#f9fafb" : "#ffffff",
                            cursor: pasada ? "not-allowed" : "pointer",
                            minHeight:60,
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"center",
                            color: pasada ? "#cbd5e1" : "#94a3b8",
                            fontSize:20,
                            transition:"all .15s"
                          }}
                          onMouseOver={e => { if (!pasada) { e.currentTarget.style.background = "#ecfdf5"; e.currentTarget.style.color = "#059669"; }}}
                          onMouseOut={e => { if (!pasada) { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#94a3b8"; }}}
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

// ═══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL APP
// ═══════════════════════════════════════════════════════════════
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
  const [previewData, setPreviewData] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [clienteParaTurno, setClienteParaTurno] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [busquedaClientes, setBusquedaClientes] = useState("");
  const [turnoCreadoData, setTurnoCreadoData] = useState(null);
  const [mostrarNuevoClienteDirecto, setMostrarNuevoClienteDirecto] = useState(false);
  const [celdaPreseleccionada, setCeldaPreseleccionada] = useState(null);
  const [lavadorRuta, setLavadorRuta] = useState(null);
  const [mostrarLluvia, setMostrarLluvia] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarGestionLav, setMostrarGestionLav] = useState(false);
  
  const [config, setConfig] = useState({
    precios: TAMANOS_DEFAULT,
    fzPct: 20,
    distancias: DISTANCIAS_DEFAULT,
    modoPrueba: false
  });

  const mostrarToast = (msg, tipo="ok") => setToast({ msg, tipo });

  // ═══════════════════════════════════════════════════════════
  //  SINCRONIZACIÓN EN TIEMPO REAL (CORREGIDA)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const fechaHoy = hoy();
    setCargando(true);
    
    // Listener de día actual
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
    
    // Listener de turnos (con filtro por fecha actual)
    const unsubTurnos = onSnapshot(collection(db, COL_TURNOS), (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoyTurnos = todos.filter(t => t.fecha === fechaHoy).sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
      setTurnos(hoyTurnos);
    });
    
    // Listener de clientes
    const unsubClientes = onSnapshot(collection(db, COL_CLIENTES), (snap) => {
      if (!snap.empty) {
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    
    // Listener de staff
    const unsubStaff = onSnapshot(collection(db, COL_STAFF), (snap) => {
      if (!snap.empty) {
        setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    
    // Listener de asistencias
    const unsubAsist = onSnapshot(doc(db, COL_ASISTENCIAS, fechaHoy), (snap) => {
      setAsistencias(snap.exists() ? (snap.data().registros || {}) : {});
    });
    
    // Listener de config
    const unsubConfig = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) {
        setConfig(prev => ({ ...prev, ...snap.data() }));
      }
    });
    
    return () => {
      unsubDia();
      unsubTurnos();
      unsubClientes();
      unsubStaff();
      unsubAsist();
      unsubConfig();
    };
  }, [modoPrueba, COL_DIAS, COL_TURNOS, COL_CLIENTES, COL_STAFF, COL_ASISTENCIAS]);

  // Seed inicial
  useEffect(() => {
    const seedAndMigrate = async () => {
      try {
        const cliSnap = await getDocs(collection(db, COL_CLIENTES));
        if (cliSnap.empty) {
          const batch = writeBatch(db);
          CLIENTES_SEED.forEach(c => { const ref = doc(collection(db, COL_CLIENTES)); batch.set(ref, {...c,_ts:serverTimestamp()}); });
          await batch.commit();
        }
        const staffSnap = await getDocs(collection(db, COL_STAFF));
        if (staffSnap.empty) {
          const batch = writeBatch(db);
          STAFF_SEED.forEach(s => { const ref = doc(collection(db, COL_STAFF)); batch.set(ref, {...s,_ts:serverTimestamp()}); });
          await batch.commit();
        }
      } catch (err) { console.error("Error en seed:", err); }
    };
    seedAndMigrate();
  }, [modoPrueba]);

  // Aviso de teléfono faltante
  useEffect(() => {
    const sinTel = staff.filter(s => !s.telefono || s.telefono === "");
    if (sinTel.length > 0 && !avisoFijo) {
      setAvisoFijo({
        msg: `${sinTel.length} lavador(es) sin teléfono: ${sinTel.slice(0,3).map(s=>s.nombre).join(", ")}${sinTel.length > 3 ? "..." : ""}`,
        tipo: "warn"
      });
    } else if (sinTel.length === 0 && avisoFijo) {
      setAvisoFijo(null);
    }
  }, [staff]);

  const cerrarTurno = async (turno) => {
    await fsUpdate(COL_TURNOS, turno.id, { estado:"terminado", rendidoEn:serverTimestamp() });
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
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia:true, lluviaInicio:serverTimestamp() });
    const pendientes = turnos.filter(t => t.estado === "pendiente");
    await Promise.all(pendientes.map(t => fsUpdate(COL_TURNOS, t.id, { estado:"lluvia" })));
    setMostrarLluvia(true);
  };
  
  const aplicarReorganizacionLluvia = async (estadoLav, turnosCancelar, lavQuedan) => {
    const turnosPendientes = turnos.filter(t => t.estado === "lluvia");
    let cancelados = 0, reasignados = 0;
    
    for (const lavId of Object.keys(estadoLav)) {
      const estado = estadoLav[lavId];
      const turnosDelLav = turnosPendientes.filter(t => t.lavadorId === lavId);
      
      if (estado === "ausente") {
        for (const t of turnosDelLav) {
          await fsUpdate(COL_TURNOS, t.id, { estado: "cancelado" });
          cancelados++;
        }
        setAsistencias(prev => ({ ...prev, [lavId]: false }));
        await fsSave(COL_ASISTENCIAS, hoy(), { registros: { ...asistencias, [lavId]: false }, fecha: hoy() });
      }
      
      if (estado === "liberar_reasignar") {
        const cancelarIds = turnosCancelar[lavId] || [];
        for (const t of turnosDelLav) {
          if (cancelarIds.includes(t.id)) {
            await fsUpdate(COL_TURNOS, t.id, { estado: "cancelado" });
            cancelados++;
          } else if (lavQuedan.length > 0) {
            const idx = reasignados % lavQuedan.length;
            const nuevoLav = lavQuedan[idx];
            await fsUpdate(COL_TURNOS, t.id, { lavadorId: nuevoLav.id });
            reasignados++;
          }
        }
      }
    }
    
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia: false, lluviaFin: serverTimestamp() });
    mostrarToast(`Reanudado: ${cancelados} cancelados, ${reasignados} reasignados`, "ok");
  };
  
  const toggleDia = async () => {
    if (!diaActual?.id) return;
    const nuevoEstado = diaActual?.estado === "abierto" ? "cerrado" : "abierto";
    await fsUpdate(COL_DIAS, diaActual.id, { estado: nuevoEstado, apertura: nuevoEstado === "abierto" ? serverTimestamp() : diaActual.apertura, cierre: nuevoEstado === "cerrado" ? serverTimestamp() : null });
    mostrarToast(nuevoEstado === "abierto" ? "☀️ Día ABIERTO" : "🌙 Día CERRADO", "ok");
  };
  
  const handleLogoTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setModoOculto(prev => !prev);
      setModoPrueba(prev => !prev);
      mostrarToast(!modoPrueba ? "🧪 Modo OCULTO activado" : "🔒 Modo producción", !modoPrueba ? "warn" : "ok");
    }
  };

  const clientesFiltrados = busquedaClientes.trim() === "" ? clientes : clientes.filter(c =>
    sinAcentos(c.nombre).includes(sinAcentos(busquedaClientes)) ||
    sinAcentos(c.codigo || "").includes(sinAcentos(busquedaClientes)) ||
    sinAcentos(c.barrio || "").includes(sinAcentos(busquedaClientes))
  );
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

  if (cargando) return (<div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f9fafb",color:"#6b7280",fontWeight:600,fontSize:14}}>⟳ Sincronizando Sofia Lavados...</div>);

  if (diaActual?.estado !== "abierto") {
    return (
      <div style={{ minHeight:"100vh", background:"#f9fafb", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ animation:"fadeInUp .5s ease-out", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:12 }}>🚗</div>
          <h1 style={{ color:"#1e293b", fontSize:28, fontWeight:900, marginBottom:6 }}>Sofía Lavados</h1>
          <p style={{ color:"#6b7280", fontSize:14, marginBottom:40 }}>{fechaAR(hoy())} • {horaAR()} hs</p>
          <button onClick={toggleDia} style={{background:"linear-gradient(135deg,#bbf7d0,#a7f3d0)", color:"#14532d", border:"1px solid #86efac", borderRadius:20, padding:"22px 56px", fontSize:20, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 30px rgba(167,243,208,.3)"}}>🟢 ABRIR DÍA</button>
        </div>
        {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
      </div>
    );
  }

  const tabsVisibles = [
    {id:"agenda",label:"📋 Agenda",color:"#3b82f6",bg:"#dbeafe",border:"#bfdbfe"},
    {id:"seguimiento",label:"📊 Seguimiento",color:"#0891b2",bg:"#cffafe",border:"#a5f3fc"},
    {id:"nuevoTurno",label:"➕ Nuevo Turno",color:"#059669",bg:"#d1fae5",border:"#a7f3d0"},
    {id:"lavadores",label:"👷 Lavadores",color:"#7c3aed",bg:"#ede9fe",border:"#ddd6fe"},
    {id:"clientes",label:"👥 Clientes",color:"#d97706",bg:"#fef3c7",border:"#fde68a"},
    {id:"config",label:"⚙️ Configuración",color:"#4b5563",bg:"#f3f4f6",border:"#e5e7eb"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb", color:"#1e293b", fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:90 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'); @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeIn { from{opacity:0} to{opacity:1} } @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} } @media (max-width:768px) { .reloj-desktop { display:none !important; } .nav-tabs { overflow-x:auto !important; scrollbar-width:none; } .nav-tabs::-webkit-scrollbar { display:none; } }`}</style>

      <header style={{position:"sticky", top:0, zIndex:100, background:"rgba(255,255,255,.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid #e5e7eb", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div onClick={handleLogoTap} style={{fontSize:18, fontWeight:900, cursor:"pointer", userSelect:"none", color:"#1e293b"}}>🚗 Sofía</div>
          <div style={{fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:10, background: diaActual?.lluvia ? "#fef2f2" : "#ecfdf5", color: diaActual?.lluvia ? "#991b1b" : "#064e3b", border: diaActual?.lluvia ? "1px solid #fecaca" : "1px solid #a7f3d0"}}>{diaActual?.lluvia ? "🌧️ LLUVIA" : "🟢 ABIERTO"}</div>
          {modoOculto && <span style={{ fontSize:10, fontWeight:800, color:"#92400e", background:"#fffbeb", padding:"3px 8px", borderRadius:8, border:"1px solid #fde68a" }}>OCULTO</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {diaActual?.lluvia ? (<Btn sm color="success" onClick={() => setMostrarLluvia(true)}>☀️ Reorganizar</Btn>) : (<Btn sm color="warning" onClick={activarLluvia}>🌧️ Lluvia</Btn>)}
          <RelojVivo />
        </div>
      </header>

      <nav className="nav-tabs" style={{display:"flex", gap:6, padding:"10px 16px", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap", alignItems:"center", background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)", position:"sticky", top:"58px", zIndex:90}}>
        {tabsVisibles.map(t => (
          <button key={t.id} onClick={() => {
            if (t.id === "nuevoTurno") { setClienteParaTurno(null); setCeldaPreseleccionada(null); setModalOpen("nuevoTurno"); }
            else if (t.id === "config") { setMostrarConfig(true); }
            else { setTab(t.id); }
          }} style={{
            background: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? t.bg : (t.id === "nuevoTurno" || t.id === "config" ? t.bg : "transparent"),
            color: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? t.color : (t.id === "nuevoTurno" || t.id === "config" ? t.color : "#6b7280"),
            border: (t.id !== "nuevoTurno" && t.id !== "config" && tab === t.id) ? `1.5px solid ${t.border}` : (t.id === "nuevoTurno" || t.id === "config" ? `1.5px solid ${t.border}` : "1.5px solid transparent"),
            borderRadius:12, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, transition:"all .2s"
          }}>{t.label}</button>
        ))}
        <button onClick={toggleDia} style={{marginLeft:"auto", flexShrink:0, background:"#fecaca", color:"#991b1b", border:"1px solid #fca5a5", borderRadius:12, padding:"8px 16px", fontSize:12, fontWeight:800, cursor:"pointer"}}>🔴 Cerrar Día</button>
      </nav>

      <main style={{ padding:20, maxWidth:1200, margin:"0 auto", animation:"fadeInUp .4s ease-out" }}>
        {tab === "agenda" && <TabAgenda turnos={turnos} staff={staff} asistencias={asistencias} clientes={clientes} mostrarToast={mostrarToast} onCeldaClick={handleCeldaClick} onTurnoClick={handleTurnoClick} onCambiarEstado={cambiarEstadoTurno} onCerrarTurno={cerrarTurno} />}
        {tab === "seguimiento" && <TabSeguimientoTurnos turnos={turnos} clientes={clientes} staff={staff} onMarcarTerminado={cambiarEstadoTurno} onCerrarTurno={cerrarTurno} />}
        {tab === "lavadores" && <TabLavadores staff={staff} turnos={turnos} hoyStr={hoy()} COL_ASISTENCIAS={COL_ASISTENCIAS} COL_STAFF={COL_STAFF} asistencias={asistencias} setAsistencias={setAsistencias} mostrarToast={mostrarToast} onVerRuta={(l) => setLavadorRuta(l)} onGestionar={() => setMostrarGestionLav(true)} />}
        
        {tab === "clientes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ position:"sticky", top:"110px", zIndex:80, background:"rgba(249,250,251,.97)", backdropFilter:"blur(12px)", padding:"8px 0 12px 0", display:"flex", flexDirection:"column", gap:10, borderBottom:"1px solid #e5e7eb" }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1e293b" }}>👥 Clientes ({clientesFiltrados.length})</h3>
                <Btn sm color="success" onClick={()=>setMostrarNuevoClienteDirecto(true)}>➕ Nuevo</Btn>
              </div>
              <input type="text" value={busquedaClientes} onChange={e => setBusquedaClientes(e.target.value)} placeholder="🔍 Buscar..."
                style={{ background:"#ffffff", border:"1.5px solid #e5e7eb", borderRadius:14, padding:"12px 16px", color:"#1e293b", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
            </div>

            {clientesFiltrados.length === 0 ? (
              <div style={{ textAlign:"center", color:"#9ca3af", padding:40, fontSize:13, background:"#ffffff", borderRadius:16, border:"1px solid #e5e7eb" }}>Sin resultados</div>
            ) : (
              clientesFiltrados.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(c => (
                <div key={c.id} style={{background:"#ffffff", borderRadius:18, padding:18, border:"1px solid #e5e7eb", boxShadow:"0 2px 8px rgba(0,0,0,.02)", display:"flex", flexDirection:"column", gap:10}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#1e293b" }}>{c.nombre}</div>
                      <div style={{fontSize:11, fontWeight:800, color:"#7c3aed", marginTop:4, fontFamily:"monospace", background:"#f3e8ff", padding:"3px 10px", borderRadius:6, display:"inline-block", border:"1px solid #ddd6fe"}}>{c.codigo}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8, background:"#f3f4f6", color:"#4b5563", border:"1px solid #e5e7eb" }}>{c.tipo}</span>
                  </div>
                  <div style={{fontSize:12, color:"#6b7280", lineHeight:1.6}}>
                    <div>📍 {c.direccion || "Sin dirección"} • {c.barrio}</div>
                    <div>{mostrarTelefono(c)}</div>
                  </div>
                  <div style={{display:"flex", gap:8, marginTop:4}}>
                    <Btn sm color="primary" onClick={()=>{setClienteParaTurno(c);setModalOpen("nuevoTurno");}}>➕ Turno</Btn>
                    <Btn sm color="secondary" onClick={()=>setClienteParaEditar(c)}>✏️ Editar</Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === "config" && (
          <div style={{padding:20, background:"#ffffff", borderRadius:20, border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:12, color:"#6b7280"}}>La configuración se gestiona desde el modal principal. Hacé clic en ⚙️ Configuración en la barra superior.</div>
          </div>
        )}
      </main>

      {modalOpen === "nuevoTurno" && (
        <ModalNuevoTurno clientes={clientes} staff={staff} turnos={turnos} asistencias={asistencias} 
          COL_TURNOS={COL_TURNOS} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast} 
          clientePreseleccionado={clienteParaTurno} config={config} codigosExistentes={codigosExistentes}
          onClienteCreated={(c) => setClientes(prev => [...prev, c])}
          onTurnoCreado={(t, c, l) => setTurnoCreadoData({ turno: t, cliente: c, lavador: l })}
          onClose={() => { setModalOpen(null); setCeldaPreseleccionada(null); }} />
      )}
      
      {modalOpen === "detalleTurno" && turnoSel && (
        <ModalDetalleTurno turno={turnoSel} clientes={clientes} staff={staff}
          onClose={() => { setModalOpen(null); setTurnoSel(null); }}
          onCambiarEstado={cambiarEstadoTurno}
          onCerrarTurno={cerrarTurno} />
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
        <ModalConfigCompleta config={config} mostrarToast={mostrarToast}
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
      
      {avisoFijo && <AvisoFijo msg={avisoFijo.msg} tipo={avisoFijo.tipo} onClose={() => setAvisoFijo(null)} />}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
    </div>
  );
}
