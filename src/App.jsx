import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, query, orderBy, where
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
// Base Olivos — punto de partida para calcular distancias del primer turno del día
const BASE_LAT  = -34.5128;
const BASE_LNG  = -58.4985; // Juan Bautista Alberdi 1620, Olivos

// Franjas reales de 90 minutos
const FRANJAS = ["09:00","10:30","12:00","13:30","15:00","16:30","18:00"];
const FRANJA_TARDE = 3; // 13:30 en adelante

// Tamaños de auto con precios DEFAULT (editables desde Configuración)
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

const CLIENTES_SEED = [
  {nombre:"Victoria", telefono:"1100000001", direccion:"Dardo Rocha 3278",           autosHabituales:3, nota:""},
  {nombre:"Martin",   telefono:"1100000002", direccion:"Colectora Panamericana 2065", autosHabituales:3, nota:""},
  {nombre:"Micaela",  telefono:"1100000003", direccion:"Eduardo Costa 902",           autosHabituales:1, nota:""},
  {nombre:"Hyundai",  telefono:"1100000004", direccion:"Av. Santa Fe 2627",           autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)"},
  {nombre:"Mariana",  telefono:"1100000005", direccion:"Diagonal Salta 557",          autosHabituales:1, nota:""},
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const hoy         = () => new Date().toISOString().split("T")[0];
const franjaFin   = h  => { const [hr,mn]=h.split(":").map(Number); const t=hr*60+mn+90; return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
const esTarde     = h  => FRANJAS.indexOf(h) >= FRANJA_TARDE;
const formatP     = n  => "$" + Number(n||0).toLocaleString("es-AR");
const colorNuevo  = (staff) => COLORES.find(c=>!staff.map(s=>s.color).includes(c)) || "#94a3b8";

// Distancia real usando fórmula Haversine aproximada (en km)
function distKm(lat1,lng1,lat2,lng2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// Convertir km a cuadras (~100m por cuadra)
const kmToCuadras = km => km * 10;

// Cache de geocoding para no repetir llamadas
const _geocache = {};
async function geocodificar(dir) {
  if(!dir) return { lat:BASE_LAT, lng:BASE_LNG };
  if(_geocache[dir]) return _geocache[dir];
  try {
    const q = encodeURIComponent(`${dir}, Buenos Aires, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,{
      headers:{"Accept-Language":"es","User-Agent":"SofiaLavados/4.1"}
    });
    const data = await res.json();
    if(data.length>0) {
      const coords = { lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon) };
      _geocache[dir] = coords;
      return coords;
    }
  } catch {}
  // Fallback simulación
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000) };
}
// Versión síncrona fallback (para CeldaTurno que no es async)
function coordsSimuladas(dir) {
  if(_geocache[dir]) return _geocache[dir];
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000) };
}

// Slots bloqueados por cantidad de autos
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
    {label&&<div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>{label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none",...style}}/>
  </div>;
}

function Sel({label,value,onChange,children,style={}}) {
  return <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>{label}</div>}
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
//  MODAL WHATSAPP (recuperable desde cualquier turno)
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
    {/* Alerta sin WA */}
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
          ["Estado",     turno.pagado?"✓ Cobrado":"💰 Pendiente"],
          ["Notas",      turno.notas||"—"],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1e2d40",paddingBottom:5}}>
            <span style={{color:"#475569"}}>{k}</span>
            <span style={{color:"#e2e8f0",fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <Btn full color="#16a34a" onClick={()=>onWA(turno)}>📲 Generar mensaje WhatsApp</Btn>
        {!turno.pagado && <Btn full color="#d97706" onClick={()=>onPagar(turno)}>💰 Registrar cobro</Btn>}
        <Btn full color="#0e7490" onClick={()=>setModo("reasignar")}>🔄 Reasignar turno</Btn>
        {turno.clienteTel && <a href={`tel:${turno.clienteTel}`} style={{textDecoration:"none"}}><Btn full ghost>📞 Llamar al cliente</Btn></a>}
        <Btn full danger onClick={()=>onCancelar(turno)}>✕ Cancelar turno</Btn>
      </div>
    </>}
    {modo==="reasignar" && <>
      <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Cambiá el lavador y/o el horario.</div>
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
      <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>ROL</div>
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
        <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>TRANSPORTE HABITUAL</div>
        <div style={{display:"flex",gap:8}}>
          {["moto","bici"].map(t=>(
            <Btn key={t} full ghost={transporte!==t} color="#0e7490" onClick={()=>setTrans(t)} style={{flex:1}}>
              {t==="moto"?"🏍 Moto (25 cuas)":"🚲 Bici (15 cuas)"}
            </Btn>
          ))}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>WHATSAPP</div>
        <div style={{display:"flex",gap:8}}>
          {[[true,"✓ Tiene WA"],[false,"✗ Sin WA"]].map(([v,l])=>(
            <Btn key={String(v)} full ghost={wa!==v} color="#0e7490" onClick={()=>setWa(v)} style={{flex:1}}>{l}</Btn>
          ))}
        </div>
      </div>
      {!wa&&<div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:6,fontWeight:700}}>CÓMO AVISAR</div>
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
// ═══════════════════════════════════════════════════════════════
function ModalCliente({cliente,esNuevo,onGuardar,onBorrar,onClose}) {
  const [nombre,   setNombre]   = useState(cliente?.nombre||"");
  const [tel,      setTel]      = useState(cliente?.telefono||"");
  const [dir,      setDir]      = useState(cliente?.direccion||"");
  const [autos,    setAutos]    = useState(cliente?.autosHabituales||1);
  const [nota,     setNota]     = useState(cliente?.nota||"");
  const [confirm,  setConfirm]  = useState(false);
  const telValido = /^[0-9]{8,12}$/.test(tel.replace(/\s/g,""));

  return <Modal titulo={esNuevo?"Nuevo cliente":"Editar cliente"} onClose={onClose}>
    <Inp label="NOMBRE *" value={nombre} onChange={setNombre} placeholder="Nombre o empresa"/>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>TELÉFONO * <span style={{color:tel&&!telValido?"#f87171":"#334155"}}>{tel&&!telValido?"✗ solo números, 8-12 dígitos":""}</span></div>
      <input type="tel" value={tel} onChange={e=>setTel(e.target.value.replace(/[^0-9]/g,""))} placeholder="Ej: 1155551234"
        style={{background:"#0b1220",border:`1px solid ${tel&&!telValido?"#f87171":"#1e3a5f"}`,borderRadius:8,color:"#e2e8f0",fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none"}}/>
    </div>
    <Inp label="DIRECCIÓN" value={dir} onChange={setDir} placeholder="Dirección habitual"/>
    <Inp label="AUTOS HABITUALES" value={autos} onChange={v=>setAutos(Number(v))} type="number"/>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>NOTA</div>
      <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Cliente detallista, etc."
        style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none",resize:"none",height:60}}/>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {!esNuevo&&!confirm&&<Btn danger sm onClick={()=>setConfirm(true)}>Eliminar</Btn>}
      {!esNuevo&&confirm&&<Btn danger sm onClick={()=>onBorrar(cliente.id)}>¿Confirmar?</Btn>}
      <Btn ghost onClick={onClose} style={{flex:1}}>Cancelar</Btn>
      <Btn full color="#0e7490" disabled={!nombre.trim()||!telValido} onClick={()=>onGuardar({nombre,telefono:tel,direccion:dir,autosHabituales:autos,nota})} style={{flex:2}}>
        {esNuevo?"Agregar cliente":"Guardar"}
      </Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  MODAL SERVICIO ESPECIAL
// ═══════════════════════════════════════════════════════════════
function ModalServicioEsp({onAplicar,onClose}) {
  const [nombre,  setNombre]  = useState("");
  const [precio,  setPrecio]  = useState("");
  const [slots,   setSlots]   = useState(1);

  return <Modal titulo="Servicio especial personalizado" onClose={onClose}>
    <Inp label="NOMBRE DEL SERVICIO" value={nombre} onChange={setNombre} placeholder="Ej: Limpieza de vómito"/>
    <Inp label="PRECIO" value={precio} onChange={setPrecio} placeholder="Ej: 45000" type="number"/>
    <Inp label="SLOTS DE TIEMPO (1 slot = 90 min)" value={slots} onChange={v=>setSlots(Number(v))} type="number"/>
    <div style={{padding:"8px 12px",background:"#fbbf2410",border:"1px solid #fbbf2433",borderRadius:8,fontSize:11,color:"#fde68a",marginBottom:12}}>
      ⏱ {slots} slot{slots>1?"s":""} = {slots*90} minutos de trabajo
    </div>
    <div style={{display:"flex",gap:8}}>
      <Btn ghost onClick={onClose} style={{flex:1}}>Cancelar</Btn>
      <Btn full color="#7c3aed" onClick={()=>{if(!nombre.trim()||!precio)return;onAplicar({nombre,precio:Number(precio),slotsPersonalizados:slots,esServicioEsp:true});}} style={{flex:2}}>
        Aplicar servicio
      </Btn>
    </div>
  </Modal>;
}

// ═══════════════════════════════════════════════════════════════
//  CELDA DE TURNO EN LA GRILLA
// ═══════════════════════════════════════════════════════════════
function CeldaTurno({s,hora,turnos,asistencia,dir,listaVacia,sel,onSel,onDetalle,tamanos}) {
  const turno = turnos.find(t=>t.staffId===s.id&&t.horasOcupadas?.includes(hora));
  const esPpal = turno?.hora===hora;
  const trans  = asistencia[s.id]?.transporte||s.transporte;
  const radio  = trans==="moto"?25:trans==="pie"?7:15;

  let geo = "libre";
  if(!turno&&dir) {
    // Calcular desde último turno del día o desde base
    const turnosHoy = turnos.filter(t=>t.staffId===s.id).sort((a,b)=>FRANJAS.indexOf(a.hora)-FRANJAS.indexOf(b.hora));
    const ultimoTurno = turnosHoy[turnosHoy.length-1];
    let fromLat = BASE_LAT, fromLng = BASE_LNG;
    if(ultimoTurno?.coordsDestino) { fromLat=ultimoTurno.coordsDestino.lat; fromLng=ultimoTurno.coordsDestino.lng; }
    const dest = coordsSimuladas(dir);
    const cuadras = kmToCuadras(distKm(fromLat,fromLng,dest.lat,dest.lng));
    if(listaVacia&&esTarde(hora)) geo=cuadras>radio*1.5?"fz_ok":"verde";
    else if(cuadras<=radio) geo="verde";
    else if(cuadras<=radio*1.5) geo="amarillo";
    else geo="fz";
  }

  const ocupado = !!turno;
  const bloq = turno&&!esPpal;

  const estilos = {
    libre:     {bg:"#0b122066",bd:"#1e2d40",  txt:"#1e3a5f",lbl:"·"},
    verde:     {bg:"#34d39913",bd:"#34d39955",txt:"#6ee7b7",lbl:"● libre"},
    amarillo:  {bg:"#fbbf2413",bd:"#fbbf2455",txt:"#fde68a",lbl:"◐ lejos"},
    fz:        {bg:"#a78bfa13",bd:"#a78bfa55",txt:"#c4b5fd",lbl:"⬡ FZ"},
    fz_ok:     {bg:"#7c3aed18",bd:"#7c3aed88",txt:"#ddd6fe",lbl:"⬡ FZ ok"},
  }[geo]||{bg:"#0b122066",bd:"#1e2d40",txt:"#1e3a5f",lbl:"·"};

  if(ocupado) return (
    <div onClick={()=>onDetalle(turno)}
      style={{padding:"7px 5px",borderRadius:7,fontSize:10,cursor:"pointer",
        background:bloq?"#ef444408":`${s.color}18`,
        border:`1px solid ${bloq?"#ef444422":s.color+"55"}`,
        color:bloq?"#1e2d40":s.color,lineHeight:1.4,minHeight:50}}>
      {esPpal?<>
        <div style={{fontWeight:700,fontSize:11}}>{turno.clienteNombre||turno.cliente||"turno"}</div>
        <div style={{color:"#475569",fontSize:9,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{turno.direccion?.split(",")[0]}</div>
        <div style={{fontSize:9,marginTop:2}}>{turno.pagado?<span style={{color:"#34d399"}}>✓ cobrado</span>:<span style={{color:"#fde68a"}}>💰 pendiente</span>}</div>
      </>:<div style={{fontSize:9,color:"#334155",textAlign:"center",paddingTop:12}}>↓</div>}
    </div>
  );

  return (
    <div onClick={()=>geo!=="libre"&&onSel(s.id,hora,geo)}
      style={{padding:"9px 5px",borderRadius:7,textAlign:"center",fontSize:11,
        background:estilos.bg,border:`1px solid ${sel?s.color:estilos.bd}`,
        color:sel?s.color:estilos.txt,
        outline:sel?`2px solid ${s.color}44`:"none",outlineOffset:1,
        cursor:geo==="libre"?"default":"pointer",minHeight:50,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
      {estilos.lbl}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function SofiaV4() {
  // ── Firebase
  const [fbOk,  setFbOk]  = useState(false);
  const [fbLoad,setFbLoad]= useState(false);

  // ── Datos
  const [staff,      setStaff]      = useState([]);
  const [asistencia, setAsist]      = useState({});
  const [clientes,   setClientes]   = useState([]);
  const [turnos,     setTurnos]     = useState([]);
  const [registros,  setRegistros]  = useState([]);
  const [tamanos,    setTamanos]    = useState(TAMANOS_DEFAULT);
  const [fzPct,      setFzPct]      = useState(20);

  // ── UI
  const [vista,  setVista]  = useState("turno");
  const [toast,  setToast]  = useState(null);
  const [modal,  setModal]  = useState(null); // {tipo, data}

  // ── Formulario nuevo turno
  const [clienteInput,setClienteInput] = useState("");
  const [sugs,        setSugs]         = useState([]);
  const [clienteSel,  setClienteSel]   = useState(null); // objeto cliente
  const [direccion,   setDireccion]    = useState("");
  const [geocodOk,    setGeocodOk]     = useState(false);
  const [cantAutos,   setCantAutos]    = useState(1);
  const [tamano,      setTamano]       = useState("mediano");
  const [precio,      setPrecio]       = useState("");
  const [notas,       setNotas]        = useState("");
  const [metodo,      setMetodo]       = useState("efectivo");
  const [staffSelId,  setStaffSelId]   = useState(null);
  const [horaSelec,   setHoraSelec]    = useState("");
  const [geoSelec,    setGeoSelec]     = useState("");
  const [paso,        setPaso]         = useState(1);
  const [guardando,   setGuardando]    = useState(false);
  const [servicioEsp, setServicioEsp]  = useState(null); // servicio especial

  // ── Filtros grilla
  const [filtroT,   setFiltroT]  = useState("todos");
  const [filtroBus, setFiltroBus]= useState("");

  // ── IA (Gemini)
  const [iaResp,  setIaResp]  = useState("");
  const [iaLoad,  setIaLoad]  = useState(false);
  const [iaPanel, setIaPanel] = useState(false);
  const [geminiKey,setGKey]   = useState("");

  // ── Módulo contable multifecha
  const [rangoC,     setRangoC]    = useState("hoy");   // hoy | semana | mes
  const [regMulti,   setRegMulti]  = useState([]);
  const [loadMulti,  setLoadMulti] = useState(false);

  const showToast = (msg,tipo="ok") => setToast({msg,tipo});
  const diaHoy = hoy();

  // ── Computed
  const staffActivo    = staff.filter(s=>asistencia[s.id]?.presente&&s.rol!=="encargado");
  const staffFiltrado  = staffActivo.filter(s=>
    (filtroT==="todos"||(asistencia[s.id]?.transporte||s.transporte)===filtroT)&&
    (!filtroBus||s.nombre.toLowerCase().includes(filtroBus.toLowerCase()))
  );
  const staffSelObj    = staff.find(s=>s.id===staffSelId);
  const tamanoObj      = tamanos.find(t=>t.id===tamano);
  const precioFinal    = servicioEsp ? servicioEsp.precio : (precio ? Number(precio) : (tamanoObj?.precio||0)) * (servicioEsp?.slotsPersonalizados||cantAutos);
  const esFZ           = geoSelec==="fz"||geoSelec==="fz_ok";
  const precioConFZ    = esFZ ? Math.round(precioFinal*(1+fzPct/100)) : precioFinal;
  const slotsAUsar     = horaSelec ? slotsOcupados(horaSelec, servicioEsp?.slotsPersonalizados||cantAutos) : [];
  const listaVacia     = !turnos.some(t=>esTarde(t.hora));
  const pendientes     = turnos.filter(t=>!t.pagado&&t.estado==="confirmado").length;
  const totalDia       = registros.reduce((s,r)=>s+Number(r.precio||0),0);
  const totalMP        = registros.filter(r=>r.metodo==="mp").reduce((s,r)=>s+Number(r.precio||0),0);
  const totalEfect     = registros.filter(r=>r.metodo==="efectivo").reduce((s,r)=>s+Number(r.precio||0),0);

  // ── Init
  useEffect(()=>{ inicializar(); },[]);

  async function inicializar() {
    setFbLoad(true);
    try {
      let s = await fsList("staff");
      if(!s.length) { for(const m of STAFF_SEED){const id=await fsAdd("staff",m);s.push({id,...m});} }
      setStaff(s);

      const asDoc = await fsGet("asistencia", diaHoy);
      if(asDoc){const{id:_,_ts:__,...slots}=asDoc;setAsist(slots);}

      let cl = await fsList("clientes");
      if(!cl.length){for(const c of CLIENTES_SEED){const id=await fsAdd("clientes",c);cl.push({id,...c});}}
      setClientes(cl);

      const cfg = await fsGet("config","precios");
      if(cfg?.tamanos) setTamanos(cfg.tamanos);
      if(cfg?.fzPct)   setFzPct(cfg.fzPct);
      if(cfg?.geminiKey) setGKey(cfg.geminiKey);

      await recargar();
      setFbOk(true);
      showToast("Firebase ✓");
    } catch { setFbOk(false); showToast("Modo local activo","warn"); }
    setFbLoad(false);
  }

  // Generar fechas de rango
  function fechasRango(rango) {
    const dias = [];
    const hoyDate = new Date();
    if(rango==="hoy") {
      dias.push(hoy());
    } else if(rango==="semana") {
      for(let i=6;i>=0;i--) {
        const d=new Date(hoyDate); d.setDate(d.getDate()-i);
        dias.push(d.toISOString().split("T")[0]);
      }
    } else if(rango==="mes") {
      for(let i=29;i>=0;i--) {
        const d=new Date(hoyDate); d.setDate(d.getDate()-i);
        dias.push(d.toISOString().split("T")[0]);
      }
    }
    return dias;
  }

  async function cargarMultiFecha(rango) {
    setLoadMulti(true);
    try {
      const fechas = fechasRango(rango);
      const todos = [];
      for(const f of fechas) {
        const r = await fsList(`cierre_${f}`);
        todos.push(...r.map(x=>({...x,fecha:f})));
      }
      setRegMulti(todos);
      if(rango==="hoy") setRegistros(todos.filter(r=>r.fecha===hoy()));
    } catch {}
    setLoadMulti(false);
  }

  async function recargar() {
    const t = await fsList(`turnos_${diaHoy}`); setTurnos(t);
    const r = await fsList(`cierre_${diaHoy}`); setRegistros(r);
  }

  // Geocodificar al cambiar dirección (debounce 800ms)
  useEffect(()=>{
    if(!direccion||direccion.length<6) return;
    const t = setTimeout(()=>{ geocodificar(direccion).then(c=>setGeocodOk(!!c)); }, 800);
    return ()=>clearTimeout(t);
  },[direccion]);

  // Listener tiempo real
  useEffect(()=>{
    if(!db) return;
    const u = onSnapshot(collection(db,`turnos_${diaHoy}`), snap=>{
      setTurnos(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return()=>u();
  },[]);

  // ── Autocomplete clientes
  function handleClienteInput(val) {
    setClienteInput(val);
    if(val.length>=2) setSugs(clientes.filter(c=>c.nombre.toLowerCase().startsWith(val.toLowerCase())));
    else setSugs([]);
  }
  function aplicarCliente(c) {
    setClienteInput(c.nombre); setClienteSel(c);
    setDireccion(c.direccion||""); setCantAutos(c.autosHabituales||1);
    if(c.nota) setNotas(c.nota);
    setSugs([]);
  }

  // ── Selección turno en grilla
  function selTurno(sId,hora,geo) {
    setStaffSelId(sId); setHoraSelec(hora); setGeoSelec(geo);
    setPaso(Math.max(paso,3));
  }

  // ── Reset formulario completo
  function resetForm() {
    setClienteInput(""); setClienteSel(null); setDireccion(""); setCantAutos(1);
    setTamano("mediano"); setPrecio(""); setNotas(""); setMetodo("efectivo");
    setStaffSelId(null); setHoraSelec(""); setGeoSelec(""); setServicioEsp(null);
    setIaResp(""); setPaso(1);
  }

  // ── Confirmar turno
  async function confirmarTurno() {
    if(!staffSelId||!horaSelec) return;
    setGuardando(true);
    const slotsUsados = slotsOcupados(horaSelec, servicioEsp?.slotsPersonalizados||cantAutos);
    const destCoords  = await geocodificar(direccion);
    const turnoData   = {
      staffId:staffSelId, staffNombre:staffSelObj?.nombre,
      staffTransporte: asistencia[staffSelId]?.transporte||staffSelObj?.transporte,
      hora:horaSelec, horasOcupadas:slotsUsados,
      clienteNombre:clienteSel?.nombre||clienteInput,
      clienteTel:clienteSel?.telefono||"",
      cliente:clienteInput, direccion,
      cantAutos: servicioEsp?.slotsPersonalizados||cantAutos,
      tamano:servicioEsp?servicioEsp.nombre:tamano,
      precio:precioConFZ, esFZ,
      metodo, notas, estado:"confirmado", pagado:false,
      coordsDestino:destCoords,
      servicioEsp:!!servicioEsp,
      fecha:diaHoy,
    };
    const id = await fsAdd(`turnos_${diaHoy}`, turnoData);
    setTurnos(prev=>[...prev,{id:id||"local_"+Date.now(),...turnoData}]);
    showToast("Turno guardado ✓");
    setGuardando(false);
    // Mostrar modal WA automáticamente
    setModal({tipo:"wa", data:{id:id||"local",...turnoData}});
    // Reset para siguiente turno
    resetForm();
  }

  // ── Cancelar turno
  async function cancelarTurno(turno) {
    await fsDel(`turnos_${diaHoy}`, turno.id);
    setTurnos(prev=>prev.filter(t=>t.id!==turno.id));
    showToast("Turno cancelado","warn");
    setModal(null);
  }

  // ── Reasignar
  async function reasignarTurno(turno,nStaff,nHora) {
    const ns = staff.find(s=>s.id===nStaff);
    const horasOcupadas = slotsOcupados(nHora, turno.cantAutos);
    const upd = {staffId:nStaff,staffNombre:ns?.nombre,hora:nHora,horasOcupadas};
    await fsUpdate(`turnos_${diaHoy}`,turno.id,upd);
    setTurnos(prev=>prev.map(t=>t.id===turno.id?{...t,...upd}:t));
    showToast(`Reasignado a ${ns?.nombre} ✓`);
    setModal(null);
  }

  // ── Registrar pago
  async function registrarPago(turno) {
    const reg = {
      turnoId:turno.id, hora:turno.hora,
      staffNombre:turno.staffNombre,
      clienteNombre:turno.clienteNombre||turno.cliente,
      direccion:turno.direccion, autos:turno.cantAutos,
      tamano:turno.tamano, precio:turno.precio,
      metodo:turno.metodo, esFZ:turno.esFZ,
      notas:turno.notas, fecha:diaHoy,
      ts:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
    };
    await fsAdd(`cierre_${diaHoy}`, reg);
    await fsUpdate(`turnos_${diaHoy}`,turno.id,{pagado:true});
    setTurnos(prev=>prev.map(t=>t.id===turno.id?{...t,pagado:true}:t));
    setRegistros(prev=>[...prev,{id:Date.now(),...reg}]);
    showToast(`Cobro ${formatP(turno.precio)} registrado ✓`);
    setModal(null);
  }

  // ── IA Gemini
  async function consultarIA() {
    setIaLoad(true); setIaResp("");
    try {
      const activos = staffActivo.slice(0,8).map(s=>`${s.nombre}(${asistencia[s.id]?.transporte||s.transporte})`).join(", ");
      const prompt  = `Sos asistente logístico de "Sofía Lavados Móvil" en Olivos, GBA Norte, Argentina. Respondé en español, directo, máx 4 oraciones, sin markdown.\n\nDatos del turno: cliente=${clienteInput||"?"}, dirección=${direccion||"?"}, autos=${cantAutos}, notas="${notas||"ninguna"}", tarde vacía=${listaVacia?"SÍ":"NO"}.\nLavadores activos: ${activos}.\n\nRecomendá el lavador óptimo, si aplica FZ y qué considerar por las notas.`;

      const key = geminiKey || "AIzaSyD-PLACEHOLDER";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });
      const d = await res.json();
      const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta de Gemini.";
      setIaResp(txt);
    } catch { setIaResp("Error — verificá la Gemini API Key en Configuración."); }
    setIaLoad(false);
  }

  // ── Backup
  function backup() {
    const data = {staff,clientes,turnos,registros,tamanos,fecha:diaHoy};
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download = `backup-sofia-${diaHoy}.json`; a.click();
    showToast("Backup descargado ✓");
  }

  // ── Guardar config precios
  async function guardarConfig(newTam,newFz,newKey) {
    setTamanos(newTam); setFzPct(newFz); setGKey(newKey);
    await fsSave("config","precios",{tamanos:newTam,fzPct:newFz,geminiKey:newKey});
    showToast("Configuración guardada ✓");
  }

  // ═══ CSS ═══════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#080c18}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
    body{background:#080c18;overscroll-behavior:none}
    .ff{font-family:'JetBrains Mono',monospace}
    @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .fade{animation:fi .22s ease}
    input,textarea,select{background:#0b1220;border:1px solid #1e3a5f;border-radius:8px;color:#e2e8f0;font-family:'JetBrains Mono',monospace;font-size:12px;padding:9px 13px;width:100%;transition:border-color .2s;outline:none;resize:none}
    input:focus,textarea:focus,select:focus{border-color:#22d3ee;box-shadow:0 0 0 2px #22d3ee18}
    select option{background:#0b1220}
    .card{background:#0b1220;border:1px solid #1e2d40;border-radius:12px;padding:16px}
    .lbl{font-size:10px;color:#334155;letter-spacing:.13em;margin-bottom:5px;font-weight:700}
    .hr{height:1px;background:linear-gradient(90deg,transparent,#1e3a5f,transparent);margin:11px 0}
    .nt{background:transparent;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 12px;border-radius:8px;color:#475569;transition:all .2s}
    .nt:hover{color:#94a3b8;background:#ffffff09}
    .nt.on{color:#22d3ee;background:#22d3ee0f;border-bottom:2px solid #22d3ee}
    .chip{padding:4px 10px;border-radius:6px;font-size:10px;cursor:pointer;border:1px solid #1e3a5f;background:transparent;color:#64748b;font-family:inherit;transition:all .15s}
    .chip:hover{border-color:#334155;color:#94a3b8}
    .chip.on{border-color:#22d3ee;color:#22d3ee;background:#22d3ee0a}
    .tog{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;padding:0}
    .tog::after{content:"";position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:white;transition:left .2s}
    .tog.off{background:#334155}.tog.off::after{left:2px}
    .tog.on_{background:#16a34a}.tog.on_::after{left:18px}
    /* GRILLA SCROLL HORIZONTAL */
    .grilla-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .grilla-inner{min-width:600px}
    @keyframes pulse_y{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.4)}50%{box-shadow:0 0 0 8px rgba(251,191,36,0)}}
    /* MOBILE FIRST */
    @media(max-width:768px){
      .layout-turno{grid-template-columns:1fr!important}
      .nav-labels{display:none}
      .nav-icons{display:flex!important}
      .topbar-right{gap:4px!important}
      .topbar-badges{display:none!important}
    }
  `;

  // ═══ RENDER ════════════════════════════════════════════════
  return (
    <div className="ff" style={{background:"#080c18",minHeight:"100vh",color:"#e2e8f0"}}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)}/>}

      {/* MODALES */}
      {modal?.tipo==="wa"       && <ModalWA      turno={modal.data} staff={staff} onClose={()=>{setModal(null);resetForm();}}/>}
      {modal?.tipo==="detalle"  && <ModalDetalle turno={modal.data} staff={staff} asistencia={asistencia} onCancelar={cancelarTurno} onReasignar={reasignarTurno} onPagar={registrarPago} onWA={t=>setModal({tipo:"wa",data:t})} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="nstaff"   && <ModalStaff   esNuevo staff={staff} onGuardar={async m=>{const id=await fsAdd("staff",m);setStaff(p=>[...p,{id,...m}]);showToast(`${m.nombre} agregado ✓`);setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="estaff"   && <ModalStaff   miembro={modal.data} staff={staff} onGuardar={async(m)=>{await fsUpdate("staff",modal.data.id,m);setStaff(p=>p.map(s=>s.id===modal.data.id?{...s,...m}:s));showToast("Guardado ✓");setModal(null);}} onBorrar={async id=>{await fsDel("staff",id);setStaff(p=>p.filter(s=>s.id!==id));showToast("Eliminado","warn");setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="ncliente" && <ModalCliente esNuevo onGuardar={async m=>{const id=await fsAdd("clientes",m);setClientes(p=>[...p,{id,...m}]);showToast(`${m.nombre} agregado ✓`);setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="ecliente" && <ModalCliente cliente={modal.data} onGuardar={async m=>{await fsUpdate("clientes",modal.data.id,m);setClientes(p=>p.map(c=>c.id===modal.data.id?{...c,...m}:c));showToast("Guardado ✓");setModal(null);}} onBorrar={async id=>{await fsDel("clientes",id);setClientes(p=>p.filter(c=>c.id!==id));showToast("Eliminado","warn");setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="servEsp"  && <ModalServicioEsp onAplicar={s=>{setServicioEsp(s);setPrecio(String(s.precio));setModal(null);showToast(`Servicio especial: ${s.nombre}`);}} onClose={()=>setModal(null)}/>}
      {modal?.tipo==="config"   && <ModalConfig tamanos={tamanos} fzPct={fzPct} geminiKey={geminiKey} onGuardar={guardarConfig} onClose={()=>setModal(null)}/>}

      {/* NAV */}
      <header style={{background:"#0b1220",borderBottom:"1px solid #1e2d40",padding:"0 16px",display:"flex",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",marginRight:20,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🚿</div>
          <div style={{display:"none"}} className="nav-labels">
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:".1em",color:"#f1f5f9",lineHeight:1}}>SOFÍA</div>
            <div style={{fontSize:8,color:"#1e3a5f",letterSpacing:".2em"}}>v4.0</div>
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:".1em",color:"#f1f5f9",lineHeight:1}}>SOFÍA v4</div>
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto"}}>
          {[
            {id:"turno",   l:"+ Turno",     ico:"➕"},
            {id:"agenda",  l:`Agenda${turnos.length?` (${turnos.length})`:""}`, ico:"📅"},
            {id:"asist",   l:"Asistencia",  ico:"✅"},
            {id:"clientes",l:"Clientes",    ico:"👥"},
            {id:"staff",   l:"Staff",       ico:"👷"},
            {id:"cierre",  l:`Cierre${registros.length?` (${registros.length})`:""}`, ico:"💰"},
            {id:"config",  l:"Config",      ico:"⚙"},
          ].map(v=>(
            <button key={v.id} className={`nt ${vista===v.id?"on":""}`} onClick={()=>v.id==="config"?setModal({tipo:"config"}):setVista(v.id)}>
              {v.l}
            </button>
          ))}
        </div>
        <div className="topbar-right" style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <div className="topbar-badges" style={{display:"flex",gap:5}}>
            {pendientes>0&&<span style={{background:"#ef444420",border:"1px solid #ef444444",color:"#fca5a5",padding:"3px 8px",borderRadius:5,fontSize:10}}>💰{pendientes}</span>}
            {listaVacia&&<span style={{background:"#312e8118",border:"1px solid #312e8144",color:"#a5b4fc",padding:"3px 8px",borderRadius:5,fontSize:10}}>📋TARDE</span>}
          </div>
          <div onClick={inicializar} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"3px 8px",borderRadius:5,cursor:"pointer",background:fbOk?"#34d39910":"#f8717110",border:`1px solid ${fbOk?"#34d39933":"#f8717133"}`,color:fbOk?"#6ee7b7":"#fca5a5"}}>
            <span style={{animation:fbLoad?"spin .7s linear infinite":"none",display:"inline-block"}}>{fbLoad?"⟳":fbOk?"●":"○"}</span>
            <span>{fbLoad?"…":fbOk?"FB✓":"off"}</span>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"16px 14px"}}>

        {/* ══ NUEVO TURNO ══ */}
        {vista==="turno"&&(
          <div className="fade layout-turno" style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>

            {/* Columna izquierda: formulario */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* PASO 1 */}
              <div className="card" style={{borderColor:paso===1?"#22d3ee33":"#1e2d40"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
                  <span style={{background:"#22d3ee",color:"#080c18",borderRadius:5,padding:"1px 6px",fontSize:10}}>01</span> Datos del servicio
                  {servicioEsp&&<span style={{marginLeft:"auto",background:"#7c3aed22",border:"1px solid #7c3aed44",color:"#c4b5fd",padding:"2px 8px",borderRadius:5,fontSize:9}}>⚡ {servicioEsp.nombre}</span>}
                </div>

                {/* Autocomplete */}
                <div style={{position:"relative",marginBottom:8}}>
                  <div className="lbl">CLIENTE</div>
                  <input placeholder="Nombre o escribí directo…" value={clienteInput} onChange={e=>handleClienteInput(e.target.value)}/>
                  {sugs.length>0&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0b1220",border:"1px solid #22d3ee44",borderRadius:8,zIndex:20,overflow:"hidden",marginTop:2,maxHeight:180,overflowY:"auto"}}>
                      {sugs.map(c=>(
                        <div key={c.id} onClick={()=>aplicarCliente(c)}
                          style={{padding:"9px 12px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #1e2d40"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#22d3ee0a"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{color:"#22d3ee",fontWeight:700}}>{c.nombre}</div>
                          <div style={{color:"#475569",fontSize:10}}>{c.telefono} · {c.direccion?.split(",")[0]}</div>
                          {c.nota&&<div style={{color:"#fbbf24",fontSize:9}}>⚠ {c.nota}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lbl">DIRECCIÓN</div>
                <input placeholder="Av. Maipú 1234, Olivos" value={direccion} onChange={e=>setDireccion(e.target.value)} style={{marginBottom:8}}/>

                {!servicioEsp&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 60px",gap:8,marginBottom:8}}>
                    <div>
                      <div className="lbl">TAMAÑO</div>
                      <select value={tamano} onChange={e=>setTamano(e.target.value)}>
                        {tamanos.map(t=><option key={t.id} value={t.id}>{t.label} — {formatP(t.precio)}</option>)}
                      </select>
                    </div>
                    <div><div className="lbl">AUTOS</div>
                      <input type="number" min={1} max={5} value={cantAutos} onChange={e=>setCantAutos(Number(e.target.value))}/>
                    </div>
                  </div>
                )}

                {/* Precio manual */}
                <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"flex-end",marginBottom:8}}>
                  <div>
                    <div className="lbl">PRECIO MANUAL (opcional)</div>
                    <input type="number" placeholder={`Base: ${formatP(servicioEsp?.precio||(tamanoObj?.precio||0)*cantAutos)}`} value={precio} onChange={e=>setPrecio(e.target.value)}/>
                  </div>
                  <button onClick={()=>setModal({tipo:"servEsp"})} style={{background:"#7c3aed22",border:"1px solid #7c3aed55",color:"#c4b5fd",borderRadius:8,padding:"9px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                    ⚡ Especial
                  </button>
                </div>

                <div className="lbl">NOTAS OPERATIVAS</div>
                <textarea rows={2} placeholder="cliente detallista, insectos de ruta…" value={notas} onChange={e=>setNotas(e.target.value)} style={{marginBottom:8}}/>

                {slotsAUsar.length>1&&<div style={{padding:"6px 10px",background:"#fbbf2410",border:"1px solid #fbbf2433",borderRadius:7,fontSize:10,color:"#fde68a",marginBottom:8}}>
                  ⏱ Ocupa: {slotsAUsar.join(", ")}
                </div>}

                <Btn full color="#0e7490" disabled={!direccion} onClick={()=>setPaso(Math.max(paso,2))}>
                  Ver disponibilidad →
                </Btn>
              </div>

              {/* ALERTA CLIENTE ESPECIAL */}
              {paso>=3&&staffSelId&&horaSelec&&notas&&["detallista","complicado","insoportable","ojo","no usar revividor","cuidado","problematico"].some(k=>notas.toLowerCase().includes(k))&&(
                <div style={{padding:"12px 16px",background:"#fbbf2418",border:"2px solid #fbbf24",borderRadius:10,color:"#fbbf24",fontWeight:800,fontSize:13,animation:"pulse_y 1s infinite",textAlign:"center"}}>
                  ⚠️ ATENCIÓN: Cliente con requerimientos especiales.<br/>
                  <span style={{fontSize:11,fontWeight:400,color:"#fde68a"}}>Informar al lavador antes de confirmar.</span>
                </div>
              )}

              {/* PASO 3: Confirmar */}
              {paso>=3&&staffSelId&&horaSelec&&(
                <div className="card fade" style={{borderColor:"#34d39933"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
                    <span style={{background:"#34d399",color:"#080c18",borderRadius:5,padding:"1px 6px",fontSize:10}}>03</span> Confirmar
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:11,marginBottom:12}}>
                    {[
                      ["Lavador",  <span style={{color:staffSelObj?.color}}>{staffSelObj?.nombre}</span>],
                      ["Franja",   <span style={{color:"#22d3ee"}}>{horaSelec} → {franjaFin(horaSelec)} hs</span>],
                      ["Tamaño",   servicioEsp?.nombre||tamano],
                      esFZ&&["Zona",<span style={{color:"#c4b5fd"}}>⬡ FZ +{fzPct}%</span>],
                    ].filter(Boolean).map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:"#475569"}}>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div className="hr"/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#64748b"}}>TOTAL</span>
                      <strong style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#22d3ee"}}>{formatP(precioConFZ)}</strong>
                    </div>
                  </div>
                  {staffSelObj?.especial==="avisar_presencia"&&<div style={{padding:"7px 10px",background:"#f8717118",border:"1px solid #f8717144",borderRadius:7,color:"#fca5a5",fontSize:11,marginBottom:8}}>🔴 Hernán — Avisar en persona</div>}
                  {staffSelObj?.especial==="llamar_telefono"&&<div style={{padding:"7px 10px",background:"#fb923c18",border:"1px solid #fb923c44",borderRadius:7,color:"#fdba74",fontSize:11,marginBottom:8}}>📞 Gastón — Llamar por teléfono</div>}
                  <div style={{display:"flex",gap:7,marginBottom:8}}>
                    <button className={`chip ${metodo==="efectivo"?"on":""}`} onClick={()=>setMetodo("efectivo")}>💵 Efectivo</button>
                    <button className={`chip ${metodo==="mp"?"on":""}`} onClick={()=>setMetodo("mp")}>📱 Mercado Pago</button>
                  </div>
                  <Btn full color="#0e7490" disabled={guardando} onClick={confirmarTurno}>
                    {guardando?"⟳ Guardando…":"✓ Confirmar turno"}
                  </Btn>
                </div>
              )}
            </div>

            {/* Columna derecha: semáforo + IA */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="card" style={{borderColor:paso>=2?"#a78bfa33":"#1e2d40"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",display:"flex",alignItems:"center",gap:7}}>
                    <span style={{background:"#7c3aed",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:10}}>02</span>
                    Semáforo
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {[["#6ee7b7","#34d399","●libre"],["#fde68a","#fbbf24","◐lejos"],["#c4b5fd","#a78bfa","⬡FZ"],["#fca5a5","#ef4444","●turno"]].map(([tc,bc,l])=>(
                      <span key={l} style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:`${bc}18`,border:`1px solid ${bc}44`,color:tc}}>{l}</span>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  {["todos","moto","bici"].map(t=>(
                    <button key={t} className={`chip ${filtroT===t?"on":""}`} onClick={()=>setFiltroT(t)}>
                      {t==="todos"?"Todos":t==="moto"?"🏍 Motos":"🚲 Bicis"}
                    </button>
                  ))}
                  <input placeholder="Buscar…" value={filtroBus} onChange={e=>setFiltroBus(e.target.value)} style={{width:110,padding:"5px 9px",fontSize:10}}/>
                  <span style={{marginLeft:"auto",fontSize:10,color:"#334155"}}>{staffFiltrado.length} activos</span>
                </div>

                {paso<2
                  ? <div style={{textAlign:"center",padding:20,color:"#1e3a5f",fontSize:12}}>Completá la dirección y tocá "Ver disponibilidad"</div>
                  : staffFiltrado.length===0
                    ? <div style={{textAlign:"center",padding:20,color:"#475569",fontSize:12}}>Sin lavadores activos. Marcá la asistencia primero.</div>
                    : <div className="grilla-wrap">
                        <div className="grilla-inner" style={{display:"grid",gridTemplateColumns:`56px repeat(${staffFiltrado.length},minmax(90px,1fr))`,gap:3}}>
                          {/* Cabecera */}
                          <div style={{fontSize:9,color:"#1e3a5f",padding:"5px"}}>HORA</div>
                          {staffFiltrado.map(s=>(
                            <div key={s.id} style={{fontSize:11,textAlign:"center",padding:"5px 3px",color:s.color,borderBottom:`2px solid ${s.color}44`,lineHeight:1.5}}>
                              <div style={{fontWeight:700}}>{s.nombre}</div>
                              <div style={{fontSize:20}}>{(asistencia[s.id]?.transporte||s.transporte)==="moto"?"🏍":(asistencia[s.id]?.transporte||s.transporte)==="pie"?"🚶":"🚲"}</div>
                              {s.especial==="rapido"&&<div style={{fontSize:9}}>⚡</div>}
                            </div>
                          ))}
                          {/* Filas */}
                          {FRANJAS.map(hora=>(
                            <>
                              <div key={`h_${hora}`} style={{fontSize:11,padding:"8px 5px",display:"flex",flexDirection:"column",gap:1}}>
                                <span style={{color:esTarde(hora)?"#a78bfa":"#94a3b8",fontWeight:700}}>{hora}</span>
                                <span style={{fontSize:8,color:"#1e3a5f"}}>→{franjaFin(hora)}</span>
                              </div>
                              {staffFiltrado.map(s=>(
                                <CeldaTurno key={`${s.id}_${hora}`} s={s} hora={hora} turnos={turnos} asistencia={asistencia} dir={direccion} listaVacia={listaVacia}
                                  sel={staffSelId===s.id&&horaSelec===hora} onSel={selTurno} onDetalle={t=>setModal({tipo:"detalle",data:t})} tamanos={tamanos}/>
                              ))}
                            </>
                          ))}
                        </div>
                      </div>
                }
              </div>

              {/* IA Gemini */}
              <div style={{background:"linear-gradient(135deg,#0d1b3e,#0b1220)",border:"1px solid #1e3a5f",borderRadius:12,padding:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:iaPanel?10:0}}>
                  <div style={{fontSize:10,color:"#4f46e5",letterSpacing:".1em",display:"flex",alignItems:"center",gap:7}}>
                    ✦ IA LOGÍSTICO {geminiKey?"(Gemini)":"(sin key)"}
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:6,cursor:"pointer",fontSize:10,padding:"3px 8px",fontFamily:"inherit"}} onClick={()=>setIaPanel(!iaPanel)}>
                      {iaPanel?"Cerrar":"Abrir"}
                    </button>
                    {iaPanel&&<button style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,padding:"3px 8px",fontFamily:"inherit"}} onClick={consultarIA} disabled={iaLoad}>
                      {iaLoad?"⟳":"Consultar"}
                    </button>}
                  </div>
                </div>
                {iaPanel&&<div className="fade">
                  {iaLoad&&<div style={{color:"#6366f1",fontSize:11}}>● Analizando…</div>}
                  {iaResp&&<div style={{fontSize:11,color:"#a5b4fc",lineHeight:1.7,borderTop:"1px solid #1e3a5f",paddingTop:8}}>{iaResp}</div>}
                  {!iaResp&&!iaLoad&&<div style={{fontSize:11,color:"#1e3a5f"}}>{geminiKey?"Completá los datos y consultá.":"Configurá la Gemini API Key en ⚙ Config."}</div>}
                </div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ AGENDA ══ */}
        {vista==="agenda"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>AGENDA — {diaHoy}</div>
              <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 11px",fontFamily:"inherit"}} onClick={recargar}>⟳</button>
            </div>
            <div className="card grilla-wrap">
              {staffActivo.filter(s=>s.rol!=="encargado").length===0
                ? <div style={{textAlign:"center",padding:28,color:"#475569"}}>Sin lavadores activos. Marcá la asistencia.</div>
                : <div className="grilla-inner" style={{display:"grid",gridTemplateColumns:`56px repeat(${staffActivo.filter(s=>s.rol!=="encargado").length},minmax(100px,1fr))`,gap:3}}>
                    <div style={{fontSize:9,color:"#1e3a5f",padding:"5px"}}>HORA</div>
                    {staffActivo.filter(s=>s.rol!=="encargado").map(s=>(
                      <div key={s.id} style={{fontSize:11,textAlign:"center",padding:"5px 3px",color:s.color,borderBottom:`2px solid ${s.color}33`,lineHeight:1.5}}>
                        <div style={{fontWeight:700}}>{s.nombre}</div>
                        <div style={{fontSize:20}}>{(asistencia[s.id]?.transporte||s.transporte)==="moto"?"🏍":(asistencia[s.id]?.transporte||s.transporte)==="pie"?"🚶":"🚲"}</div>
                      </div>
                    ))}
                    {FRANJAS.map(hora=>(
                      <>
                        <div key={`ha_${hora}`} style={{fontSize:10,padding:"8px 5px",color:esTarde(hora)?"#a78bfa":"#64748b",fontWeight:700}}>{hora}</div>
                        {staffActivo.filter(s=>s.rol!=="encargado").map(s=>{
                          const t=turnos.find(x=>x.staffId===s.id&&x.horasOcupadas?.includes(hora));
                          const pp=t?.hora===hora;
                          return <div key={s.id} onClick={()=>t&&setModal({tipo:"detalle",data:t})}
                            style={{padding:"8px 6px",borderRadius:8,fontSize:10,cursor:t?"pointer":"default",lineHeight:1.4,minHeight:55,
                              background:t?`${s.color}18`:"#0b122088",
                              border:`1px solid ${t?s.color+"44":"#1e2d40"}`,
                              color:t?s.color:"#1e3a5f"}}>
                            {pp?<><div style={{fontWeight:700,fontSize:11}}>{t.clienteNombre||t.cliente||"turno"}</div>
                              <div style={{color:"#475569",fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.direccion?.split(",")[0]}</div>
                              <div style={{fontSize:9,marginTop:2}}>{t.pagado?<span style={{color:"#34d399"}}>✓</span>:<span style={{color:"#fde68a"}}>💰</span>}</div>
                            </>:t?<div style={{fontSize:9,color:"#334155",textAlign:"center",paddingTop:12}}>↓</div>:"·"}
                          </div>;
                        })}
                      </>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ══ ASISTENCIA ══ */}
        {vista==="asist"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>ASISTENCIA — {diaHoy}</div>
              <span style={{fontSize:11,color:"#475569"}}>{staffActivo.length} presentes</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {staff.filter(s=>s.rol!=="encargado").map(s=>{
                const a=asistencia[s.id]||{};
                const pres=a.presente===true;
                const trans=a.transporte||s.transporte;
                return <div key={s.id} className="card" style={{borderColor:`${s.color}33`,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {trans==="moto"?"🏍":"🚲"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:s.color,fontSize:13,marginBottom:4}}>{s.nombre}</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {["moto","bici","pie"].map(t=>(
                        <button key={t} onClick={async()=>{
                          const upd={...(asistencia[s.id]||{}),transporte:t};
                          setAsist(p=>({...p,[s.id]:upd}));
                          await fsSave("asistencia",diaHoy,{[s.id]:upd});
                        }} className={`chip ${trans===t?"on":""}`} style={{padding:"3px 8px",fontSize:9}}>
                          {t==="moto"?"🏍 Moto":t==="bici"?"🚲 Bici":"🚶 Pie"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className={`tog ${pres?"on_":"off"}`} onClick={async()=>{
                    const upd={...(asistencia[s.id]||{transporte:s.transporte}),presente:!pres};
                    setAsist(p=>({...p,[s.id]:upd}));
                    await fsSave("asistencia",diaHoy,{[s.id]:upd});
                  }}/>
                </div>;
              })}
            </div>
            {staff.filter(s=>s.rol==="encargado").length>0&&<>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",margin:"18px 0 10px"}}>ENCARGADOS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
                {staff.filter(s=>s.rol==="encargado").map(s=>(
                  <div key={s.id} className="card" style={{borderColor:`${s.color}33`,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👷</div>
                    <div><div style={{fontWeight:700,color:s.color,fontSize:12}}>{s.nombre}</div><div style={{fontSize:10,color:"#475569"}}>Encargado</div></div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ══ CLIENTES ══ */}
        {vista==="clientes"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>CLIENTES — {clientes.length}</div>
              <Btn sm color="#0e7490" onClick={()=>setModal({tipo:"ncliente"})}>+ Nuevo cliente</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
              {clientes.map(c=>(
                <div key={c.id} className="card" style={{cursor:"pointer",borderColor:"#22d3ee22"}} onClick={()=>setModal({tipo:"ecliente",data:c})}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"#22d3ee18",border:"2px solid #22d3ee44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:"#22d3ee",fontSize:13}}>{c.nombre}</div>
                      <div style={{fontSize:10,color:"#475569"}}>{c.telefono}</div>
                    </div>
                    <div style={{fontSize:10,color:"#334155"}}>✏️</div>
                  </div>
                  {c.direccion&&<div style={{fontSize:10,color:"#475569",marginBottom:4}}>📍 {c.direccion}</div>}
                  {c.nota&&<div style={{fontSize:10,color:"#fbbf24"}}>⚠ {c.nota}</div>}
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <a href={`tel:${c.telefono}`} onClick={e=>e.stopPropagation()} style={{textDecoration:"none"}}>
                      <button style={{background:"#34d39918",border:"1px solid #34d39944",color:"#6ee7b7",borderRadius:6,padding:"4px 9px",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:700}}>📞 Llamar</button>
                    </a>
                    <button onClick={e=>{e.stopPropagation();setClienteInput(c.nombre);setClienteSel(c);setDireccion(c.direccion||"");setCantAutos(c.autosHabituales||1);if(c.nota)setNotas(c.nota);setVista("turno");}} style={{background:"#22d3ee18",border:"1px solid #22d3ee44",color:"#22d3ee",borderRadius:6,padding:"4px 9px",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:700}}>
                      + Turno
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STAFF ══ */}
        {vista==="staff"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>STAFF — {staff.length}</div>
              <div style={{display:"flex",gap:8}}>
                <Btn sm ghost onClick={backup}>⬇ Backup</Btn>
                <Btn sm color="#0e7490" onClick={()=>setModal({tipo:"nstaff"})}>+ Agregar</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
              {staff.map(s=>(
                <div key={s.id} className="card" style={{borderColor:`${s.color}33`,cursor:"pointer"}} onClick={()=>setModal({tipo:"estaff",data:s})}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                      {s.rol==="encargado"?"👷":s.transporte==="moto"?"🏍":"🚲"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:s.color,fontSize:13}}>{s.nombre}</div>
                      <div style={{fontSize:10,color:"#475569"}}>{s.rol==="encargado"?"Encargado":`${s.transporte} · ${s.transporte==="moto"?25:15} cuas.`}</div>
                    </div>
                    <span style={{fontSize:11,color:"#334155"}}>✏️</span>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:s.whatsapp?"#34d39918":"#ef444418",border:`1px solid ${s.whatsapp?"#34d39944":"#ef444444"}`,color:s.whatsapp?"#6ee7b7":"#fca5a5"}}>{s.whatsapp?"✓ WA":"✗ Sin WA"}</span>
                    {s.especial==="rapido"&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#fbbf2418",border:"1px solid #fbbf2444",color:"#fde68a"}}>⚡</span>}
                    {asistencia[s.id]?.presente&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#34d39918",border:"1px solid #34d39933",color:"#6ee7b7"}}>● Hoy</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CIERRE ══ */}
        {vista==="cierre"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>CIERRE — {diaHoy}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["hoy","semana","mes"].map(r=>(
                  <button key={r} className={`chip ${rangoC===r?"on":""}`} onClick={()=>{setRangoC(r);cargarMultiFecha(r);}}>
                    {r==="hoy"?"📅 Hoy":r==="semana"?"📆 Semana":"🗓 Mes"}
                  </button>
                ))}
                <Btn sm ghost onClick={()=>cargarMultiFecha(rangoC)}>{loadMulti?"⟳":"⟳"}</Btn>
                <Btn sm ghost onClick={backup}>⬇</Btn>
              </div>
            </div>
            {/* Totales del rango */}
            {(()=>{
              const regs = rangoC==="hoy" ? registros : regMulti;
              const tTotal = regs.reduce((s,r)=>s+Number(r.precio||0),0);
              const tMP    = regs.filter(r=>r.metodo==="mp").reduce((s,r)=>s+Number(r.precio||0),0);
              const tEf    = regs.filter(r=>r.metodo==="efectivo").reduce((s,r)=>s+Number(r.precio||0),0);
              return <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                {[{l:`TOTAL ${rangoC.toUpperCase()}`,v:formatP(tTotal),c:"#22d3ee"},{l:"MERC. PAGO",v:formatP(tMP),c:"#a78bfa"},{l:"EFECTIVO",v:formatP(tEf),c:"#34d399"},{l:"SIN COBRAR",v:pendientes,c:"#f87171"}].map(s=>(
                  <div key={s.l} className="card" style={{textAlign:"center",borderColor:`${s.c}33`}}>
                    <div style={{fontSize:8,color:"#334155",marginBottom:5,letterSpacing:".12em"}}>{s.l}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>;
            })()}
            {/* LIQUIDACIÓN SEMANAL POR LAVADOR */}
            {rangoC!=="hoy"&&regMulti.length>0&&(()=>{
              const porLavador = {};
              regMulti.forEach(r=>{
                const n=r.staffNombre||"?";
                if(!porLavador[n]) porLavador[n]={nombre:n,total:0,efectivo:0,mp:0,turnos:0};
                porLavador[n].total    += Number(r.precio||0);
                porLavador[n].efectivo += r.metodo==="efectivo"?Number(r.precio||0):0;
                porLavador[n].mp       += r.metodo==="mp"?Number(r.precio||0):0;
                porLavador[n].turnos   += 1;
              });
              const lavs = Object.values(porLavador).sort((a,b)=>b.total-a.total);
              return <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#a78bfa",letterSpacing:".1em",marginBottom:8,fontWeight:700}}>
                  💼 LIQUIDACIÓN POR LAVADOR — {rangoC==="semana"?"SEMANA":"MES"}
                </div>
                <div className="card" style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{borderBottom:"1px solid #1e2d40"}}>
                      {["LAVADOR","TURNOS","COMISIONES TOTALES","EFECTIVO EN MANO","SALDO A TRANSFERIR"].map(h=>(
                        <th key={h} style={{padding:"7px 9px",textAlign:"left",color:"#334155",fontSize:9,letterSpacing:".08em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {lavs.map(l=>(
                        <tr key={l.nombre} style={{borderBottom:"1px solid #0b1220"}}>
                          <td style={{padding:"9px",fontWeight:700}}>{l.nombre}</td>
                          <td style={{padding:"9px",textAlign:"center",color:"#94a3b8"}}>{l.turnos}</td>
                          <td style={{padding:"9px",color:"#22d3ee",fontWeight:700}}>{formatP(l.total)}</td>
                          <td style={{padding:"9px",color:"#34d399"}}>{formatP(l.efectivo)}</td>
                          <td style={{padding:"9px",color:"#a78bfa",fontWeight:700}}>{formatP(l.total-l.efectivo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>;
            })()}
            {pendientes>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#f87171",letterSpacing:".1em",marginBottom:8}}>💰 PENDIENTES</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {turnos.filter(t=>!t.pagado&&t.estado==="confirmado").map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,background:"#0b1220",border:"1px solid #f8717133",borderRadius:8,padding:"9px 12px",flexWrap:"wrap",gap:8}}>
                      <span style={{color:"#22d3ee",fontSize:11,fontWeight:700}}>{t.hora}</span>
                      <span style={{color:"#94a3b8",fontSize:11,flex:1}}>{t.staffNombre} → {t.clienteNombre||t.cliente}</span>
                      <span style={{color:"#34d399",fontWeight:700,fontSize:11}}>{formatP(t.precio)}</span>
                      <Btn sm color="#d97706" onClick={()=>setModal({tipo:"detalle",data:t})}>Cobrar</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(()=>{const regs=rangoC==="hoy"?registros:regMulti; return regs.length===0
              ? <div className="card" style={{textAlign:"center",color:"#1e3a5f",padding:28}}>{loadMulti?"Cargando…":"Sin registros para este período."}</div>
              : <div className="card" style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{borderBottom:"1px solid #1e2d40"}}>
                      {["HORA","LAVADOR","CLIENTE","DIR.","AUTOS","TAMAÑO","PRECIO","PAGO","FZ"].map(h=>(
                        <th key={h} style={{padding:"6px 8px",textAlign:"left",color:"#334155",fontSize:9,letterSpacing:".08em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {registros.map((r,i)=>(
                        <tr key={r.id||i} style={{borderBottom:"1px solid #0b1220"}}>
                          <td style={{padding:"8px",color:"#22d3ee",whiteSpace:"nowrap"}}>{r.hora}</td>
                          <td style={{padding:"8px"}}>{r.staffNombre}</td>
                          <td style={{padding:"8px",color:"#64748b"}}>{r.clienteNombre||"—"}</td>
                          <td style={{padding:"8px",color:"#475569",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.direccion}</td>
                          <td style={{padding:"8px",textAlign:"center"}}>{r.autos}</td>
                          <td style={{padding:"8px",color:"#94a3b8"}}>{r.tamano}</td>
                          <td style={{padding:"8px",color:"#34d399",fontWeight:700}}>{formatP(r.precio)}</td>
                          <td style={{padding:"8px"}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:r.metodo==="mp"?"#a78bfa18":"#34d39918",border:`1px solid ${r.metodo==="mp"?"#a78bfa44":"#34d39944"}`,color:r.metodo==="mp"?"#c4b5fd":"#6ee7b7"}}>{r.metodo==="mp"?"MP":"Ef."}</span></td>
                          <td style={{padding:"8px"}}>{r.esFZ&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#a78bfa18",border:"1px solid #a78bfa44",color:"#c4b5fd"}}>⬡</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{borderTop:"2px solid #1e3a5f"}}>
                      <td colSpan={6} style={{padding:"9px 8px",color:"#475569",fontSize:10}}>TOTALES</td>
                      <td style={{padding:"9px 8px",color:"#22d3ee",fontFamily:"'Bebas Neue',sans-serif",fontSize:15}}>{formatP(totalDia)}</td>
                      <td colSpan={2} style={{padding:"9px 8px",color:"#475569",fontSize:10}}>MP:{formatP(totalMP)} Ef:{formatP(totalEfect)}</td>
                    </tr></tfoot>
                  </table>
                </div>
            }
          </div>
        )}

      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
function ModalConfig({tamanos,fzPct,geminiKey,onGuardar,onClose}) {
  const [tams,  setTams]  = useState(tamanos.map(t=>({...t})));
  const [fz,    setFz]    = useState(fzPct);
  const [gKey,  setGKey]  = useState(geminiKey||"");

  function updTam(id,field,val) {
    setTams(prev=>prev.map(t=>t.id===id?{...t,[field]:field==="precio"?Number(val):val}:t));
  }

  return <Modal titulo="⚙ Configuración" onClose={onClose} wide>
    <div style={{fontSize:11,color:"#475569",marginBottom:14}}>Editá precios base, recargo FZ y la API Key de Gemini.</div>

    <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:8,fontWeight:700}}>PRECIOS POR TAMAÑO DE AUTO</div>
    {tams.map(t=>(
      <div key={t.id} style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:8,marginBottom:8,alignItems:"center"}}>
        <input value={t.label} onChange={e=>updTam(t.id,"label",e.target.value)} placeholder="Nombre"/>
        <input type="number" value={t.precio} onChange={e=>updTam(t.id,"precio",e.target.value)} placeholder="Precio base"/>
      </div>
    ))}
    <div style={{marginBottom:14,marginTop:4}}>
      <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>RECARGO FZ (%)</div>
      <input type="number" value={fz} onChange={e=>setFz(Number(e.target.value))} style={{maxWidth:100}}/>
    </div>

    <div style={{height:1,background:"linear-gradient(90deg,transparent,#1e3a5f,transparent)",margin:"12px 0"}}/>

    <div style={{fontSize:10,color:"#334155",letterSpacing:".13em",marginBottom:5,fontWeight:700}}>GEMINI API KEY (IA gratis)</div>
    <input value={gKey} onChange={e=>setGKey(e.target.value)} placeholder="AIzaSy..." type="password" style={{marginBottom:6}}/>
    <div style={{fontSize:10,color:"#475569",marginBottom:14}}>
      Obtené la key gratis en <span style={{color:"#22d3ee"}}>aistudio.google.com</span> → Get API Key. El plan gratuito tiene límite generoso para este uso.
    </div>

    <div style={{display:"flex",gap:8}}>
      <Btn ghost onClick={onClose} style={{flex:1}}>Cancelar</Btn>
      <Btn full color="#0e7490" onClick={()=>onGuardar(tams,fz,gKey)} style={{flex:2}}>Guardar configuración</Btn>
    </div>
  </Modal>;
}
