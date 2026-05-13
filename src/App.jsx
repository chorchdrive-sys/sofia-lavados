import { useState, useEffect } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
let db = null;
try { const app = initializeApp(FB); db = getFirestore(app); } catch {}

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

// ═══════════════════════════════════════════════════════════════
//  TABLA DE BARRIOS - CORREGIDA (detecta comas, paréntesis, etc.)
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//  CLIENTES SEED (con barrio corregido)
// ═══════════════════════════════════════════════════════════════
const CLIENTES_SEED = [
  {nombre:"Victoria", telefono:"", direccion:"Dardo Rocha 3278", barrio:"Olivos", autosHabituales:3, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-001"},
  {nombre:"Martin",   telefono:"", direccion:"Colectora Panamericana 2065", barrio:"San Isidro", autosHabituales:3, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"SIS-001"},
  {nombre:"Micaela",  telefono:"", direccion:"Eduardo Costa 902", barrio:"Acassuso", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"ACA-001"},
  {nombre:"Hyundai",  telefono:"", direccion:"Av. Santa Fe 2627", barrio:"Martínez", autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)", tipo:"🔥 Top", deuda:0, codigo:"MAR-001"},
  {nombre:"Mariana",  telefono:"", direccion:"Diagonal Salta 557", barrio:"Olivos", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-002"},
  {nombre:"Caro",     telefono:"", direccion:"Las Heras 1533", barrio:"Martínez", autosHabituales:3, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-002"},
  {nombre:"Salva",    telefono:"", direccion:"Hipólito Yrigoyen 2647", barrio:"Martínez", autosHabituales:1, nota:"Silicina en llantas y paragolpes", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-003"},
  {nombre:"Johana",   telefono:"", direccion:"Blas Parera 429", barrio:"Boulogne", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"BOU-001"},
  {nombre:"Karina",   telefono:"", direccion:"Cangallo 846", barrio:"Martínez", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-004"},
  {nombre:"Andres",   telefono:"", direccion:"Paraná 374", barrio:"Martínez", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-005"},
  {nombre:"Barby",    telefono:"", direccion:"Fray Justo Sarmiento 3304", barrio:"Olivos", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"OLI-003"},
  {nombre:"Tomás",    telefono:"", direccion:"Córdoba 596", barrio:"Martínez", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-006"},
  {nombre:"HernanC",  telefono:"", direccion:"Beruti 1583", barrio:"Martínez", autosHabituales:2, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-007"},
  {nombre:"Agustín",  telefono:"", direccion:"Colectora Panamericana 2065", barrio:"San Isidro", autosHabituales:1, nota:"Llamar antes", tipo:"⭐ Frecuente", deuda:0, codigo:"SIS-002"},
  {nombre:"Candelaria",telefono:"", direccion:"Ladislao Martínez 440", barrio:"Martínez", autosHabituales:1, nota:"", tipo:"⭐ Frecuente", deuda:0, codigo:"MAR-008"},
  {nombre:"Vero",     telefono:"", direccion:"Entre Ríos 2397", barrio:"Martínez", autosHabituales:1, nota:"Confirmar", tipo:"💤 Ocasional", deuda:0, codigo:"MAR-009"},
  {nombre:"Avri",     telefono:"", direccion:"Entre Ríos 2983", barrio:"Martínez", autosHabituales:1, nota:"", tipo:"💤 Ocasional", deuda:0, codigo:"MAR-010"},
  {nombre:"Ale",      telefono:"", direccion:"Sáenz Valiente 2163", barrio:"Olivos", autosHabituales:1, nota:"", tipo:"💤 Ocasional", deuda:0, codigo:"OLI-004"},
  {nombre:"GabyC",    telefono:"", direccion:"Catamarca 1304", barrio:"Florida", autosHabituales:2, nota:"", tipo:"💤 Ocasional", deuda:0, codigo:"FLO-001"},
  {nombre:"Pablo",    telefono:"", direccion:"Ezpeleta 531", barrio:"Martínez", autosHabituales:2, nota:"", tipo:"💤 Ocasional", deuda:0, codigo:"MAR-011"},
];

const NOTAS_PREDEFINIDAS = [
  "Cliente detallista","Insectos de ruta","Barro extremo","Decir precio antes de empezar",
  "Avisar cuando va","No usar revividor","Llevar doble alargue","Auto muy sucio","Cliente nuevo",
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
const hoy         = () => new Date().toISOString().split("T")[0];
const franjaFin   = h  => { const [hr,mn]=h.split(":").map(Number); const t=hr*60+mn+90; return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
const esTarde     = h  => FRANJAS.indexOf(h) >= FRANJA_TARDE;
const formatP     = n  => "$" + Number(n||0).toLocaleString("es-AR");
const colorNuevo  = (staff) => COLORES.find(c=>!staff.map(s=>s.color).includes(c)) || "#94a3b8";
const sinAcentos = s => (s||"").toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));

// Mostrar teléfono con ícono (CORREGIDO)
function mostrarTelefono(cliente) {
  const telefono = cliente?.telefono;
  const esFicticio = telefono && String(telefono).startsWith("1100000");
  if (telefono && !esFicticio && telefono !== "") {
    return `📞 ${telefono}`;
  }
  return "📞 Sin registrar";
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
//  FIRESTORE
// ═══════════════════════════════════════════════════════════════
const fsGet    = async (col,id)       => { if(!db)return null; try{const s=await getDoc(doc(db,col,id));return s.exists()?{id:s.id,...s.data()}:null;}catch{return null;} };
const fsSave   = async (col,id,data)  => { if(!db)return; try{await setDoc(doc(db,col,id),{...data,_ts:serverTimestamp()},{merge:true});}catch{} };
const fsAdd    = async (col,data)     => { if(!db)return null; try{const r=await addDoc(collection(db,col),{...data,_ts:serverTimestamp()});return r.id;}catch{return null;} };
const fsDel    = async (col,id)       => { if(!db)return; try{await deleteDoc(doc(db,col,id));}catch{} };
const fsList   = async (col)          => { if(!db)return []; try{const s=await getDocs(collection(db,col));return s.docs.map(d=>({id:d.id,...d.data()}));}catch{return[];} };
const fsUpdate = async (col,id,data)  => { if(!db)return; try{await updateDoc(doc(db,col,id),data);}catch{} };

// ═══════════════════════════════════════════════════════════════
//  INICIALIZAR / LIMPIEZA DE DATOS (CORREGIDO)
// ═══════════════════════════════════════════════════════════════
async function inicializar() {
  if (!db) return;
  
  console.log("🔄 Inicializando sistema...");
  
  // 1. LIMPIAR TELÉFONOS FICTICIOS Y ACTUALIZAR CÓDIGOS DE BARRIO
  const clientes = await fsList("clientes");
  let contadorActualizaciones = 0;
  
  for (const cli of clientes) {
    let necesitaUpdate = false;
    const updates = {};
    
    // Teléfono ficticio?
    if (cli.telefono && String(cli.telefono).startsWith("1100000")) {
      updates.telefono = "";
      necesitaUpdate = true;
    }
    
    // Recalcular código de barrio (GEN → código real)
    if (cli.barrio && cli.codigo && cli.codigo.startsWith("GEN")) {
      const nuevoCodigo = codigoBarrio(cli.barrio);
      const numeroSecuencial = cli.codigo.split("-")[1] || "001";
      updates.codigo = `${nuevoCodigo}-${numeroSecuencial}`;
      necesitaUpdate = true;
    }
    
    if (necesitaUpdate) {
      await fsUpdate("clientes", cli.id, updates);
      contadorActualizaciones++;
      console.log(`✅ Actualizado: ${cli.nombre} - Código: ${updates.codigo || "sin cambio"} | Teléfono: ${updates.telefono === "" ? "limpiado" : "ok"}`);
    }
  }
  
  console.log(`✅ Inicialización completa. ${contadorActualizaciones} clientes actualizados.`);
  
  // 2. CARGAR STAFF SI ESTÁ VACÍO
  const staffExistente = await fsList("staff");
  if (staffExistente.length === 0) {
    for (const s of STAFF_SEED) {
      await fsAdd("staff", { ...s, disponible: true });
    }
    console.log("✅ Staff inicializado");
  }
  
  // 3. CARGAR BARRIOS SI ESTÁN VACÍOS
  const barriosExist = await fsList("barrios");
  if (barriosExist.length === 0) {
    for (const b of LISTA_BARRIOS) {
      await fsAdd("barrios", { nombre: b, codigo: codigoBarrio(b) });
    }
    console.log("✅ Barrios inicializados");
  }
}

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
  const bg = disabled?"#1e2d40":danger?"#dc2626":ghost?"transparent":`linear-gradient(135deg,${color},${color}cc)`;
  return <button onClick={disabled?undefined:onClick} style={{
    background:bg, color:disabled?"#334155":ghost?"#64748b":"white",
    border:ghost?"1px solid #1e3a5f":"none", borderRadius:8,
    padding:sm?"6px 13px":"10px 18px", fontSize:sm?11:12, fontWeight:700,
    cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit",
    width:full?"100%":"auto", transition:"all .15s", ...style
  }}>{children}</button>;
}

function Inp({label,value,onChange,placeholder,type="text",required,style={}}) {
  return <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>{label}{required && <span style={{color:"#f87171"}}>*</span>}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none",...style}}/>
  </div>;
}

function Sel({label,value,onChange,children,style={}}) {
  return <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none",...style}}>
      {children}
    </select>
  </div>;
}

function Toggle({on,onChange}) {
  return <button onClick={()=>onChange(!on)} style={{
    width:38,height:20,borderRadius:10,border:"none",cursor:"pointer",position:"relative",
    background:on?"#16a34a":"#334155",transition:"background .2s",flexShrink:0,padding:0
  }}>
    <span style={{position:"absolute",top:2,left:on?20:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left .2s"}}/>
  </button>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL WHATSAPP
// ═══════════════════════════════════════════════════════════════
function ModalWA({turno,staff,onClose}) {
  const [copiado,setCopiado] = useState(false);
  const s = staff.find(x=>x.id===turno.staffId)||{};
  const fin = franjaFin(turno.hora);
  const notasLines = turno.notas?.trim()
    ? `\n⚠️ *Instrucciones:*\n${turno.notas.split(",").map(n=>`• ${n.trim()}`).join("\n")}`
    : "";
  const fzLine = turno.esFZ ? "\n🌐 *Servicio fuera de zona — recargo de traslado incluido.*" : "";
  const telLine = turno.clienteTel ? `\n📞 *Tel. cliente:* ${turno.clienteTel}` : "";
  const icono = (turno.staffTransporte||s.transporte)==="moto"?"🏍":"🚲";
  const msg = `🚿 *SOFÍA LAVADOS — Turno confirmado*\n\n📍 *Dirección:* ${turno.direccion}\n🕐 *Llegada:* ${turno.hora} a ${fin} hs\n🚗 *Autos:* ${turno.cantAutos} auto${turno.cantAutos>1?"s":""} (${turno.tamano||""})\n💰 *Cobrar:* ${formatP(turno.precio)} (${turno.metodo==="mp"?"Mercado Pago":"Efectivo"})${fzLine}${telLine}${notasLines}\n\n${icono} Confirmá arribo cuando llegues. ¡Gracias!`;

  async function copiar() {
    try { await navigator.clipboard.writeText(msg); } catch {}
    setCopiado(true); setTimeout(()=>setCopiado(false),2500);
  }

  return <Modal titulo="📲 Mensaje para el lavador" onClose={onClose}>
    <div style={{background:"#041a0f",border:"1px solid #16a34a33",borderRadius:10,padding:14,marginBottom:12}}>
      <pre style={{fontFamily:"inherit",fontSize:12,color:"#bbf7d0",whiteSpace:"pre-wrap",lineHeight:1.75}}>{msg}</pre>
    </div>
    {s.especial==="avisar_presencia" && <div style={{padding:"9px 12px",background:"#f8717118",border:"1px solid #f8717144",borderRadius:8,color:"#fca5a5",fontSize:12,marginBottom:10}}>🔴 Hernán — Avisar en persona (sin celular)</div>}
    {s.especial==="llamar_telefono" && <div style={{padding:"9px 12px",background:"#fb923c18",border:"1px solid #fb923c44",borderRadius:8,color:"#fdba74",fontSize:12,marginBottom:10}}>📞 Gastón — Llamar por teléfono</div>}
    <div style={{display:"flex",gap:8}}>
      <Btn full color="#16a34a" onClick={copiar}>{copiado?"✓ Copiado — pegá en WhatsApp":`📋 Copiar mensaje de ${s.nombre||"lavador"}`}</Btn>
    </div>
    {turno.clienteTel && (
      <a href={`tel:${turno.clienteTel}`} style={{display:"block",marginTop:8,textDecoration:"none"}}>
        <Btn full ghost>📞 Llamar al cliente ({turno.clienteNombre})</Btn>
      </a>
    )}
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL REGISTRAR CLIENTE NUEVO (CORREGIDO)
// ═══════════════════════════════════════════════════════════════
function ModalRegistrarCliente({nombreInicial, onClose, onRegistrado}) {
  const [nombre, setNombre] = useState(nombreInicial || "");
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sinTelefono, setSinTelefono] = useState(false);
  const [contactoAlternativo, setContactoAlternativo] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function registrar() {
    if (!nombre.trim()) { alert("⚠️ El nombre es obligatorio"); return; }
    if (!direccion.trim()) { alert("⚠️ La dirección es obligatoria"); return; }
    if (!barrio) { alert("⚠️ El barrio es obligatorio"); return; }
    if (!sinTelefono && !telefono.trim()) { alert("⚠️ El teléfono es obligatorio"); return; }
    
    setLoading(true);
    try {
      const clientesExistentes = await fsList("clientes");
      const ultimoNumero = clientesExistentes
        .map(c => {
          const match = c.codigo?.match(/-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, n) => Math.max(max, n), 0);
      const nuevoNumero = String(ultimoNumero + 1).padStart(3, "0");
      const codigoBarrioCliente = codigoBarrio(barrio);
      const nuevoCodigo = `${codigoBarrioCliente}-${nuevoNumero}`;
      
      const telefonoFinal = sinTelefono ? (contactoAlternativo || "SIN TELEFONO") : telefono;
      
      const nuevoCliente = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        barrio: barrio,
        telefono: telefonoFinal,
        codigo: nuevoCodigo,
        tipo: "🆕 Nuevo",
        deuda: 0,
        autosHabituales: 1,
        nota: sinTelefono ? `Contacto: ${contactoAlternativo || "tocar timbre"}` : "",
        _ts: serverTimestamp()
      };
      
      const id = await fsAdd("clientes", nuevoCliente);
      onRegistrado({ id, ...nuevoCliente });
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error al registrar cliente");
    }
    setLoading(false);
  }
  
  return <Modal titulo="✨ REGISTRAR CLIENTE NUEVO" onClose={onClose} wide>
    <Inp label="NOMBRE / APODO" value={nombre} onChange={setNombre} required />
    <Inp label="DIRECCIÓN" value={direccion} onChange={setDireccion} required placeholder="Calle y número" />
    <Sel label="BARRIO" value={barrio} onChange={setBarrio}>
      <option value="">Seleccionar barrio</option>
      {LISTA_BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
    </Sel>
    <div style={{marginBottom:10}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
        <Toggle on={sinTelefono} onChange={setSinTelefono} />
        <span style={{fontSize:11, color:"#94a3b8"}}>No tiene teléfono</span>
      </div>
      {!sinTelefono ? (
        <Inp label="TELÉFONO" value={telefono} onChange={setTelefono} placeholder="Ej: 1156789012" required />
      ) : (
        <Inp label="FORMA DE CONTACTO ALTERNATIVA" value={contactoAlternativo} onChange={setContactoAlternativo} placeholder="Tocar timbre / llamar por portero / etc." />
      )}
    </div>
    <div style={{display:"flex", gap:8, marginTop:12}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn color="#16a34a" onClick={registrar} disabled={loading}>CREAR CLIENTE</Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL OPERACIÓN CON STAFF (con devolución)
// ═══════════════════════════════════════════════════════════════
function ModalOperacionStaff({staff, onClose, onActualizado}) {
  const [tipo, setTipo] = useState(MOTIVOS_OPERACION[0]);
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  
  function handleMontoChange(val) {
    const limpio = val.replace(/[^0-9]/g, "");
    setMonto(limpio);
  }
  
  async function registrarOperacion() {
    const montoNum = parseInt(monto) || 0;
    if (montoNum <= 0) { alert("⚠️ Ingresá un monto válido"); return; }
    
    setLoading(true);
    try {
      let nuevoSaldo = staff.saldoPendiente || 0;
      const esRecibe = tipo.includes("recibe");
      const esDevuelve = tipo.includes("paga");
      
      if (esRecibe) {
        nuevoSaldo += montoNum;
      } else if (esDevuelve) {
        nuevoSaldo -= montoNum;
        if (nuevoSaldo < 0) nuevoSaldo = 0;
      }
      
      await fsUpdate("staff", staff.id, {
        saldoPendiente: nuevoSaldo
      });
      
      await fsAdd("operacionesStaff", {
        staffId: staff.id,
        staffNombre: staff.nombre,
        tipo: tipo,
        monto: montoNum,
        motivo: motivo || "Sin motivo",
        fecha: hoy(),
        saldoAnterior: staff.saldoPendiente || 0,
        saldoNuevo: nuevoSaldo,
        _ts: serverTimestamp()
      });
      
      if (onActualizado) onActualizado();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error al registrar operación");
    }
    setLoading(false);
  }
  
  return <Modal titulo={`💰 Operación con ${staff.nombre}`} onClose={onClose}>
    <Sel label="TIPO DE OPERACIÓN" value={tipo} onChange={setTipo}>
      {MOTIVOS_OPERACION.map(m => <option key={m} value={m}>{m}</option>)}
    </Sel>
    <Inp label="MONTO" value={monto} onChange={handleMontoChange} placeholder="0" type="text" />
    <Inp label="MOTIVO (opcional)" value={motivo} onChange={setMotivo} placeholder="Ej: Cumpleaños, préstamo personal, etc." />
    <div style={{background:"#1e2d40", borderRadius:8, padding:10, marginTop:12, textAlign:"center"}}>
      <div style={{fontSize:11, color:"#94a3b8"}}>SALDO ACTUAL DE {staff.nombre}</div>
      <div style={{fontSize:18, fontWeight:700, color: (staff.saldoPendiente||0) > 0 ? "#fbbf24" : "#22d3ee"}}>
        {formatP(staff.saldoPendiente || 0)}
      </div>
    </div>
    <div style={{display:"flex", gap:8, marginTop:16}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn color="#fbbf24" onClick={registrarOperacion} disabled={loading}>REGISTRAR</Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL REGISTRAR COBRO / RENDICIÓN
// ═══════════════════════════════════════════════════════════════
function ModalRegistrarCobro({turno, onClose, onCobrado}) {
  const [montoPagado, setMontoPagado] = useState(String(turno.precio || 0));
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  
  function handleMontoChange(val) {
    const limpio = val.replace(/[^0-9]/g, "");
    setMontoPagado(limpio);
  }
  
  async function registrarCobro() {
    const montoNum = parseInt(montoPagado) || 0;
    const precioTotal = turno.precio || 0;
    const nuevaDeuda = Math.max(0, precioTotal - montoNum);
    
    setLoading(true);
    try {
      if (nuevaDeuda > 0 && montoNum > 0) {
        await fsUpdate("turnos", turno.id, {
          estadoPago: "Cliente debe (pago parcial)",
          montoPagado: montoNum,
          deudaPendiente: nuevaDeuda,
          motivoDeuda: motivo || "Cliente pagó parcialmente",
          fechaCobro: hoy()
        });
        if (turno.clienteId) {
          const cliente = await fsGet("clientes", turno.clienteId);
          if (cliente) {
            await fsUpdate("clientes", turno.clienteId, {
              deuda: (cliente.deuda || 0) + nuevaDeuda
            });
          }
        }
      } else if (nuevaDeuda > 0 && montoNum === 0) {
        await fsUpdate("turnos", turno.id, {
          estadoPago: "Cliente debe (no pagó)",
          montoPagado: 0,
          deudaPendiente: precioTotal,
          motivoDeuda: motivo || "Cliente no pagó",
          fechaCobro: hoy()
        });
        if (turno.clienteId) {
          const cliente = await fsGet("clientes", turno.clienteId);
          if (cliente) {
            await fsUpdate("clientes", turno.clienteId, {
              deuda: (cliente.deuda || 0) + precioTotal
            });
          }
        }
      } else if (montoNum === precioTotal) {
        await fsUpdate("turnos", turno.id, {
          estadoPago: "Cobrado (sin rendir)",
          montoPagado: montoNum,
          deudaPendiente: 0,
          fechaCobro: hoy()
        });
      } else if (montoNum > precioTotal) {
        // Pagó de más (incluye deuda anterior)
        await fsUpdate("turnos", turno.id, {
          estadoPago: "Cobrado (sin rendir)",
          montoPagado: precioTotal,
          deudaPendiente: 0,
          fechaCobro: hoy()
        });
        const diferencia = montoNum - precioTotal;
        if (turno.clienteId && diferencia > 0) {
          const cliente = await fsGet("clientes", turno.clienteId);
          if (cliente && cliente.deuda > 0) {
            const nuevaDeudaCliente = Math.max(0, cliente.deuda - diferencia);
            await fsUpdate("clientes", turno.clienteId, {
              deuda: nuevaDeudaCliente
            });
          }
        }
      }
      
      if (onCobrado) onCobrado();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error al registrar cobro");
    }
    setLoading(false);
  }
  
  const precioTotal = turno.precio || 0;
  const esPagoParcial = parseInt(montoPagado) < precioTotal;
  
  return <Modal titulo="💰 Registrar cobro" onClose={onClose}>
    <div style={{marginBottom:12, padding:10, background:"#1e2d40", borderRadius:8}}>
      <div style={{fontSize:11, color:"#94a3b8"}}>Importe esperado</div>
      <div style={{fontSize:18, fontWeight:700, color:"#22d3ee"}}>{formatP(precioTotal)}</div>
      {(turno.deudaPendiente > 0 || (turno.clienteDeuda > 0)) && (
        <div style={{fontSize:11, color:"#f87171", marginTop:4}}>⚠️ Cliente debe {formatP(turno.deudaPendiente || turno.clienteDeuda || 0)} adicional</div>
      )}
    </div>
    <Inp label="IMPORTE REAL COBRADO" value={montoPagado} onChange={handleMontoChange} placeholder="0" type="text" />
    {esPagoParcial && (
      <Sel label="MOTIVO (si pagó menos)" value={motivo} onChange={setMotivo}>
        <option value="">Seleccionar motivo</option>
        {MOTIVOS_DESCUENTO.map(m => <option key={m} value={m}>{m}</option>)}
      </Sel>
    )}
    <div style={{display:"flex", gap:8, marginTop:16}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn color="#16a34a" onClick={registrarCobro} disabled={loading}>REGISTRAR COBRO</Btn>
    </div>
  </Modal>;
}

function ModalRegistrarRendicion({turno, onClose, onRendido}) {
  const [loading, setLoading] = useState(false);
  
  async function registrarRendicion() {
    setLoading(true);
    try {
      await fsUpdate("turnos", turno.id, {
        estadoPago: "✅ Rendido",
        fechaRendicion: hoy()
      });
      if (onRendido) onRendido();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error al registrar rendición");
    }
    setLoading(false);
  }
  
  return <Modal titulo="💸 Rendir dinero" onClose={onClose}>
    <div style={{marginBottom:12, padding:10, background:"#1e2d40", borderRadius:8}}>
      <div style={{fontSize:11, color:"#94a3b8"}}>Confirmar rendición</div>
      <div style={{fontSize:13, color:"#e2e8f0", marginTop:8}}>
        Turno de {turno.clienteNombre || turno.cliente}<br />
        Monto: {formatP(turno.montoPagado || turno.precio)}
      </div>
    </div>
    <div style={{display:"flex", gap:8}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn color="#fbbf24" onClick={registrarRendicion} disabled={loading}>CONFIRMAR RENDICIÓN</Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL DETALLE TURNO
// ═══════════════════════════════════════════════════════════════
function ModalDetalle({turno,staff,asistencia,onCancelar,onReasignar,onPagar,onWA,onClose}) {
  const [modo,setModo] = useState("detalle");
  const [nStaff,setNS] = useState(turno.staffId||"");
  const [nHora, setNH] = useState(turno.hora||"");
  const staffActivos = staff.filter(s=>asistencia[s.id]?.presente&&s.rol!=="encargado");

  return <Modal titulo={modo==="detalle"?"Detalle del turno":"Reasignar turno"} onClose={onClose}>
    {modo==="detalle" && <>
      <div style={{display:"flex",flexDirection:"column",gap:7,fontSize:12,marginBottom:16}}>
        {[
          ["Lavador",    turno.staffNombre],
          ["Hora",       turno.hora],
          ["Franja",     `${turno.hora} → ${franjaFin(turno.hora)} hs`],
          ["Cliente",    turno.clienteNombre||turno.cliente||"—"],
          ["Teléfono",   mostrarTelefono({telefono: turno.clienteTel})],
          ["Dirección",  turno.direccion],
          ["Autos",      `${turno.cantAutos} (${turno.tamano||"—"})`],
          ["Precio",     formatP(turno.precio)],
          ["Pago",       turno.metodo==="mp"?"Mercado Pago":"Efectivo"],
          ["Estado",     turno.estadoPago || "💰 Pendiente"],
          ["Notas",      turno.notas||"—"],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1e2d40",paddingBottom:5}}>
            <span style={{color:"#94a3b8"}}>{k}</span>
            <span style={{color:"#e2e8f0",fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {onWA && <Btn color="#25D366" onClick={onWA}>📲 WhatsApp</Btn>}
        {(turno.estadoPago === "Pendiente" || turno.estadoPago === "Cliente debe") && onPagar && <Btn color="#16a34a" onClick={onPagar}>💰 Cobrar</Btn>}
        {onReasignar && <Btn>🔄 Reasignar</Btn>}
        {onCancelar && <Btn danger onClick={onCancelar}>🗑 Cancelar</Btn>}
      </div>
    </>}
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState("turno");
  const [clientes, setClientes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [toast, setToast] = useState(null);
  const [filtroDeuda, setFiltroDeuda] = useState(false);
  const [busquedaClientes, setBusquedaClientes] = useState("");
  const [showRegistroCliente, setShowRegistroCliente] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  
  const [formTurno, setFormTurno] = useState({
    clienteId: "", clienteNombre: "", clienteTel: "", direccion: "", barrio: "",
    cantAutos: 1, tamano: "mediano", precio: 28000, metodo: "efectivo",
    hora: "09:00", staffId: "", notas: ""
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    inicializar();
    
    if (!db) return;
    
    const unsubClientes = onSnapshot(collection(db, "clientes"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(data);
    });
    
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStaff(data);
    });
    
    const unsubTurnos = onSnapshot(collection(db, "turnos"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTurnos(data);
    });
    
    const unsubAsistencia = onSnapshot(collection(db, "asistencia"), (snap) => {
      const data = {};
      snap.docs.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    
    return () => {
      unsubClientes();
      unsubStaff();
      unsubTurnos();
      unsubAsistencia();
    };
  }, []);
  
  // Limpiar formulario al cambiar a pestaña turno
  useEffect(() => {
    if (activeTab === "turno") {
      setFormTurno({
        clienteId: "", clienteNombre: "", clienteTel: "", direccion: "", barrio: "",
        cantAutos: 1, tamano: "mediano", precio: 28000, metodo: "efectivo",
        hora: "09:00", staffId: "", notas: ""
      });
    }
  }, [activeTab]);
  
  function showToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
  }
  
  // Clientes filtrados
  const clientesFiltrados = clientes.filter(c => {
    const pasaDeuda = filtroDeuda ? (c.deuda || 0) > 0 : true;
    const pasaBusqueda = !busquedaClientes || 
      sinAcentos(c.nombre).includes(sinAcentos(busquedaClientes)) ||
      (c.codigo || "").toLowerCase().includes(busquedaClientes.toLowerCase()) ||
      (c.direccion || "").toLowerCase().includes(busquedaClientes.toLowerCase()) ||
      (c.barrio || "").toLowerCase().includes(busquedaClientes.toLowerCase());
    return pasaDeuda && pasaBusqueda;
  });
  
  return (
    <div style={{maxWidth:550,margin:"0 auto",background:"#0f172a",minHeight:"100vh",color:"#e2e8f0",fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:12,paddingBottom:0,display:"flex",gap:6,flexWrap:"wrap",borderBottom:"1px solid #1e3a5f"}}>
        {["turno","agenda","asistencia","clientes","staff","cierre","precios"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: activeTab===tab ? "#1e3a5f" : "transparent",
            border:"none", borderRadius:8, padding:"8px 14px", color:activeTab===tab?"#22d3ee":"#94a3b8",
            fontSize:11, fontWeight:700, cursor:"pointer"
          }}>{tab === "turno" ? "+ Turno" : tab.charAt(0).toUpperCase()+tab.slice(1)}</button>
        ))}
      </div>
      
      <div style={{padding:16}}>
        {activeTab === "turno" && (
          <div>
            <h2 style={{fontSize:16,marginBottom:12}}>📝 Nuevo turno</h2>
            
            {/* Cliente con detección de nuevo */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:5,fontWeight:700}}>CLIENTE *</div>
              <input
                list="clientesList"
                value={formTurno.clienteNombre}
                onChange={async (e) => {
                  const nombre = e.target.value;
                  setFormTurno(prev => ({ ...prev, clienteNombre: nombre, clienteId: "" }));
                  const existe = clientes.find(c => sinAcentos(c.nombre) === sinAcentos(nombre));
                  if (existe) {
                    setFormTurno(prev => ({
                      ...prev,
                      clienteId: existe.id,
                      clienteNombre: existe.nombre,
                      clienteTel: existe.telefono,
                      direccion: existe.direccion || "",
                      barrio: existe.barrio || ""
                    }));
                    if ((existe.deuda || 0) > 0) {
                      showToast(`⚠️ ATENCIÓN: Este cliente te debe ${formatP(existe.deuda)}`, "warn");
                    }
                  }
                }}
                style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:12,padding:"9px 13px",width:"100%"}}
                placeholder="Escribí el nombre del cliente"
              />
              <datalist id="clientesList">
                {clientes.map(c => <option key={c.id} value={c.nombre} />)}
              </datalist>
              
              {/* Botón registrar nuevo cliente */}
              {formTurno.clienteNombre && !clientes.find(c => sinAcentos(c.nombre) === sinAcentos(formTurno.clienteNombre)) && (
                <Btn full ghost style={{marginTop:8}} onClick={() => {
                  setNuevoClienteNombre(formTurno.clienteNombre);
                  setShowRegistroCliente(true);
                }}>✨ REGISTRAR COMO CLIENTE NUEVO</Btn>
              )}
            </div>
            
            <Inp label="DIRECCIÓN" value={formTurno.direccion} onChange={v => setFormTurno(p=>({...p,direccion:v}))} required />
            <Sel label="BARRIO" value={formTurno.barrio} onChange={v => setFormTurno(p=>({...p,barrio:v}))}>
              <option value="">Seleccionar barrio</option>
              {LISTA_BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
            </Sel>
            
            <div style={{display:"flex",gap:8}}>
              <Sel label="TAMAÑO" value={formTurno.tamano} onChange={v => {
                const tam = TAMANOS_DEFAULT.find(t => t.id === v);
                setFormTurno(p=>({...p,tamano:v,precio: tam?.precio || 28000}));
              }}>
                {TAMANOS_DEFAULT.map(t => <option key={t.id} value={t.id}>{t.label} – {formatP(t.precio)}</option>)}
              </Sel>
              <Sel label="AUTOS" value={formTurno.cantAutos} onChange={v => setFormTurno(p=>({...p,cantAutos:parseInt(v)}))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </Sel>
            </div>
            
            <div style={{display:"flex",gap:8, marginBottom:10}}>
              <div style={{flex:1}}><Sel label="HORA" value={formTurno.hora} onChange={v => setFormTurno(p=>({...p,hora:v}))}>
                {FRANJAS.map(h => <option key={h} value={h}>{h} → {franjaFin(h)}</option>)}
              </Sel></div>
              <div style={{flex:1}}><Sel label="PAGO" value={formTurno.metodo} onChange={v => setFormTurno(p=>({...p,metodo:v}))}>
                <option value="efectivo">Efectivo</option>
                <option value="mp">Mercado Pago</option>
              </Sel></div>
            </div>
            
            <Inp label="NOTAS (opcional)" value={formTurno.notas} onChange={v => setFormTurno(p=>({...p,notas:v}))} placeholder="Instrucciones para el lavador" />
            
            <div style={{display:"flex",gap:8, marginBottom:12}}>
              <Btn color="#0e7490" full>🔍 Ver disponibilidad</Btn>
              <Btn color="#22d3ee" full>Sugerir lavador</Btn>
            </div>
            
            {/* SUGERENCIAS - AHORA ARRIBA DE LA GRILLA */}
            {/* Acá iría el panel de sugerencias si existe */}
            
            <div style={{background:"#1e2d40", borderRadius:8, padding:12, marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>💰 TOTAL: {formatP(formTurno.precio)}</div>
              <Btn full color="#16a34a" onClick={() => showToast("Turno creado (demo)","ok")}>✓ CONFIRMAR TURNO</Btn>
            </div>
            
            {/* GRILLA DEL SEMÁFORO - AHORA ABAJO */}
          </div>
        )}
        
        {activeTab === "clientes" && (
          <div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <h2 style={{fontSize:16}}>👥 Clientes ({clientesFiltrados.length})</h2>
              <Btn sm ghost onClick={() => setFiltroDeuda(!filtroDeuda)}>
                {filtroDeuda ? "⭐ Todos" : "🔄 Con deuda"}
              </Btn>
            </div>
            <Inp placeholder="Buscar por nombre, código, dirección..." value={busquedaClientes} onChange={setBusquedaClientes} />
            <div style={{marginTop:12, display:"flex",flexDirection:"column",gap:8}}>
              {clientesFiltrados.map(c => (
                <div key={c.id} style={{background:"#0b1220", border:"1px solid #1e3a5f", borderRadius:10, padding:12}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <div><span style={{color:"#22d3ee",fontWeight:700}}>{c.codigo || "GEN-000"}</span> - {c.nombre} <span style={{fontSize:10, color:"#94a3b8"}}>{c.tipo || ""}</span></div>
                    {(c.deuda || 0) > 0 && <div style={{background:"#dc262622", color:"#f87171", padding:"2px 8px", borderRadius:12, fontSize:10}}>Debe {formatP(c.deuda)}</div>}
                  </div>
                  <div style={{fontSize:11, color:"#94a3b8", marginTop:6}}>{mostrarTelefono(c)}</div>
                  <div style={{fontSize:11, color:"#64748b"}}>{c.direccion} ({c.barrio || "?"})</div>
                  <div style={{display:"flex", gap:8, marginTop:8}}>
                    <Btn sm ghost>📞 Llamar</Btn>
                    <Btn sm ghost>➕ Turno</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "staff" && (
          <div>
            <h2 style={{fontSize:16,marginBottom:12}}>👨‍🔧 Staff</h2>
            {staff.map(s => (
              <div key={s.id} style={{background:"#0b1220", border:"1px solid #1e3a5f", borderRadius:10, padding:12, marginBottom:8}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700}}>{s.nombre} {s.transporte==="moto"?"🏍":"🚲"}</div>
                    <div style={{fontSize:10, color:"#94a3b8"}}>Saldo: {formatP(s.saldoPendiente || 0)}</div>
                    {s.especial && <div style={{fontSize:9, color:"#fbbf24"}}>✨ {s.especial}</div>}
                  </div>
                  <Btn sm color="#fbbf24">💰 Operación</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === "cierre" && (
          <div>
            <h2 style={{fontSize:16,marginBottom:12}}>💵 Cierre del día</h2>
            {turnos.filter(t => t.fecha === hoy()).map(t => (
              <div key={t.id} style={{background:"#0b1220", border:"1px solid #1e3a5f", borderRadius:10, padding:12, marginBottom:8}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <div><span style={{color:"#22d3ee"}}>{t.hora}</span> - {t.staffNombre} → {t.clienteNombre || t.cliente}</div>
                  <div>{formatP(t.precio)}</div>
                </div>
                <div style={{fontSize:11, color:"#94a3b8", marginTop:4}}>Estado: {t.estadoPago || "Pendiente"}</div>
                <div style={{display:"flex", gap:8, marginTop:8}}>
                  {(!t.estadoPago || t.estadoPago === "Pendiente" || t.estadoPago === "Cliente debe") && <Btn sm color="#16a34a">💰 Cobró</Btn>}
                  {t.estadoPago === "Cobrado (sin rendir)" && <Btn sm color="#fbbf24">💸 Rendir</Btn>}
                  {t.estadoPago === "✅ Rendido" && <Btn sm ghost disabled>✅ Rendido</Btn>}
                </div>
              </div>
            ))}
            {turnos.filter(t => t.fecha === hoy()).length === 0 && (
              <div style={{textAlign:"center", color:"#64748b", padding:40}}>No hay turnos hoy</div>
            )}
          </div>
        )}
        
        {activeTab === "agenda" && <div style={{textAlign:"center", color:"#64748b", padding:40}}>📅 Agenda (en desarrollo)</div>}
        {activeTab === "asistencia" && <div style={{textAlign:"center", color:"#64748b", padding:40}}>📋 Asistencia (en desarrollo)</div>}
        {activeTab === "precios" && <div style={{textAlign:"center", color:"#64748b", padding:40}}>💰 Precios (en desarrollo)</div>}
      </div>
      
      {showRegistroCliente && (
        <ModalRegistrarCliente
          nombreInicial={nuevoClienteNombre}
          onClose={() => setShowRegistroCliente(false)}
          onRegistrado={(cliente) => {
            setFormTurno(prev => ({
              ...prev,
              clienteId: cliente.id,
              clienteNombre: cliente.nombre,
              clienteTel: cliente.telefono,
              direccion: cliente.direccion,
              barrio: cliente.barrio
            }));
            showToast(`✅ Cliente ${cliente.nombre} registrado correctamente`, "ok");
          }}
        />
      )}
      
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
