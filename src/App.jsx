import { useState, useEffect } from "react";
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
  "#22d3ee","#0ea5e9","#38bdf8","#7dd3fc","#06b6d4","#67e8f9",
  "#a5f3fc","#2dd4bf","#5eead4","#34d399","#6ee7b7","#a7f3d0",
  "#c084fc","#d8b4fe","#e879f9","#f0abfc","#a78bfa","#fbbf24",
  "#fb923c","#f87171","#4ade80","#facc15","#60a5fa","#f472b6",
];

const STAFF_SEED = [
  {nombre:"Jhony",     transporte:"moto",color:"#22d3ee",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Sergio",    transporte:"moto",color:"#0ea5e9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Alexander", transporte:"moto",color:"#38bdf8",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Maxi",      transporte:"moto",color:"#7dd3fc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Rene",      transporte:"moto",color:"#06b6d4",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Brandon",   transporte:"moto",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Jorge",     transporte:"moto",color:"#a5f3fc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Emiliano",  transporte:"moto",color:"#2dd4bf",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Gaby",      transporte:"moto",color:"#5eead4",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Javi",      transporte:"moto",color:"#99f6e4",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Franco",    transporte:"moto",color:"#34d399",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Fede",      transporte:"moto",color:"#6ee7b7",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Elias",     transporte:"moto",color:"#a7f3d0",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Alvaro",    transporte:"bici",color:"#c084fc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Nestor",    transporte:"bici",color:"#d8b4fe",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Matias",    transporte:"bici",color:"#e879f9",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Luis",      transporte:"bici",color:"#f0abfc",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Bruno",     transporte:"bici",color:"#a78bfa",whatsapp:true, rol:"lavador",especial:"", saldoPendiente:0},
  {nombre:"Nico Alto", transporte:"bici",color:"#fbbf24",whatsapp:true, rol:"lavador",especial:"rapido", saldoPendiente:0},
  {nombre:"Hernán",    transporte:"bici",color:"#f87171",whatsapp:false,rol:"lavador",especial:"avisar_presencia", saldoPendiente:0},
  {nombre:"Gastón",    transporte:"bici",color:"#fb923c",whatsapp:false,rol:"lavador",especial:"llamar_telefono", saldoPendiente:0},
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
const colorNuevo  = (staff) => COLORES.find(c=>!staff.map(s=>s.color).includes(c)) || "#94a3b8";
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
  if(!dir) return { lat:BASE_LAT, lng:BASE_LNG };
  if(_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,{
      headers:{"Accept-Language":"es","User-Agent":"SofiaLavados/5.0"}
    });
    const data = await res.json();
    if(data.length>0) {
      const coords = { lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon) };
      _geocache[dir] = coords;
      return coords;
    }
  } catch {}
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000) };
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
//  COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════
function Toast({msg,tipo,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const c={ok:"#22d3ee",error:"#f87171",warn:"#fbbf24"}[tipo]||"#22d3ee";
  return <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:"#0b1220",border:`1px solid ${c}55`,color:c,padding:"11px 16px",borderRadius:10,fontSize:12,fontFamily:"inherit",boxShadow:`0 4px 20px ${c}22`,maxWidth:280,animation:"fi .2s ease"}}>
    {tipo==="ok"?"✓":tipo==="error"?"✗":"⚠"} {msg}
  </div>;
}

function Modal({titulo,onClose,children,wide}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:14,padding:20,width:"100%",maxWidth:wide?580:440,maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{titulo}</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px"}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

function Btn({children,onClick,color="#0e7490",ghost,danger,disabled,full,sm,style={}}) {
  const bg = disabled?"#1e2d40":danger?"#dc2626":ghost?"transparent":`linear-gradient(135deg, ${color}, ${color})`;
  return (
    <button style={{
      background: bg,
      color: disabled ? "#475569" : ghost ? color : "#fff",
      border: ghost ? `1px solid ${color}44` : "none",
      borderRadius: 8,
      padding: sm ? "6px 12px" : "10px 18px",
      fontSize: sm ? 12 : 13,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      width: full ? "100%" : "auto",
      transition: "all .2s ease",
      opacity: disabled ? 0.6 : 1,
      fontFamily: "inherit",
      ...style
    }} onClick={!disabled ? onClick : undefined}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL NUEVO TURNO
// ═══════════════════════════════════════════════════════════════
function ModalNuevoTurno({ onClose, clientes, staff, COL_TURNOS, mostrarToast }) {
  const [clienteId, setClienteId] = useState("");
  const [hora, setHora] = useState(franjasValidas()[0] || FRANJAS[0]);
  const [tamaño, setTamaño] = useState(TAMANOS_DEFAULT[1]);
  const [lavadorId, setLavadorId] = useState("");
  const [nota, setNota] = useState("");

  const clienteSel = clientes.find(c => c.id === clienteId);

  const guardar = async () => {
    if (!clienteId) return mostrarToast("Seleccioná un cliente", "warn");
    try {
      await fsAdd(COL_TURNOS, {
        fecha: hoy(),
        hora,
        clienteId,
        clienteNombre: clienteSel?.nombre || "Desconocido",
        auto: tamaño.label,
        precio: tamaño.precio,
        lavadorId,
        estado: "pendiente",
        nota,
        creadoEn: serverTimestamp()
      });
      mostrarToast("Turno creado correctamente", "ok");
      onClose();
    } catch (err) {
      mostrarToast("Error al crear turno", "error");
    }
  };

  return (
    <Modal titulo="➕ Nuevo Turno" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Cliente */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Cliente</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
          <option value="">-- Seleccionar --</option>
          {clientes.sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"")).map(c => (
            <option key={c.id} value={c.id}>{c.nombre} ({c.barrio})</option>
          ))}
        </select>

        {/* Hora */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Horario</label>
        <select value={hora} onChange={e => setHora(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
          {FRANJAS.map(h => <option key={h} value={h}>{h} hs</option>)}
        </select>

        {/* Tamaño */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Vehículo</label>
        <div style={{ display: "flex", gap: 6 }}>
          {TAMANOS_DEFAULT.map(t => (
            <button key={t.id} onClick={() => setTamaño(t)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tamaño.id === t.id ? "#22d3ee22" : "#0f172a",
              border: tamaño.id === t.id ? "1px solid #22d3ee" : "1px solid #334155",
              color: tamaño.id === t.id ? "#22d3ee" : "#94a3b8"
            }}>
              {t.label}<br/><span style={{fontSize:11}}>{formatP(t.precio)}</span>
            </button>
          ))}
        </div>

        {/* Lavador */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Lavador Asignado</label>
        <select value={lavadorId} onChange={e => setLavadorId(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
          <option value="">-- Sin asignar --</option>
          {staff.sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"")).map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        {/* Nota */}
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Nota</label>
        <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Observaciones..."
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }} />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn full onClick={guardar}>✓ Crear Turno</Btn>
        </div>
      </div>
    </Modal>
  );
}

// Modal Cierre Turno
function ModalCerrarTurno({ turno, onClose, clientes, cerrarTurnoFn }) {
  const [monto, setMonto] = useState(turno?.precioFinal || turno?.precio || 0);
  const [metodo, setMetodo] = useState("efectivo");
  
  const total = Number(turno?.precioFinal || turno?.precio || 0);
  const deuda = Math.max(0, total - Number(monto || 0));
  const cliente = clientes.find(c => c.id === turno?.clienteId);

  return (
    <Modal titulo={`💰 Cerrar Turno: ${turno?.hora} hs`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#1e293b", padding: 12, borderRadius: 8, fontSize: 13 }}>
          <div>👤 {cliente?.nombre || "Cliente Ocasional"}</div>
          <div>🚗 {turno?.auto || "Sin especificar"}</div>
          <div style={{ marginTop: 6, fontWeight: 700, color: "#22d3ee" }}>Total: {formatP(total)}</div>
        </div>

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Monto Físico Recibido ($)</label>
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 16, outline: "none" }} autoFocus />

        <label style={{ fontSize: 12, color: "#94a3b8" }}>Método de Pago</label>
        <select value={metodo} onChange={e => setMetodo(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
        </select>

        {deuda > 0 && (
          <div style={{ background: "#7c2d1244", border: "1px solid #f8717155", borderRadius: 8, padding: 12, fontSize: 12, color: "#fca5a5" }}>
            ⚠️ <strong>Diferencia pendiente:</strong> {formatP(deuda)}<br/>
            Se registrará como deuda en el perfil de {cliente?.nombre || "el cliente"}.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn ghost onClick={onClose} full>Cancelar</Btn>
          <Btn color={deuda > 0 ? "#d97706" : "#0e7490"} full 
            onClick={() => { cerrarTurnoFn(turno, monto, metodo); onClose(); }}>
            {deuda > 0 ? `Registrar Deuda y Cerrar` : `✓ Confirmar Pago Completo`}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// Previsualización Tabla
function PreviewTabla({ datos, columnas, titulo, onImprimir, onCerrar }) {
  if (!datos || datos.length === 0) return null;
  return (
    <Modal titulo={`🖨️ Vista Previa: ${titulo}`} onClose={onCerrar} wide>
      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid #334155" }}>
            {columnas.map(col => (<th key={col.key} style={{ padding: "8px 10px", textAlign: "left", color: "#94a3b8", fontWeight: 600 }}>{col.label}</th>))}
          </tr></thead>
          <tbody>{datos.map((fila, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
              {columnas.map(col => (<td key={col.key} style={{ padding: "8px 10px", color: "#e2e8f0" }}>
                {col.format ? col.format(fila[col.key], fila) : fila[col.key]}
              </td>))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn ghost full onClick={onCerrar}>Cancelar</Btn>
        <Btn full onClick={() => { onImprimir(datos); onCerrar(); }}>🖨️ Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

// Módulo Presentismo
function TabPresentismo({ staff, turnos, hoyStr, COL_TURNOS, db, collection, onSnapshot, useEffect, useState, setPreviewData, mostrarToast }) {
  const [asistencias, setAsistencias] = useState({});
  useEffect(() => {
    const unsub = onSnapshot(collection(db, COL_TURNOS), (snap) => {
      const datos = {};
      snap.docs.forEach(d => { const t = d.data(); if (t.fecha === hoyStr && t.lavadorId) datos[t.lavadorId] = true; });
      setAsistencias(datos);
    });
    return () => unsub();
  }, [hoyStr]);

  const toggleAsistencia = (staffId) => {
    const nuevoEstado = !asistencias[staffId];
    setAsistencias(prev => ({ ...prev, [staffId]: nuevoEstado }));
    mostrarToast(nuevoEstado ? "Marcado como PRESENTE" : "Marcado como AUSENTE", nuevoEstado ? "ok" : "warn");
  };

  const columnasPreview = [
    { key: "nombre", label: "Lavador" }, { key: "transporte", label: "Movilidad" },
    { key: "estado", label: "Estado", format: (v) => v ? "✅ Presente" : "❌ Ausente" },
    { key: "turnos", label: "Turnos Hoy", format: (_, row) => turnos.filter(t => t.lavadorId === row.id).length }
  ];
  const datosPreview = staff.map(s => ({ ...s, estado: asistencias[s.id] || false, turnos: turnos.filter(t => t.lavadorId === s.id).length }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#e2e8f0" }}>📋 Control de Personal</h3>
        <Btn sm onClick={() => setPreviewData({ titulo: "Presentismo " + fechaAR(hoyStr), datos: datosPreview, columnas: columnasPreview })}>🖨️ Previsualizar</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {staff.map(s => {
          const presente = asistencias[s.id];
          return (
            <button key={s.id} onClick={() => toggleAsistencia(s.id)} style={{
              background: presente ? "#065f4622" : "#1e293b", border: `1px solid ${presente ? "#34d399" : "#334155"}`,
              borderRadius: 8, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left"
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: presente ? "#34d399" : "#475569" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: presente ? "#34d399" : "#94a3b8" }}>{s.nombre}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.transporte}</div>
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
  const CLAVE_MAESTRA = "sofia2024"; 
  
  const COL_DIAS = modoPrueba ? "dias_prueba" : "dias";
  const COL_TURNOS = modoPrueba ? "turnos_prueba" : "turnos";
  const COL_CLIENTES = modoPrueba ? "clientes_prueba" : "clientes";
  const COL_STAFF = modoPrueba ? "staff_prueba" : "staff";

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
  
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("sofia_gemini_key") || "");
  const [keyDesbloqueada, setKeyDesbloqueada] = useState(false);
  const [inputClave, setInputClave] = useState("");

  const mostrarToast = (msg, tipo="ok") => setToast({ msg, tipo });

  // ─── SEED AUTOMÁTICO DE DATOS INICIALES ───
  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const cliSnap = await getDocs(collection(db, COL_CLIENTES));
        if (cliSnap.empty) {
          const batch = writeBatch(db);
          CLIENTES_SEED.forEach(c => {
            const ref = doc(collection(db, COL_CLIENTES));
            batch.set(ref, { ...c, _ts: serverTimestamp() });
          });
          await batch.commit();
          console.log("✅ Clientes seed cargados");
        }

        const staffSnap = await getDocs(collection(db, COL_STAFF));
        if (staffSnap.empty) {
          const batch = writeBatch(db);
          STAFF_SEED.forEach(s => {
            const ref = doc(collection(db, COL_STAFF));
            batch.set(ref, { ...s, _ts: serverTimestamp() });
          });
          await batch.commit();
          console.log("✅ Staff seed cargado");
        }
      } catch (err) {
        console.error("Error seeding:", err);
      }
    };
    seedIfEmpty();
  }, [modoPrueba]);

  // ─── SUSCRIPCIÓN TIEMPO REAL ───
  useEffect(() => {
    const fechaHoy = hoy();
    setCargando(true);

    const unsubDia = onSnapshot(doc(db, COL_DIAS, fechaHoy), 
      (snap) => {
        if (snap.exists()) {
          setDiaActual({ id: snap.id, ...snap.data() });
        } else {
          const nuevoDia = { fecha: fechaHoy, estado: "cerrado", apertura: null, cierre: null, lluvia: false };
          setDiaActual(nuevoDia);
          if(!modoPrueba) fsSave(COL_DIAS, fechaHoy, nuevoDia);
        }
        setCargando(false);
      },
      () => { setCargando(false); mostrarToast("Sin conexión a base de datos", "error"); }
    );

    const unsubTurnos = onSnapshot(collection(db, COL_TURNOS), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.fecha === fechaHoy).sort((a,b) => FRANJAS.indexOf(a.hora) - FRANJAS.indexOf(b.hora));
      setTurnos(lista);
    });

    const unsubClientes = onSnapshot(collection(db, COL_CLIENTES), (snap) => {
      if (!snap.empty) setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStaff = onSnapshot(collection(db, COL_STAFF), (snap) => {
      if (!snap.empty) setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubDia(); unsubTurnos(); unsubClientes(); unsubStaff(); };
  }, [modoPrueba]);

  // ─── ACCIONES DE NEGOCIO ───
  const cerrarTurno = async (turno, montoRecibido, metodoPago) => {
    const total = Number(turno.precioFinal || turno.precio || 0);
    const recibido = Math.max(0, Number(montoRecibido || 0));
    const diferencia = total - recibido;
    
    await fsUpdate(COL_TURNOS, turno.id, {
      estado: "rendido", pagado: recibido, deudaGenerada: diferencia > 0 ? diferencia : 0,
      metodoPago, rendidoEn: serverTimestamp(), editadoPostRendicion: false
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
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia: true, lluviaInicio: serverTimestamp() });
    const pendientes = turnos.filter(t => t.estado === "pendiente" && t.hora >= horaAR());
    await Promise.all(pendientes.map(t => fsUpdate(COL_TURNOS, t.id, { estado: "lluvia" })));
    mostrarToast("Modo lluvia activado", "warn");
  };

  const reanudarTrasLluvia = async () => {
    if (!diaActual?.id) return;
    const minutosActuales = new Date().getHours() * 60 + new Date().getMinutes();
    let franjaInicio = FRANJAS.find(h => { const [hr,mn]=h.split(":").map(Number); return hr*60+mn >= minutosActuales; }) || FRANJAS[FRANJAS.length-1];
    
    await fsUpdate(COL_DIAS, diaActual.id, { lluvia: false, lluviaFin: serverTimestamp() });
    
    const pendientes = turnos.filter(t => t.estado === "lluvia");
    let idx = FRANJAS.indexOf(franjaInicio);
    for (const t of pendientes) {
      if (idx >= FRANJAS.length) break;
      await fsUpdate(COL_TURNOS, t.id, { hora: FRANJAS[idx], estado: "pendiente", reasignadoPorLluvia: true });
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
      estado: nuevoEstado,
      apertura: nuevoEstado === "abierto" ? serverTimestamp() : diaActual.apertura,
      cierre: nuevoEstado === "cerrado" ? serverTimestamp() : null
    });
    mostrarToast(nuevoEstado === "abierto" ? "☀️ Día ABIERTO" : "🌙 Día CERRADO", "ok");
  };

  // ─── RENDER ───
  if (cargando) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0b1220",color:"#22d3ee"}}>⟳ Sincronizando...</div>;

  // PANTALLA COMPLETA DE APERTURA
  if (diaActual?.estado !== "abierto") {
    return (
      <div style={{ minHeight:"100vh", background:"#0b1220", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🚗</div>
        <h1 style={{ color:"#e2e8f0", fontSize:24, fontWeight:800, marginBottom:8 }}>Sofía Lavados</h1>
        <p style={{ color:"#64748b", fontSize:14, marginBottom:32 }}>{fechaAR(hoy())} • {horaAR()} hs</p>
        
        <button onClick={toggleDia} style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          color: "#fff", border: "none", borderRadius: 20,
          padding: "28px 64px", fontSize: 22, fontWeight: 800,
          cursor: "pointer", boxShadow: "0 8px 40px rgba(5,150,105,0.5)",
          transition: "all 0.3s ease", width: "100%", maxWidth: 400
        }}>
          🟢 ABRIR DÍA
        </button>

        {/* Acceso rápido a config en modo cerrado */}
        <button onClick={() => setTab("config")} style={{
          marginTop: 24, background: "transparent", border: "1px solid #334155",
          borderRadius: 10, padding: "10px 20px", color: "#64748b", fontSize: 12,
          cursor: "pointer"
        }}>
          ⚙️ Configuración
        </button>

        {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
        
        {/* Panel Config inline cuando está cerrado */}
        {tab === "config" && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
               onClick={e => e.target === e.currentTarget && setTab("agenda")}>
            <div style={{ background:"#0b1220", border:"1px solid #1e3a5f", borderRadius:14, padding:20, width:"100%", maxWidth:400 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>⚙️ Configuración</span>
                <button onClick={()=>setTab("agenda")} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:18 }}>✕</button>
              </div>
              {!keyDesbloqueada ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>🔒 Clave para API Key Gemini</div>
                  <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                    <input type="password" placeholder="Clave maestra" value={inputClave} onChange={e=>setInputClave(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verificarClaveAcceso()} style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none", width:160 }} />
                    <Btn sm onClick={verificarClaveAcceso}>OK</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <input type="text" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} placeholder="API Key Gemini" style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"10px 12px", color:"#e2e8f0", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:10 }} />
                  <Btn sm full onClick={()=>{localStorage.setItem("sofia_gemini_key", geminiKey); mostrarToast("API Key guardada","ok");}}>💾 Guardar</Btn>
                </div>
              )}
              <div style={{marginTop:16}}>
                <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}>
                  <input type="checkbox" checked={modoPrueba} onChange={e=>setModoPrueba(e.target.checked)} />
                  <span style={{fontSize:13, color:"#94a3b8"}}>🧪 Modo Prueba</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // APP NORMAL (DÍA ABIERTO)
  return (
    <div style={{ minHeight:"100vh", background:"#0b1220", color:"#e2e8f0", fontFamily:"'Segoe UI', system-ui, sans-serif", paddingBottom:80 }}>
      <style>{`
        @media (max-width: 768px) { .reloj-desktop { display: none !important; } .nav-tabs { overflow-x: auto !important; scrollbar-width: none; } .nav-tabs::-webkit-scrollbar { display: none; } }
      `}</style>

      <header style={{ position:"sticky", top:0, zIndex:100, background:"#0b1220ee", backdropFilter:"blur(10px)", borderBottom:"1px solid #1e3a5f", padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#22d3ee" }}>🚗 Sofía</div>
          <div style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:4, background: diaActual?.lluvia ? "#7c2d12" : "#065f46", color: diaActual?.lluvia ? "#fca5a5" : "#6ee7b7" }}>
            {diaActual?.lluvia ? "🌧️ LLUVIA" : "🟢 ABIERTO"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {diaActual?.lluvia ? (
            <Btn sm color="#059669" onClick={reanudarTrasLluvia}>☀️ Reanudar</Btn>
          ) : (
            <Btn sm color="#d97706" onClick={activarLluvia}>🌧️ Lluvia</Btn>
          )}
          <div className="reloj-desktop" style={{ fontSize:13, color:"#94a3b8", fontWeight:600 }}>{horaAR()} hs</div>
        </div>
      </header>

      <nav className="nav-tabs" style={{ display:"flex", gap:4, padding:"8px 12px", borderBottom:"1px solid #1e3a5f", whiteSpace:"nowrap" }}>
        {[{id:"agenda",label:"📋 Agenda"},{id:"presentismo",label:"✅ Presentismo"},{id:"caja",label:"💰 Caja"},{id:"clientes",label:"👥 Clientes"},{id:"config",label:"⚙️ Config"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background: tab===t.id ? "#22d3ee22" : "transparent", color: tab===t.id ? "#22d3ee" : "#94a3b8", border: tab===t.id ? "1px solid #22d3ee44" : "1px solid transparent", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ padding:16, maxWidth:800, margin:"0 auto" }}>
        {tab === "agenda" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0, fontSize:16 }}>Turnos de Hoy</h3>
              <Btn sm onClick={() => setModalOpen("nuevoTurno")}>➕ Nuevo Turno</Btn>
            </div>

            {turnos.length === 0 ? (
              <div style={{ textAlign:"center", color:"#475569", padding:40, fontSize:14 }}>
                No hay turnos registrados.<br/>Tocá "+ Nuevo Turno" para comenzar.
              </div>
            ) : (
              turnos.map(t => (
                <div key={t.id} style={{ background:"#1e293b", borderRadius:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#22d3ee" }}>{t.hora} hs</div>
                    <div style={{ fontSize:13 }}>{t.clienteNombre}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{t.auto} • {formatP(t.precio)}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {t.estado === "pendiente" && (
                      <Btn sm onClick={() => { setEditando(t); setModalOpen("cerrarTurno"); }}>💰</Btn>
                    )}
                    {t.estado === "rendido" && (
                      <span style={{ fontSize:11, color:"#34d399", fontWeight:700, padding:"6px 10px" }}>✓ RENDIDO</span>
                    )}
                  </div>
                </div>
              ))
            )}

            <button onClick={toggleDia} style={{
              marginTop: 20, background: "linear-gradient(135deg, #dc2626, #991b1b)",
              color: "#fff", border: "none", borderRadius: 12, padding: "16px",
              fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%"
            }}>
              🔴 CERRAR DÍA
            </button>
          </div>
        )}
        
        {tab === "presentismo" && <TabPresentismo staff={staff} turnos={turnos} hoyStr={hoy()} COL_TURNOS={COL_TURNOS} db={db} collection={collection} onSnapshot={onSnapshot} useEffect={useEffect} useState={useState} setPreviewData={setPreviewData} mostrarToast={mostrarToast} />}
        
        {tab === "caja" && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:14, color:"#94a3b8", marginBottom:8 }}>Recaudación del día</div>
            <div style={{ fontSize:32, fontWeight:800, color:"#22d3ee" }}>
              {formatP(turnos.reduce((a,t) => a + (t.pagado||0), 0))}
            </div>
            <div style={{ fontSize:12, color:"#475569", marginTop:8 }}>
              {turnos.filter(t=>t.estado==="rendido").length} turnos rendidos
            </div>
          </div>
        )}
        
        {tab === "clientes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <h3 style={{ margin:0, fontSize:16, marginBottom:8 }}>👥 Clientes ({clientes.length})</h3>
            {clientes.length === 0 ? (
              <div style={{ textAlign:"center", color:"#475569", padding:20 }}>Cargando clientes...</div>
            ) : (
              clientes.sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"")).map(c => (
                <div key={c.id} style={{ background:"#1e293b", borderRadius:8, padding:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.nombre}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{c.barrio} • {c.tipo}</div>
                  </div>
                  {c.deuda > 0 && (
                    <span style={{ fontSize:11, color:"#f87171", fontWeight:700 }}>Deuda: {formatP(c.deuda)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === "config" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {!keyDesbloqueada ? (
              <div style={{ background:"#1e293b", padding:16, borderRadius:10, textAlign:"center" }}>
                <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>🔒 Ingresa clave para ver API Key Gemini</div>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  <input type="password" placeholder="Clave maestra" value={inputClave} onChange={e=>setInputClave(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verificarClaveAcceso()} style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none", width:160 }} />
                  <Btn sm onClick={verificarClaveAcceso}>Desbloquear</Btn>
                </div>
              </div>
            ) : (
              <div style={{ background:"#1e293b", padding:16, borderRadius:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#22d3ee" }}>🔑 API Key Gemini</span>
                  <button onClick={()=>setKeyDesbloqueada(false)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:11 }}>🔒 Bloquear</button>
                </div>
                <input type="text" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"10px 12px", color:"#e2e8f0", fontSize:12, outline:"none", boxSizing:"border-box" }} />
                <Btn sm full style={{marginTop:10}} onClick={()=>{localStorage.setItem("sofia_gemini_key", geminiKey); mostrarToast("API Key guardada","ok");}}>💾 Guardar</Btn>
              </div>
            )}
            <div style={{background:"#1e293b", padding:16, borderRadius:10}}>
              <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}>
                <input type="checkbox" checked={modoPrueba} onChange={e=>setModoPrueba(e.target.checked)} />
                <span style={{fontSize:13}}>🧪 Modo Prueba (Datos aislados)</span>
              </label>
            </div>
          </div>
        )}
      </main>

      {modalOpen === "nuevoTurno" && <ModalNuevoTurno clientes={clientes} staff={staff} COL_TURNOS={COL_TURNOS} mostrarToast={mostrarToast} onClose={()=>{setModalOpen(null);}} />}
      {modalOpen === "cerrarTurno" && editando && <ModalCerrarTurno turno={editando} clientes={clientes} cerrarTurnoFn={cerrarTurno} onClose={()=>{setModalOpen(null);setEditando(null);}} />}
      {previewData && <PreviewTabla {...previewData} onImprimir={()=>window.print()} onCerrar={()=>setPreviewData(null)} />}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)} />}
    </div>
  );
}
