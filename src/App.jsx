import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, writeBatch
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
const FRANJA_TARDE = 3;
const FRANJA_MANANA = 0;
const FRANJA_MEDIODIA = 2;

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
  {nombre:"Jhony",     transporte:"moto",color:"#93c5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Sergio",    transporte:"moto",color:"#c4b5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Alexander", transporte:"moto",color:"#fca5a5",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Maxi",      transporte:"moto",color:"#fdba74",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Rene",      transporte:"moto",color:"#86efac",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Brandon",   transporte:"moto",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Jorge",     transporte:"moto",color:"#a5b4fc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Emiliano",  transporte:"moto",color:"#f0abfc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Gaby",      transporte:"moto",color:"#fcd34d",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Javi",      transporte:"moto",color:"#a7f3d0",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Franco",    transporte:"moto",color:"#bae6fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Fede",      transporte:"moto",color:"#fecdd3",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Elias",     transporte:"moto",color:"#93c5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Alvaro",    transporte:"bici",color:"#c4b5fd",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Nestor",    transporte:"bici",color:"#fca5a5",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Matias",    transporte:"bici",color:"#fdba74",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Luis",      transporte:"bici",color:"#86efac",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Bruno",     transporte:"bici",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Nico Alto", transporte:"bici",color:"#a5b4fc",whatsapp:true, rol:"lavador",especial:"rapido", saldoPendiente:0},
  {nombre:"Hernán",    transporte:"bici",color:"#f0abfc",whatsapp:false,rol:"lavador",especial:"avisar_presencia", saldoPendiente:0},
  {nombre:"Gastón",    transporte:"bici",color:"#fcd34d",whatsapp:false,rol:"lavador",especial:"llamar_telefono", saldoPendiente:0},
];

const BARRIOS_INICIALES = {
  "olivos":"OLI","martinez":"MAR","florida":"FLO","san isidro":"SIS",
  "acassuso":"ACA","la lucila":"LAL","boulogne":"BOU","vicente lopez":"VLO",
  "munro":"MUN","villa adelina":"VAD","beccar":"BEC",
};
let LISTA_BARRIOS = Object.keys(BARRIOS_INICIALES).map(k=>k.charAt(0).toUpperCase()+k.slice(1));

function codigoBarrio(barrioNombre) {
  if(!barrioNombre) return "GEN";
  const limpio = barrioNombre.replace(/[\(\)\[\],]/g," ").replace(/\s+/g," ").trim();
  const b = limpio.toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));
  for(const [k,v] of Object.entries(BARRIOS_INICIALES)) {
    if(b.includes(k)) return v;
  }
  const cod = b.replace(/[\s,]+/g,"").substring(0,3).toUpperCase();
  if(!LISTA_BARRIOS.find(x=>x.toLowerCase()===limpio.toLowerCase())) LISTA_BARRIOS.push(limpio);
  return cod;
}

const CLIENTES_SEED = [
  {nombre:"Victoria",  telefono:"", direccion:"Dardo Rocha 3278",              barrio:"Olivos",     autosHabituales:3, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-001"},
  {nombre:"Martin",    telefono:"", direccion:"Colectora Panamericana 2065",   barrio:"San Isidro", autosHabituales:3, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"SIS-001"},
  {nombre:"Micaela",   telefono:"", direccion:"Eduardo Costa 902",             barrio:"Acassuso",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"ACA-001"},
  {nombre:"Hyundai",   telefono:"", direccion:"Av. Santa Fe 2627",             barrio:"Martínez",   autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)", tipo:"🔥 Top",       deuda:0, codigo:"MAR-001"},
  {nombre:"Mariana",   telefono:"", direccion:"Diagonal Salta 557",            barrio:"Olivos",     autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-002"},
  {nombre:"Caro",      telefono:"", direccion:"Las Heras 1533",                barrio:"Martínez",   autosHabituales:3, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-002"},
  {nombre:"Salva",     telefono:"", direccion:"Hipólito Yrigoyen 2647",        barrio:"Martínez",   autosHabituales:1, nota:"Silicina en llantas y paragolpes",tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-003"},
  {nombre:"Johana",    telefono:"", direccion:"Blas Parera 429",               barrio:"Boulogne",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"BOU-001"},
  {nombre:"Karina",    telefono:"", direccion:"Cangallo 846",                  barrio:"Martínez",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-004"},
  {nombre:"Andres",    telefono:"", direccion:"Paraná 374",                    barrio:"Martínez",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-005"},
  {nombre:"Barby",     telefono:"", direccion:"Fray Justo Sarmiento 3304",     barrio:"Olivos",     autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-003"},
  {nombre:"Tomás",     telefono:"", direccion:"Córdoba 596",                   barrio:"Martínez",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-006"},
  {nombre:"HernanC",   telefono:"", direccion:"Beruti 1583",                   barrio:"Martínez",   autosHabituales:2, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-007"},
  {nombre:"Agustín",   telefono:"", direccion:"Colectora Panamericana 2065",   barrio:"San Isidro", autosHabituales:1, nota:"Llamar antes",                   tipo:"⭐ Frecuente", deuda:0, codigo:"SIS-002"},
  {nombre:"Candelaria",telefono:"", direccion:"Ladislao Martínez 440",         barrio:"Martínez",   autosHabituales:1, nota:"",                                tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-008"},
  {nombre:"Vero",      telefono:"", direccion:"Entre Ríos 2397",               barrio:"Martínez",   autosHabituales:1, nota:"Confirmar",                      tipo:"💤 Ocasional", deuda:0, codigo:"MAR-009"},
  {nombre:"Avri",      telefono:"", direccion:"Entre Ríos 2983",               barrio:"Martínez",   autosHabituales:1, nota:"",                                tipo:"💤 Ocasional", deuda:0, codigo:"MAR-010"},
  {nombre:"Ale",       telefono:"", direccion:"Sáenz Valiente 2163",           barrio:"Olivos",     autosHabituales:1, nota:"",                                tipo:"💤 Ocasional", deuda:0, codigo:"OLI-004"},
  {nombre:"GabyC",     telefono:"", direccion:"Catamarca 1304",                barrio:"Florida",    autosHabituales:2, nota:"",                                tipo:"💤 Ocasional", deuda:0, codigo:"FLO-001"},
  {nombre:"Pablo",     telefono:"", direccion:"Ezpeleta 531",                  barrio:"Martínez",   autosHabituales:2, nota:"",                                tipo:"💤 Ocasional", deuda:0, codigo:"MAR-011"},
];

const NOTAS_PREDEFINIDAS = [
  "Cliente detallista","Insectos de ruta","Barro extremo","Decir precio antes de empezar",
  "Avisar cuando va","No usar revividor","Llevar doble alargue","Auto muy sucio","Cliente nuevo",
];

const MOTIVOS_DESCUENTO = [
  "Error de cambio","Descuento por queja","Lavado gratis (compensación total)",
  "Lavado con descuento (compensación parcial)","Cliente no pagó (deuda)","Otro",
];

const MOTIVOS_OPERACION = [
  "Préstamo (lavador recibe)","Adelanto de sueldo (lavador recibe)","Regalo / Premio (lavador recibe)",
  "Devolución de préstamo (lavador paga)","Aporte voluntario (lavador paga)","Otro",
];

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
const franjasValidas = () => {
  const ahora = new Date();
  const minutos = ahora.getHours()*60 + ahora.getMinutes() + 30;
  return FRANJAS.filter(h => {
    const [hr,mn] = h.split(":").map(Number);
    return hr*60+mn > minutos;
  });
};
const franjaFin   = h  => { const [hr,mn]=h.split(":").map(Number); const t=hr*60+mn+90; return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
const esTarde     = h  => FRANJAS.indexOf(h) >= FRANJA_TARDE;
const formatP     = n  => "$" + Number(n||0).toLocaleString("es-AR");
const colorNuevo  = (staff) => COLORES.find(c=>!staff.map(s=>s.color).includes(c)) || "#cbd5e1";
const sinAcentos  = s  => (s||"").toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));

function mostrarTelefono(cliente) {
  const telefono = cliente?.telefono;
  const esFicticio = telefono && String(telefono).startsWith("1100000");
  if (telefono && !esFicticio && telefono !== "") return `📞 ${telefono}`;
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
const tiempoViaje = (cuadras, trans) => Math.round(cuadras * (trans==="moto"?2:trans==="pie"?8:4));

const _geocache = {};
async function geocodificar(dir) {
  if(!dir) return { lat:BASE_LAT, lng:BASE_LNG, barrio:"" };
  if(_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,{
      headers:{"Accept-Language":"es","User-Agent":"SofiaLavados/5.0"}
    });
    const data = await res.json();
    if(data.length>0) {
      const coords = { lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon), barrio:data[0].address?.suburb || data[0].address?.city_district || "" };
      _geocache[dir] = coords;
      return coords;
    }
  } catch {}
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000), barrio:"" };
}

function coordsSimuladas(dir) {
  if(_geocache[dir]) return _geocache[dir];
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000) };
}

function slotsOcupados(inicio, cant) {
  const idx = FRANJAS.indexOf(inicio);
  if (idx < 0) return [inicio];
  return Array.from({length: cant}, (_,i) => FRANJAS[idx+i]).filter(Boolean);
}

// Generador de código único de cliente
async function generarCodigoCliente(barrio, nombre, COL_CLIENTES) {
  const codBarrio = codigoBarrio(barrio);
  const snap = await getDocs(collection(db, COL_CLIENTES));
  const existentes = snap.docs.map(d => d.data().codigo || "");
  const prefijo = `${codBarrio}-`;
  let maxNum = 0;
  existentes.forEach(c => {
    if (c.startsWith(prefijo)) {
      const num = parseInt(c.split("-")[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  const sigNum = String(maxNum + 1).padStart(3, "0");
  const nombreClean = (nombre || "").replace(/\s+/g, "").substring(0, 10);
  return `${codBarrio}-${sigNum}-${nombreClean}`;
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

function Modal({titulo,onClose,children,wide}) {
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(241,245,249,.6)",backdropFilter:"blur(12px)",
      zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,
      animation:"fadeIn .2s ease-out"
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,
        padding:24,width:"100%",maxWidth:wide?580:440,maxHeight:"92vh",overflowY:"auto",
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
//  BUSCADOR DE CLIENTES REUTILIZABLE
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

  // Init with current value if needed
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
                <div style={{fontSize:11, color:"#6b7280"}}>{c.codigo} • {c.barrio}</div>
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
function ModalNuevoCliente({ nombreInicial, onClose, COL_CLIENTES, mostrarToast, onClienteCreated }) {
  const [datos, setDatos] = useState({
    nombre: nombreInicial || "",
    telefono: "",
    direccion: "",
    barrio: "",
    nota: ""
  });
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [error, setError] = useState("");

  const buscarDireccion = async () => {
    if (!datos.direccion) return;
    setBuscandoDir(true);
    const res = await geocodificar(datos.direccion);
    if (res.barrio && !datos.barrio) {
      setDatos(prev => ({ ...prev, barrio: capitalizar(res.barrio) }));
    }
    setBuscandoDir(false);
  };

  const guardar = async () => {
    setError("");
    if (!datos.nombre) return setError("El nombre es obligatorio");
    if (!datos.direccion) return setError("La dirección es obligatoria");
    
    try {
      const codigo = await generarCodigoCliente(datos.barrio, datos.nombre, COL_CLIENTES);
      const nuevoCliente = {
        nombre: capitalizar(datos.nombre),
        telefono: datos.telefono || "",
        direccion: datos.direccion,
        barrio: datos.barrio || "Desconocido",
        autosHabituales: 1,
        nota: datos.nota || "",
        tipo: "💤 Ocasional",
        deuda: 0,
        codigo: codigo
      };

      const docRef = await addDoc(collection(db, COL_CLIENTES), { ...nuevoCliente, _ts: serverTimestamp() });
      
      mostrarToast(`Cliente creado: ${codigo}`, "ok");
      
      // Devolver el ID del nuevo cliente al padre
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
    transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box",
    fontFamily:"'Inter',system-ui,sans-serif"
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo="➕ Nuevo Cliente Rápido" onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        {error && <div style={{color:"#dc2626", fontSize:12, background:"#fef2f2", padding:10, borderRadius:8}}>{error}</div>}
        
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input value={datos.nombre} onChange={e=>setDatos({...datos, nombre:e.target.value})} style={inputStyle} autoFocus
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={labelStyle}>Teléfono (Opcional)</label>
          <input value={datos.telefono} onChange={e=>setDatos({...datos, telefono:e.target.value})} placeholder="Si no tiene, dejar vacío" style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={labelStyle}>Dirección Completa *</label>
          <div style={{display:"flex", gap:8}}>
            <input value={datos.direccion} onChange={e=>setDatos({...datos, direccion:e.target.value})} style={inputStyle}
              onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
              onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
            <button onClick={buscarDireccion} disabled={buscandoDir} style={{background:"#bfdbfe", border:"none", borderRadius:8, padding:"0 12px", cursor:"pointer"}} title="Buscar en mapa">
              📍
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Barrio</label>
          <input value={datos.barrio} onChange={e=>setDatos({...datos, barrio:e.target.value})} placeholder="Se autocompleta si es posible" style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={labelStyle}>Nota</label>
          <input value={datos.nota} onChange={e=>setDatos({...datos, nota:e.target.value})} placeholder="Ej: Tiene perro, llamar antes" style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="success" full onClick={guardar}>💾 Crear y Asignar</Btn>
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
        telefono: datos.telefono || "",
        direccion: datos.direccion || "",
        barrio: datos.barrio || "",
        nota: datos.nota || "",
        tipo: datos.tipo || "",
        autosHabituales: Number(datos.autosHabituales) || 1,
      });
      mostrarToast("Cliente actualizado correctamente", "ok");
      onClose();
    } catch (err) {
      mostrarToast("Error al actualizar cliente", "error");
    }
  };

  const inputStyle = {
    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12,
    padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none",
    transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box",
    fontFamily:"'Inter',system-ui,sans-serif"
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo={`✏️ Editar: ${cliente.nombre}`} onClose={onClose}>
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        <div style={{background:"#f9fafb", padding:12, borderRadius:12, border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280", marginBottom:4}}>
          Código: <strong style={{color:"#1e293b"}}>{cliente.codigo}</strong>
        </div>

        <div>
          <label style={labelStyle}>Teléfono</label>
          <input value={datos.telefono||""} onChange={e=>setDatos({...datos, telefono:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>
        <div>
          <label style={labelStyle}>Dirección</label>
          <input value={datos.direccion||""} onChange={e=>setDatos({...datos, direccion:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>
        <div>
          <label style={labelStyle}>Barrio</label>
          <input value={datos.barrio||""} onChange={e=>setDatos({...datos, barrio:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select value={datos.tipo||""} onChange={e=>setDatos({...datos, tipo:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}}>
            <option value="⭐ Frecuente">⭐ Frecuente</option>
            <option value="🔥 Top">🔥 Top</option>
            <option value="💤 Ocasional">💤 Ocasional</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Autos Habituales</label>
          <input type="number" value={datos.autosHabituales||1} onChange={e=>setDatos({...datos, autosHabituales:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>
        <div>
          <label style={labelStyle}>Nota</label>
          <input value={datos.nota||""} onChange={e=>setDatos({...datos, nota:e.target.value})} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div style={{display:"flex", gap:10, marginTop:8}}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>💾 Guardar Cambios</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LÓGICA DE SUGERENCIA IA + LOCAL (INTACTA)
// ═══════════════════════════════════════════════════════════════
async function sugerirLavadorIA(presentes, turnosHoy, cliente, geminiKey) {
  const fallbackLocal = () => {
    if (presentes.length === 0) return null;
    const carga = {};
    presentes.forEach(s => carga[s.id] = 0);
    turnosHoy.forEach(t => { if (t.lavadorId && carga[t.lavadorId] !== undefined) carga[t.lavadorId]++; });
    let mejor = presentes[0];
    let minCarga = Infinity;
    presentes.forEach(s => {
      if (carga[s.id] < minCarga) { minCarga = carga[s.id]; mejor = s; }
    });
    return mejor;
  };

  if (!geminiKey) return fallbackLocal();

  try {
    const cargaMap = {};
    presentes.forEach(s => cargaMap[s.id] = turnosHoy.filter(t => t.lavadorId === s.id).length);

    const prompt = `Sos un asistente de asignación de lavadores para un lavadero de autos.
Lavadores presentes hoy con su carga actual de turnos:
${presentes.map(s => `- ${s.nombre} (${s.transporte}, especialidad: ${s.especial || "ninguna"}, turnos hoy: ${cargaMap[s.id]})`).join("\n")}

Cliente: ${cliente?.nombre || "Desconocido"}, Barrio: ${cliente?.barrio || "Desconocido"}, Dirección: ${cliente?.direccion || "Desconocida"}
Vehículo: ${cliente?.autosHabituales || 1} auto(s) habitual(es)

Reglas:
1. Priorizar lavadores con MENOS turnos hoy.
2. Si el cliente es de un barrio lejano, preferir lavador con moto.
3. Si el lavador tiene especialidad "rapido", priorizarlo para clientes frecuentes.
4. NUNCA asignar a alguien que no esté en la lista de presentes.

Respondé SOLO con el nombre exacto del lavador sugerido, sin explicaciones ni texto extra.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    const nombreSugerido = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (nombreSugerido) {
      const encontrado = presentes.find(s => s.nombre.toLowerCase() === nombreSugerido.toLowerCase());
      if (encontrado) return encontrado;
    }
    return fallbackLocal();
  } catch (err) {
    console.warn("IA suggestion failed, using fallback:", err);
    return fallbackLocal();
  }
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO TURNO (CON BUSCADOR Y NUEVO CLIENTE)
// ═══════════════════════════════════════════════════════════════
function ModalNuevoTurno({ onClose, clientes, staff, turnos, asistencias, COL_TURNOS, COL_CLIENTES, geminiKey, mostrarToast, clientePreseleccionado, onClienteCreated }) {
  const [clienteId, setClienteId] = useState(clientePreseleccionado?.id || "");
  const [hora, setHora] = useState(franjasValidas()[0] || FRANJAS[0]);
  const [tamaño, setTamaño] = useState(TAMANOS_DEFAULT[1]);
  const [lavadorId, setLavadorId] = useState("");
  const [nota, setNota] = useState("");
  const [sugiriendo, setSugiriendo] = useState(false);
  
  // State for New Client Modal
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const clienteSel = clientes.find(c => c.id === clienteId);
  const presentes = staff.filter(s => asistencias[s.id]);

  // Si llega un cliente preseleccionado, actualizamos el estado local si es necesario
  useEffect(() => {
    if (clientePreseleccionado?.id) {
      setClienteId(clientePreseleccionado.id);
    }
  }, [clientePreseleccionado]);

  const manejarSugerir = async () => {
    if (presentes.length === 0) return mostrarToast("No hay lavadores presentes marcados", "warn");
    setSugiriendo(true);
    const sugerido = await sugerirLavadorIA(presentes, turnos, clienteSel, geminiKey);
    setSugiriendo(false);
    if (sugerido) {
      setLavadorId(sugerido.id);
      mostrarToast(`🤖 Sugerido: ${sugerido.nombre}`, "ok");
    } else {
      mostrarToast("No se pudo generar sugerencia", "warn");
    }
  };

  // Callback when new client is created
  const handleNewClientSuccess = (newClient) => {
    onClienteCreated(newClient); // Actualizar lista global
    setClienteId(newClient.id); // Seleccionar en el turno actual
    // Cargar nota en el turno si el cliente tiene nota
    if (newClient.nota) setNota(`📋 Nota cliente: ${newClient.nota}`);
    mostrarToast(`Cliente ${newClient.nombre} listo para asignar`, "ok");
  };

  const guardar = async () => {
    if (!clienteId) return mostrarToast("Seleccioná un cliente", "warn");
    try {
      await fsAdd(COL_TURNOS, {
        fecha: hoy(), hora, clienteId,
        clienteNombre: clienteSel?.nombre || "Desconocido",
        auto: tamaño.label, precio: tamaño.precio,
        lavadorId, estado: "pendiente", nota,
        creadoEn: serverTimestamp()
      });
      mostrarToast("Turno creado correctamente", "ok");
      onClose();
    } catch (err) {
      mostrarToast("Error al crear turno", "error");
    }
  };

  const inputStyle = {
    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12,
    padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none",
    transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box",
    fontFamily:"'Inter',system-ui,sans-serif"
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo="➕ Nuevo Turno" onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        
        <div>
          <label style={labelStyle}>Cliente</label>
          <BuscadorClientes
            clientes={clientes}
            value={clienteId}
            onChange={(id) => setClienteId(id)}
            placeholder="Buscar por nombre, código o barrio..."
            onCreateNew={(nombre) => {
              setNewClientName(nombre);
              setShowNewClient(true);
            }}
          />
        </div>

        {clienteSel && (
          <div style={{ background:"linear-gradient(135deg,#f8fafc,#eff6ff)", padding:14, borderRadius:14, border:"1px solid #bfdbfe", display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
               <div>
                 <div style={{fontSize:14, fontWeight:800, color:"#1e3a8a"}}>{clienteSel.nombre}</div>
                 <div style={{fontSize:11, color:"#7c3aed", fontFamily:"monospace", marginTop:2}}>{clienteSel.codigo}</div>
               </div>
               <div style={{fontSize:11, fontWeight:700, background:"#dbeafe", color:"#1e3a8a", padding:"4px 8px", borderRadius:6}}>{clienteSel.tipo}</div>
            </div>
            <div style={{fontSize:12, color:"#4b5563", lineHeight:1.5}}>
               <div>📍 {clienteSel.direccion} • {clienteSel.barrio}</div>
               <div>{mostrarTelefono(clienteSel)}</div>
               {clienteSel.nota && <div style={{fontStyle:"italic", color:"#6b7280", marginTop:2}}>📝 {clienteSel.nota}</div>}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Horario</label>
          <select value={hora} onChange={e=>setHora(e.target.value)} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}}>
            {FRANJAS.map(h=><option key={h} value={h}>{h} hs</option>)}
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
                color: tamaño.id===t.id ? "#1e3a8a" : "#6b7280",
                boxShadow: tamaño.id===t.id ? "0 4px 14px rgba(147,197,253,.2)" : "none",
                transition:"all .2s"
              }}>
                {t.label}<br/><span style={{fontSize:11,opacity:.8}}>{formatP(t.precio)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <label style={labelStyle}>Lavador Asignado</label>
            <Btn sm color="secondary" disabled={sugiriendo||presentes.length===0} onClick={manejarSugerir}>
              {sugiriendo ? "🤖 Pensando..." : `🤖 Sugerir (${presentes.length})`}
            </Btn>
          </div>
          <select value={lavadorId} onChange={e=>setLavadorId(e.target.value)} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#c4b5fd";e.target.style.boxShadow="0 0 0 3px rgba(196,181,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}}>
            <option value="">-- Sin asignar --</option>
            {presentes.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(s=>(
              <option key={s.id} value={s.id}>{s.nombre} ({s.transporte})</option>
            ))}
            {staff.filter(s=>!asistencias[s.id]).sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(s=>(
              <option key={s.id} value={s.id} disabled style={{color:"#d1d5db"}}>{s.nombre} (AUSENTE)</option>
            ))}
          </select>
          {presentes.length===0 && (
            <div style={{ fontSize:11, color:"#dc2626", marginTop:6, fontWeight:600 }}>⚠️ No hay lavadores marcados como presentes.</div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Nota del Turno</label>
          <input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Observaciones..."
            style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#93c5fd";e.target.style.boxShadow="0 0 0 3px rgba(147,197,253,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color="primary" full onClick={guardar}>✓ Crear Turno</Btn>
        </div>
      </div>

      {showNewClient && (
        <ModalNuevoCliente
          nombreInicial={newClientName}
          COL_CLIENTES={COL_CLIENTES}
          mostrarToast={mostrarToast}
          onClienteCreated={handleNewClientSuccess}
          onClose={() => setShowNewClient(false)}
        />
      )}
    </Modal>
  );
}

// Modal Cierre Turno (SOFT PASTELS - INTACTO)
function ModalCerrarTurno({ turno, onClose, clientes, cerrarTurnoFn }) {
  const [monto, setMonto] = useState(turno?.precioFinal || turno?.precio || 0);
  const [metodo, setMetodo] = useState("efectivo");
  
  const total = Number(turno?.precioFinal || turno?.precio || 0);
  const deuda = Math.max(0, total - Number(monto || 0));
  const cliente = clientes.find(c => c.id === turno?.clienteId);

  const inputStyle = {
    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12,
    padding:"11px 14px", color:"#1e293b", fontSize:13, outline:"none",
    transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box"
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6, display:"block" };

  return (
    <Modal titulo={`💰 Cerrar Turno: ${turno?.hora} hs`} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#f0f9ff)", padding:16, borderRadius:16, border:"1px solid #bfdbfe" }}>
          <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>👤 {cliente?.nombre || "Cliente Ocasional"}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>🚗 {turno?.auto || "Sin especificar"}</div>
          <div style={{ marginTop:8, fontWeight:800, fontSize:20, color:"#1e3a8a" }}>Total: {formatP(total)}</div>
        </div>

        <div>
          <label style={labelStyle}>Monto Físico Recibido ($)</label>
          <input type="number" value={monto} onChange={e=>setMonto(e.target.value)}
            style={{...inputStyle, fontSize:18, fontWeight:700}} autoFocus
            onFocus={e=>{e.target.style.borderColor="#86efac";e.target.style.boxShadow="0 0 0 3px rgba(134,239,172,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={labelStyle}>Método de Pago</label>
          <select value={metodo} onChange={e=>setMetodo(e.target.value)} style={inputStyle}
            onFocus={e=>{e.target.style.borderColor="#86efac";e.target.style.boxShadow="0 0 0 3px rgba(134,239,172,.2)"}}
            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
        </div>

        {deuda > 0 && (
          <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:16, padding:14, fontSize:12, color:"#92400e" }}>
            ⚠️ <strong>Diferencia pendiente:</strong> {formatP(deuda)}<br/>
            <span style={{opacity:.8}}>Se registrará como deuda en el perfil de {cliente?.nombre || "el cliente"}.</span>
          </div>
        )}

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color={deuda > 0 ? "warning" : "success"} full 
            onClick={() => { cerrarTurnoFn(turno, monto, metodo); onClose(); }}>
            {deuda > 0 ? `Registrar Deuda y Cerrar` : `✓ Confirmar Pago Completo`}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// Previsualización Tabla (SOFT PASTELS - INTACTO)
function PreviewTabla({ datos, columnas, titulo, onImprimir, onCerrar }) {
  if (!datos || datos.length === 0) return null;
  return (
    <Modal titulo={`🖨️ Vista Previa: ${titulo}`} onClose={onCerrar} wide>
      <div style={{ overflowX:"auto", marginBottom:20, borderRadius:14, border:"1px solid #e5e7eb" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f9fafb" }}>
              {columnas.map(col => (
                <th key={col.key} style={{ padding:"12px 14px", textAlign:"left", color:"#374151", fontWeight:700, borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #f3f4f6", transition:"background .15s" }}
                onMouseOver={e=>e.currentTarget.style.background="#f9fafb"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                {columnas.map(col => (
                  <td key={col.key} style={{ padding:"10px 14px", color:"#374151" }}>
                    {col.format ? col.format(fila[col.key], fila) : fila[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn ghost onClick={onCerrar} full>Cancelar</Btn>
        <Btn color="primary" full onClick={() => { onImprimir(datos); onCerrar(); }}>🖨️ Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MÓDULO PRESENTISMO (SOFT PASTELS - INTACTO)
// ═══════════════════════════════════════════════════════════════
function TabPresentismo({ staff, turnos, hoyStr, COL_ASISTENCIAS, db, doc, setDoc, onSnapshot, useEffect, useState, setPreviewData, mostrarToast }) {
  const [asistencias, setAsistencias] = useState({});
  const [cargandoAsistencia, setCargandoAsistencia] = useState(true);

  useEffect(() => {
    const docRef = doc(db, COL_ASISTENCIAS, hoyStr);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setAsistencias(snap.data().registros || {});
      } else {
        setAsistencias({});
      }
      setCargandoAsistencia(false);
    });
    return () => unsub();
  }, [hoyStr, COL_ASISTENCIAS]);

  const toggleAsistencia = async (staffId) => {
    const nuevoEstado = !asistencias[staffId];
    setAsistencias(prev => ({ ...prev, [staffId]: nuevoEstado }));
    try {
      const docRef = doc(db, COL_ASISTENCIAS, hoyStr);
      const nuevosRegistros = { ...asistencias, [staffId]: nuevoEstado };
      await setDoc(docRef, { 
        fecha: hoyStr, registros: nuevosRegistros, actualizadoEn: serverTimestamp() 
      }, { merge: true });
      mostrarToast(nuevoEstado ? `${staff.find(s=>s.id===staffId)?.nombre} ✅ PRESENTE` : `${staff.find(s=>s.id===staffId)?.nombre} ❌ AUSENTE`, nuevoEstado ? "ok" : "warn");
    } catch (err) {
      setAsistencias(prev => ({ ...prev, [staffId]: !nuevoEstado }));
      mostrarToast("Error al guardar asistencia", "error");
    }
  };

  const columnasPreview = [
    { key:"nombre", label:"Lavador" }, { key:"transporte", label:"Movilidad" },
    { key:"estado", label:"Estado", format:(v)=>v?"✅ Presente":"❌ Ausente" },
    { key:"turnos", label:"Turnos Hoy", format:(_,row)=>turnos.filter(t=>t.lavadorId===row.id).length }
  ];
  const datosPreview = staff.map(s=>({...s, estado:asistencias[s.id]||false, turnos:turnos.filter(t=>t.lavadorId===s.id).length}));

  if (cargandoAsistencia) return <div style={{textAlign:"center",color:"#9ca3af",padding:40,fontSize:13}}>Cargando presentismo...</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeInUp .4s ease-out" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"#1e293b" }}>📋 Control de Personal</h3>
        <Btn sm color="tertiary" onClick={()=>setPreviewData({titulo:"Presentismo "+fechaAR(hoyStr),datos:datosPreview,columnas:columnasPreview})}>🖨️ Previsualizar</Btn>
      </div>
      <div style={{ fontSize:12, color:"#6b7280", background:"#f9fafb", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb" }}>
        💡 Marcá quién vino hoy ANTES de crear turnos. Los presentes aparecerán disponibles en "+ Nuevo Turno".
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:10 }}>
        {staff.map(s => {
          const presente = asistencias[s.id];
          return (
            <button key={s.id} onClick={()=>toggleAsistencia(s.id)} style={{
              background: presente ? "linear-gradient(135deg,#ecfdf5,#f0fdf4)" : "#ffffff",
              border: `1.5px solid ${presente ? "#a7f3d0" : "#e5e7eb"}`,
              borderRadius:16, padding:"14px 16px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:12, textAlign:"left",
              transition:"all .2s ease",
              boxShadow: presente ? "0 4px 14px rgba(167,243,208,.2)" : "0 2px 8px rgba(0,0,0,.03)"
            }}
            onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{
                width:12, height:12, borderRadius:"50%", flexShrink:0,
                background: presente ? "#10b981" : "#d1d5db",
                boxShadow: presente ? "0 0 8px rgba(16,185,129,.4)" : "none"
              }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: presente ? "#064e3b" : "#374151" }}>{s.nombre}</div>
                <div style={{ fontSize:11, color: presente ? "#059669" : "#9ca3af", fontWeight:600 }}>{s.transporte}</div>
              </div>
            </button>
          );
        })}
      </div>
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

  const [diaActual, setDiaActual] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [tab, setTab] = useState("agenda");
  const [modalOpen, setModalOpen] = useState(null);
  const [editando, setEditando] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [clienteParaTurno, setClienteParaTurno] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [busquedaClientes, setBusquedaClientes] = useState("");
  
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("sofia_gemini_key") || "");
  const [keyDesbloqueada, setKeyDesbloqueada] = useState(false);
  const [inputClave, setInputClave] = useState("");

  const mostrarToast = (msg, tipo="ok") => setToast({ msg, tipo });

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

  // SEED (INTACTO)
  useEffect(() => {
    const seedIfEmpty = async () => {
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
      } catch (err) { console.error("Error seeding:", err); }
    };
    seedIfEmpty();
  }, [modoPrueba]);

  // SUSCRIPCIONES TIEMPO REAL (INTACTAS)
  useEffect(() => {
    const fechaHoy = hoy();
    setCargando(true);
    const unsubDia = onSnapshot(doc(db, COL_DIAS, fechaHoy), 
      (snap) => {
        if (snap.exists()) setDiaActual({ id: snap.id, ...snap.data() });
        else {
          const nuevoDia = { fecha: fechaHoy, estado: "cerrado", apertura: null, cierre: null, lluvia: false };
          setDiaActual(nuevoDia);
          if(!modoPrueba) fsSave(COL_DIAS, fechaHoy, nuevoDia);
        }
        setCargando(false);
      },
      () => { setCargando(false); mostrarToast("Sin conexión a base de datos", "error"); }
    );
    const unsubTurnos = onSnapshot(collection(db, COL_TURNOS), (snap) => {
      const lista = snap.docs.map(d=>({id:d.id,...d.data()})).filter(t=>t.fecha===fechaHoy).sort((a,b)=>FRANJAS.indexOf(a.hora)-FRANJAS.indexOf(b.hora));
      setTurnos(lista);
    });
    const unsubClientes = onSnapshot(collection(db, COL_CLIENTES), (snap) => {
      if (!snap.empty) setClientes(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const unsubStaff = onSnapshot(collection(db, COL_STAFF), (snap) => {
      if (!snap.empty) setStaff(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return () => { unsubDia(); unsubTurnos(); unsubClientes(); unsubStaff(); };
  }, [modoPrueba]);

  useEffect(() => {
    const fechaHoy = hoy();
    const docRef = doc(db, COL_ASISTENCIAS, fechaHoy);
    const unsub = onSnapshot(docRef, (snap) => {
      setAsistencias(snap.exists() ? (snap.data().registros || {}) : {});
    });
    return () => unsub();
  }, [modoPrueba]);

  // ACCIONES DE NEGOCIO (INTACTAS)
  const cerrarTurno = async (turno, montoRecibido, metodoPago) => {
    const total = Number(turno.precioFinal || turno.precio || 0);
    const recibido = Math.max(0, Number(montoRecibido || 0));
    const diferencia = total - recibido;
    await fsUpdate(COL_TURNOS, turno.id, {
      estado:"rendido", pagado:recibido, deudaGenerada:diferencia>0?diferencia:0,
      metodoPago, rendidoEn:serverTimestamp(), editadoPostRendicion:false
    });
    if (diferencia > 0 && turno.clienteId) {
      const cli = clientes.find(c => c.id === turno.clienteId);
      if (cli) {
        await fsUpdate(COL_CLIENTES, cli.id, { deuda: Number(cli.deuda||0) + diferencia });
        mostrarToast(`Deuda registrada: ${formatP(diferencia)}`, "warn");
      }
    } else {
      mostrarToast("Turno cerrado correctamente", "ok");
    }
  };

  const activarLluvia = async () => {
    if (!diaActual?.id) return;
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia:true, lluviaInicio:serverTimestamp() });
    const pendientes = turnos.filter(t => t.estado==="pendiente" && t.hora>=horaAR());
    await Promise.all(pendientes.map(t => fsUpdate(COL_TURNOS, t.id, { estado:"lluvia" })));
    mostrarToast("Modo lluvia activado", "warn");
  };

  const reanudarTrasLluvia = async () => {
    if (!diaActual?.id) return;
    const minutosActuales = new Date().getHours()*60 + new Date().getMinutes();
    let franjaInicio = FRANJAS.find(h => { const [hr,mn]=h.split(":").map(Number); return hr*60+mn>=minutosActuales; }) || FRANJAS[FRANJAS.length-1];
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia:false, lluviaFin:serverTimestamp() });
    const pendientes = turnos.filter(t => t.estado==="lluvia");
    let idx = FRANJAS.indexOf(franjaInicio);
    for (const t of pendientes) {
      if (idx >= FRANJAS.length) break;
      await fsUpdate(COL_TURNOS, t.id, { hora:FRANJAS[idx], estado:"pendiente", reasignadoPorLluvia:true });
      idx++;
    }
    mostrarToast(`Reanudado desde ${franjaInicio}`, "ok");
  };

  const verificarClaveAcceso = () => {
    if (inputClave === CLAVE_MAESTRA) { setKeyDesbloqueada(true); setInputClave(""); mostrarToast("Acceso concedido", "ok"); }
    else { setInputClave(""); mostrarToast("Clave incorrecta", "error"); }
  };

  const toggleDia = async () => {
    if (!diaActual?.id) return;
    const nuevoEstado = diaActual?.estado === "abierto" ? "cerrado" : "abierto";
    await fsUpdate(COL_DIAS, diaActual.id, { 
      estado:nuevoEstado,
      apertura: nuevoEstado==="abierto" ? serverTimestamp() : diaActual.apertura,
      cierre: nuevoEstado==="cerrado" ? serverTimestamp() : null
    });
    mostrarToast(nuevoEstado==="abierto" ? "☀️ Día ABIERTO" : "🌙 Día CERRADO", "ok");
  };

  // Filtrado de clientes para pestaña Clientes
  const clientesFiltrados = busquedaClientes.trim() === "" ? clientes : clientes.filter(c =>
    sinAcentos(c.nombre).includes(sinAcentos(busquedaClientes)) ||
    sinAcentos(c.codigo || "").includes(sinAcentos(busquedaClientes)) ||
    sinAcentos(c.barrio || "").includes(sinAcentos(busquedaClientes)) ||
    sinAcentos(c.telefono || "").includes(sinAcentos(busquedaClientes))
  );

  // ─── RENDER ───
  if (cargando) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f9fafb",color:"#6b7280",fontFamily:"'Inter',system-ui,sans-serif",fontWeight:600,fontSize:14}}>
      ⟳ Sincronizando Sofia Lavados...
    </div>
  );

  // PANTALLA COMPLETA DE APERTURA
  if (diaActual?.estado !== "abierto") {
    return (
      <div style={{ minHeight:"100vh", background:"#f9fafb", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Inter',system-ui,sans-serif" }}>
        <div style={{ animation:"fadeInUp .5s ease-out", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:12 }}>🚗</div>
          <h1 style={{ color:"#1e293b", fontSize:28, fontWeight:900, marginBottom:6, letterSpacing:"-0.5px" }}>Sofía Lavados</h1>
          <p style={{ color:"#6b7280", fontSize:14, marginBottom:40, fontWeight:500 }}>{fechaAR(hoy())} • {horaAR()} hs</p>
          
          <button onClick={toggleDia} style={{
            background:"linear-gradient(135deg,#bbf7d0,#a7f3d0)",
            color:"#14532d", border:"1px solid #86efac", borderRadius:20,
            padding:"22px 56px", fontSize:20, fontWeight:800,
            cursor:"pointer", boxShadow:"0 8px 30px rgba(167,243,208,.3)",
            transition:"all .3s ease", width:"100%", maxWidth:380,
            fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:"0.3px"
          }}
          onMouseOver={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(167,243,208,.4)"}}
          onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 8px 30px rgba(167,243,208,.3)"}}>
            🟢 ABRIR DÍA
          </button>

          {modoOculto && (
            <div style={{ marginTop:20, padding:"8px 20px", borderRadius:12, background:"#fffbeb", border:"1px solid #fde68a", color:"#92400e", fontSize:12, fontWeight:700, display:"inline-block" }}>
              🧪 MODO OCULTO ACTIVO
            </div>
          )}
        </div>
        {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
      </div>
    );
  }

  // APP NORMAL (DÍA ABIERTO)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb", color:"#1e293b", fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:90 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @media (max-width:768px) {
          .reloj-desktop { display:none !important; }
          .nav-tabs { overflow-x:auto !important; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .nav-tabs::-webkit-scrollbar { display:none; }
        }
      `}</style>

      {/* HEADER (FIXED) */}
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(255,255,255,.9)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid #e5e7eb",
        padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div onClick={handleLogoTap} style={{
            fontSize:18, fontWeight:900, cursor:"pointer", userSelect:"none",
            color:"#1e293b", letterSpacing:"-0.3px"
          }}>🚗 Sofía</div>
          <div style={{
            fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:10,
            background: diaActual?.lluvia ? "#fffbeb" : "#ecfdf5",
            color: diaActual?.lluvia ? "#92400e" : "#064e3b",
            border: diaActual?.lluvia ? "1px solid #fde68a" : "1px solid #a7f3d0"
          }}>
            {diaActual?.lluvia ? "🌧️ LLUVIA" : "🟢 ABIERTO"}
          </div>
          {modoOculto && (
            <span style={{ fontSize:10, fontWeight:800, color:"#92400e", background:"#fffbeb", padding:"3px 8px", borderRadius:8, border:"1px solid #fde68a" }}>OCULTO</span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {diaActual?.lluvia ? (
            <Btn sm color="success" onClick={reanudarTrasLluvia}>☀️ Reanudar</Btn>
          ) : (
            <Btn sm color="warning" onClick={activarLluvia}>🌧️ Lluvia</Btn>
          )}
          <div className="reloj-desktop" style={{ fontSize:13, color:"#6b7280", fontWeight:700, fontVariantNumeric:"tabular-nums", display:"flex", alignItems:"center", gap:6 }}>
            {fechaAR(hoy())} • {horaAR()} hs
          </div>
        </div>
      </header>

      {/* NAV TABS (STICKY BELOW HEADER) */}
      <nav className="nav-tabs" style={{
        display:"flex", gap:6, padding:"10px 16px",
        borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap", alignItems:"center",
        background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)",
        position:"sticky", top:"58px", zIndex:90
      }}>
        {[
          {id:"agenda",label:"📋 Agenda",color:"#3b82f6",bg:"#dbeafe",border:"#bfdbfe"},
          {id:"presentismo",label:"✅ Presentismo",color:"#059669",bg:"#d1fae5",border:"#a7f3d0"},
          {id:"caja",label:"💰 Caja",color:"#d97706",bg:"#fef3c7",border:"#fde68a"},
          {id:"clientes",label:"👥 Clientes",color:"#7c3aed",bg:"#ede9fe",border:"#ddd6fe"},
          {id:"config",label:"⚙️ Config",color:"#4b5563",bg:"#f3f4f6",border:"#e5e7eb"}
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background: tab===t.id ? t.bg : "transparent",
            color: tab===t.id ? t.color : "#6b7280",
            border: tab===t.id ? `1.5px solid ${t.border}` : "1.5px solid transparent",
            borderRadius:12, padding:"8px 16px", fontSize:12, fontWeight:700,
            cursor:"pointer", flexShrink:0, transition:"all .2s",
            fontFamily:"'Inter',system-ui,sans-serif"
          }}
          onMouseOver={e=>{if(tab!==t.id)e.currentTarget.style.background="#f3f4f6"}}
          onMouseOut={e=>{if(tab!==t.id)e.currentTarget.style.background="transparent"}}>
            {t.label}
          </button>
        ))}
        <button onClick={toggleDia} style={{
          marginLeft:"auto", flexShrink:0,
          background:"#fecaca", color:"#991b1b",
          border:"1px solid #fca5a5", borderRadius:12,
          padding:"8px 16px", fontSize:12, fontWeight:800,
          cursor:"pointer", boxShadow:"0 4px 14px rgba(254,202,202,.25)",
          transition:"all .2s", fontFamily:"'Inter',system-ui,sans-serif"
        }}
        onMouseOver={e=>{e.currentTarget.style.background="#fca5a5";e.currentTarget.style.transform="translateY(-2px)"}}
        onMouseOut={e=>{e.currentTarget.style.background="#fecaca";e.currentTarget.style.transform="translateY(0)"}}>
          🔴 Cerrar Día
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ padding:20, maxWidth:800, margin:"0 auto", animation:"fadeInUp .4s ease-out" }}>
        
        {/* AGENDA */}
        {tab === "agenda" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1e293b" }}>Turnos de Hoy</h3>
              <Btn sm color="primary" onClick={()=>{setClienteParaTurno(null);setModalOpen("nuevoTurno");}}>➕ Nuevo Turno</Btn>
            </div>

            {turnos.length === 0 ? (
              <div style={{ textAlign:"center", color:"#9ca3af", padding:60, fontSize:14, background:"#ffffff", borderRadius:20, border:"1.5px dashed #e5e7eb" }}>
                <div style={{fontSize:32,marginBottom:12}}>📋</div>
                No hay turnos registrados.<br/><span style={{fontWeight:600,color:"#6b7280"}}>Tocá "+ Nuevo Turno" para comenzar.</span>
              </div>
            ) : (
              turnos.map(t => (
                <div key={t.id} style={{
                  background:"#ffffff", borderRadius:18, padding:18,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  border:"1px solid #e5e7eb",
                  boxShadow:"0 2px 10px rgba(0,0,0,.03)",
                  transition:"all .2s ease"
                }}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 25px rgba(0,0,0,.06)"}}
                onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.03)"}}>
                  <div>
                    <div style={{ display:"inline-block",fontSize:13,fontWeight:800, color:"#1e3a8a", marginBottom:4 }}>{t.hora} hs</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{t.clienteNombre}</div>
                    <div style={{ fontSize:12, color:"#6b7280", fontWeight:500, marginTop:2 }}>{t.auto} • {formatP(t.precio)}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {t.estado === "pendiente" && (
                      <Btn sm color="success" onClick={()=>{setEditando(t);setModalOpen("cerrarTurno");}}>💰 Cobrar</Btn>
                    )}
                    {t.estado === "rendido" && (
                      <span style={{ fontSize:11, fontWeight:800, padding:"6px 12px", borderRadius:10, background:"#ecfdf5", color:"#064e3b", border:"1px solid #a7f3d0" }}>✓ RENDIDO</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* PRESENTISMO */}
        {tab === "presentismo" && (
          <TabPresentismo 
            staff={staff} turnos={turnos} hoyStr={hoy()} COL_ASISTENCIAS={COL_ASISTENCIAS} 
            db={db} doc={doc} setDoc={setDoc} onSnapshot={onSnapshot} 
            useEffect={useEffect} useState={useState} setPreviewData={setPreviewData} mostrarToast={mostrarToast} 
          />
        )}
        
        {/* CAJA */}
        {tab === "caja" && (
          <div style={{ textAlign:"center", padding:50, background:"#ffffff", borderRadius:24, border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,.03)", animation:"fadeInUp .4s ease-out" }}>
            <div style={{ fontSize:13, color:"#6b7280", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Recaudación del día</div>
            <div style={{ fontSize:42, fontWeight:900, letterSpacing:"-1px", color:"#1e3a8a", marginBottom:12 }}>
              {formatP(turnos.reduce((a,t) => a + (t.pagado||0), 0))}
            </div>
            <div style={{ display:"inline-block",fontSize:12, fontWeight:700, padding:"6px 16px", borderRadius:10, background:"#eff6ff", color:"#1e3a8a", border:"1px solid #bfdbfe" }}>
              {turnos.filter(t=>t.estado==="rendido").length} turnos rendidos
            </div>
          </div>
        )}
        
        {/* CLIENTES (FIXED AND ENHANCED) */}
        {tab === "clientes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeInUp .4s ease-out" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1e293b" }}>👥 Clientes ({clientesFiltrados.length})</h3>
            </div>

            <div style={{position:"relative"}}>
              <input
                type="text"
                value={busquedaClientes}
                onChange={e => setBusquedaClientes(e.target.value)}
                placeholder="🔍 Buscar por nombre, código, barrio o teléfono..."
                style={{
                  background:"#ffffff", border:"1.5px solid #e5e7eb", borderRadius:14,
                  padding:"12px 16px", color:"#1e293b", fontSize:14, outline:"none",
                  transition:"border-color .2s, box-shadow .2s", width:"100%", boxSizing:"border-box",
                  fontFamily:"'Inter',system-ui,sans-serif", fontWeight:500
                }}
                onFocus={e=>{e.target.style.borderColor="#c4b5fd";e.target.style.boxShadow="0 0 0 3px rgba(196,181,253,.2)"}}
                onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none"}}
              />
            </div>

            {clientesFiltrados.length === 0 ? (
              <div style={{ textAlign:"center", color:"#9ca3af", padding:40, fontSize:13, background:"#ffffff", borderRadius:16, border:"1px solid #e5e7eb" }}>
                {clientes.length === 0 ? "Cargando clientes..." : "Sin resultados para esta búsqueda"}
              </div>
            ) : (
              clientesFiltrados.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"")).map(c => (
                <div key={c.id} style={{
                  background:"#ffffff", borderRadius:18, padding:18,
                  border:"1px solid #e5e7eb", boxShadow:"0 2px 8px rgba(0,0,0,.02)",
                  transition:"all .2s", display:"flex", flexDirection:"column", gap:10
                }}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 15px rgba(0,0,0,.05)"}}
                onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.02)"}}>
                  
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#1e293b" }}>{c.nombre}</div>
                      {/* FIX 1: Código Visible */}
                      <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", marginTop:2, fontFamily:"monospace" }}>{c.codigo}</div>
                    </div>
                    <div style={{display:"flex", gap:6, alignItems:"center"}}>
                      {c.deuda > 0 && (
                        <span style={{ fontSize:11, fontWeight:800, padding:"4px 10px", borderRadius:8, background:"#fef2f2", color:"#991b1b", border:"1px solid #fecaca" }}>
                          Deuda: {formatP(c.deuda)}
                        </span>
                      )}
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8, background:"#f3f4f6", color:"#4b5563", border:"1px solid #e5e7eb" }}>
                        {c.tipo}
                      </span>
                    </div>
                  </div>

                  {/* FIX 2: Mostrar info completa */}
                  <div style={{fontSize:12, color:"#6b7280", lineHeight:1.6}}>
                    <div>📍 {c.direccion || "Sin dirección"} • {c.barrio}</div>
                    <div>{mostrarTelefono(c)}</div>
                    {c.nota && <div style={{fontStyle:"italic", opacity:.8}}>📝 {c.nota}</div>}
                  </div>

                  <div style={{display:"flex", gap:8, marginTop:4}}>
                    <Btn sm color="primary" onClick={()=>{setClienteParaTurno(c);setModalOpen("nuevoTurno");}}>
                      ➕ Asignar Turno
                    </Btn>
                    <Btn sm color="secondary" onClick={()=>setClienteParaEditar(c)}>
                      ✏️ Editar
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* CONFIG */}
        {tab === "config" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeInUp .4s ease-out" }}>
            {!keyDesbloqueada ? (
              <div style={{ background:"#ffffff", padding:24, borderRadius:20, textAlign:"center", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,.03)" }}>
                <div style={{ fontSize:14, color:"#374151", marginBottom:14, fontWeight:600 }}>🔒 Ingresa clave para ver API Key Gemini</div>
                <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                  <input type="password" placeholder="Clave maestra" value={inputClave} onChange={e=>setInputClave(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verificarClaveAcceso()} style={{
                    background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"10px 16px", color:"#1e293b", fontSize:13, outline:"none", width:180, fontFamily:"'Inter',system-ui,sans-serif"
                  }} />
                  <Btn sm color="secondary" onClick={verificarClaveAcceso}>Desbloquear</Btn>
                </div>
              </div>
            ) : (
              <div style={{ background:"#ffffff", padding:24, borderRadius:20, border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,.03)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>🔑 API Key Gemini</span>
                  <button onClick={()=>setKeyDesbloqueada(false)} style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", fontSize:12, fontWeight:700 }}>🔒 Bloquear</button>
                </div>
                <input type="text" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} style={{
                  width:"100%", background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"12px 16px", color:"#1e293b", fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"monospace"
                }} />
                <Btn sm color="primary" full style={{marginTop:12}} onClick={()=>{localStorage.setItem("sofia_gemini_key", geminiKey); mostrarToast("API Key guardada","ok");}}>💾 Guardar</Btn>
              </div>
            )}
            <div style={{background:"#ffffff", padding:20, borderRadius:20, border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,.03)"}}>
              <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer"}}>
                <input type="checkbox" checked={modoPrueba} onChange={e=>{setModoPrueba(e.target.checked);setModoOculto(e.target.checked);}} style={{width:18,height:18,accentColor:"#7c3aed"}} />
                <span style={{fontSize:14,fontWeight:600,color:"#374151"}}>🧪 Modo Prueba (Datos aislados)</span>
              </label>
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {modalOpen === "nuevoTurno" && (
        <ModalNuevoTurno 
          clientes={clientes} staff={staff} turnos={turnos} asistencias={asistencias} 
          COL_TURNOS={COL_TURNOS} COL_CLIENTES={COL_CLIENTES} geminiKey={geminiKey} mostrarToast={mostrarToast} 
          clientePreseleccionado={clienteParaTurno}
          onClienteCreated={(nuevoCliente) => {
             // Actualizar el array global de clientes inmediatamente para el buscador
             setClientes(prev => [...prev, nuevoCliente]);
          }}
          onClose={()=>{setModalOpen(null);setClienteParaTurno(null);}} 
        />
      )}
      {modalOpen === "cerrarTurno" && editando && (
        <ModalCerrarTurno turno={editando} clientes={clientes} cerrarTurnoFn={cerrarTurno} 
          onClose={()=>{setModalOpen(null);setEditando(null);}} 
        />
      )}
      {clienteParaEditar && (
        <ModalEditarCliente 
          cliente={clienteParaEditar} COL_CLIENTES={COL_CLIENTES} mostrarToast={mostrarToast}
          onClose={()=>setClienteParaEditar(null)} 
        />
      )}
      {previewData && <PreviewTabla {...previewData} onImprimir={()=>window.print()} onCerrar={()=>setPreviewData(null)} />}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
    </div>
  );
}
