import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDBZS7KR8YIq8UzAhnq9WaPTh8wGTZ-SMI",
  authDomain:        "sofia-lavados-99231.firebaseapp.com",
  projectId:         "sofia-lavados-99231",
  storageBucket:     "sofia-lavados-99231.firebasestorage.app",
  messagingSenderId: "738758410354",
  appId:             "1:738758410354:web:0c07ee6f2906d8add402eb",
};

let db = null;
try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
} catch {}

// ═══════════════════════════════════════════════════════════════
//  DATOS SEED (solo para primera carga si Firestore está vacío)
// ═══════════════════════════════════════════════════════════════
const STAFF_SEED = [
  { nombre:"Jhony",     transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#22d3ee" },
  { nombre:"Sergio",    transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#0ea5e9" },
  { nombre:"Alexander", transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#38bdf8" },
  { nombre:"Maxi",      transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#7dd3fc" },
  { nombre:"Rene",      transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#06b6d4" },
  { nombre:"Brandon",   transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#67e8f9" },
  { nombre:"Jorge",     transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#a5f3fc" },
  { nombre:"Emiliano",  transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#2dd4bf" },
  { nombre:"Gaby",      transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#5eead4" },
  { nombre:"Javi",      transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#99f6e4" },
  { nombre:"Franco",    transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#34d399" },
  { nombre:"Fede",      transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#6ee7b7" },
  { nombre:"Elias",     transporte:"moto", whatsapp:true,  rol:"lavador",   especial:"",               color:"#a7f3d0" },
  { nombre:"Alvaro",    transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"",               color:"#c084fc" },
  { nombre:"Nestor",    transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"",               color:"#d8b4fe" },
  { nombre:"Matias",    transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"",               color:"#e879f9" },
  { nombre:"Luis",      transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"",               color:"#f0abfc" },
  { nombre:"Bruno",     transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"",               color:"#a78bfa" },
  { nombre:"Nico Alto", transporte:"bici", whatsapp:true,  rol:"lavador",   especial:"rapido",         color:"#fbbf24" },
  { nombre:"Hernán",    transporte:"bici", whatsapp:false, rol:"lavador",   especial:"avisar_presencia",color:"#f87171" },
  { nombre:"Gastón",    transporte:"bici", whatsapp:false, rol:"lavador",   especial:"llamar_telefono",color:"#fb923c" },
];

const CLIENTES_SEED = [
  { nombre:"Victoria", direccion:"Dardo Rocha 3278",           autosHabituales:3, nota:"" },
  { nombre:"Martin",   direccion:"Colectora Panamericana 2065", autosHabituales:3, nota:"" },
  { nombre:"Micaela",  direccion:"Eduardo Costa 902",           autosHabituales:1, nota:"" },
  { nombre:"Hyundai",  direccion:"Av. Santa Fe 2627",           autosHabituales:4, nota:"Confirmar cantidad (3-5 autos)" },
  { nombre:"Mariana",  direccion:"Diagonal Salta 557",          autosHabituales:1, nota:"" },
];

const SERVICIOS = [
  { id:"basico",   nombre:"Lavado Básico",     precio:8000  },
  { id:"completo", nombre:"Lavado Completo",   precio:12000 },
  { id:"premium",  nombre:"Premium Detailing", precio:18000 },
];

// Grilla horaria continua de 9 a 19 (cada hora)
const HORAS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const HORAS_TARDE_IDX = 4; // 13:00 en adelante = tarde

const COLORES_POOL = [
  "#22d3ee","#0ea5e9","#38bdf8","#7dd3fc","#06b6d4","#67e8f9",
  "#a5f3fc","#2dd4bf","#5eead4","#34d399","#6ee7b7","#a7f3d0",
  "#c084fc","#d8b4fe","#e879f9","#f0abfc","#a78bfa","#fbbf24",
  "#fb923c","#f87171","#4ade80","#facc15","#60a5fa","#f472b6",
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const fechaHoy    = () => new Date().toISOString().split("T")[0];
const horaFin     = h  => { const [hr,mn]=h.split(":").map(Number); return `${String(hr+1).padStart(2,"0")}:${String(mn).padStart(2,"0")}`; };
const formatPesos = n  => "$" + Number(n||0).toLocaleString("es-AR");
const distSim     = (id,dir) => 5 + ((id*17 + (dir||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)*7) % 35);
const coloresUsados = (staff) => staff.map(s=>s.color).filter(Boolean);
const colorNuevo    = (staff) => COLORES_POOL.find(c=>!coloresUsados(staff).includes(c)) || "#94a3b8";

// Slots bloqueados por una cantidad de autos desde una hora
function slotsOcupados(horaInicio, cantAutos) {
  const idx = HORAS.indexOf(horaInicio);
  if (idx < 0) return [];
  return Array.from({length: cantAutos}, (_,i) => HORAS[idx+i]).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════
async function fsLeer(col, id) {
  if (!db) return null;
  try { const s = await getDoc(doc(db, col, id)); return s.exists() ? {id:s.id,...s.data()} : null; } catch { return null; }
}
async function fsGuardar(col, id, data) {
  if (!db) return;
  try { await setDoc(doc(db, col, id), {...data, _ts: serverTimestamp()}, {merge:true}); } catch {}
}
async function fsAgregar(col, data) {
  if (!db) return null;
  try { const r = await addDoc(collection(db, col), {...data, _ts: serverTimestamp()}); return r.id; } catch { return null; }
}
async function fsBorrar(col, id) {
  if (!db) return;
  try { await deleteDoc(doc(db, col, id)); } catch {}
}
async function fsListar(col) {
  if (!db) return [];
  try { const s = await getDocs(collection(db, col)); return s.docs.map(d=>({id:d.id,...d.data()})); } catch { return []; }
}
async function fsActualizar(col, id, data) {
  if (!db) return;
  try { await updateDoc(doc(db, col, id), data); } catch {}
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES PEQUEÑOS
// ═══════════════════════════════════════════════════════════════
function Toast({ msg, tipo, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const c={ok:"#22d3ee",error:"#f87171",warn:"#fbbf24"}[tipo]||"#22d3ee";
  return <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#0b1220",
    border:`1px solid ${c}55`,color:c,padding:"12px 18px",borderRadius:10,
    fontSize:12,fontFamily:"inherit",boxShadow:`0 4px 20px ${c}22`,animation:"fadein .2s ease"}}>
    {tipo==="ok"?"✓":tipo==="error"?"✗":"⚠"} {msg}
  </div>;
}

function Modal({ titulo, onClose, children }) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:14,padding:24,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{titulo}</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

function Btn({ children, onClick, color="#0e7490", disabled, style={}, small }) {
  return <button onClick={onClick} disabled={disabled} style={{
    background:disabled?"#1e2d40":`linear-gradient(135deg,${color},${color}cc)`,
    color:disabled?"#334155":"white",border:"none",borderRadius:8,
    padding:small?"6px 14px":"10px 18px",fontSize:small?11:12,fontWeight:700,
    cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",
    transition:"all .15s",...style
  }}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type="text", style={} }) {
  return <div style={{marginBottom:10}}>
    {label && <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5,fontWeight:700}}>{label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",
        fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none",...style}}/>
  </div>;
}

function Select({ label, value, onChange, children }) {
  return <div style={{marginBottom:10}}>
    {label && <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5,fontWeight:700}}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:"#0b1220",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",
        fontFamily:"inherit",fontSize:12,padding:"9px 13px",width:"100%",outline:"none"}}>
      {children}
    </select>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function SofiaV3() {
  // ── Firebase
  const [fbOk,   setFbOk]   = useState(false);
  const [fbCarg, setFbCarg] = useState(false);

  // ── Datos dinámicos desde Firestore
  const [staff,    setStaff]    = useState([]);   // todos los integrantes
  const [asistencia,setAsist]  = useState({});    // { staffId: { transporte, presente } } — clave del día
  const [clientes, setClientes] = useState([]);
  const [turnos,   setTurnos]   = useState([]);   // colección turnos_YYYY-MM-DD
  const [registros,setRegistros]= useState([]);

  // ── UI
  const [vista,   setVista]   = useState("turno");
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null);   // { tipo, data }

  // ── Formulario nuevo turno
  const [clienteInput, setClienteInput] = useState("");
  const [sugerencias,  setSugerencias]  = useState([]);
  const [direccion,    setDireccion]    = useState("");
  const [cantAutos,    setCantAutos]    = useState(1);
  const [servicio,     setServicio]     = useState("completo");
  const [notas,        setNotas]        = useState("");
  const [metodoPago,   setMetodoPago]   = useState("efectivo");
  const [staffSelId,   setStaffSelId]   = useState(null);
  const [horaSelec,    setHoraSelec]    = useState("");
  const [paso,         setPaso]         = useState(1);
  const [msgCopiado,   setMsgCopiado]   = useState(false);
  const [guardando,    setGuardando]    = useState(false);

  // ── Filtros grilla
  const [filtroT,     setFiltroT]   = useState("todos");
  const [filtroBusca, setFiltroBusca]= useState("");

  // ── IA
  const [iaResp,  setIaResp]  = useState("");
  const [iaLoad,  setIaLoad]  = useState(false);
  const [iaPanel, setIaPanel] = useState(false);

  const showToast = (msg, tipo="ok") => setToast({msg,tipo});

  // ── Computed
  const hoy = fechaHoy();
  const staffActivo = staff.filter(s => {
    const a = asistencia[s.id];
    return a?.presente === true;
  });
  const staffFiltrado = staffActivo.filter(s =>
    (filtroT==="todos" || (asistencia[s.id]?.transporte||s.transporte)===filtroT) &&
    (!filtroBusca || s.nombre.toLowerCase().includes(filtroBusca.toLowerCase())) &&
    s.rol !== "encargado"
  );
  const staffSelObj   = staff.find(s=>s.id===staffSelId);
  const servicioSel   = SERVICIOS.find(s=>s.id===servicio);
  const totalBase     = (servicioSel?.precio||0)*cantAutos;
  const esFZ          = (() => {
    if(!staffSelId||!horaSelec||!direccion) return false;
    const s = staffSelObj; if(!s) return false;
    const radio = (asistencia[s.id]?.transporte||s.transporte)==="moto"?25:15;
    return distSim(s.id,direccion) > radio*1.4;
  })();
  const totalFinal    = esFZ ? Math.round(totalBase*1.20) : totalBase;
  const slotsAUsar    = horaSelec ? slotsOcupados(horaSelec, cantAutos) : [];

  const hayTardeTurnos = turnos.some(t => {
    const idx = HORAS.indexOf(t.hora);
    return idx >= HORAS_TARDE_IDX;
  });
  const listaVacia = !hayTardeTurnos;

  // Totales cierre
  const totalDia   = registros.reduce((s,r)=>s+Number(r.total||0),0);
  const totalMP    = registros.filter(r=>r.metodo==="mp").reduce((s,r)=>s+Number(r.total||0),0);
  const totalEfect = registros.filter(r=>r.metodo==="efectivo").reduce((s,r)=>s+Number(r.total||0),0);
  const pendientes = turnos.filter(t=>t.estado==="confirmado"&&!t.pagado).length;

  // ── Init
  useEffect(()=>{ inicializar(); },[]);

  async function inicializar() {
    setFbCarg(true);
    try {
      // Cargar staff
      let s = await fsListar("staff");
      if (s.length === 0) {
        // Seed inicial
        for (const m of STAFF_SEED) {
          const id = await fsAgregar("staff", m);
          s.push({id, ...m});
        }
      }
      setStaff(s);

      // Cargar asistencia de hoy
      const asDoc = await fsLeer("asistencia", hoy);
      if (asDoc) {
        const { id:_, _ts:__, ...slots } = asDoc;
        setAsist(slots);
      }

      // Cargar clientes
      let cl = await fsListar("clientes");
      if (cl.length === 0) {
        for (const c of CLIENTES_SEED) {
          const id = await fsAgregar("clientes", c);
          cl.push({id, ...c});
        }
      }
      setClientes(cl);

      // Cargar turnos y registros del día
      await recargarDia();

      setFbOk(true);
      showToast("Firebase conectado ✓");
    } catch(e) {
      setFbOk(false);
      showToast("Firebase offline — modo local", "warn");
    }
    setFbCarg(false);
  }

  async function recargarDia() {
    const t = await fsListar(`turnos_${hoy}`);
    setTurnos(t);
    const r = await fsListar(`cierre_${hoy}`);
    setRegistros(r);
  }

  // Listener tiempo real de turnos
  useEffect(()=>{
    if (!db) return;
    const unsub = onSnapshot(collection(db, `turnos_${hoy}`), snap=>{
      setTurnos(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[]);

  // ── Helpers de estado turno
  function getTurno(staffId, hora) {
    return turnos.find(t => t.staffId===staffId && t.hora===hora);
  }
  function estaOcupado(staffId, hora) {
    return turnos.some(t => t.staffId===staffId && t.horasOcupadas?.includes(hora));
  }
  function estadoGeo(staffMiembro, hora) {
    if(!direccion) return "libre";
    const a = asistencia[staffMiembro.id];
    const trans = a?.transporte || staffMiembro.transporte;
    const radio = trans==="moto"?25:15;
    const dist  = distSim(staffMiembro.id, direccion);
    if (listaVacia && HORAS.indexOf(hora)>=HORAS_TARDE_IDX) return dist>radio*1.5?"fz_aceptable":"verde";
    if (dist<=radio)        return "verde";
    if (dist<=radio*1.4)    return "amarillo";
    return "fz";
  }

  // ── Autocompletado
  function handleClienteInput(val) {
    setClienteInput(val);
    setSugerencias(val.length>=2 ? clientes.filter(c=>c.nombre.toLowerCase().startsWith(val.toLowerCase())) : []);
  }
  function aplicarCliente(c) {
    setClienteInput(c.nombre); setDireccion(c.direccion);
    setCantAutos(Number(c.autosHabituales)||1);
    if(c.nota) setNotas(c.nota);
    setSugerencias([]);
  }

  // ── Seleccionar turno
  function selTurno(sId, hora) {
    setStaffSelId(sId); setHoraSelec(hora);
    setPaso(Math.max(paso,3));
  }

  // ── Confirmar turno
  async function confirmarTurno() {
    if(!staffSelId||!horaSelec) return;
    setGuardando(true);
    const horasOcupadas = slotsOcupados(horaSelec, cantAutos);
    const turnoData = {
      staffId:staffSelId, staffNombre:staffSelObj?.nombre,
      hora:horaSelec, horasOcupadas,
      cliente:clienteInput, direccion, cantAutos,
      servicio:servicioSel?.nombre, precioBase:totalBase,
      esFZ, totalFinal, metodo:metodoPago,
      notas, estado:"confirmado", pagado:false,
      fechaCreacion: new Date().toISOString(),
    };
    const id = await fsAgregar(`turnos_${hoy}`, turnoData);
    if(id) {
      setTurnos(prev=>[...prev,{id,...turnoData}]);
      showToast("Turno guardado ✓");
    } else {
      setTurnos(prev=>[...prev,{id:"local_"+Date.now(),...turnoData}]);
      showToast("Turno guardado local","warn");
    }
    setGuardando(false);
    setPaso(4);
  }

  // ── Cancelar turno
  async function cancelarTurno(turno) {
    await fsBorrar(`turnos_${hoy}`, turno.id);
    setTurnos(prev=>prev.filter(t=>t.id!==turno.id));
    showToast("Turno cancelado — slots liberados","warn");
    setModal(null);
  }

  // ── Reasignar turno
  async function reasignarTurno(turno, nuevoStaffId, nuevaHora) {
    const nuevoStaff = staff.find(s=>s.id===nuevoStaffId);
    const horasOcupadas = slotsOcupados(nuevaHora, turno.cantAutos);
    const upd = { staffId:nuevoStaffId, staffNombre:nuevoStaff?.nombre, hora:nuevaHora, horasOcupadas };
    await fsActualizar(`turnos_${hoy}`, turno.id, upd);
    setTurnos(prev=>prev.map(t=>t.id===turno.id?{...t,...upd}:t));
    showToast(`Turno reasignado a ${nuevoStaff?.nombre} ✓`);
    setModal(null);
  }

  // ── Registrar pago
  async function registrarPago(turno) {
    const reg = {
      turnoId:turno.id, hora:turno.hora, staffNombre:turno.staffNombre,
      cliente:turno.cliente, direccion:turno.direccion, autos:turno.cantAutos,
      servicio:turno.servicio, total:turno.totalFinal, metodo:turno.metodo,
      esFZ:turno.esFZ, notas:turno.notas,
      ts:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
    };
    await fsAgregar(`cierre_${hoy}`, reg);
    await fsActualizar(`turnos_${hoy}`, turno.id, {pagado:true, estadoPago:"cobrado"});
    setTurnos(prev=>prev.map(t=>t.id===turno.id?{...t,pagado:true}:t));
    setRegistros(prev=>[...prev,{id:Date.now(),...reg}]);
    showToast(`Pago ${formatPesos(turno.totalFinal)} registrado ✓`);
    setModal(null);
  }

  // Flujo rápido de registro de pago al cerrar turno
  async function cerrarTurnoActual() {
    setGuardando(true);
    const turnoTemp = {
      id:"tmp_"+Date.now(), hora:horaSelec, staffNombre:staffSelObj?.nombre,
      cliente:clienteInput, direccion, cantAutos, servicio:servicioSel?.nombre,
      totalFinal, metodo:metodoPago, esFZ, notas,
    };
    await registrarPago({...turnoTemp, id: turnos.find(t=>t.staffId===staffSelId&&t.hora===horaSelec)?.id||"tmp"});
    setClienteInput(""); setDireccion(""); setCantAutos(1); setNotas("");
    setStaffSelId(null); setHoraSelec(""); setIaResp(""); setPaso(1);
    setGuardando(false);
  }

  // ── WhatsApp
  function generarMensaje() {
    const fin = horaFin(horaSelec);
    const notasLines = notas.trim() ? `\n⚠️ *Instrucciones:*\n${notas.split(",").map(n=>`• ${n.trim()}`).join("\n")}` : "";
    const fzLine = esFZ ? "\n🌐 *Fuera de zona — recargo de traslado incluido.*" : "";
    const trans = asistencia[staffSelId]?.transporte || staffSelObj?.transporte;
    const icono = trans==="moto"?"🏍":"🚲";
    return `🚿 *SOFÍA LAVADOS — Turno confirmado*\n\n📍 *Dirección:* ${direccion}\n🕐 *Llegada:* ${horaSelec} a ${fin} hs\n🚗 *Autos:* ${cantAutos} × ${servicioSel?.nombre}\n💰 *Cobrar:* ${formatPesos(totalFinal)} (${metodoPago==="mp"?"Mercado Pago":"Efectivo"})${fzLine}${notasLines}\n\n${icono} Confirmá arribo cuando llegues. ¡Gracias!`;
  }
  async function copiarMensaje() {
    try { await navigator.clipboard.writeText(generarMensaje()); } catch {}
    setMsgCopiado(true); setTimeout(()=>setMsgCopiado(false),2500);
  }

  // ── IA
  async function consultarIA() {
    setIaLoad(true); setIaResp("");
    try {
      const activos = staffActivo.filter(s=>s.rol!=="encargado").slice(0,8)
        .map(s=>`${s.nombre}(${asistencia[s.id]?.transporte||s.transporte},r:${(asistencia[s.id]?.transporte||s.transporte)==="moto"?25:15})`).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",
          content:`Sos asistente logístico de "Sofía Lavados Móvil", norte del GBA, Argentina. Respondé en español, directo, máx 4 oraciones, sin markdown.\n\nSituación: cliente=${clienteInput||"?"}, dirección=${direccion||"?"}, autos=${cantAutos}, servicio=${servicioSel?.nombre}, hora=${horaSelec||"?"}, notas=${notas||"ninguna"}, tarde vacía=${listaVacia?"SÍ":"NO"}.\nLavadores activos hoy: ${activos}.\n\nRecomendá el conductor óptimo, si aplica FZ y cualquier advertencia operativa.`}]})
      });
      const d = await res.json();
      setIaResp(d.content?.find(b=>b.type==="text")?.text||"Sin respuesta.");
    } catch { setIaResp("Error de conexión."); }
    setIaLoad(false);
  }

  // ── Backup
  function descargarBackup() {
    const data = { staff, clientes, turnos, registros, fecha:hoy };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `backup-sofia-${hoy}.json`; a.click();
    showToast("Backup descargado ✓");
  }

  // ═══ CSS ═══════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#080c18}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
    .ff{font-family:'JetBrains Mono',monospace}
    @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .fade{animation:fadein .25s ease}
    input,textarea,select{background:#0b1220;border:1px solid #1e3a5f;border-radius:8px;color:#e2e8f0;font-family:'JetBrains Mono',monospace;font-size:12px;padding:10px 14px;width:100%;transition:border-color .2s;outline:none;resize:none}
    input:focus,textarea:focus,select:focus{border-color:#22d3ee;box-shadow:0 0 0 2px #22d3ee18}
    select option{background:#0b1220}
    .card{background:#0b1220;border:1px solid #1e2d40;border-radius:12px;padding:16px}
    .lbl{font-size:10px;color:#334155;letter-spacing:.15em;margin-bottom:6px;font-weight:700}
    .hr{height:1px;background:linear-gradient(90deg,transparent,#1e3a5f,transparent);margin:12px 0}
    .nav-tab{background:transparent;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;padding:8px 14px;border-radius:8px;color:#475569;transition:all .2s}
    .nav-tab:hover{color:#94a3b8;background:#fff8}
    .nav-tab.on{color:#22d3ee;background:#22d3ee0f;border-bottom:2px solid #22d3ee}
    .cell-turno{padding:7px 5px;border-radius:6px;text-align:center;font-size:10px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-family:inherit}
    .cell-libre{background:#0b122088;border-color:#1e2d40;color:#1e3a5f}
    .cell-verde{background:#34d39913;border-color:#34d39955;color:#6ee7b7}
    .cell-verde:hover{background:#34d39930}
    .cell-amarillo{background:#fbbf2413;border-color:#fbbf2455;color:#fde68a}
    .cell-amarillo:hover{background:#fbbf2430}
    .cell-fz{background:#a78bfa13;border-color:#a78bfa55;color:#c4b5fd}
    .cell-fz:hover{background:#a78bfa30}
    .cell-fz_aceptable{background:#7c3aed18;border-color:#7c3aed88;color:#ddd6fe}
    .cell-ocupado{cursor:pointer;border-color:#334155}
    .cell-bloqueado{background:#ef444405;border-color:#ef444415;color:#1e2d40;cursor:default}
    .cell-sel{outline:2px solid #22d3ee;outline-offset:1px}
    .badge{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}
    .chip-toggle{padding:5px 12px;border-radius:8px;font-size:10px;cursor:pointer;border:1px solid #1e3a5f;background:transparent;color:#64748b;font-family:inherit;transition:all .15s}
    .chip-toggle:hover{border-color:#334155;color:#94a3b8}
    .chip-toggle.on{border-color:#22d3ee;color:#22d3ee;background:#22d3ee0a}
    .turno-pill{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:6px 7px;border-radius:6px;font-size:9px;line-height:1.3;text-align:left}
    .toggle-asist{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
    .toggle-asist::after{content:"";position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:white;transition:left .2s}
    .toggle-asist.off{background:#334155}.toggle-asist.off::after{left:2px}
    .toggle-asist.on_{background:#16a34a}.toggle-asist.on_::after{left:18px}
  `;

  // ═══ RENDER ════════════════════════════════════════════════
  return (
    <div className="ff" style={{background:"#080c18",minHeight:"100vh",color:"#e2e8f0"}}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)}/>}

      {/* MODALES */}
      {modal?.tipo==="detalle_turno" && <ModalDetalleTurno turno={modal.data} staff={staff} asistencia={asistencia} horas={HORAS} onCancelar={cancelarTurno} onReasignar={reasignarTurno} onPagar={registrarPago} onClose={()=>setModal(null)} />}
      {modal?.tipo==="nuevo_staff"  && <ModalNuevoStaff staff={staff} onGuardar={async m=>{const id=await fsAgregar("staff",m);const ns={id,...m};setStaff(prev=>[...prev,ns]);showToast(`${m.nombre} agregado ✓`);setModal(null);}} onClose={()=>setModal(null)} colorNuevo={colorNuevo(staff)} />}
      {modal?.tipo==="editar_staff" && <ModalEditarStaff miembro={modal.data} onGuardar={async(id,upd)=>{await fsActualizar("staff",id,upd);setStaff(prev=>prev.map(s=>s.id===id?{...s,...upd}:s));showToast("Datos actualizados ✓");setModal(null);}} onBorrar={async id=>{await fsBorrar("staff",id);setStaff(prev=>prev.filter(s=>s.id!==id));showToast("Integrante eliminado","warn");setModal(null);}} onClose={()=>setModal(null)} />}

      {/* NAV */}
      <header style={{background:"#0b1220",borderBottom:"1px solid #1e2d40",padding:"0 20px",display:"flex",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",marginRight:24,flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🚿</div>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".1em",color:"#f1f5f9",lineHeight:1}}>SOFÍA LAVADOS</div>
            <div style={{fontSize:8,color:"#1e3a5f",letterSpacing:".2em"}}>v3.0 BETA</div>
          </div>
        </div>
        {[{id:"turno",l:"+ Turno"},{id:"agenda",l:`Agenda${turnos.length?` (${turnos.length})`:""}`},{id:"asistencia",l:`Asistencia`},{id:"staff",l:"Staff"},{id:"cierre",l:`Cierre${registros.length?` (${registros.length})`:""}`}].map(v=>(
          <button key={v.id} className={`nav-tab ${vista===v.id?"on":""}`} onClick={()=>setVista(v.id)}>{v.l}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {pendientes>0 && <span style={{background:"#ef444420",border:"1px solid #ef444444",color:"#fca5a5",padding:"3px 9px",borderRadius:6,fontSize:10}}>💰 {pendientes} sin cobrar</span>}
          {listaVacia && <span style={{background:"#312e8118",border:"1px solid #312e8144",color:"#a5b4fc",padding:"3px 9px",borderRadius:6,fontSize:10}}>📋 TARDE LIBRE</span>}
          <div onClick={fbCarg?null:inicializar} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,padding:"4px 9px",borderRadius:6,cursor:"pointer",background:fbOk?"#34d39910":"#f8717110",border:`1px solid ${fbOk?"#34d39933":"#f8717133"}`,color:fbOk?"#6ee7b7":"#fca5a5"}}>
            <span style={{animation:fbCarg?"spin .7s linear infinite":"none",display:"inline-block"}}>{fbCarg?"⟳":fbOk?"●":"○"}</span>
            {fbCarg?"…":fbOk?"Firebase ✓":"Offline"}
          </div>
        </div>
      </header>

      <main style={{maxWidth:1300,margin:"0 auto",padding:"20px 18px"}}>

        {/* ══ NUEVO TURNO ══ */}
        {vista==="turno" && (
          <div className="fade" style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:18,alignItems:"start"}}>
            {/* Columna izquierda */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* Paso 1 */}
              <div className="card" style={{borderColor:paso===1?"#22d3ee33":"#1e2d40"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{background:"#22d3ee",color:"#080c18",borderRadius:5,padding:"1px 6px",fontSize:10}}>01</span> Datos del servicio
                </div>
                {/* Autocomplete */}
                <div style={{position:"relative",marginBottom:8}}>
                  <div className="lbl">CLIENTE</div>
                  <input placeholder="Victoria, Martin, Hyundai…" value={clienteInput} onChange={e=>handleClienteInput(e.target.value)}/>
                  {sugerencias.length>0 && (
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0b1220",border:"1px solid #22d3ee44",borderRadius:8,zIndex:20,overflow:"hidden",marginTop:2}}>
                      {sugerencias.map(s=>(
                        <div key={s.id||s.nombre} onClick={()=>aplicarCliente(s)}
                          style={{padding:"9px 12px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #1e2d40"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#22d3ee0a"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{color:"#22d3ee",fontWeight:700}}>{s.nombre}</div>
                          <div style={{color:"#475569",fontSize:10}}>{s.direccion} · {s.autosHabituales} auto{s.autosHabituales>1?"s":""}</div>
                          {s.nota&&<div style={{color:"#fbbf24",fontSize:9,marginTop:2}}>⚠ {s.nota}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lbl">DIRECCIÓN</div>
                <input placeholder="Av. Maipú 1234, Olivos" value={direccion} onChange={e=>setDireccion(e.target.value)} style={{marginBottom:8}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 70px",gap:8,marginBottom:8}}>
                  <div>
                    <div className="lbl">SERVICIO</div>
                    <select value={servicio} onChange={e=>setServicio(e.target.value)}>
                      {SERVICIOS.map(s=><option key={s.id} value={s.id}>{s.nombre} — {formatPesos(s.precio)}</option>)}
                    </select>
                  </div>
                  <div><div className="lbl">AUTOS</div>
                    <input type="number" min={1} max={5} value={cantAutos} onChange={e=>setCantAutos(Number(e.target.value))}/>
                  </div>
                </div>
                <div className="lbl">NOTAS OPERATIVAS</div>
                <textarea rows={2} placeholder="cliente detallista, insectos de ruta…" value={notas} onChange={e=>setNotas(e.target.value)}/>
                {cantAutos>1&&<div style={{marginTop:8,padding:"7px 10px",background:"#fbbf2410",border:"1px solid #fbbf2433",borderRadius:7,fontSize:10,color:"#fde68a"}}>
                  ⏱ {cantAutos} autos = {cantAutos}hs — ocupa franjas: {slotsOcupados(horaSelec||"09:00",cantAutos).join(", ")||"(elegí horario)"}
                </div>}
                <button className="btn" onClick={()=>setPaso(Math.max(paso,2))} disabled={!direccion}
                  style={{width:"100%",marginTop:10,background:direccion?"linear-gradient(135deg,#0e7490,#1d4ed8)":"#1e2d40",color:direccion?"#fff":"#334155",border:"none",borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:direccion?"pointer":"not-allowed",fontFamily:"inherit"}}>
                  Ver disponibilidad →
                </button>
              </div>

              {/* Paso 3: Confirmar */}
              {paso>=3 && staffSelId && horaSelec && (
                <div className="card fade" style={{borderColor:"#34d39933"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#34d399",color:"#080c18",borderRadius:5,padding:"1px 6px",fontSize:10}}>03</span> Confirmar turno
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7,fontSize:11,marginBottom:12}}>
                    {[
                      ["Lavador", <span style={{color:staffSelObj?.color}}>{staffSelObj?.nombre} <span style={{color:"#475569"}}>({asistencia[staffSelId]?.transporte||staffSelObj?.transporte})</span></span>],
                      ["Hora interna", horaSelec],
                      ["Franja cliente", <span style={{color:"#22d3ee"}}>{horaSelec} → {horaFin(horaSelec)} hs</span>],
                      ["Servicio", `${servicioSel?.nombre} × ${cantAutos}`],
                      esFZ && ["Zona", <span style={{color:"#c4b5fd"}}>⬡ FZ — +20%</span>],
                      slotsAUsar.length>1 && ["Ocupa franjas", <span style={{color:"#fde68a"}}>{slotsAUsar.join(", ")}</span>],
                    ].filter(Boolean).map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:"#475569"}}>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div className="hr"/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#64748b"}}>TOTAL</span>
                      <strong style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#22d3ee"}}>{formatPesos(totalFinal)}</strong>
                    </div>
                  </div>
                  {/* Alerta sin WA */}
                  {staffSelObj?.especial==="avisar_presencia" && <div style={{padding:"8px 12px",background:"#f8717118",border:"1px solid #f8717144",borderRadius:7,color:"#fca5a5",fontSize:11,marginBottom:10}}>🔴 Hernán — Avisar en persona</div>}
                  {staffSelObj?.especial==="llamar_telefono" && <div style={{padding:"8px 12px",background:"#fb923c18",border:"1px solid #fb923c44",borderRadius:7,color:"#fdba74",fontSize:11,marginBottom:10}}>📞 Gastón — Llamar por teléfono</div>}
                  <div style={{display:"flex",gap:7,marginBottom:10}}>
                    <button className={`chip-toggle ${metodoPago==="efectivo"?"on":""}`} onClick={()=>setMetodoPago("efectivo")}>💵 Efectivo</button>
                    <button className={`chip-toggle ${metodoPago==="mp"?"on":""}`} onClick={()=>setMetodoPago("mp")}>📱 Mercado Pago</button>
                  </div>
                  <button onClick={confirmarTurno} disabled={guardando} style={{width:"100%",background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:guardando?"not-allowed":"pointer",fontFamily:"inherit"}}>
                    {guardando?"⟳ Guardando…":"Confirmar y enviar al lavador →"}
                  </button>
                </div>
              )}

              {/* Paso 4: WA */}
              {paso>=4 && (
                <div className="card fade" style={{background:"#052e1c",borderColor:"#16a34a44"}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"#4ade80",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#16a34a",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:10}}>04</span>
                    📲 Mensaje para el lavador
                  </div>
                  <pre style={{fontFamily:"inherit",fontSize:11,color:"#bbf7d0",whiteSpace:"pre-wrap",lineHeight:1.7,background:"#041a0f",padding:12,borderRadius:8,border:"1px solid #16a34a22"}}>
                    {generarMensaje()}
                  </pre>
                  <button style={{width:"100%",marginTop:10,background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff",border:"none",borderRadius:8,padding:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={copiarMensaje}>
                    {msgCopiado?"✓ Copiado — pegá en WhatsApp":`📋 Copiar para WA de ${staffSelObj?.nombre}`}
                  </button>
                  <button onClick={()=>setPaso(5)} style={{width:"100%",marginTop:7,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    ✓ Confirmé arribo → Registrar pago
                  </button>
                </div>
              )}

              {/* Paso 5: Pago */}
              {paso>=5 && (
                <div className="card fade" style={{borderColor:"#fbbf2433"}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"#fde68a",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#d97706",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:10}}>05</span> Registrar pago
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{color:"#64748b",fontSize:12}}>Total a cobrar:</span>
                    <strong style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#22d3ee"}}>{formatPesos(totalFinal)}</strong>
                  </div>
                  <button onClick={cerrarTurnoActual} disabled={guardando} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff",border:"none",borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:guardando?"not-allowed":"pointer",fontFamily:"inherit"}}>
                    {guardando?"⟳ Guardando…":"💰 Confirmar cobro y cerrar turno"}
                  </button>
                </div>
              )}
            </div>

            {/* Columna derecha: Semáforo + IA */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="card" style={{borderColor:paso>=2?"#a78bfa33":"#1e2d40"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#7c3aed",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:10}}>02</span>
                    Semáforo Geográfico
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {[["#6ee7b7","#34d399","● libre"],["#fde68a","#fbbf24","◐ lejos"],["#c4b5fd","#a78bfa","⬡ FZ"],["#fca5a5","#ef4444","● turno"]].map(([tc,bc,l])=>(
                      <span key={l} style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:`${bc}18`,border:`1px solid ${bc}44`,color:tc}}>{l}</span>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {["todos","moto","bici"].map(t=>(
                    <button key={t} className={`chip-toggle ${filtroT===t?"on":""}`} onClick={()=>setFiltroT(t)}>
                      {t==="todos"?"Todos":t==="moto"?"🏍 Motos":"🚲 Bicis"}
                    </button>
                  ))}
                  <input placeholder="Buscar…" value={filtroBusca} onChange={e=>setFiltroBusca(e.target.value)} style={{width:120,padding:"5px 10px",fontSize:10}}/>
                  <span style={{marginLeft:"auto",fontSize:10,color:"#334155"}}>{staffFiltrado.length} activos hoy</span>
                </div>

                {paso<2
                  ? <div style={{textAlign:"center",padding:24,color:"#1e3a5f",fontSize:12}}>Completá la dirección y tocá "Ver disponibilidad"</div>
                  : <div style={{overflowX:"auto"}}>
                      {staffFiltrado.length===0
                        ? <div style={{textAlign:"center",padding:20,color:"#475569",fontSize:12}}>No hay lavadores activos hoy.<br/>Marcá la asistencia en la pestaña "Asistencia".</div>
                        : <>
                          {/* Cabecera */}
                          <div style={{display:"grid",gridTemplateColumns:`60px repeat(${staffFiltrado.length},minmax(80px,1fr))`,gap:3,marginBottom:5}}>
                            <div style={{fontSize:9,color:"#1e3a5f",padding:"5px"}}>HORA</div>
                            {staffFiltrado.map(s=>(
                              <div key={s.id} style={{fontSize:9,textAlign:"center",padding:"4px 2px",color:s.color,borderBottom:`2px solid ${s.color}44`,lineHeight:1.4}}>
                                <div style={{fontWeight:700}}>{s.nombre}</div>
                                <div style={{opacity:.6}}>{(asistencia[s.id]?.transporte||s.transporte)==="moto"?"🏍":"🚲"}</div>
                                {s.especial==="rapido"&&<div style={{fontSize:8,color:s.color}}>⚡</div>}
                              </div>
                            ))}
                          </div>
                          {/* Filas */}
                          {HORAS.map(hora=>{
                            const esTarde_ = HORAS.indexOf(hora)>=HORAS_TARDE_IDX;
                            return (
                              <div key={hora} style={{display:"grid",gridTemplateColumns:`60px repeat(${staffFiltrado.length},minmax(80px,1fr))`,gap:3,marginBottom:3}}>
                                <div style={{fontSize:10,padding:"7px 5px",display:"flex",flexDirection:"column",gap:1}}>
                                  <span style={{color:esTarde_?"#a78bfa":"#94a3b8",fontWeight:700}}>{hora}</span>
                                  <span style={{fontSize:8,color:"#1e3a5f"}}>→{horaFin(hora)}</span>
                                </div>
                                {staffFiltrado.map(s=>{
                                  const ocup = estaOcupado(s.id, hora);
                                  const turno = turnos.find(t=>t.staffId===s.id&&t.horasOcupadas?.includes(hora));
                                  const sel = staffSelId===s.id && horaSelec===hora;
                                  let geo = "libre";
                                  if(!ocup && paso>=2) geo = estadoGeo(s, hora);

                                  if(ocup && turno) {
                                    const esPrincipal = turno.hora === hora;
                                    return (
                                      <div key={s.id} className={`cell-turno cell-ocupado ${sel?"cell-sel":""}`}
                                        onClick={()=>setModal({tipo:"detalle_turno",data:turno})}
                                        style={{background:`${s.color}18`,borderColor:`${s.color}55`,color:s.color,padding:"5px 4px"}}>
                                        {esPrincipal
                                          ? <div className="turno-pill" style={{color:s.color}}>
                                              <span style={{fontWeight:700,fontSize:9}}>● {turno.cliente||"turno"}</span>
                                              <span style={{color:"#475569",fontSize:8}}>{turno.direccion?.split(",")[0]||""}</span>
                                              {turno.notas&&<span style={{color:"#fbbf24",fontSize:8}}>📝</span>}
                                              {turno.pagado?<span style={{color:"#34d399",fontSize:8}}>✓ cobrado</span>:<span style={{color:"#fde68a",fontSize:8}}>💰 pendiente</span>}
                                            </div>
                                          : <div style={{fontSize:9,color:"#334155",padding:"4px 0"}}>— cont.</div>
                                        }
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={s.id}
                                      className={`cell-turno cell-${geo} ${sel?"cell-sel":""}`}
                                      onClick={()=>{if(geo!=="libre"&&paso>=2){selTurno(s.id,hora);}}}
                                      style={{cursor:geo==="libre"||paso<2?"default":"pointer"}}>
                                      {geo==="libre"?"·":geo==="verde"?"● libre":geo==="amarillo"?"◐ lejos":geo==="fz"||geo==="fz_aceptable"?"⬡ FZ":"·"}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </>
                      }
                    </div>
                }
              </div>

              {/* IA */}
              <div style={{background:"linear-gradient(135deg,#0d1b3e,#0b1220)",border:"1px solid #1e3a5f",borderRadius:12,padding:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:iaPanel?10:0}}>
                  <div style={{fontSize:10,color:"#4f46e5",letterSpacing:".1em",display:"flex",alignItems:"center",gap:7}}>✦ ASISTENTE IA</div>
                  <div style={{display:"flex",gap:5}}>
                    <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"3px 9px",fontFamily:"inherit"}} onClick={()=>setIaPanel(!iaPanel)}>{iaPanel?"Cerrar":"Abrir"}</button>
                    {iaPanel&&<button style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:10,padding:"3px 9px",fontFamily:"inherit"}} onClick={consultarIA} disabled={iaLoad}>{iaLoad?"⟳":"Consultar"}</button>}
                  </div>
                </div>
                {iaPanel&&<div className="fade">
                  {iaLoad&&<div style={{color:"#6366f1",fontSize:11}}>● Analizando…</div>}
                  {iaResp&&<div style={{fontSize:11,color:"#a5b4fc",lineHeight:1.7,borderTop:"1px solid #1e3a5f",paddingTop:8}}>{iaResp}</div>}
                  {!iaResp&&!iaLoad&&<div style={{fontSize:10,color:"#1e3a5f"}}>Completá los datos y tocá Consultar.</div>}
                </div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ AGENDA ══ */}
        {vista==="agenda" && (
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>AGENDA HOY — {hoy}</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 12px",fontFamily:"inherit"}} onClick={recargarDia}>⟳ Refrescar</button>
              </div>
            </div>
            <div className="card" style={{overflowX:"auto"}}>
              {staffActivo.filter(s=>s.rol!=="encargado").length===0
                ? <div style={{textAlign:"center",padding:30,color:"#475569"}}>No hay lavadores activos hoy. Marcá la asistencia primero.</div>
                : <div style={{display:"grid",gridTemplateColumns:`65px repeat(${staffActivo.filter(s=>s.rol!=="encargado").length},minmax(110px,1fr))`,gap:3,minWidth:600}}>
                    <div style={{padding:"5px",fontSize:9,color:"#1e3a5f"}}>HORA</div>
                    {staffActivo.filter(s=>s.rol!=="encargado").map(s=>(
                      <div key={s.id} style={{fontSize:9,textAlign:"center",padding:"4px 2px",color:s.color,borderBottom:`2px solid ${s.color}33`,lineHeight:1.4}}>
                        <div style={{fontWeight:700}}>{s.nombre}</div>
                        <div style={{opacity:.5}}>{(asistencia[s.id]?.transporte||s.transporte)==="moto"?"🏍":"🚲"}</div>
                      </div>
                    ))}
                    {HORAS.map(hora=>(
                      <>
                        <div key={`h_${hora}`} style={{fontSize:10,padding:"9px 5px",color:HORAS.indexOf(hora)>=HORAS_TARDE_IDX?"#a78bfa":"#64748b",fontWeight:700}}>{hora}</div>
                        {staffActivo.filter(s=>s.rol!=="encargado").map(s=>{
                          const turno=turnos.find(t=>t.staffId===s.id&&t.horasOcupadas?.includes(hora));
                          const esPrincipal=turno&&turno.hora===hora;
                          return <div key={s.id} onClick={()=>turno&&setModal({tipo:"detalle_turno",data:turno})}
                            style={{padding:"7px 5px",borderRadius:7,fontSize:10,
                              background:turno?`${s.color}18`:"#0b122088",
                              border:`1px solid ${turno?s.color+"44":"#1e2d40"}`,
                              color:turno?s.color:"#1e3a5f",cursor:turno?"pointer":"default",
                              lineHeight:1.3}}>
                            {esPrincipal
                              ? <div>
                                  <div style={{fontWeight:700,fontSize:9}}>{turno.cliente||"turno"}</div>
                                  <div style={{color:"#475569",fontSize:8,marginTop:1}}>{turno.direccion?.split(",")[0]}</div>
                                  <div style={{marginTop:2}}>{turno.pagado?<span style={{color:"#34d399",fontSize:8}}>✓</span>:<span style={{color:"#fde68a",fontSize:8}}>💰</span>}</div>
                                </div>
                              : turno ? <div style={{color:"#334155",fontSize:9}}>↓ cont.</div>
                              : <div style={{color:"#1e2d40",fontSize:10}}>·</div>
                            }
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
        {vista==="asistencia" && (
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>ASISTENCIA HOY — {hoy}</div>
              <div style={{fontSize:11,color:"#475569"}}>{staffActivo.length} presentes de {staff.filter(s=>s.rol!=="encargado").length} lavadores</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {staff.filter(s=>s.rol!=="encargado").map(s=>{
                const a = asistencia[s.id]||{};
                const presente = a.presente===true;
                const trans = a.transporte||s.transporte;
                return (
                  <div key={s.id} className="card" style={{borderColor:`${s.color}33`,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                      {trans==="moto"?"🏍":"🚲"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:s.color,fontSize:12,marginBottom:3}}>{s.nombre}</div>
                      {/* Toggle transporte */}
                      <div style={{display:"flex",gap:5,marginBottom:4}}>
                        {["moto","bici"].map(t=>(
                          <button key={t} onClick={async()=>{
                            const radio = t==="moto"?25:15;
                            const upd = {...(asistencia[s.id]||{}), transporte:t, radio};
                            const newA = {...asistencia,[s.id]:upd};
                            setAsist(newA);
                            await fsGuardar("asistencia", hoy, {[s.id]:upd});
                          }} className={`chip-toggle ${trans===t?"on":""}`} style={{padding:"3px 9px",fontSize:9}}>
                            {t==="moto"?"🏍 Moto":"🚲 Bici"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Toggle presencia */}
                    <button className={`toggle-asist ${presente?"on_":"off"}`}
                      onClick={async()=>{
                        const upd = {...(asistencia[s.id]||{transporte:s.transporte}), presente:!presente};
                        const newA = {...asistencia,[s.id]:upd};
                        setAsist(newA);
                        await fsGuardar("asistencia", hoy, {[s.id]:upd});
                      }}/>
                  </div>
                );
              })}
            </div>
            {/* Encargados */}
            {staff.filter(s=>s.rol==="encargado").length>0 && <>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",margin:"20px 0 10px"}}>ENCARGADOS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
                {staff.filter(s=>s.rol==="encargado").map(s=>(
                  <div key={s.id} className="card" style={{borderColor:`${s.color}33`,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>👷</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:s.color,fontSize:12}}>{s.nombre}</div>
                      <div style={{fontSize:10,color:"#475569"}}>Encargado / Supervisor</div>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ══ STAFF ══ */}
        {vista==="staff" && (
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>STAFF — {staff.length} INTEGRANTES</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={descargarBackup} style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 12px",fontFamily:"inherit"}}>⬇ Backup</button>
                <button onClick={()=>setModal({tipo:"nuevo_staff"})} style={{background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 12px",fontFamily:"inherit",fontWeight:700}}>+ Agregar integrante</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
              {staff.map(s=>(
                <div key={s.id} className="card" style={{borderColor:`${s.color}33`,cursor:"pointer"}} onClick={()=>setModal({tipo:"editar_staff",data:s})}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
                      {s.rol==="encargado"?"👷":s.transporte==="moto"?"🏍":"🚲"}
                    </div>
                    <div>
                      <div style={{fontWeight:700,color:s.color,fontSize:12}}>{s.nombre}</div>
                      <div style={{fontSize:9,color:"#475569"}}>{s.rol==="encargado"?"Encargado":`${s.transporte} · ${s.transporte==="moto"?25:15} cuas.`}</div>
                    </div>
                    <div style={{marginLeft:"auto",fontSize:9,color:"#334155"}}>✏️</div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:s.whatsapp?"#34d39918":"#ef444418",border:`1px solid ${s.whatsapp?"#34d39944":"#ef444444"}`,color:s.whatsapp?"#6ee7b7":"#fca5a5"}}>{s.whatsapp?"✓ WA":"✗ Sin WA"}</span>
                    {s.especial==="rapido"&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#fbbf2418",border:"1px solid #fbbf2444",color:"#fde68a"}}>⚡ Rápido</span>}
                    {s.especial==="avisar_presencia"&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#f8717118",border:"1px solid #f8717144",color:"#fca5a5"}}>👁 Avisar</span>}
                    {s.especial==="llamar_telefono"&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#fb923c18",border:"1px solid #fb923c44",color:"#fdba74"}}>📞 Tel.</span>}
                    {asistencia[s.id]?.presente&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#34d39918",border:"1px solid #34d39933",color:"#6ee7b7"}}>● Hoy</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CIERRE ══ */}
        {vista==="cierre" && (
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>CIERRE — {hoy}</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 12px",fontFamily:"inherit"}} onClick={recargarDia}>⟳ Refrescar</button>
                <button style={{background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:7,cursor:"pointer",fontSize:10,padding:"5px 12px",fontFamily:"inherit"}} onClick={descargarBackup}>⬇ Backup</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
              {[{l:"TOTAL DÍA",v:formatPesos(totalDia),c:"#22d3ee"},{l:"MERCADO PAGO",v:formatPesos(totalMP),c:"#a78bfa"},{l:"EFECTIVO",v:formatPesos(totalEfect),c:"#34d399"},{l:"SIN COBRAR",v:pendientes,c:"#f87171"}].map(s=>(
                <div key={s.l} className="card" style={{textAlign:"center",borderColor:`${s.c}33`}}>
                  <div style={{fontSize:8,color:"#334155",marginBottom:6,letterSpacing:".15em"}}>{s.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {/* Turnos pendientes de cobro */}
            {turnos.filter(t=>!t.pagado&&t.estado==="confirmado").length>0 && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#f87171",letterSpacing:".1em",marginBottom:8}}>💰 PENDIENTES DE COBRO</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {turnos.filter(t=>!t.pagado).map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,background:"#0b1220",border:"1px solid #f8717133",borderRadius:8,padding:"10px 14px"}}>
                      <span style={{color:"#22d3ee",fontSize:11,fontWeight:700,flexShrink:0}}>{t.hora}</span>
                      <span style={{color:"#94a3b8",fontSize:11,flex:1}}>{t.staffNombre} → {t.cliente||t.direccion}</span>
                      <span style={{color:"#34d399",fontWeight:700,fontSize:11}}>{formatPesos(t.totalFinal)}</span>
                      <button onClick={()=>setModal({tipo:"detalle_turno",data:t})} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Cobrar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {registros.length===0
              ? <div className="card" style={{textAlign:"center",color:"#1e3a5f",padding:30}}>Sin registros todavía.</div>
              : <div className="card" style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{borderBottom:"1px solid #1e2d40"}}>
                      {["HORA","LAVADOR","CLIENTE","DIRECCIÓN","AUTOS","SERVICIO","TOTAL","PAGO","FZ","NOTAS"].map(h=>(
                        <th key={h} style={{padding:"7px 8px",textAlign:"left",color:"#334155",fontSize:9,letterSpacing:".08em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {registros.map((r,i)=>(
                        <tr key={r.id||i} style={{borderBottom:"1px solid #0b1220"}}>
                          <td style={{padding:"9px 8px",color:"#22d3ee",whiteSpace:"nowrap"}}>{r.hora}</td>
                          <td style={{padding:"9px 8px"}}>{r.staffNombre||r.conductor}</td>
                          <td style={{padding:"9px 8px",color:"#64748b"}}>{r.cliente||"—"}</td>
                          <td style={{padding:"9px 8px",color:"#475569",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.direccion}</td>
                          <td style={{padding:"9px 8px",textAlign:"center"}}>{r.autos}</td>
                          <td style={{padding:"9px 8px",color:"#94a3b8"}}>{r.servicio}</td>
                          <td style={{padding:"9px 8px",color:"#34d399",fontWeight:700}}>{formatPesos(r.total)}</td>
                          <td style={{padding:"9px 8px"}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:r.metodo==="mp"?"#a78bfa18":"#34d39918",border:`1px solid ${r.metodo==="mp"?"#a78bfa44":"#34d39944"}`,color:r.metodo==="mp"?"#c4b5fd":"#6ee7b7"}}>{r.metodo==="mp"?"MP":"Efect."}</span></td>
                          <td style={{padding:"9px 8px"}}>{(r.esFZ)&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,background:"#a78bfa18",border:"1px solid #a78bfa44",color:"#c4b5fd"}}>⬡</span>}</td>
                          <td style={{padding:"9px 8px",color:"#334155",fontSize:10,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.notas||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{borderTop:"2px solid #1e3a5f"}}>
                      <td colSpan={6} style={{padding:"10px 8px",color:"#475569",fontSize:10}}>TOTALES</td>
                      <td style={{padding:"10px 8px",color:"#22d3ee",fontFamily:"'Bebas Neue',sans-serif",fontSize:16}}>{formatPesos(totalDia)}</td>
                      <td colSpan={3} style={{padding:"10px 8px",color:"#475569",fontSize:10}}>MP: {formatPesos(totalMP)} · Ef: {formatPesos(totalEfect)}</td>
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
//  MODALES
// ═══════════════════════════════════════════════════════════════

function ModalDetalleTurno({ turno, staff, asistencia, horas, onCancelar, onReasignar, onPagar, onClose }) {
  const [modo, setModo]       = useState("detalle"); // detalle | reasignar
  const [nuevoStaff,setNS]    = useState(turno.staffId);
  const [nuevaHora, setNH]    = useState(turno.hora);
  const formatP = n => "$" + Number(n||0).toLocaleString("es-AR");
  const staffLavadores = staff.filter(s=>s.rol!=="encargado"&&asistencia[s.id]?.presente);
  return (
    <Modal titulo={modo==="detalle"?"Detalle del turno":"Reasignar turno"} onClose={onClose}>
      {modo==="detalle" && <>
        <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:12,marginBottom:16}}>
          {[
            ["Lavador",   turno.staffNombre],
            ["Hora",      turno.hora],
            ["Cliente",   turno.cliente||"—"],
            ["Dirección", turno.direccion],
            ["Autos",     turno.cantAutos],
            ["Servicio",  turno.servicio],
            ["Total",     formatP(turno.totalFinal)],
            ["Pago",      turno.metodo==="mp"?"Mercado Pago":"Efectivo"],
            ["Estado",    turno.pagado?"✓ Cobrado":"💰 Pendiente"],
            ["Notas",     turno.notas||"—"],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1e2d40",paddingBottom:6}}>
              <span style={{color:"#475569"}}>{k}</span>
              <span style={{color:"#e2e8f0",fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {!turno.pagado && <button onClick={()=>onPagar(turno)} style={{flex:1,background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>💰 Registrar cobro</button>}
          <button onClick={()=>setModo("reasignar")} style={{flex:1,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🔄 Reasignar</button>
          <button onClick={()=>onCancelar(turno)} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Cancelar turno</button>
        </div>
      </>}
      {modo==="reasignar" && <>
        <div style={{marginBottom:14,fontSize:12,color:"#64748b"}}>Cambiá el lavador y/o el horario del turno.</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>NUEVO LAVADOR</div>
          <select value={nuevoStaff} onChange={e=>setNS(e.target.value)}>
            {staffLavadores.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>NUEVO HORARIO</div>
          <select value={nuevaHora} onChange={e=>setNH(e.target.value)}>
            {horas.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModo("detalle")} style={{flex:1,background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>← Volver</button>
          <button onClick={()=>onReasignar(turno,nuevoStaff,nuevaHora)} style={{flex:2,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirmar reasignación</button>
        </div>
      </>}
    </Modal>
  );
}

function ModalNuevoStaff({ onGuardar, onClose, colorNuevo }) {
  const [nombre,    setNombre]    = useState("");
  const [transporte,setTransporte]= useState("moto");
  const [rol,       setRol]       = useState("lavador");
  const [whatsapp,  setWhatsapp]  = useState(true);
  const [especial,  setEspecial]  = useState("");
  return (
    <Modal titulo="Agregar integrante" onClose={onClose}>
      <Input label="NOMBRE" value={nombre} onChange={setNombre} placeholder="Nombre del lavador"/>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>ROL</div>
        <div style={{display:"flex",gap:8}}>
          {["lavador","encargado"].map(r=>(
            <button key={r} onClick={()=>setRol(r)} style={{flex:1,background:rol===r?"#22d3ee0a":"transparent",border:`1px solid ${rol===r?"#22d3ee":"#1e3a5f"}`,color:rol===r?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:rol===r?700:400}}>
              {r==="lavador"?"🚗 Lavador":"👷 Encargado"}
            </button>
          ))}
        </div>
      </div>
      {rol==="lavador" && <>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>TRANSPORTE</div>
          <div style={{display:"flex",gap:8}}>
            {["moto","bici"].map(t=>(
              <button key={t} onClick={()=>setTransporte(t)} style={{flex:1,background:transporte===t?"#22d3ee0a":"transparent",border:`1px solid ${transporte===t?"#22d3ee":"#1e3a5f"}`,color:transporte===t?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {t==="moto"?"🏍 Moto":"🚲 Bici"}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>WHATSAPP</div>
          <div style={{display:"flex",gap:8}}>
            {[true,false].map(v=>(
              <button key={String(v)} onClick={()=>setWhatsapp(v)} style={{flex:1,background:whatsapp===v?"#22d3ee0a":"transparent",border:`1px solid ${whatsapp===v?"#22d3ee":"#1e3a5f"}`,color:whatsapp===v?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {v?"✓ Tiene WA":"✗ Sin WA"}
              </button>
            ))}
          </div>
        </div>
        {!whatsapp && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>CÓMO AVISAR</div>
            <div style={{display:"flex",gap:8}}>
              {[["avisar_presencia","👁 En persona"],["llamar_telefono","📞 Por teléfono"]].map(([v,l])=>(
                <button key={v} onClick={()=>setEspecial(v)} style={{flex:1,background:especial===v?"#22d3ee0a":"transparent",border:`1px solid ${especial===v?"#22d3ee":"#1e3a5f"}`,color:especial===v?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </>}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
        <button onClick={()=>{if(!nombre.trim()) return; onGuardar({nombre:nombre.trim(),transporte,rol,whatsapp,especial,color:colorNuevo});}} style={{flex:2,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Agregar integrante
        </button>
      </div>
    </Modal>
  );
}

function ModalEditarStaff({ miembro, onGuardar, onBorrar, onClose }) {
  const [nombre,    setNombre]    = useState(miembro.nombre);
  const [transporte,setTransporte]= useState(miembro.transporte);
  const [rol,       setRol]       = useState(miembro.rol||"lavador");
  const [whatsapp,  setWhatsapp]  = useState(miembro.whatsapp!==false);
  const [especial,  setEspecial]  = useState(miembro.especial||"");
  const [confirm,   setConfirm]   = useState(false);
  return (
    <Modal titulo={`Editar: ${miembro.nombre}`} onClose={onClose}>
      <Input label="NOMBRE" value={nombre} onChange={setNombre}/>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>ROL</div>
        <div style={{display:"flex",gap:8}}>
          {["lavador","encargado"].map(r=>(
            <button key={r} onClick={()=>setRol(r)} style={{flex:1,background:rol===r?"#22d3ee0a":"transparent",border:`1px solid ${rol===r?"#22d3ee":"#1e3a5f"}`,color:rol===r?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
              {r==="lavador"?"🚗 Lavador":"👷 Encargado"}
            </button>
          ))}
        </div>
      </div>
      {rol==="lavador" && <>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>TRANSPORTE HABITUAL</div>
          <div style={{display:"flex",gap:8}}>
            {["moto","bici"].map(t=>(
              <button key={t} onClick={()=>setTransporte(t)} style={{flex:1,background:transporte===t?"#22d3ee0a":"transparent",border:`1px solid ${transporte===t?"#22d3ee":"#1e3a5f"}`,color:transporte===t?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {t==="moto"?"🏍 Moto":"🚲 Bici"}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>WHATSAPP</div>
          <div style={{display:"flex",gap:8}}>
            {[true,false].map(v=>(
              <button key={String(v)} onClick={()=>setWhatsapp(v)} style={{flex:1,background:whatsapp===v?"#22d3ee0a":"transparent",border:`1px solid ${whatsapp===v?"#22d3ee":"#1e3a5f"}`,color:whatsapp===v?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {v?"✓ Tiene WA":"✗ Sin WA"}
              </button>
            ))}
          </div>
        </div>
        {!whatsapp && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:5}}>CÓMO AVISAR</div>
            <div style={{display:"flex",gap:8}}>
              {[["avisar_presencia","👁 En persona"],["llamar_telefono","📞 Por teléfono"]].map(([v,l])=>(
                <button key={v} onClick={()=>setEspecial(v)} style={{flex:1,background:especial===v?"#22d3ee0a":"transparent",border:`1px solid ${especial===v?"#22d3ee":"#1e3a5f"}`,color:especial===v?"#22d3ee":"#64748b",borderRadius:8,padding:"8px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </>}
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
        {!confirm
          ? <button onClick={()=>setConfirm(true)} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Eliminar</button>
          : <button onClick={()=>onBorrar(miembro.id)} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>¿Confirmar eliminación?</button>
        }
        <button onClick={onClose} style={{flex:1,background:"transparent",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
        <button onClick={()=>onGuardar(miembro.id,{nombre,transporte,rol,whatsapp,especial})} style={{flex:2,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Guardar cambios
        </button>
      </div>
    </Modal>
  );
}
