import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN FIREBASE ORIGINAL PERSISTIDA [cite: 38]
// ═══════════════════════════════════════════════════════════════
const FB = { 
  apiKey: "AIzaSyDBZS7KR8YIq8UzAhnq9WaPTh8wGTZ-SMI", 
  authDomain: "sofia-lavados-99231.firebaseapp.com", 
  projectId: "sofia-lavados-99231", 
  storageBucket: "sofia-lavados-99231.firebasestorage.app", 
  messagingSenderId: "738758410354", 
  appId: "1:738758410354:web:0c07ee6f2906d8add402eb" 
};

const app = initializeApp(FB);
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
// CONSTANTES DE NEGOCIO [cite: 39, 40, 41, 42]
// ═══════════════════════════════════════════════════════════════
const BASE_LAT = -34.5128; 
const BASE_LNG = -58.4985;
const FRANJAS = ["09:00","10:30","12:00","13:30","15:00","16:30","18:00"]; 
const FRANJA_TARDE = 3; 

const COLORES = [ 
  "#22d3ee","#0ea5e9","#38bdf8","#7dd3fc","#06b6d4","#67e8f9",
  "#a5f3fc","#2dd4bf","#5eead4","#34d399","#6ee7b7","#a7f3d0",
  "#c084fc","#d8b4fe","#e879f9","#f0abfc","#a78bfa","#fbbf24",
  "#fb923c","#f87171","#4ade80","#facc15","#60a5fa","#f472b6" 
]; 

const STAFF_SEED = [ 
  {nombre:"Jhony", transporte:"moto", color:"#22d3ee", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Sergio", transporte:"moto", color:"#0ea5e9", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Alexander", transporte:"moto", color:"#38bdf8", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Maxi", transporte:"moto", color:"#7dd3fc", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Rene", transporte:"moto", color:"#06b6d4", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Brandon", transporte:"moto", color:"#67e8f9", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Jorge", transporte:"moto", color:"#a5f3fc", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Emiliano", transporte:"moto", color:"#2dd4bf", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Gaby", transporte:"moto", color:"#5eead4", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Javi", transporte:"moto", color:"#99f6e4", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Franco", transporte:"moto", color:"#34d399", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Fede", transporte:"moto", color:"#6ee7b7", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Elias", transporte:"moto", color:"#a7f3d0", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Alvaro", transporte:"bici", color:"#c084fc", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Nestor", transporte:"bici", color:"#d8b4fe", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Matias", transporte:"bici", color:"#e879f9", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Luis", transporte:"bici", color:"#f0abfc", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Bruno", transporte:"bici", color:"#a78bfa", whatsapp:true, rol:"lavador", especial:"", saldoPendiente:0}, 
  {nombre:"Nico Alto", transporte:"bici", color:"#fbbf24", whatsapp:true, rol:"lavador", especial:"rapido", saldoPendiente:0}, 
  {nombre:"Hernán", transporte:"bici", color:"#f87171", whatsapp:false, rol:"lavador", especial:"avisar_presencia", saldoPendiente:0}, 
  {nombre:"Gastón", transporte:"bici", color:"#fb923c", whatsapp:false, rol:"lavador", especial:"llamar_telefono", saldoPendiente:0}
];

const BARRIOS_INICIALES = { 
  "olivos":"OLI","martinez":"MAR","florida":"FLO","san isidro":"SIS", 
  "acassuso":"ACA","la lucila":"LAL","boulogne":"BOU","vicente lopez":"VLO", 
  "munro":"MUN","villa adelina":"VAD","beccar":"BEC"
}; 

let LISTA_BARRIOS = Object.keys(BARRIOS_INICIALES).map(k=>k.charAt(0).toUpperCase()+k.slice(1));

const MOTIVOS_OPERACION = [ 
  "Préstamo (lavador recibe)", 
  "Adelanto de sueldo (lavador recibe)", 
  "Regalo / Premio (lavador recibe)", 
  "Devolución de préstamo (lavador paga)", 
  "Aporte voluntario (lavador paga)", 
  "Otro"
];

// ═══════════════════════════════════════════════════════════════
// HELPERS CRONOLÓGICOS Y GEOGRÁFICOS
// ═══════════════════════════════════════════════════════════════
const hoy = () => { 
  const now = new Date(); 
  const utc = now.getTime() + now.getTimezoneOffset() * 60000; 
  const ar = new Date(utc - 3 * 60 * 60000);
  const y = ar.getFullYear(); 
  const m = String(ar.getMonth()+1).padStart(2,"0"); 
  const d = String(ar.getDate()).padStart(2,"0"); 
  return y + "-" + m + "-" + d; 
};

const fechaAR = (iso) => { 
  if(!iso) return ""; 
  const parts = iso.split("-"); 
  return parts[2] + "/" + parts[1] + "/" + parts[0]; 
};

const horaAR = () => { 
  const now = new Date(); 
  const utc = now.getTime() + now.getTimezoneOffset() * 60000; 
  const ar = new Date(utc - 3 * 60 * 60000); 
  return String(ar.getHours()).padStart(2,"0") + ":" + String(ar.getMinutes()).padStart(2,"0"); 
};

const franjasValidas = () => { 
  const ahora = new Date(); 
  const minutos = ahora.getHours() * 60 + ahora.getMinutes(); 
  return FRANJAS.filter(h => {
    const parts = h.split(":").map(Number);
    return (parts[0] * 60 + parts[1]) > minutos;
  });
};

const franjaFin = h => { 
  const parts = h.split(":").map(Number); 
  const t = parts[0] * 60 + parts[1] + 90; 
  return String(Math.floor(t/60)).padStart(2,"0") + ":" + String(t%60).padStart(2,"0"); 
};

const esTarde = h => FRANJAS.indexOf(h) >= FRANJA_TARDE;
const formatP = n => "$" + Number(n||0).toLocaleString("es-AR"); 
const sinAcentos = s => (s||"").toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));

function codigoBarrio(barrioNombre) { 
  if(!barrioNombre) return "GEN"; 
  const limpio = barrioNombre.replace(/[()\[\]]/g," ").replace(/\s+/g," ").trim(); 
  const b = limpio.toLowerCase().replace(/[áéíóúü]/g, m=>({á:"a",é:"e",í:"i",ó:"o",ú:"u",ü:"u"}[m]||m));
  for(const [k,v] of Object.entries(BARRIOS_INICIALES)) { if(b.includes(k)) return v; } 
  return b.replace(/[\s,]+/g,"").substring(0,3).toUpperCase(); 
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
  const R=6371; 
  const dLat=(lat2-lat1)*Math.PI/180; 
  const dLng=(lng2-lng1)*Math.PI/180; 
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2); 
  return R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); 
}

const kmToCuadras = km => km * 10;

function coordsSimuladas(dir) { 
  const h = (dir||"").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0); 
  return { lat:BASE_LAT+(((h&0xFF)-127)/10000), lng:BASE_LNG+((((h>>8)&0xFF)-127)/8000) }; 
}

function slotsOcupados(inicio, cant) { 
  const idx = FRANJAS.indexOf(inicio); 
  if (idx < 0) return [inicio]; 
  return Array.from({length: cant}, (_,i) => FRANJAS[idx+i]).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// CAPA DE FIRESTORE WRAPPERS [cite: 72, 73, 74, 75, 76]
// ═══════════════════════════════════════════════════════════════
const fsGet = async (col,id) => { try{const s=await getDoc(doc(db,col,id)); return s.exists()?{id:s.id,...s.data()}:null;}catch{return null;} };
const fsSave = async (col,id,data) => { try{await setDoc(doc(db,col,id),{...data,_ts:serverTimestamp()},{merge:true});}catch{} };
const fsAdd = async (col,data) => { try{const r=await addDoc(collection(db,col),{...data,_ts:serverTimestamp()}); return r.id;}catch{return null;} };
const fsDel = async (col,id) => { try{await deleteDoc(doc(db,col,id));}catch{} };
const fsList = async (col) => { try{const s=await getDocs(collection(db,col)); return s.docs.map(d=>({id:d.id,...d.data()}));}catch{return[];} };
const fsUpdate = async (col,id,data) => { try{await updateDoc(doc(db,col,id),data);}catch{} };

// ═══════════════════════════════════════════════════════════════
// COMPONENTES COMUNES DE LA INTERFAZ [cite: 77, 78, 79, 81]
// ═══════════════════════════════════════════════════════════════
function Toast({msg,tipo,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3500); return()=>clearTimeout(t);},[]);
  const c={ok:"#22d3ee",error:"#f87171",warn:"#fbbf24"}[tipo]||"#22d3ee";
  return <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:"#0b1220",border:"1px solid " + c + "55",color:c,padding:"11px 16px",borderRadius:10,fontSize:12,boxShadow:"0 4px 20px " + c + "22"}}>
    {tipo==="ok"?"✓":tipo==="error"?"✗":"⚠"} {msg}
  </div>;
}

function Modal({titulo,onClose,children,wide}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:14,padding:20,width:"100%",maxWidth:wide?580:440,maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{titulo}</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

// Reloj 24h Argentina instalado en todas las pestañas de forma ubicua [cite: 2]
function RelojAR() {
  const [hora, setHora] = useState("");
  useEffect(()=>{
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ar = new Date(utc - 3 * 60 * 60000);
      const d = String(ar.getDate()).padStart(2,"0");
      const m = String(ar.getMonth()+1).padStart(2,"0");
      const y = ar.getFullYear();
      const hh = String(ar.getHours()).padStart(2,"0");
      const mm = String(ar.getMinutes()).padStart(2,"0");
      setHora(d + "/" + m + "/" + y + " - " + hh + ":" + mm);
    };
    tick();
    const t = setInterval(tick,10000);
    return ()=>clearInterval(t);
  },[]);
  return <span style={{fontSize:11,color:"#22d3ee",fontFamily:"monospace",whiteSpace:"nowrap",fontWeight:"600"}}>{hora}</span>;
}

function Btn({children,onClick,color,danger,sm,full,ghost,disabled}) {
  const bg = danger ? "#f87171" : color || "#0ea5e9";
  return <button disabled={disabled} onClick={onClick} style={{
    width: full ? "100%" : "auto",
    padding: sm ? "5px 10px" : "9px 16px",
    background: ghost ? "transparent" : bg,
    border: ghost ? "1px solid " + bg : "none",
    color: ghost ? bg : "#ffffff",
    borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontSize: sm ? 11 : 12, fontWeight: 600,
    opacity: disabled ? 0.5 : 1
  }}>{children}</button>;
}

function Inp({label,value,onChange,placeholder,type="text",inputMode}) {
  return <div style={{marginBottom:10}}><div className="lbl">{label}</div>
    <input type={type} inputMode={inputMode} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>
  </div>;
}

function Sel({label,value,onChange,children}) {
  return <div style={{marginBottom:10}}><div className="lbl">{label}</div>
    <select value={value} onChange={e=>onChange(e.target.value)}>{children}</select>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MODALES OPERATIVOS DEL SISTEMA [cite: 83, 92, 96, 101, 104, 114, 123]
// ═══════════════════════════════════════════════════════════════
function ModalWA({turno,staff,onClose}) {
  const [copiado,setCopiado] = useState(false);
  const s = staff.find(x=>x.id===turno.staffId)||{};
  const fin = franjaFin(turno.hora);
  const notasLines = turno.notas?.trim() ? "\n⚠️ Instrucciones:\n" + turno.notas.split(",").map(n=>"• " + n.trim()).join("\n") : "";
  const telLine = turno.clienteTel ? "\n📞 Tel. cliente: " + turno.clienteTel : "";
  const deudLine = turno.clienteDeuda>0 ? "\n⚠️ ATENCIÓN: Cliente deudor de " + formatP(turno.clienteDeuda) + "." : "";
  const icono = (turno.staffTransporte||s.transporte)==="moto"?"🏍":"🚲";
  const msg = " Sofía Lavados\n\n📍 Dirección: " + turno.direccion + "\n🕐 Llegada: " + turno.hora + " a " + fin + " hs\n🚗 Autos: " + turno.cantAutos + " (" + (turno.tamano||"") + ")\n💰 Cobrar: " + formatP(turno.precio) + " (" + (turno.metodo==="mp"?"Mercado Pago":"Efectivo") + ")" + telLine + deudLine + notasLines + "\n\n" + icono + " Confirmá arribo.";
  
  async function copiar() { try { await navigator.clipboard.writeText(msg); } catch {} setCopiado(true); setTimeout(()=>setCopiado(false),2500); }
  return <Modal titulo="Enviar por WhatsApp" onClose={onClose}>
    <div style={{background:"#041a0f",border:"1px solid #16a34a33",borderRadius:10,padding:14,marginBottom:12}}>
      <pre style={{fontFamily:"inherit",fontSize:12,color:"#bbf7d0",whiteSpace:"pre-wrap",lineHeight:1.75}}>{msg}</pre>
    </div>
    <Btn full color="#25D366" onClick={copiar}>{copiado?"✓ Copiado":"📋 Copiar Mensaje"}</Btn>
  </Modal>;
}

function ModalDetalle({turno,staff,asistencia,onCancelar,onReasignar,onPagar,onRendir,onWA,onClose}) {
  const [modo,setModo] = useState("detalle");
  const [nStaff,setNS] = useState(turno.staffId||"");
  const [nHora, setNH] = useState(turno.hora||"");
  const staffActivos = staff.filter(s=>asistencia[s.id]?.presente&&s.rol!=="encargador");
  return <Modal titulo={modo==="detalle"?"Detalle del Turno":"Reasignar Horario"} onClose={onClose}>
    {modo === "detalle" && <>
      <div style={{display:"flex",flexDirection:"column",gap:7,fontSize:12,marginBottom:16}}>
        {[ ["Lavador", turno.staffNombre], ["Hora", turno.hora], ["Cliente", turno.clienteNombre||"—"], ["Dirección", turno.direccion], ["Precio", formatP(turno.precio)], ["Pago", turno.metodo==="mp"?"Mercado Pago":"Efectivo"], ["Estado", turno.estadoPago||"💰 Pendiente"] ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1e2d40",paddingBottom:5}}>
            <span style={{color:"#94a3b8"}}>{k}</span><span style={{color:"#e2e8f0",fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <Btn full color="#25D366" onClick={()=>onWA(turno)}>📲 Generar WA</Btn>
        {(!turno.estadoPago || turno.estadoPago === "💰 Pendiente" || turno.estadoPago === "🔴 Cliente debe") && onPagar && <Btn full color="#d97706" onClick={()=>onPagar(turno)}>💰 Cobrar</Btn>}
        {turno.estadoPago === "💵 Cobrado (sin rendir)" && onRendir && <Btn full color="#16a34a" onClick={()=>onRendir(turno)}>✅ Rendir Caja</Btn>}
        <Btn full color="#0e7490" onClick={()=>setModo("reasignar")}>🔄 Reasignar Lavador</Btn>
        <Btn full danger onClick={()=>onCancelar(turno)}>✕ Cancelar Turno</Btn>
      </div>
    </>}
    {modo === "reasignar" && <>
      <Sel label="NUEVO LAVADOR" value={nStaff} onChange={setNS}>{staffActivos.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</Sel>
      <Sel label="NUEVA FRANJA" value={nHora} onChange={setNH}>{FRANJAS.map(h=><option key={h} value={h}>{h}</option>)}</Sel>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <Btn ghost onClick={()=>setModo("detalle")}>Volver</Btn>
        <Btn full color="#0e7490" onClick={()=>onReasignar(turno,nStaff,nHora)}>Confirmar Cambio</Btn>
      </div>
    </>}
  </Modal>;
}

function ModalCobro({turno,onRegistrar,onClose}) {
  const [importeReal, setImporteReal] = useState(turno.precio||0);
  const [metodoCobro, setMetodoCobro] = useState(turno.metodo||"efectivo");
  const [esDeudaCliente, setEsDeudaCliente] = useState(false);
  const importeEsperado = turno.precio||0;

  return <Modal titulo={"Cobrar Turno: " + turno.clienteNombre} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:12}}>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#94a3b8"}}>Monto Estimado:</span><strong>{formatP(importeEsperado)}</strong></div>
      <Sel label="MÉTODO DE COBRO" value={metodoCobro} onChange={setMetodoCobro}>
        <option value="efectivo">💵 Efectivo</option>
        <option value="mp">🌐 Mercado Pago</option>
      </Sel>
      <div style={{margin:"6px 0",display:"flex",alignItems:"center",gap:8}}>
        <input type="checkbox" checked={esDeudaCliente} onChange={e=>{setEsDeudaCliente(e.target.checked); if(e.target.checked) setImporteReal(0); else setImporteReal(importeEsperado);}} style={{width:"auto"}}/>
        <span style={{color:"#fb7171",fontWeight:"600"}}>El cliente no pagó en el momento (Anotar como Deuda)</span>
      </div>
      {!esDeudaCliente && <Inp label="IMPORTE REAL RECIBIDO ($)" type="number" value={importeReal} onChange={v=>setImporteReal(Number(v))}/>}
      <div style={{display:"flex",gap:8,marginTop:6}}>
        <Btn ghost onClick={onClose}>Cancelar</Btn>
        <Btn full color="#16a34a" onClick={()=>onRegistrar(turno, Number(importeReal), metodoCobro, esDeudaCliente)}>Confirmar Cobro</Btn>
      </div>
    </div>
  </Modal>;
}

// ARREGLO EXCEDENTE Y PEQUEÑAS DIFERENCIAS TOLERADAS [cite: 6, 7]
function ModalRendicion({turno,onRegistrar,onClose}) {
  const [montoEntregado, setMontoEntregado] = useState(turno.montoPagado || turno.precio || 0);
  const [destinoExcedente, setDestinoExcedente] = useState("propina"); 
  const [perdonarDiferencia, setPerdonarDiferencia] = useState(false);
  
  const montoEsperado = turno.montoPagado || turno.precio || 0;
  const dif = montoEntregado - montoEsperado;
  const hayExcedente = dif > 0;
  const hayFaltante = dif < 0;

  const esDiferenciaPerdonable = hayFaltante && Math.abs(dif) <= 200;

  return <Modal titulo="Rendición de Caja en Base" onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:12}}>
      <div style={{padding:"8px 12px",background:"#1e2d4022",border:"1px solid #34d39944",borderRadius:8}}>
        <div><span style={{color:"#94a3b8"}}>Lavador:</span> <strong style={{color:"#e2e8f0"}}>{turno.staffNombre}</strong></div>
        <div style={{marginTop:4}}><span style={{color:"#94a3b8"}}>Cobrado al Cliente:</span> <strong style={{color:"#34d399"}}>{formatP(montoEsperado)}</strong></div>
      </div>
      
      <Inp label="MONTO TOTAL ENTREGADO POR EL LAVADOR ($)" type="number" value={montoEntregado} onChange={v=>setMontoEntregado(Number(v))}/>

      {/* Excedente de dinero: Pregunta si es Propina o cuenta del cliente */}
      {hayExcedente && (
        <div style={{padding:"10px",background:"#22d3ee10",border:"1px solid #22d3ee44",borderRadius:8}}>
          <div style={{color:"#22d3ee",fontWeight:"600",marginBottom:6}}>💰 Sobran {formatP(dif)}: ¿A dónde va este excedente?</div>
          <Sel label="DESTINO" value={destinoExcedente} onChange={setDestinoExcedente}>
            <option value="propina">🎁 Es Propina del Lavador (No entra a Caja)</option>
            <option value="cuenta_cliente">🏦 Va a favor del saldo de la cuenta del Cliente</option>
          </Sel>
        </div>
      )}

      {/* Perdonar pequeñas diferencias (ej. $200) al rendir */}
      {esDiferenciaPerdonable && (
        <div style={{padding:"10px",background:"#fbbf2410",border:"1px solid #fbbf2444",borderRadius:8,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{color:"#fde68a"}}>⚠ Hay una pequeña diferencia de {formatP(Math.abs(dif))}.</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <input type="checkbox" checked={perdonarDiferencia} onChange={e=>setPerdonarDiferencia(e.target.checked)} style={{width:"auto"}}/>
            <span>Perdonar diferencia chica (absorber pérdida de $200 o menos)</span>
          </div>
        </div>
      )}

      {hayFaltante && !esDiferenciaPerdonable && (
        <div style={{padding:"10px",background:"#f8717110",border:"1px solid #f8717144",borderRadius:8,color:"#fca5a5"}}>
          🔴 Faltan {formatP(Math.abs(dif))}. Este importe se le sumará como Deuda interna al saldo pendiente del lavador.
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn ghost onClick={onClose}>Cancelar</Btn>
        <Btn full color="#16a34a" onClick={()=>onRegistrar(turno, montoEntregado, destinoExcedente, perdonarDiferencia)}>✅ Confirmar Rendición</Btn>
      </div>
    </div>
  </Modal>;
}

function ModalOperacion({lavador,onRegistrar,onClose}) {
  const [monto, setMonto] = useState(0);
  const [motivo, setMotivo] = useState("Préstamo (lavador recibe)");
  return <Modal titulo={"Operación Interna: " + lavador.nombre} onClose={onClose}>
    <Sel label="CONCEPTO" value={motivo} onChange={setMotivo}>{MOTIVOS_OPERACION.map(m=><option key={m} value={m}>{m}</option>)}</Sel>
    <Inp label="MONTO ($)" type="number" value={monto} onChange={v=>setMonto(Number(v))}/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn full color="#fbbf24" onClick={()=>onRegistrar(lavador,monto,motivo)}>Registrar Movimiento</Btn>
    </div>
  </Modal>;
}

function ModalCliente({cliente,esNuevo,onGuardar,onClose}) {
  const [nombre, setNombre] = useState(cliente?.nombre||"");
  const [tel, setTel] = useState(cliente?.telefono||"");
  const [dir, setDir] = useState(cliente?.direccion||"");
  const [barrio, setBarrio] = useState(cliente?.barrio||"");
  const [autos, setAutos] = useState(cliente?.autosHabituales||1);
  const [nota, setNota] = useState(cliente?.nota||"");
  const [tipo, setTipo] = useState(cliente?.tipo||"💤 Ocasional");

  return <Modal titulo={esNuevo?"Nuevo Cliente":"Editar Cliente"} onClose={onClose}>
    <Inp label="NOMBRE Y APELLIDO" value={nombre} onChange={setNombre}/>
    <Inp label="TELÉFONO" value={tel} onChange={setTel}/>
    <Inp label="DIRECCIÓN" value={dir} onChange={setDir}/>
    <Sel label="BARRIO" value={barrio} onChange={setBarrio}>{LISTA_BARRIOS.map(b=><option key={b} value={b}>{b}</option>)}</Sel>
    <Inp label="AUTOS" type="number" value={autos} onChange={v=>setAutos(Number(v))}/>
    <Inp label="NOTAS ADICIONALES" value={nota} onChange={setNota}/>
    <Sel label="TIPO CLIENTE" value={tipo} onChange={setTipo}>
      <option value="💤 Ocasional">💤 Ocasional</option>
      <option value="⭐ Frecuente">⭐ Frecuente</option>
      <option value="🔥 Top">🔥 Top</option>
    </Sel>
    <div style={{display:"flex",gap:8,marginTop:14}}>
      <Btn ghost onClick={onClose}>Cancelar</Btn>
      <Btn full color="#0ea5e9" onClick={()=>onGuardar({
        ...cliente,
        nombre: capitalizar(nombre), telefono: tel, direccion: dir, barrio, autosHabituales: Number(autos), nota, tipo,
        deuda: cliente?.deuda || 0, codigo: cliente?.codigo || codigoBarrio(barrio) + "-" + Math.floor(100+Math.random()*900)
      })}>Guardar Cliente</Btn>
    </div>
  </Modal>;
}

function CeldaTurno({s,hora,turnos,asistencia,dir,listaVacia,sel,onSel,onDetalle}) {
  const turno = turnos.find(t=>t.staffId===s.id&&t.horasOcupadas?.includes(hora));
  const esPpal = turno?.hora===hora;
  const trans = asistencia[s.id]?.transporte||s.transporte;
  const radio = trans === "moto" ? 25 : 15;
  
  let geo = "libre";
  if(!turno && dir) {
    const turnosHoy = turnos.filter(t=>t.staffId===s.id).sort((a,b)=>FRANJAS.indexOf(a.hora)-FRANJAS.indexOf(b.hora));
    const ultimoTurno = turnosHoy[turnosHoy.length-1];
    let fromLat = BASE_LAT, fromLng = BASE_LNG;
    if(ultimoTurno?.coordsDestino) { fromLat=ultimoTurno.coordsDestino.lat; fromLng=ultimoTurno.coordsDestino.lng; }
    const dest = coordsSimuladas(dir);
    const cuadras = kmToCuadras(distKm(fromLat,fromLng,dest.lat,dest.lng));
    if(listaVacia && esTarde(hora)) geo="fz_ok";
    else if(cuadras<=radio) geo="verde";
    else if(cuadras<=radio*1.5) geo="amarillo";
    else geo="fz";
  }

  const estilos = {
    libre: {bg:"#0b122066",bd:"#1e2d40",txt:"#475569",lbl:"·"},
    verde: {bg:"#34d39913",bd:"#34d39955",txt:"#6ee7b7",lbl:"●"},
    amarillo: {bg:"#fbbf2413",bd:"#fbbf2455",txt:"#fde68a",lbl:"◐"},
    fz: {bg:"#a78bfa13",bd:"#a78bfa55",txt:"#c4b5fd",lbl:"⬡"},
    fz_ok: {bg:"#7c3aed18",bd:"#7c3aed88",txt:"#ddd6fe",lbl:"⬡ Ok"}
  }[geo];

  if(turno) {
    return <div onClick={()=>onDetalle(turno)} style={{padding:"7px 5px",borderRadius:7,fontSize:10,cursor:"pointer",background:!esPpal?"#ef444405":s.color+"18",border:"1px solid " + (!esPpal?"#ef444415":s.color+"55"),color:!esPpal?"#475569":s.color,lineHeight:1.4,minHeight:50}}>
      {esPpal ? <>
        <div style={{fontWeight:"700",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{turno.clienteNombre}</div>
        <div style={{color:"#94a3b8",fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{turno.direccion}</div>
        <div style={{fontSize:9,marginTop:2}}>{turno.estadoPago}</div>
      </> : <div style={{textAlign:"center",paddingTop:12,color:"#1e2d40"}}>↓</div>}
    </div>;
  }

  return <div onClick={()=>geo!=="libre"&&onSel(s.id,hora,geo)} style={{padding:"9px 5px",borderRadius:7,textAlign:"center",fontSize:11,background:estilos.bg,border:"1px solid " + (sel?s.color:estilos.bd),color:sel?s.color:estilos.txt,cursor:geo==="libre"?"default":"pointer",minHeight:50,display:"flex",alignItems:"center",justifyContent:"center"}}>
    {estilos.lbl}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// CLASE / EXPERTO PRINCIPAL EXPORTADO
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [fbLoad, setFbLoad] = useState(false);
  const [modoPrueba, setModoPrueba] = useState(false);
  const [clicksLogo, setClicksLogo] = useState(0);
  const [turnosPrueba, setTurnosPrueba] = useState([]);
  
  // Ciclo del día y lluvia controlado por estado [cite: 3, 4]
  const [estadoDia, setEstadoDia] = useState("cerrado"); // "cerrado" | "abierto" | "lluvia_espera" | "finalizado"
  
  const [staff, setStaff] = useState([]);
  const [asistencia, setAsist] = useState({});
  const [clientes, setClientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [prestamos, setPrestamos] = useState({});
  const [vista, setVista] = useState("turno");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  // Formulario Reactivo de Carga
  const [clienteInput, setClienteInput] = useState("");
  const [sugs, setSugs] = useState([]);
  const [clienteSel, setClienteSel] = useState(null);
  const [direccion, setDireccion] = useState("");
  const [cantAutos, setCantAutos] = useState(1);
  const [tamano, setTamano] = useState("mediano");
  const [precio, setPrecio] = useState("");
  const [notas, setNotas] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [staffSelId, setStaffSelId] = useState(null);
  const [horaSelec, setHoraSelec] = useState("");
  const [geoSelec, setGeoSelec] = useState("");

  const showToast = (msg,tipo="ok") => setToast({msg,tipo});
  const diaHoy = hoy();

  useEffect(() => {
    async function load() {
      setFbLoad(true);
      try {
        let s = await fsList("staff");
        if(!s.length) {
          for(const m of STAFF_SEED) { const id = await fsAdd("staff",m); s.push({id,...m}); }
        }
        setStaff(s);

        const asDoc = await fsGet("asistencia", diaHoy);
        if(asDoc && asDoc.fecha === diaHoy) {
          const {id, _ts, fecha, ...slots} = asDoc;
          setAsist(slots);
        }

        const configDoc = await fsGet("config", "ciclo_" + diaHoy);
        if (configDoc) setEstadoDia(configDoc.estado || "cerrado");

        let cl = await fsList("clientes");
        setClientes(cl);

        let prest = await fsGet("prestamos", "global");
        if(prest) setPrestamos(prest.valores || {});

        let r = await fsList("cierre_" + diaHoy);
        setRegistros(r);
      } catch {
        showToast("Error de sincronización con base de datos", "error");
      }
      setFbLoad(false);
    }
    load();
  }, [diaHoy]);

  useEffect(() => {
    if (modoPrueba) {
      setTurnos(turnosPrueba);
      return;
    }
    const u = onSnapshot(collection(db, "turnos_" + diaHoy), snap => {
      const reales = snap.docs.map(d => ({id:d.id, ...d.data()}));
      setTurnos(reales);
    });
    return () => u();
  }, [diaHoy, modoPrueba, turnosPrueba]);

  const staffSelObj = staff.find(s=>s.id===staffSelId);
  const slotsAUsar = horaSelec ? slotsOcupados(horaSelec, cantAutos) : [];
  const listaVacia = !turnos.some(t=>esTarde(t.hora));

  const totalCajaMP = registros.filter(r=>r.metodo==="mp" && r.estadoPago!=="🔴 Cliente debe").reduce((s,r)=>s+Number(r.precio||0),0);
  const totalCajaEfectivo = registros.filter(r=>r.metodo==="efectivo" && r.estadoPago!=="🔴 Cliente debe" && r.motivo!=="Propina interna").reduce((s,r)=>s+Number(r.precio||0),0);
  const totalCajaGlobal = totalCajaMP + totalCajaEfectivo;

  function handleClienteInput(val) {
    setClienteInput(val);
    if(val.length >= 2) {
      const v = sinAcentos(val);
      setSugs(clientes.filter(c => 
        sinAcentos(c.nombre).includes(v) || sinAcentos(c.direccion||"").includes(v)
      ));
    } else setSugs([]);
  }

  function aplicarCliente(c) {
    setClienteInput(c.nombre); setClienteSel(c); setDireccion(c.direccion||""); setCantAutos(c.autosHabituales||1);
    if(c.nota) setNotas(c.nota); setSugs([]);
    if(c.deuda > 0) showToast("⚠️ Cliente arrastra saldo deudor: " + formatP(c.deuda),"warn");
  }

  function selTurno(sId,hora,geo) { setStaffSelId(sId); setHoraSelec(hora); setGeoSelec(geo); }

  function resetForm() {
    setClienteInput(""); setClienteSel(null); setDireccion(""); setCantAutos(1); setTamano("mediano");
    setPrecio(""); setNotas(""); setStaffSelId(null); setHoraSelec(""); setGeoSelec(""); setSugs([]);
  }

  // Ciclo unificado del día (permite reabrir si se cerró por error) [cite: 3, 4]
  async function cambiarEstadoDia(nuevoEstado) {
    setEstadoDia(nuevoEstado);
    await fsSave("config", "ciclo_" + diaHoy, { estado: nuevoEstado });
    if(nuevoEstado === "abierto") {
      setAsist({});
      await fsSave("asistencia", diaHoy, { fecha: diaHoy });
      showToast("Operación del día iniciada ✓");
    } else {
      showToast("Ciclo unificado cambiado a: " + nuevoEstado);
    }
  }

  async function confirmarTurno() {
    if(!staffSelId || !horaSelec) return;
    const basePrecio = precio ? Number(precio) : (tamano === "chico" ? 25000 : tamano === "mediano" ? 28000 : 32000);
    const precioFinal = basePrecio * cantAutos;
    
    const turnoData = {
      staffId: staffSelId, staffNombre: staffSelObj?.nombre, hora: horaSelec, horasOcupadas: slotsAUsar,
      clienteNombre: clienteSel?.nombre || clienteInput, clienteTel: clienteSel?.telefono || "",
      clienteDeuda: clienteSel?.deuda || 0, direccion, cantAutos, tamano, precio: precioFinal,
      metodo, notas, estado: "confirmado", estadoPago: "💰 Pendiente", fecha: diaHoy
    };

    if(modoPrueba) {
      const id = "prueba_" + Date.now();
      setTurnosPrueba(prev => [...prev, {id, ...turnoData}]);
      showToast("Turno cargado localmente (Modo Prueba)","warn");
    } else {
      const id = await fsAdd("turnos_" + diaHoy, turnoData);
      showToast("Turno agendado ✓");
      setModal({tipo:"wa", data:{id, ...turnoData}});
    }
    resetForm();
  }

  // Columna TS muestra la hora exacta del cobro (HH:mm) [cite: 7]
  async function procesarCobro(turno, importeReal, metodoCobro, esDeuda) {
    const tsHoraArgentina = horaAR(); 
    const estadoPago = esDeuda ? "🔴 Cliente debe" : "💵 Cobrado (sin rendir)";
    const updTurno = { estadoPago, montoPagado: importeReal, metodoCobro, horaCobroExacta: tsHoraArgentina };
    
    if (modoPrueba) {
      setTurnosPrueba(prev => prev.map(t => t.id === turno.id ? {...t, ...updTurno} : t));
    } else {
      await fsUpdate("turnos_" + diaHoy, turno.id, updTurno);
      
      if (esDeuda && clienteSel?.id) {
        const nuevaDeuda = (clienteSel.deuda || 0) + turno.precio;
        await fsUpdate("clientes", clienteSel.id, { deuda: nuevaDeuda });
        setClientes(prev => prev.map(c => c.id === clienteSel.id ? {...c, deuda: nuevaDeuda} : c));
      }

      const regCierre = {
        turnoId: turno.id, hora: turno.hora, ts: tsHoraArgentina, staffNombre: turno.staffNombre,
        clienteNombre: turno.clienteNombre, autos: turno.cantAutos, precio: importeReal,
        precioEsperado: turno.precio, metodo: metodoCobro, estadoPago: estadoPago, motivo: esDeuda ? "Deuda Cliente" : "Cobro normal"
      };
      await fsAdd("cierre_" + diaHoy, regCierre);
      setRegistros(prev => [...prev, regCierre]);
    }
    showToast("Cobro registrado con éxito ✓");
    setModal(null);
  }

  async function procesarRendicion(turno, montoEntregado, destinoExcedente, perdonarDiferencia) {
    const montoEsperado = turno.montoPagado || turno.precio || 0;
    const difCaja = montoEntregado - montoEsperado;
    const tsActual = horaAR();

    if (modoPrueba) {
      setTurnosPrueba(prev => prev.map(t => t.id === turno.id ? {...t, estadoPago: "✅ Rendido"} : t));
      showToast("Rendición simulada con éxito", "warn");
      setModal(null);
      return;
    }

    await fsUpdate("turnos_" + diaHoy, turno.id, { estadoPago: "✅ Rendido", fechaRendicion: diaHoy });

    const todosRegs = await fsList("cierre_" + diaHoy);
    const regExistente = todosRegs.find(r => r.turnoId === turno.id);
    if(regExistente?.id) {
      await fsUpdate("cierre_" + diaHoy, regExistente.id, { estadoPago: "✅ Rendido" });
    }

    if (difCaja > 0) {
      if (destinoExcedente === "propina") {
        await fsAdd("cierre_" + diaHoy, {
          hora: turno.hora, ts: tsActual, staffNombre: turno.staffNombre, clienteNombre: turno.clienteNombre,
          precio: -difCaja, metodo: "efectivo", estadoPago: "🎁 Propina", motivo: "Propina interna", autos: 0
        });
      } else if (destinoExcedente === "cuenta_cliente" && clienteSel?.id) {
        const nuevaDeuda = Math.max(0, (clienteSel.deuda || 0) - difCaja);
        await fsUpdate("clientes", clienteSel.id, { deuda: nuevaDeuda });
        setClientes(prev => prev.map(c => c.id === clienteSel.id ? {...c, deuda: nuevaDeuda} : c));
      }
    }

    if (difCaja < 0) {
      if (perdonarDiferencia) {
        await fsAdd("cierre_" + diaHoy, {
          hora: turno.hora, ts: tsActual, staffNombre: turno.staffNombre, clienteNombre: "Sistema (Pérdida)",
          precio: difCaja, metodo: "efectivo", estadoPago: "⚠ Tolerancia", motivo: "Diferencia chica perdonada", autos: 0
        });
      } else {
        const saldoAnterior = prestamos[turno.staffId] || 0;
        const nuevoSaldo = saldoAnterior + Math.abs(difCaja);
        const updPrestamos = { ...prestamos, [turno.staffId]: nuevoSaldo };
        setPrestamos(updPrestamos);
        await fsSave("prestamos", "global", { valores: updPrestamos });
        
        await fsAdd("cierre_" + diaHoy, {
          hora: turno.hora, ts: tsActual, staffNombre: turno.staffNombre, clienteNombre: "Deuda interna",
          precio: 0, metodo: "efectivo", estadoPago: "🔴 Lavador debe", motivo: "Faltante rendición turno: " + formatP(Math.abs(difCaja)), autos: 0
        });
      }
    }

    const nuevosRegs = await fsList("cierre_" + diaHoy);
    setRegistros(nuevosRegs);
    setTurnos(prev => prev.map(t => t.id === turno.id ? {...t, estadoPago: "✅ Rendido"} : t));
    setModal(null);
    showToast("Rendición impactada ✓");
  }

  async function procesarOperacionLavador(lavador, monto, motivo) {
    if(monto <= 0) return;
    const esRecibe = motivo.includes("recibe");
    const saldoActual = prestamos[lavador.id] || 0;
    const nuevoSaldo = esRecibe ? saldoActual + monto : Math.max(0, saldoActual - monto);

    const upd = { ...prestamos, [lavador.id]: nuevoSaldo };
    setPrestamos(upd);
    await fsSave("prestamos", "global", { valores: upd });

    const tsArgentina = horaAR();
    const reg = {
      hora: "Interno", ts: tsArgentina, staffNombre: lavador.nombre, clienteNombre: "—", autos: 0,
      precio: esRecibe ? -monto : monto, precioEsperado: 0, metodo: "efectivo",
      estadoPago: esRecibe ? "⚠️ Prestamo" : "✅ Devolución", motivo: motivo
    };
    await fsAdd("cierre_" + diaHoy, reg);
    setRegistros(prev => [...prev, reg]);
    showToast("Operación de personal registrada ✓");
    setModal(null);
  }

  // Condonaciones y punitorios unificados en lote dentro de la pestaña Cierre [cite: 5]
  async function manejarCondonarLote(cliente) {
    if(!window.confirm("¿Confirmás perdonar la deuda de " + formatP(cliente.deuda) + " a " + cliente.nombre + "?")) return;
    await fsUpdate("clientes", cliente.id, { deuda: 0 });
    
    const tsArgentina = horaAR();
    await fsAdd("cierre_" + diaHoy, {
      hora: "Lote", ts: tsArgentina, staffNombre: "Administración", clienteNombre: cliente.nombre, autos: 0,
      precio: 0, metodo: "efectivo", estadoPago: "✓ Condonado", motivo: "Se condonó deuda de " + formatP(cliente.deuda)
    });

    setClientes(prev => prev.map(c => c.id === cliente.id ? {...c, deuda: 0} : c));
    const nuevosRegs = await fsList("cierre_" + diaHoy);
    setRegistros(nuevosRegs);
    showToast("Deuda condonada con éxito");
  }

  async function manejarPunitorioLote(cliente) {
    const montoStr = prompt("Ingresá el punitorio/recargo a sumarle a " + cliente.nombre + ":");
    const monto = Number(montoStr);
    if(!monto || monto <= 0) return;

    const nuevaDeuda = (cliente.deuda || 0) + monto;
    await fsUpdate("clientes", cliente.id, { deuda: nuevaDeuda });

    const tsArgentina = horaAR();
    await fsAdd("cierre_" + diaHoy, {
      hora: "Lote", ts: tsArgentina, staffNombre: "Administración", clienteNombre: cliente.nombre, autos: 0,
      precio: 0, metodo: "efectivo", estadoPago: "⚠️ Punitorio", motivo: "Recargo punitorio en lote: +" + formatP(monto)
    });

    setClientes(prev => prev.map(c => c.id === cliente.id ? {...c, deuda: nuevaDeuda} : c));
    const nuevosRegs = await fsList("cierre_" + diaHoy);
    setRegistros(nuevosRegs);
    showToast("Punitorio cargado ✓");
  }

  async function cancelarTurno(turno) {
    if(modoPrueba) {
      setTurnosPrueba(prev => prev.filter(t => t.id !== turno.id));
    } else {
      await fsDel("turnos_" + diaHoy, turno.id);
    }
    setModal(null);
    showToast("Turno cancelado de forma correcta");
  }

  function salirModoPrueba() {
    setModoPrueba(false);
    setTurnosPrueba([]);
    window.location.reload(); 
  }

  return (
    <div className="ff" style={{background:"#080c18", minHeight:"100vh", color:"#e2e8f0"}}>
      
      {/* HEADER DE LA APLICACIÓN CON RELOJ INTEGRADO */}
      <header style={{background:"#0b1220", borderBottom:"1px solid #1e2d40", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <h1 onClick={()=>{
            const c = clicksLogo + 1; setClicksLogo(c);
            if(c===5){
              const p = prompt("Clave desarrollador:");
              if(p==="sofia2024"){setModoPrueba(true); setTurnosPrueba([]); setTurnos([]); showToast("🔧 MODO PRUEBA LOCAL ACTIVADO","warn");}
              setClicksLogo(0);
            }
          }} style={{fontSize:16, fontWeight:"800", letterSpacing:"1px", color:"#ffffff", cursor:"pointer", userSelect:"none"}}>
            SOFÍA LAVADOS {modoPrueba && <span style={{color:"#fbbf24", fontSize:11}}> [MODO PRUEBA]</span>}
          </h1>
          <RelojAR /> 
        </div>

        <nav style={{display:"flex", gap:6}}>
          <button className={"nt " + (vista==="turno"?"on":"")} onClick={()=>setVista("turno")}>📋 Turnos</button>
          <button className={"nt " + (vista==="cierre"?"on":"")} onClick={()=>setVista("cierre")}>💰 Cierre Diario</button>
          <button className={"nt " + (vista==="clientes"?"on":"")} onClick={()=>setVista("clientes")}>👥 Clientes</button>
        </nav>
      </header>

      <main style={{padding:20, maxWidth:1200, margin:"0 auto"}}>
        
        {/* Cartel Modo Prueba (Arreglado: Visible de forma fija independientemente del ciclo del día) [cite: 8] */}
        {modoPrueba && (
          <div style={{background:"#fbbf2415", border:"1px solid #fbbf2454", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span style={{fontSize:12, color:"#fde68a"}}>✨ Corriendo en **Modo Prueba de Software**. Ningún dato modificará Firestore de manera permanente.</span>
            <Btn color="#fbbf24" sm onClick={salirModoPrueba}>Salir del Modo Prueba</Btn>
          </div>
        )}

        {/* 📋 SECCIÓN: PLANILLA DE TURNOS */}
        {vista === "turno" && (
          <>
            <div className="card" style={{marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span className="lbl" style={{margin:0}}>ESTADO DEL DÍA:</span>
                <span style={{
                  fontSize:11, fontWeight:700, padding:"4px 8px", borderRadius:6,
                  background: estadoDia==="abierto"?"#16a34a22":estadoDia==="lluvia_espera"?"#fbbf2422":"#ef444422",
                  color: estadoDia==="abierto"?"#4ade80":estadoDia==="lluvia_espera"?"#facc15":"#f87171"
                }}>
                  {estadoDia==="abierto"?"🟢 Abierto Comercial":estadoDia==="lluvia_espera"?"🌧 Espera por Lluvia":"🔴 Día Cerrado"}
                </span>
              </div>

              <div style={{display:"flex", gap:8}}>
                {(estadoDia === "cerrado" || estadoDia === "finalizado") && (
                  <Btn color="#16a34a" onClick={()=>cambiarEstadoDia("abierto")}>🟢 Abrir / Reabrir Día</Btn>
                )}
                {estadoDia === "abierto" && (
                  <>
                    <Btn color="#fbbf24" onClick={()=>cambiarEstadoDia("lluvia_espera")}>🌧 Día Lluvia (En Espera)</Btn>
                    <Btn danger onClick={()=>cambiarEstadoDia("finalizado")}>🔴 Finalizar Turnos</Btn>
                  </>
                )}
                {estadoDia === "lluvia_espera" && (
                  <>
                    <Btn color="#16a34a" onClick={()=>cambiarEstadoDia("abierto")}>☀️ Volver a Abrir Carga</Btn>
                    <Btn color="#7c3aed" onClick={()=>showToast("Emergencia activada: Carga de turnos liberada temporalmente para lluvia.")}>⚡ Emergencia</Btn>
                  </>
                )}
              </div>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"320px 1fr", gap:16}} className="layout-turno">
              <div className="card" style={{opacity: (estadoDia==="finalizado" || estadoDia==="cerrado") ? 0.4 : 1}}>
                <h3 style={{fontSize:13, marginBottom:12, color:"#ffffff"}}>Agendar Servicio Nuevo</h3>
                <Inp label="BUSCAR CLIENTE" value={clienteInput} onChange={handleClienteInput} placeholder="Ej: Micaela..."/>
                
                {sugs.length > 0 && (
                  <div style={{background:"#0b1220", border:"1px solid #1e3a5f", borderRadius:8, marginTop:-6, marginBottom:10, maxHeight:120, overflowY:"auto"}}>
                    {sugs.map(c=><div key={c.id} onClick={()=>aplicarCliente(c)} style={{padding:"6px 10px", fontSize:11, cursor:"pointer", borderBottom:"1px solid #1e2d40"}}>{c.nombre} ({c.direccion})</div>)}
                  </div>
                )}

                <Inp label="DIRECCIÓN DE LAVADO" value={direccion} onChange={setDireccion}/>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                  <Inp label="CANT. AUTOS" type="number" value={cantAutos} onChange={v=>setCantAutos(Number(v))}/>
                  <Sel label="TAMAÑO BASE" value={tamano} onChange={setTamano}>
                    <option value="chico">Chico ($25.000)</option>
                    <option value="mediano">Mediano ($28.000)</option>
                    <option value="camioneta">Camioneta ($32.000)</option>
                  </Sel>
                </div>
                <Inp label="PRECIO FORZADO (Opcional)" type="number" value={precio} onChange={setPrecio}/>
                <Sel label="MÉTODO ESTIMADO PAGO" value={metodo} onChange={setMetodo}>
                  <option value="efectivo">Efectivo</option>
                  <option value="mp">Mercado Pago</option>
                </Sel>
                <Inp label="NOTAS ADICIONALES" value={notas} onChange={setNotas}/>

                <div style={{background:"#1e2d4044", padding:10, borderRadius:8, fontSize:11, marginBottom:10, border:"1px solid #1e2d40"}}>
                  <div>📍 Lavador: <strong style={{color:"#22d3ee"}}>{staffSelObj?.nombre || "Hacé click en un casillero libre →"}</strong></div>
                  {horaSelec && <div style={{marginTop:3}}>⏰ Horario: <strong>{horaSelec} hs</strong> ({slotsAUsar.join(", ")})</div>}
                </div>

                <Btn full color="#22d3ee" disabled={!staffSelId || !horaSelec || !clienteInput || (estadoDia==="finalizado"||estadoDia==="cerrado")} onClick={confirmarTurno}>💾 Guardar Turno</Btn>
              </div>

              <div className="card grilla-wrap">
                <div className="grilla-inner">
                  <div style={{display:"grid", gridTemplateColumns:"110px repeat(" + FRANJAS.length + ", 1fr)", gap:6, textAlign:"center", marginBottom:8}}>
                    <div style={{fontSize:11, fontWeight:"bold", color:"#475569", textAlign:"left"}}>Personal Staff</div>
                    {FRANJAS.map(h=><div key={h} style={{fontSize:11, fontWeight:"700", color:"#94a3b8"}}>{h}</div>)}
                  </div>

                  {staff.filter(s=>s.rol!=="encargado").map(s=(
                    <div key={s.id} style={{display:"grid", gridTemplateColumns:"110px repeat(" + FRANJAS.length + ", 1fr)", gap:6, alignItems:"center", marginBottom:6, opacity:asistencia[s.id]?.presente?1:0.3}}>
                      <div style={{fontSize:11, fontWeight:"600", display:"flex", alignItems:"center", gap:4}}>
                        <input type="checkbox" checked={!!asistencia[s.id]?.presente} onChange={async(e)=>{
                          const val = e.target.checked;
                          const updatedAsist = { ...asistencia, [s.id]: { presente: val, transporte: s.transporte } };
                          setAsist(updatedAsist);
                          if (!modoPrueba) await fsSave("asistencia", diaHoy, updatedAsist);
                        }}/>
                        <span style={{color:s.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.nombre}</span>
                      </div>

                      {FRANJAS.map(h=>(
                        <CeldaTurno key={h} s={s} hora={h} turnos={turnos} asistencia={asistencia} dir={direccion} listaVacia={listaVacia} sel={staffSelId===s.id && horaSelec===h} onSel={selTurno} onDetalle={(t)=>setModal({tipo:"detalle", data:t})}/>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 💰 SECCIÓN: CIERRE DIARIO (TABLA COMPACTA EN LOTE VISIBLE) */}
        {vista === "cierre" && (
          <div style={{display:"flex", flexDirection:"column", gap:16}}>
            
            {/* Tabla compacta de deudores directamente visible en Cierre [cite: 5] */}
            <div className="card" style={{border:"1px solid #fbbf2444"}}>
              <h3 style={{fontSize:13, color:"#fde68a", marginBottom:10}}>⚖️ Acciones Comerciales Masivas (Clientes con Deuda)</h3>
              {clientes.filter(c=>c.deuda>0).length === 0 ? (
                <div style={{fontSize:11, color:"#475569"}}>No se registran clientes con deudas en el sistema.</div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%", fontSize:11, textAlign:"left", borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{color:"#94a3b8", borderBottom:"1px solid #1e2d40"}}>
                        <th style={{padding:"6px"}}>Ficha</th><th style={{padding:"6px"}}>Cliente</th>
                        <th style={{padding:"6px"}}>Dirección</th><th style={{padding:"6px"}}>Monto Deuda</th>
                        <th style={{padding:"6px", textAlign:"right"}}>Acción Operativa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.filter(c=>c.deuda>0).map(c=>(
                        <tr key={c.id} style={{borderBottom:"1px solid #1e2d4022"}}>
                          <td style={{padding:"6px", color:"#22d3ee"}}>{c.codigo}</td>
                          <td style={{padding:"6px", fontWeight:"600"}}>{c.nombre}</td>
                          <td style={{padding:"6px", color:"#94a3b8"}}>{c.direccion}</td>
                          <td style={{padding:"6px", color:"#f87171", fontWeight:"700"}}>{formatP(c.deuda)}</td>
                          <td style={{padding:"6px", textAlign:"right", display:"flex", gap:6, justifyContent:"flex-end"}}>
                            <button className="chip" style={{borderColor:"#16a34a44", color:"#6ee7b7", background:"#16a34a10"}} onClick={()=>manejarCondonarLote(c)}>✓ Condonar</button>
                            <button className="chip" style={{borderColor:"#f8717144", color:"#fca5a5", background:"#f8717110"}} onClick={()=>manejarPunitorioLote(c)}>+ Punitorio</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Planilla de Caja Diaria */}
            <div className="card">
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <h3 style={{fontSize:13, color:"#ffffff"}}>Planilla General de Caja de Hoy</h3>
                <div style={{display:"flex", gap:14, fontSize:12}}>
                  <div>Efectivo: <span style={{color:"#34d399", fontWeight:"700"}}>{formatP(totalCajaEfectivo)}</span></div>
                  <div>MercadoPago: <span style={{color:"#22d3ee", fontWeight:"700"}}>{formatP(totalCajaMP)}</span></div>
                  <div>Caja Total: <span style={{color:"#ffffff", fontWeight:"700", borderBottom:"2px solid #22d3ee"}}>{formatP(totalCajaGlobal)}</span></div>
                </div>
              </div>

              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%", fontSize:12, textAlign:"left", borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{color:"#94a3b8", borderBottom:"1px solid #1e2d40", background:"#0b1220"}}>
                      <th style={{padding:8}}>TS (Hora Cobro Exacto)</th><th style={{padding:8}}>Lavador</th>
                      <th style={{padding:8}}>Cliente</th><th style={{padding:8}}>Autos</th>
                      <th style={{padding:8}}>Importe Recibido</th><th style={{padding:8}}>Canal</th>
                      <th style={{padding:8}}>Estado</th><th style={{padding:8}}>Concepto / Auditoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.length === 0 ? (
                      <tr><td colSpan="8" style={{padding:12, textAlign:"center", color:"#475569"}}>Ningún cobro registrado hoy.</td></tr>
                    ) : (
                      registros.map((r, i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #1e2d4044"}}>
                          {/* Columna TS con hora exacta de cobro */}
                          <td style={{padding:8, color:"#22d3ee", fontFamily:"monospace"}}>{r.ts || r.hora || "—"}</td>
                          <td style={{padding:8}}>{r.staffNombre}</td>
                          <td style={{padding:8, fontWeight:"600"}}>{r.clienteNombre}</td>
                          <td style={{padding:8}}>{r.autos}</td>
                          <td style={{padding:8, color: r.precio >= 0 ? "#6ee7b7" : "#fca5a5"}}>{formatP(r.precio)}</td>
                          <td style={{padding:8}}>{r.metodo === "mp" ? "🌐 MP" : "💵 Ef."}</td>
                          <td style={{padding:8}}>{r.estadoPago}</td>
                          <td style={{padding:8, color:"#94a3b8", fontSize:11}}>{r.motivo || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{marginTop:16, borderTop:"1px solid #1e2d40", paddingTop:14}}>
                <h4 style={{fontSize:11, color:"#94a3b8", marginBottom:8, letterSpacing:".1em"}}>GESTIÓN DE PRÉSTAMOS E INTERNOS</h4>
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {staff.filter(s=>s.rol!=="encargado").map(s=>(
                    <button key={s.id} className="chip" onClick={()=>setModal({tipo:"operacion", data:s})}>💰 {s.nombre} ({formatP(prestamos[s.id])})</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 👥 SECCIÓN: CARTERA DE CLIENTES */}
        {vista === "clientes" && (
          <div className="card">
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, alignItems:"center"}}>
              <h3 style={{fontSize:13, color:"#ffffff"}}>Base General de Clientes</h3>
              <Btn color="#0ea5e9" sm onClick={()=>setModal({tipo:"cliente", data:null, esNuevo:true})}>➕ Registrar Cliente</Btn>
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%", fontSize:11, textAlign:"left", borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{color:"#94a3b8", borderBottom:"1px solid #1e2d40"}}>
                    <th style={{padding:6}}>Código</th><th style={{padding:6}}>Nombre</th>
                    <th style={{padding:6}}>Dirección</th><th style={{padding:6}}>Barrio</th>
                    <th style={{padding:6}}>Autos</th><th style={{padding:6}}>Saldo Deuda</th>
                    <th style={{padding:6}}>Notas Fijas</th><th style={{padding:6, textAlign:"right"}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c=>(
                    <tr key={c.id} style={{borderBottom:"1px solid #1e2d4022"}}>
                      <td style={{padding:6, color:"#22d3ee"}}>{c.codigo||"—"}</td>
                      <td style={{padding:6, fontWeight:"600"}}>{c.nombre}</td>
                      <td style={{padding:6}}>{c.direccion}</td>
                      <td style={{padding:6}}>{c.barrio}</td>
                      <td style={{padding:6, textAlign:"center"}}>{c.autosHabituales}</td>
                      <td style={{padding:6, color: c.deuda > 0 ? "#f87171" : "#e2e8f0", fontWeight: c.deuda > 0 ? "700" : "400"}}>{formatP(c.deuda)}</td>
                      <td style={{padding:6, color:"#94a3b8"}}>{c.nota||"—"}</td>
                      <td style={{padding:6, textAlign:"right"}}>
                        <button className="chip" onClick={()=>setModal({tipo:"cliente", data:c, esNuevo:false})}>✏️ Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* RENDERIZADO DE MODALES DINÁMICOS */}
      {modal?.tipo === "wa" && <ModalWA turno={modal.data} staff={staff} onClose={()=>setModal(null)}/>}
      
      {modal?.tipo === "detalle" && (
        <ModalDetalle turno={modal.data} staff={staff} asistencia={asistencia} onClose={()=>setModal(null)}
          onCancelar={cancelarTurno} onWA={(t)=>setModal({tipo:"wa", data:t})}
          onPagar={(t)=>setModal({tipo:"cobro", data:t})} onRendir={(t)=>setModal({tipo:"rendicion", data:t})}
          onReasignar={async(turno, nStaff, nHora) => {
            const ns = staff.find(x=>x.id===nStaff);
            const horasOcupadas = slotsOcupados(nHora, turno.cantAutos);
            const upd = { staffId: nStaff, staffNombre: ns?.nombre, hora: nHora, horasOcupadas };
            if(!modoPrueba) await fsUpdate("turnos_" + diaHoy, turno.id, upd);
            setTurnos(prev => prev.map(t => t.id === turno.id ? {...t, ...upd} : t));
            showToast("Turno reasignado con éxito");
            setModal(null);
          }}
        />
      )}

      {modal?.tipo === "cobro" && <ModalCobro turno={modal.data} onClose={()=>setModal(null)} onRegistrar={procesarCobro}/>}
      
      {modal?.tipo === "rendicion" && <ModalRendicion turno={modal.data} onClose={()=>setModal(null)} onRegistrar={procesarRendicion}/>}

      {modal?.tipo === "operacion" && <ModalOperacion lavador={modal.data} onClose={()=>setModal(null)} onRegistrar={procesarOperacionLavador}/>}

      {modal?.tipo === "cliente" && (
        <ModalCliente cliente={modal.data} esNuevo={modal.esNuevo} onClose={()=>setModal(null)}
          onGuardar={async(cliData) => {
            if(modal.esNuevo) {
              const id = await fsAdd("clientes", cliData);
              setClientes(prev => [...prev, {id, ...cliData}]);
              showToast("Cliente guardado ✓");
            } else {
              await fsUpdate("clientes", cliData.id, cliData);
              setClientes(prev => prev.map(c => c.id === cliData.id ? cliData : c));
              showToast("Cambios del cliente aplicados ✓");
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
