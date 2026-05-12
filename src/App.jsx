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
  {nombre:"Jhony",     transporte:"moto",color:"#22d3ee",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Sergio",    transporte:"moto",color:"#0ea5e9",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Alexander", transporte:"moto",color:"#38bdf8",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Maxi",      transporte:"moto",color:"#7dd3fc",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Rene",      transporte:"moto",color:"#06b6d4",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Brandon",   transporte:"moto",color:"#67e8f9",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Jorge",     transporte:"moto",color:"#a5f3fc",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Emiliano",  transporte:"moto",color:"#2dd4bf",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Gaby",      transporte:"moto",color:"#5eead4",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Javi",      transporte:"moto",color:"#99f6e4",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Franco",    transporte:"moto",color:"#34d399",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Fede",      transporte:"moto",color:"#6ee7b7",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Elias",     transporte:"moto",color:"#a7f3d0",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Alvaro",    transporte:"bici",color:"#c084fc",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Nestor",    transporte:"bici",color:"#d8b4fe",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Matias",    transporte:"bici",color:"#e879f9",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Luis",      transporte:"bici",color:"#f0abfc",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Bruno",     transporte:"bici",color:"#a78bfa",whatsapp:true, rol:"lavador",especial:""},
  {nombre:"Nico Alto", transporte:"bici",color:"#fbbf24",whatsapp:true, rol:"lavador",especial:"rapido"},
  {nombre:"Hernán",    transporte:"bici",color:"#f87171",whatsapp:false,rol:"lavador",especial:"avisar_presencia"},
  {nombre:"Gastón",    transporte:"bici",color:"#fb923c",whatsapp:false,rol:"lavador",especial:"llamar_telefono"},
];

// ═══════════════════════════════════════════════════════════════
//  CLIENTES SEED (con frecuencia del Excel de Marzo 2026)
// ═══════════════════════════════════════════════════════════════
const CLIENTES_SEED = [
  {nombre:"Victoria", telefono:"1100000001", direccion:"Dardo Rocha 3278",           autosHabituales:3, nota:"", tipo:"⭐ Frecuente", nroCliente:1001},
  {nombre:"Martin",   telefono:"1100000002", direccion:"Colectora Panamericana 2065", autosHabituales:3, nota:"", tipo:"⭐ Frecuente", nroCliente:1002},
  {nombre:"Micaela",  telefono:"1100000003", direccion:"Eduardo Costa 902",           autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1003},
  {nombre:"Hyundai",  telefono:"1100000004", direccion:"Av. Santa Fe 2627",           autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)", tipo:"🔥 Top", nroCliente:1004},
  {nombre:"Mariana",  telefono:"1100000005", direccion:"Diagonal Salta 557",          autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1005},
  {nombre:"Caro",     telefono:"1100000006", direccion:"Las Heras 1533, Martínez",    autosHabituales:3, nota:"", tipo:"⭐ Frecuente", nroCliente:1006},
  {nombre:"Salva",    telefono:"1100000007", direccion:"Hipólito Yrigoyen 2647, Martínez", autosHabituales:1, nota:"Silicina en llantas y paragolpes", tipo:"⭐ Frecuente", nroCliente:1007},
  {nombre:"Johana",   telefono:"1100000008", direccion:"Blas Parera 429, Boulogne",   autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1008},
  {nombre:"Karina",   telefono:"1100000009", direccion:"Cangallo 846",                autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1009},
  {nombre:"Andres",   telefono:"1100000010", direccion:"Paraná 374",                  autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1010},
  {nombre:"Barby",    telefono:"1100000011", direccion:"Fray Justo Sarmiento 3304",   autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1011},
  {nombre:"Tomás",    telefono:"1100000012", direccion:"Córdoba 596, Martínez",       autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1012},
  {nombre:"HernanC",  telefono:"1100000013", direccion:"Beruti 1583, Martínez",       autosHabituales:2, nota:"", tipo:"⭐ Frecuente", nroCliente:1013},
  {nombre:"Agustín",  telefono:"1100000014", direccion:"Colectora Panamericana 2065", autosHabituales:1, nota:"Llamar antes", tipo:"⭐ Frecuente", nroCliente:1014},
  {nombre:"Candelaria",telefono:"1100000015", direccion:"Ladislao Martínez 440",      autosHabituales:1, nota:"", tipo:"⭐ Frecuente", nroCliente:1015},
  {nombre:"Vero",     telefono:"1100000016", direccion:"Entre Ríos 2397, Martínez",   autosHabituales:1, nota:"Confirmar", tipo:"💤 Ocasional", nroCliente:1016},
  {nombre:"Avri",     telefono:"1100000017", direccion:"Entre Ríos 2983, Martínez",   autosHabituales:1, nota:"", tipo:"💤 Ocasional", nroCliente:1017},
  {nombre:"Ale",      telefono:"1100000018", direccion:"Sáenz Valiente 2163",         autosHabituales:1, nota:"", tipo:"💤 Ocasional", nroCliente:1018},
  {nombre:"GabyC",    telefono:"1100000019", direccion:"Catamarca 1304",              autosHabituales:2, nota:"", tipo:"💤 Ocasional", nroCliente:1019},
  {nombre:"Pablo",    telefono:"1100000020", direccion:"Ezpeleta 531, Martínez",      autosHabituales:2, nota:"", tipo:"💤 Ocasional", nroCliente:1020},
];

const NOTAS_PREDEFINIDAS = [
  "Cliente detallista","Insectos de ruta","Barro extremo","Decir precio antes de empezar",
  "Avisar cuando va","Llamar antes de entrar","No usar revividor","Llevar doble alargue",
  "Auto muy sucio","Cliente nuevo",
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const hoy         = () => new Date().toISOString().split("T")[0];
const franjaFin   = h  => { const [hr,mn]=h.split(":").map(Number); const t=hr*60+mn+90; return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
const esTarde     = h  => FRANJAS.indexOf(h) >= FRANJA_TARDE;
const formatP     = n  => "$" + Number(n||0).toLocaleString("es-AR");
const colorNuevo  = (staff) => COLORES.find(c=>!staff.map(s=>s.color).includes(c)) || "#94a3b8";

function distKm(lat1,lng1,lat2,lng2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
const kmToCuadras = km => km * 10;

const _geocache = {};
async function geocodificar(dir) {
  if(!dir) return { lat:BASE_LAT, lng:BASE_LNG };
  if(_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,{
      headers:{"Accept-Language":"es","User-Agent":"SofiaLavados/4.3"}
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

function Inp({label,value,onChange,placeholder,type="text",style={}}) {
  return <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>{label}</div>}
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
          ["Teléfono",   turno.clienteTel||"—"],
          ["Dirección",  turno.direccion],
          ["Autos",      `${turno.cantAutos} (${turno.tamano||"—"})`],
          ["Precio",     formatP(turno.precio)],
          ["Pago",       turno.metodo==="mp"?"Mercado Pago":"Efectivo"],
          ["Estado",     turno.pagado?"✓ Cobrado por el lavador":"💰 Pendiente de rendición"],
          ["Notas",      turno.notas||"—"],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1e2d40",paddingBottom:5}}>
            <span style={{color:"#94a3b8"}}>{k}</span>
            <span style={{color:"#e2e8f0",fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <Btn full color="#16a34a" onClick={()=>onWA(turno)}>📲 Generar mensaje WhatsApp</Btn>
        {!turno.pagado && <Btn full color="#d97706" onClick={()=>onPagar(turno)}>💰 Cobró el lavador</Btn>}
        <Btn full color="#0e7490" onClick={()=>setModo("reasignar")}>🔄 Reasignar turno</Btn>
        {turno.clienteTel && <a href={`tel:${turno.clienteTel}`} style={{textDecoration:"none"}}><Btn full ghost>📞 Llamar al cliente</Btn></a>}
        <Btn full danger onClick={()=>onCancelar(turno)}>✕ Cancelar turno</Btn>
      </div>
    </>}
    {modo==="reasignar" && <>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>Cambiá el lavador y/o el horario.</div>
      <Sel label="NUEVO LAVADOR" value={nStaff} onChange={setNS}>
        {staffActivos.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
      </Sel>
      <Sel label="NUEVO HORARIO" value={nHora} onChange={setNH}>
        {FRANJAS.map(h=><option key={h} value={h}>{h}</option>)}
      </Sel>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <Btn ghost onClick={()=>setModo("detalle")}>← Volver</Btn>
        <Btn full color="#0e7490" onClick={()=>onReasignar(turno,nStaff,nHora)}>Confirmar reasignación</Btn>
      </div>
    </>}
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL STAFF
// ═══════════════════════════════════════════════════════════════
function ModalStaff({miembro,staff,esNuevo,onGuardar,onBorrar,onClose}) {
  const [nombre,    setNombre]    = useState(miembro?.nombre||"");
  const [transporte,setTrans]     = useState(miembro?.transporte||"moto");
  const [rol,       setRol]       = useState(miembro?.rol||"lavador");
  const [wa,        setWa]        = useState(miembro?.whatsapp!==false);
  const [especial,  setEspecial]  = useState(miembro?.especial||"");
  const [confirmar, setConfirmar] = useState(false);

  return <Modal titulo={esNuevo?"Agregar integrante":`Editar: ${miembro?.nombre}`} onClose={onClose}>
    <Inp label="NOMBRE" value={nombre} onChange={setNombre}/>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>ROL</div>
      <div style={{display:"flex",gap:8}}>
        {["lavador","encargado"].map(r=>(
          <Btn key={r} full ghost={rol!==r} color="#0e7490" onClick={()=>setRol(r)} style={{flex:1}}>
            {r==="lavador"?"🚗 Lavador":"👷 Encargado"}
          </Btn>
        ))}
      </div>
    </div>
    {rol==="lavador"&&<>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>TRANSPORTE HABITUAL</div>
        <div style={{display:"flex",gap:8}}>
          {["moto","bici"].map(t=>(
            <Btn key={t} full ghost={transporte!==t} color="#0e7490" onClick={()=>setTrans(t)} style={{flex:1}}>
              {t==="moto"?"🏍 Moto (25 cuas)":"🚲 Bici (15 cuas)"}
            </Btn>
          ))}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>WHATSAPP</div>
        <div style={{display:"flex",gap:8}}>
          {[[true,"✓ Tiene WA"],[false,"✗ Sin WA"]].map(([v,l])=>(
            <Btn key={String(v)} full ghost={wa!==v} color="#0e7490" onClick={()=>setWa(v)} style={{flex:1}}>{l}</Btn>
          ))}
        </div>
      </div>
      {!wa&&<div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#94a3b8",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>CÓMO AVISAR</div>
        <div style={{display:"flex",gap:8}}>
          {[["avisar_presencia","👁 En persona"],["llamar_telefono","📞 Por teléfono"]].map(([v,l])=>(
            <Btn key={v} full ghost={especial!==v} color="#0e7490" onClick={()=>setEspecial(v)} style={{flex:1}}>{l}</Btn>
          ))}
        </div>
      </div>}
    </>}
    <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
      {!esNuevo&&!confirmar&&<Btn danger sm onClick={()=>setConfirmar(true)}>Eliminar</Btn>}
      {!esNuevo&&confirmar&&<Btn danger sm onClick={()=>onBorrar(miembro.id)}>¿Confirmar?</Btn>}
      <Btn ghost onClick={onClose} style={{flex:1}}>Cancelar</Btn>
      <Btn full color="#0e7490" onClick={()=>{if(!nombre.trim())return;onGuardar({nombre,transporte,rol,whatsapp:wa,especial,color:esNuevo?colorNuevo(staff):miembro?.color});}} style={{flex:2}}>
        {esNuevo?"Agregar":"Guardar cambios"}
      </Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL CLIENTE
//
