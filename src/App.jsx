import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, query, where, getDocs, deleteDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ═══════════════════════════════════════════════════════════════
//  ⚙️  CONFIGURACIÓN FIREBASE — REEMPLAZAR CON TUS DATOS
//  (Instrucciones de setup al final del archivo)
// ═══════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDBZS7KR8YIq8UzAhnq9WaPTh8wGTZ-SMI",
  authDomain:        "sofia-lavados-99231.firebaseapp.com",
  projectId:         "sofia-lavados-99231",
  storageBucket:     "sofia-lavados-99231.firebasestorage.app",
  messagingSenderId: "738758410354",
  appId:             "1:738758410354:web:0c07ee6f2906d8add402eb",
};
const CONFIGURADO = FIREBASE_CONFIG.apiKey !== "TU_API_KEY";

// ─── Init Firebase (solo si está configurado) ───────────────────
let db = null;
if (CONFIGURADO) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
//  BASE DE DATOS LOCAL
// ═══════════════════════════════════════════════════════════════
const CONDUCTORES = [
  { id: 1,  nombre: "Jhony",     transporte: "moto", radio: 25, whatsapp: true,  color: "#22d3ee" },
  { id: 2,  nombre: "Sergio",    transporte: "moto", radio: 25, whatsapp: true,  color: "#0ea5e9" },
  { id: 3,  nombre: "Alexander", transporte: "moto", radio: 25, whatsapp: true,  color: "#38bdf8" },
  { id: 4,  nombre: "Maxi",      transporte: "moto", radio: 25, whatsapp: true,  color: "#7dd3fc" },
  { id: 5,  nombre: "Rene",      transporte: "moto", radio: 25, whatsapp: true,  color: "#06b6d4" },
  { id: 6,  nombre: "Brandon",   transporte: "moto", radio: 25, whatsapp: true,  color: "#67e8f9" },
  { id: 7,  nombre: "Jorge",     transporte: "moto", radio: 25, whatsapp: true,  color: "#a5f3fc" },
  { id: 8,  nombre: "Emiliano",  transporte: "moto", radio: 25, whatsapp: true,  color: "#2dd4bf" },
  { id: 9,  nombre: "Gaby",      transporte: "moto", radio: 25, whatsapp: true,  color: "#5eead4" },
  { id: 10, nombre: "Javi",      transporte: "moto", radio: 25, whatsapp: true,  color: "#99f6e4" },
  { id: 11, nombre: "Franco",    transporte: "moto", radio: 25, whatsapp: true,  color: "#34d399" },
  { id: 12, nombre: "Fede",      transporte: "moto", radio: 25, whatsapp: true,  color: "#6ee7b7" },
  { id: 13, nombre: "Elias",     transporte: "moto", radio: 25, whatsapp: true,  color: "#a7f3d0" },
  { id: 14, nombre: "Alvaro",    transporte: "bici", radio: 15, whatsapp: true,  color: "#c084fc" },
  { id: 15, nombre: "Nestor",    transporte: "bici", radio: 15, whatsapp: true,  color: "#d8b4fe" },
  { id: 16, nombre: "Matias",    transporte: "bici", radio: 15, whatsapp: true,  color: "#e879f9" },
  { id: 17, nombre: "Luis",      transporte: "bici", radio: 15, whatsapp: true,  color: "#f0abfc" },
  { id: 18, nombre: "Bruno",     transporte: "bici", radio: 15, whatsapp: true,  color: "#a78bfa" },
  { id: 19, nombre: "Nico Alto", transporte: "bici", radio: 15, whatsapp: true,  color: "#fbbf24", especial: "rapido" },
  { id: 20, nombre: "Hernán",    transporte: "bici", radio: 15, whatsapp: false, color: "#f87171", especial: "avisar_presencia" },
  { id: 21, nombre: "Gastón",    transporte: "bici", radio: 15, whatsapp: false, color: "#fb923c", especial: "llamar_telefono" },
];

const CLIENTES_DEFAULT = [
  { nombre: "Victoria", direccion: "Dardo Rocha 3278",           autosHabituales: 3, nota: "" },
  { nombre: "Martin",   direccion: "Colectora Panamericana 2065", autosHabituales: 3, nota: "" },
  { nombre: "Micaela",  direccion: "Eduardo Costa 902",           autosHabituales: 1, nota: "" },
  { nombre: "Hyundai",  direccion: "Av. Santa Fe 2627",           autosHabituales: 4, nota: "Confirmar cantidad (3-5 autos)" },
  { nombre: "Mariana",  direccion: "Diagonal Salta 557",          autosHabituales: 1, nota: "" },
];

const SERVICIOS = [
  { id: "basico",   nombre: "Lavado Básico",     precio: 8000  },
  { id: "completo", nombre: "Lavado Completo",   precio: 12000 },
  { id: "premium",  nombre: "Premium Detailing", precio: 18000 },
];

const FRANJAS = ["09:00","10:30","12:00","13:30","15:00","16:30"];

// ═══════════════════════════════════════════════════════════════
//  CAPA FIRESTORE
// ═══════════════════════════════════════════════════════════════

// Clave del día: "agenda_2026-04-20"
const fechaHoy = () => new Date().toISOString().split("T")[0];
const agendaDocId = (fecha = fechaHoy()) => `agenda_${fecha}`;
const cierreColId = (fecha = fechaHoy()) => `cierre_${fecha}`;

// Lee agenda del día → devuelve objeto { "condId_hora": { estado, ... } }
async function fsGetAgenda(fecha) {
  if (!db) return {};
  try {
    const snap = await getDoc(doc(db, "agenda", agendaDocId(fecha)));
    return snap.exists() ? (snap.data().slots || {}) : {};
  } catch { return {}; }
}

// Guarda agenda completa del día (merge para no pisar otros campos)
async function fsSetAgenda(slots, fecha) {
  if (!db) return;
  try {
    await setDoc(doc(db, "agenda", agendaDocId(fecha)), { slots, updatedAt: serverTimestamp() }, { merge: true });
  } catch {}
}

// Agrega un registro de pago
async function fsAddRegistro(registro, fecha) {
  if (!db) return null;
  try {
    const ref = await addDoc(collection(db, cierreColId(fecha)), {
      ...registro, createdAt: serverTimestamp()
    });
    return ref.id;
  } catch { return null; }
}

// Lee registros del día
async function fsGetRegistros(fecha) {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, cierreColId(fecha)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const franjaIdx        = h  => FRANJAS.indexOf(h);
const esTarde          = h  => franjaIdx(h) >= 3;
const franjaFin        = h  => { const [hr,mn]=h.split(":").map(Number); return `${String(hr+1).padStart(2,"0")}:${String(mn).padStart(2,"0")}`; };
const franjasBloq      = (h,n) => Array.from({length:n-1},(_,i)=>FRANJAS[franjaIdx(h)+1+i]).filter(Boolean);
const formatPesos      = n  => "$" + Number(n).toLocaleString("es-AR");
const distSim          = (id,dir) => 5 + ((id*17 + dir.split("").reduce((a,c)=>a+c.charCodeAt(0),0)*7) % 35);

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES
// ═══════════════════════════════════════════════════════════════

function Toast({ msg, tipo, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const c={ok:"#22d3ee",error:"#f87171",warn:"#fbbf24"}[tipo]||"#22d3ee";
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:"#0b1220",
      border:`1px solid ${c}55`,color:c,padding:"12px 18px",borderRadius:10,
      fontSize:12,fontFamily:"inherit",boxShadow:`0 4px 20px ${c}22`,animation:"fadein .2s ease"}}>
      {tipo==="ok"?"✓":tipo==="error"?"✗":"⚠"} {msg}
    </div>
  );
}

function FirebaseStatus({ ok, cargando, onReload }) {
  return (
    <div onClick={onReload} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,
      padding:"4px 10px",borderRadius:6,cursor:"pointer",
      background:ok?"#34d39910":"#f8717110",
      border:`1px solid ${ok?"#34d39933":"#f8717133"}`,
      color:ok?"#6ee7b7":"#fca5a5"}}>
      <span style={{animation:cargando?"spin .7s linear infinite":"none",display:"inline-block"}}>
        {cargando?"⟳":ok?"●":"○"}
      </span>
      {cargando?"Conectando…":ok?"Firebase ✓":!CONFIGURADO?"Sin configurar":"Firebase offline"}
    </div>
  );
}

function AlertaConductor({ conductor }) {
  if (!conductor?.especial) return null;
  const cfg={
    rapido:            {c:"#fbbf24",msg:"⚡ Nico Alto es rápido — puede adelantar turno si termina antes de los 90 min."},
    avisar_presencia:  {c:"#f87171",msg:"🔴 Hernán no tiene celular — Avisar en persona antes del turno."},
    llamar_telefono:   {c:"#fb923c",msg:"📞 Gastón no tiene WhatsApp — Llamar por teléfono."},
  };
  const s=cfg[conductor.especial];
  return <div style={{padding:"10px 14px",background:`${s.c}18`,border:`1px solid ${s.c}44`,borderRadius:8,fontSize:12,color:s.c,marginTop:10}}>{s.msg}</div>;
}

function CeldaTurno({ conductor, hora, agenda, dir, listaVacia, seleccionada, onSelect }) {
  const key  = `${conductor.id}_${hora}`;
  const slot = agenda[key];
  let estado = "libre";
  if (slot?.estado==="ocupado")   estado="ocupado";
  else if (slot?.estado==="bloqueado") estado="bloqueado";
  else if (dir) {
    const c=distSim(conductor.id,dir), r=conductor.radio;
    if (listaVacia&&esTarde(hora)) estado=c>r*1.5?"fz_aceptable":"verde";
    else if (c<=r) estado="verde";
    else if (c<=r*1.4) estado="amarillo";
    else estado="fz";
  }
  const bloq = estado==="ocupado"||estado==="bloqueado";
  const E={
    libre:        {bg:"#0b122088",bd:"#1e2d40",     txt:"#1e3a5f",lbl:"·"},
    verde:        {bg:"#34d39913",bd:"#34d39955",   txt:"#6ee7b7",lbl:"● libre"},
    amarillo:     {bg:"#fbbf2413",bd:"#fbbf2455",   txt:"#fde68a",lbl:"◐ lejos"},
    fz:           {bg:"#a78bfa13",bd:"#a78bfa55",   txt:"#c4b5fd",lbl:"⬡ FZ"},
    fz_aceptable: {bg:"#7c3aed18",bd:"#7c3aed88",   txt:"#ddd6fe",lbl:"⬡ FZ ok"},
    ocupado:      {bg:"#ef444408",bd:"#ef444422",   txt:"#374151",lbl:"● turno"},
    bloqueado:    {bg:"#ef444405",bd:"#ef444415",   txt:"#1e2d40", lbl:"— bloq"},
  }[estado];
  return (
    <div onClick={()=>!bloq&&onSelect(conductor.id,hora,estado)}
      style={{padding:"9px 6px",borderRadius:7,textAlign:"center",fontSize:11,
        background:E.bg,border:`1px solid ${seleccionada?conductor.color:E.bd}`,
        color:seleccionada?conductor.color:E.txt,
        cursor:bloq?"not-allowed":"pointer",
        outline:seleccionada?`2px solid ${conductor.color}44`:"none",
        outlineOffset:1,transition:"all .15s",fontFamily:"inherit"}}>
      {E.lbl}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════
export default function SofiaFirebase() {
  // ── Firebase state
  const [fbOk, setFbOk]       = useState(false);
  const [fbCarg, setFbCarg]   = useState(false);

  // ── Datos
  const [agenda, setAgenda]       = useState({});
  const [registros, setRegistros] = useState([]);
  const [clientes]                = useState(CLIENTES_DEFAULT);

  // ── UI
  const [vista, setVista]     = useState("turno");
  const [paso, setPaso]       = useState(1);
  const [toast, setToast]     = useState(null);
  const [guardando, setGuardando] = useState(false);

  // ── Formulario
  const [clienteInput, setClienteInput] = useState("");
  const [sugerencias, setSugerencias]   = useState([]);
  const [direccion, setDireccion]       = useState("");
  const [cantAutos, setCantAutos]       = useState(1);
  const [servicio, setServicio]         = useState("completo");
  const [notas, setNotas]               = useState("");
  const [metodoPago, setMetodoPago]     = useState("efectivo");
  const [condSelId, setCondSelId]       = useState(null);
  const [horaSelec, setHoraSelec]       = useState("");
  const [estadoSelec, setEstadoSelec]   = useState("");
  const [msgCopiado, setMsgCopiado]     = useState(false);

  // ── Filtros
  const [filtroT, setFiltroT]       = useState("todos");
  const [filtroBusca, setFiltroBusca] = useState("");

  // ── IA
  const [iaResp, setIaResp]   = useState("");
  const [iaLoad, setIaLoad]   = useState(false);
  const [iaPanel, setIaPanel] = useState(false);

  const showToast = (msg, tipo="ok") => setToast({msg,tipo});

  // ── Computed
  const condFiltrados  = CONDUCTORES.filter(c=>(filtroT==="todos"||c.transporte===filtroT)&&(!filtroBusca||c.nombre.toLowerCase().includes(filtroBusca.toLowerCase())));
  const hayTurnos      = Object.values(agenda).some(v=>v?.estado==="ocupado"&&esTarde(v?.hora||""));
  const listaVaciaTarde= !hayTurnos;
  const conductorSel   = CONDUCTORES.find(c=>c.id===condSelId);
  const servicioSel    = SERVICIOS.find(s=>s.id===servicio);
  const totalBase      = (servicioSel?.precio||0)*cantAutos;
  const esFZ           = estadoSelec==="fz"||estadoSelec==="fz_aceptable";
  const totalFinal     = esFZ?Math.round(totalBase*1.20):totalBase;
  const bloqueadas     = horaSelec?franjasBloq(horaSelec,cantAutos):[];
  const totalDia       = registros.reduce((s,r)=>s+Number(r.total||0),0);
  const totalMP        = registros.filter(r=>r.metodo==="mp").reduce((s,r)=>s+Number(r.total||0),0);
  const totalEfect     = registros.filter(r=>r.metodo==="efectivo").reduce((s,r)=>s+Number(r.total||0),0);

  // ── Init: cargar datos
  useEffect(()=>{ cargarDatos(); },[]);

  async function cargarDatos() {
    if (!CONFIGURADO) { showToast("Modo local — Firebase no configurado","warn"); return; }
    setFbCarg(true);
    try {
      const [ag, regs] = await Promise.all([fsGetAgenda(), fsGetRegistros()]);
      setAgenda(ag);
      setRegistros(regs);
      setFbOk(true);
      showToast("Firebase conectado ✓");
    } catch {
      setFbOk(false);
      showToast("Firebase offline — modo local","warn");
    }
    setFbCarg(false);
  }

  // ── Escucha en tiempo real la agenda del día
  useEffect(()=>{
    if (!db||!CONFIGURADO) return;
    const unsub = onSnapshot(doc(db,"agenda",agendaDocId()), snap=>{
      if (snap.exists()) setAgenda(snap.data().slots||{});
    });
    return ()=>unsub();
  },[]);

  // ── Autocompletado
  function handleClienteInput(val){
    setClienteInput(val);
    setSugerencias(val.length>=2?clientes.filter(c=>c.nombre.toLowerCase().startsWith(val.toLowerCase())):[]);
  }
  function aplicarCliente(c){
    setClienteInput(c.nombre); setDireccion(c.direccion);
    setCantAutos(Number(c.autosHabituales)||1);
    if(c.nota) setNotas(c.nota);
    setSugerencias([]);
  }

  // ── Seleccionar turno
  function seleccionarTurno(condId,hora,estado){
    setCondSelId(condId); setHoraSelec(hora); setEstadoSelec(estado);
    setPaso(Math.max(paso,3));
  }

  // ── Confirmar turno → persiste en Firestore
  async function confirmarTurno(){
    if(!condSelId||!horaSelec) return;
    setGuardando(true);

    const nueva={...agenda};
    nueva[`${condSelId}_${horaSelec}`]={estado:"ocupado",hora:horaSelec,conductorId:condSelId,conductorNombre:conductorSel?.nombre,direccion,cantAutos,servicio,notas};
    franjasBloq(horaSelec,cantAutos).forEach(h=>{
      nueva[`${condSelId}_${h}`]={estado:"bloqueado",hora:h,conductorId:condSelId};
    });
    setAgenda(nueva);

    if(CONFIGURADO){
      await fsSetAgenda(nueva);
      showToast("Turno guardado en Firebase ✓");
    } else {
      showToast("Turno confirmado (local)","warn");
    }
    setGuardando(false);
    setPaso(4);
  }

  // ── Generar mensaje WA
  function generarMensaje(){
    const notasLines=notas.trim()?`\n⚠️ *Instrucciones:*\n${notas.split(",").map(n=>`• ${n.trim()}`).join("\n")}`:"";
    const fzLine=esFZ?"\n🌐 *Servicio fuera de zona — recargo de traslado incluido.*":"";
    const icono=conductorSel?.transporte==="moto"?"🏍":"🚲";
    return `🚿 *SOFÍA LAVADOS — Turno confirmado*\n\n📍 *Dirección:* ${direccion}\n🕐 *Llegada:* ${horaSelec} a ${franjaFin(horaSelec)} hs\n🚗 *Autos:* ${cantAutos} × ${servicioSel?.nombre}\n💰 *Cobrar:* ${formatPesos(totalFinal)} (${metodoPago==="mp"?"Mercado Pago":"Efectivo"})${fzLine}${notasLines}\n\n${icono} Confirmá arribo cuando llegues. ¡Gracias!`;
  }

  async function copiarMensaje(){
    try{await navigator.clipboard.writeText(generarMensaje());}catch{}
    setMsgCopiado(true); setTimeout(()=>setMsgCopiado(false),2500);
  }

  // ── Registrar pago → persiste en Firestore
  async function registrarPago(){
    setGuardando(true);
    const reg={
      hora:horaSelec, conductor:conductorSel?.nombre, cliente:clienteInput,
      direccion, autos:cantAutos, servicio:servicioSel?.nombre,
      total:totalFinal, metodo:metodoPago, esFZ, notas,
      ts:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
    };

    if(CONFIGURADO){
      const id=await fsAddRegistro(reg);
      if(id){ setRegistros(prev=>[...prev,{id,...reg}]); showToast(`Pago ${formatPesos(totalFinal)} guardado ✓`); }
      else   { setRegistros(prev=>[...prev,{id:Date.now(),...reg}]); showToast("Guardado local (Firestore falló)","warn"); }
    } else {
      setRegistros(prev=>[...prev,{id:Date.now(),...reg}]);
      showToast("Pago registrado (local)","warn");
    }

    setClienteInput(""); setDireccion(""); setCantAutos(1); setNotas("");
    setCondSelId(null); setHoraSelec(""); setEstadoSelec(""); setIaResp("");
    setPaso(1); setGuardando(false);
  }

  // ── IA
  async function consultarIA(){
    setIaLoad(true); setIaResp("");
    try{
      const conds=CONDUCTORES.filter(c=>c.whatsapp).slice(0,8).map(c=>`${c.nombre}(${c.transporte},r:${c.radio})`).join(", ");
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",
          content:`Sos asistente logístico de "Sofía Lavados Móvil", norte del GBA, Argentina. Respondé en español, directo, máx 4 oraciones, sin markdown.\n\nSituación: cliente=${clienteInput||"?"}, dirección=${direccion||"?"}, autos=${cantAutos}, servicio=${servicioSel?.nombre}, hora=${horaSelec||"?"}, notas=${notas||"ninguna"}, tarde vacía=${listaVaciaTarde?"SÍ":"NO"}.\nConductores: ${conds}.\n\nRecomendá conductor óptimo, si aplica recargo FZ y cualquier advertencia operativa.`}]})
      });
      const d=await res.json();
      setIaResp(d.content?.find(b=>b.type==="text")?.text||"Sin respuesta.");
    }catch{ setIaResp("Error de conexión."); }
    setIaLoad(false);
  }

  // ── Setup instructions panel
  const [showSetup, setShowSetup] = useState(!CONFIGURADO);

  // ═══ CSS ═══════════════════════════════════════════════════════
  const css=`
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
    .btn{border:none;border-radius:8px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;padding:10px 18px;transition:all .2s;letter-spacing:.04em}
    .bp{background:linear-gradient(135deg,#0e7490,#1d4ed8);color:#fff}.bp:hover{opacity:.85;transform:translateY(-1px)}.bp:disabled{opacity:.35;cursor:not-allowed;transform:none}
    .bg_{background:transparent;border:1px solid #1e3a5f;color:#64748b}.bg_:hover{border-color:#334155;color:#94a3b8}.bg_.on{border-color:#22d3ee;color:#22d3ee;background:#22d3ee0a}
    .card{background:#0b1220;border:1px solid #1e2d40;border-radius:12px;padding:18px}
    .lbl{font-size:10px;color:#334155;letter-spacing:.15em;margin-bottom:7px}
    .hr{height:1px;background:linear-gradient(90deg,transparent,#1e3a5f,transparent);margin:14px 0}
    .nav{background:transparent;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;padding:8px 14px;border-radius:8px;color:#475569;transition:all .2s}.nav:hover{color:#94a3b8;background:#fff8}.nav.on{color:#22d3ee;background:#22d3ee0f;border-bottom:2px solid #22d3ee}
    code{background:#0f172a;color:#22d3ee;padding:2px 7px;border-radius:4px;font-size:11px}
  `;

  // ═══ RENDER ════════════════════════════════════════════════════
  return (
    <div className="ff" style={{background:"#080c18",minHeight:"100vh",color:"#e2e8f0"}}>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} tipo={toast.tipo} onClose={()=>setToast(null)}/>}

      {/* NAV */}
      <header style={{background:"#0b1220",borderBottom:"1px solid #1e2d40",padding:"0 24px",display:"flex",alignItems:"center",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",marginRight:28}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0e7490,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🚿</div>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:".1em",color:"#f1f5f9",lineHeight:1}}>SOFÍA LAVADOS</div>
            <div style={{fontSize:9,color:"#1e3a5f",letterSpacing:".2em"}}>v2.0 + FIREBASE</div>
          </div>
        </div>
        {[{id:"turno",l:"+ Nuevo Turno"},{id:"agenda",l:"Agenda"},{id:"staff",l:"Staff"},{id:"cierre",l:`Cierre${registros.length?` (${registros.length})`:""}`}].map(v=>(
          <button key={v.id} className={`nav ${vista===v.id?"on":""}`} onClick={()=>setVista(v.id)}>{v.l}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {listaVaciaTarde&&<span style={{background:"#312e8118",border:"1px solid #312e8144",color:"#a5b4fc",padding:"4px 10px",borderRadius:6,fontSize:10}}>📋 TARDE LIBRE — modo flexible</span>}
          <FirebaseStatus ok={fbOk} cargando={fbCarg} onReload={cargarDatos}/>
          <button className="bg_ btn" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>setShowSetup(!showSetup)}>⚙ Setup</button>
        </div>
      </header>

      {/* PANEL SETUP FIREBASE */}
      {showSetup&&(
        <div className="fade" style={{background:"#0d1b3a",borderBottom:"1px solid #1e3a5f",padding:"20px 24px"}}>
          <div style={{maxWidth:820,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".1em",color:"#60a5fa"}}>⚙ CONFIGURACIÓN FIREBASE — 5 PASOS</div>
              <button className="bg_ btn" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>setShowSetup(false)}>✕ Cerrar</button>
            </div>
            {[
              {n:1,t:"Crear proyecto",d:<>Ir a <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{color:"#22d3ee"}}>console.firebase.google.com</a> → "Agregar proyecto" → nombre: <code>sofia-lavados</code> → desactivar Analytics → Crear proyecto.</>},
              {n:2,t:"Crear base de datos",d:<>En el menú izquierdo → <code>Firestore Database</code> → "Crear base de datos" → Modo producción → elegir ubicación <code>southamerica-east1</code> (São Paulo, la más cercana a Buenos Aires).</>},
              {n:3,t:"Configurar reglas de seguridad",d:<>En Firestore → pestaña <code>Reglas</code> → reemplazar con:<br/><br/><code style={{display:"block",padding:"10px",marginTop:6,lineHeight:1.6}}>{"rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}"}</code><br/>Esto permite acceso libre (ideal para uso personal). Publicar.</>},
              {n:4,t:"Obtener credenciales",d:<>En el menú izquierdo → ⚙ Configuración del proyecto → pestaña <code>General</code> → sección "Tus apps" → click en <code>&lt;/&gt;</code> (Web) → nombre: <code>sofia-web</code> → Registrar app → copiás el objeto <code>firebaseConfig</code> que aparece.</>},
              {n:5,t:"Pegar en el código",d:<>En este archivo JSX, reemplazá el objeto <code>FIREBASE_CONFIG</code> (línea ~20) con los valores que copiaste en el paso anterior. Guardá y recargá la página. El indicador "Firebase ✓" se pondrá verde.</>},
            ].map(s=>(
              <div key={s.n} style={{display:"flex",gap:14,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:"#1d4ed822",border:"1px solid #1d4ed855",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#60a5fa",flexShrink:0,marginTop:2}}>{s.n}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:5}}>{s.t}</div>
                  <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{s.d}</div>
                </div>
              </div>
            ))}
            <div style={{padding:"12px 16px",background:"#34d39908",border:"1px solid #34d39922",borderRadius:8,fontSize:12,color:"#6ee7b7",marginTop:4}}>
              ✓ <strong>Plan Spark (gratuito):</strong> 1 GB almacenamiento · 50.000 lecturas/día · 20.000 escrituras/día · suficiente para años de uso de Sofía.
            </div>
          </div>
        </div>
      )}

      <main style={{maxWidth:1280,margin:"0 auto",padding:"24px 20px"}}>

        {/* ══ NUEVO TURNO ══ */}
        {vista==="turno"&&(
          <div className="fade" style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:20,alignItems:"start"}}>

            {/* Columna izquierda */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* PASO 1 */}
              <div className="card" style={{borderColor:paso===1?"#22d3ee33":"#1e2d40"}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{background:"#22d3ee",color:"#080c18",borderRadius:5,padding:"1px 7px",fontSize:11}}>01</span> Datos del servicio
                </div>
                {/* Autocomplete cliente */}
                <div style={{position:"relative",marginBottom:10}}>
                  <div className="lbl">CLIENTE</div>
                  <input placeholder="Victoria, Martin, Hyundai…" value={clienteInput} onChange={e=>handleClienteInput(e.target.value)}/>
                  {sugerencias.length>0&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0b1220",border:"1px solid #22d3ee44",borderRadius:8,zIndex:20,overflow:"hidden",marginTop:2}}>
                      {sugerencias.map(s=>(
                        <div key={s.nombre} onClick={()=>aplicarCliente(s)}
                          style={{padding:"10px 14px",cursor:"pointer",fontSize:12,borderBottom:"1px solid #1e2d40"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#22d3ee0a"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{color:"#22d3ee",fontWeight:600}}>{s.nombre}</div>
                          <div style={{color:"#475569",fontSize:11}}>{s.direccion} · {s.autosHabituales} auto{s.autosHabituales>1?"s":""}</div>
                          {s.nota&&<div style={{color:"#fbbf24",fontSize:10,marginTop:2}}>⚠ {s.nota}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lbl">DIRECCIÓN</div>
                <input placeholder="Av. Maipú 1234, Olivos" value={direccion} onChange={e=>setDireccion(e.target.value)} style={{marginBottom:10}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 70px",gap:8,marginBottom:10}}>
                  <div><div className="lbl">SERVICIO</div>
                    <select value={servicio} onChange={e=>setServicio(e.target.value)}>
                      {SERVICIOS.map(s=><option key={s.id} value={s.id}>{s.nombre} — {formatPesos(s.precio)}</option>)}
                    </select>
                  </div>
                  <div><div className="lbl">AUTOS</div>
                    <input type="number" min={1} max={5} value={cantAutos} onChange={e=>setCantAutos(Number(e.target.value))}/>
                  </div>
                </div>
                <div className="lbl">NOTAS OPERATIVAS</div>
                <textarea rows={2} placeholder="cliente detallista, insectos de ruta, decir precio antes…" value={notas} onChange={e=>setNotas(e.target.value)}/>
                {cantAutos>1&&<div style={{marginTop:10,padding:"8px 12px",background:"#fbbf2410",border:"1px solid #fbbf2433",borderRadius:8,fontSize:11,color:"#fde68a"}}>
                  ⏱ {cantAutos} autos = {cantAutos*1.5}h — bloquea {cantAutos-1} franja{cantAutos>2?"s":""} siguiente{cantAutos>2?"s":""}
                </div>}
                <button className="btn bp" style={{width:"100%",marginTop:12}} disabled={!direccion} onClick={()=>setPaso(Math.max(paso,2))}>
                  Ver disponibilidad →
                </button>
              </div>

              {/* PASO 3: Confirmar */}
              {paso>=3&&condSelId&&horaSelec&&(
                <div className="card fade" style={{borderColor:"#34d39933"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#34d399",color:"#080c18",borderRadius:5,padding:"1px 7px",fontSize:11}}>03</span> Confirmar turno
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:12,marginBottom:14}}>
                    {[
                      ["Lavador",<span style={{color:conductorSel?.color}}>{conductorSel?.nombre} <span style={{color:"#475569"}}>({conductorSel?.transporte})</span></span>],
                      ["Hora interna",horaSelec],
                      ["Franja cliente",<span style={{color:"#22d3ee"}}>{horaSelec} → {franjaFin(horaSelec)} hs</span>],
                      ["Servicio",`${servicioSel?.nombre} × ${cantAutos}`],
                      esFZ&&["Zona",<span style={{color:"#c4b5fd"}}>⬡ FZ — recargo 20% aplicado</span>],
                      bloqueadas.length>0&&["Bloquea",<span style={{color:"#fde68a"}}>{bloqueadas.join(", ")}</span>],
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
                  <AlertaConductor conductor={conductorSel}/>
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button className={`btn bg_ ${metodoPago==="efectivo"?"on":""}`} onClick={()=>setMetodoPago("efectivo")}>💵 Efectivo</button>
                    <button className={`btn bg_ ${metodoPago==="mp"?"on":""}`} onClick={()=>setMetodoPago("mp")}>📱 Mercado Pago</button>
                  </div>
                  <button className="btn bp" style={{width:"100%",marginTop:12}} disabled={guardando} onClick={confirmarTurno}>
                    {guardando?"⟳ Guardando…":"Confirmar y enviar al lavador →"}
                  </button>
                </div>
              )}

              {/* PASO 4: WhatsApp */}
              {paso>=4&&(
                <div className="card fade" style={{background:"#052e1c",borderColor:"#16a34a44"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"#4ade80",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#16a34a",color:"#fff",borderRadius:5,padding:"1px 7px",fontSize:11}}>04</span>
                    📲 Mensaje para el lavador
                  </div>
                  <pre style={{fontFamily:"inherit",fontSize:11.5,color:"#bbf7d0",whiteSpace:"pre-wrap",lineHeight:1.75,background:"#041a0f",padding:14,borderRadius:8,border:"1px solid #16a34a22"}}>
                    {generarMensaje()}
                  </pre>
                  <AlertaConductor conductor={conductorSel}/>
                  {conductorSel?.whatsapp
                    ? <button className="btn" style={{width:"100%",marginTop:12,background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff"}} onClick={copiarMensaje}>
                        {msgCopiado?"✓ Copiado — pegá en WhatsApp":`📋 Copiar para WA de ${conductorSel?.nombre}`}
                      </button>
                    : conductorSel?.especial==="avisar_presencia"
                      ? <div style={{marginTop:12,padding:"10px 14px",background:"#991b1b22",border:"1px solid #991b1b55",borderRadius:8,color:"#fca5a5",fontSize:12,textAlign:"center"}}>🔴 Hernán — <strong>Avisar en persona</strong></div>
                      : <div style={{marginTop:12,padding:"10px 14px",background:"#9a341222",border:"1px solid #9a341255",borderRadius:8,color:"#fdba74",fontSize:12,textAlign:"center"}}>📞 Gastón — <strong>Llamar por teléfono</strong></div>
                  }
                  <button className="btn bp" style={{width:"100%",marginTop:8}} onClick={()=>setPaso(5)}>
                    ✓ Confirmé arribo → Registrar pago
                  </button>
                </div>
              )}

              {/* PASO 5: Pago */}
              {paso>=5&&(
                <div className="card fade" style={{borderColor:"#fbbf2433"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"#fde68a",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#d97706",color:"#fff",borderRadius:5,padding:"1px 7px",fontSize:11}}>05</span>
                    Registrar pago
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <span style={{color:"#64748b",fontSize:13}}>Total a cobrar:</span>
                    <strong style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#22d3ee"}}>{formatPesos(totalFinal)}</strong>
                  </div>
                  <button className="btn" style={{width:"100%",background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff"}} disabled={guardando} onClick={registrarPago}>
                    {guardando?"⟳ Guardando…":"💰 Confirmar cobro y cerrar turno"}
                  </button>
                </div>
              )}
            </div>

            {/* Columna derecha: Grilla + IA */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="card" style={{borderColor:paso>=2?"#a78bfa33":"#1e2d40"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:"#7c3aed",color:"#fff",borderRadius:5,padding:"1px 7px",fontSize:11}}>02</span>
                    Semáforo Geográfico
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[["#6ee7b7","#34d399","● libre"],["#fde68a","#fbbf24","◐ lejos"],["#c4b5fd","#a78bfa","⬡ FZ"],["#fca5a5","#ef4444","○ no disp"]].map(([tc,bc,l])=>(
                      <span key={l} style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:`${bc}18`,border:`1px solid ${bc}44`,color:tc}}>{l}</span>
                    ))}
                  </div>
                </div>
                {/* Filtros */}
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {["todos","moto","bici"].map(t=>(
                    <button key={t} className={`btn bg_ ${filtroT===t?"on":""}`} style={{padding:"5px 12px",fontSize:10}} onClick={()=>setFiltroT(t)}>
                      {t==="todos"?"Todos":t==="moto"?"🏍 Motos":"🚲 Bicis"}
                    </button>
                  ))}
                  <input placeholder="Buscar…" value={filtroBusca} onChange={e=>setFiltroBusca(e.target.value)} style={{width:130,padding:"5px 10px",fontSize:11}}/>
                </div>
                {paso<2
                  ? <div style={{textAlign:"center",padding:28,color:"#1e3a5f",fontSize:13}}>Completá la dirección y tocá "Ver disponibilidad"</div>
                  : <div style={{overflowX:"auto"}}>
                      <div style={{display:"grid",gridTemplateColumns:`70px repeat(${condFiltrados.length},minmax(72px,1fr))`,gap:4,marginBottom:6}}>
                        <div style={{fontSize:10,color:"#1e3a5f",padding:"6px"}}>HORA</div>
                        {condFiltrados.map(c=>(
                          <div key={c.id} style={{fontSize:10,textAlign:"center",padding:"4px 2px",color:c.color,borderBottom:`2px solid ${c.color}44`,lineHeight:1.4}}>
                            <div style={{fontWeight:600}}>{c.nombre}</div>
                            <div style={{opacity:.6}}>{c.transporte==="moto"?"🏍":"🚲"}</div>
                            {c.especial&&<div style={{fontSize:9,color:c.color}}>{c.especial==="rapido"?"⚡":"📵"}</div>}
                          </div>
                        ))}
                      </div>
                      {FRANJAS.map(hora=>(
                        <div key={hora} style={{display:"grid",gridTemplateColumns:`70px repeat(${condFiltrados.length},minmax(72px,1fr))`,gap:4,marginBottom:4}}>
                          <div style={{fontSize:11,padding:"8px 6px",display:"flex",flexDirection:"column",gap:1}}>
                            <span style={{color:esTarde(hora)?"#a78bfa":"#94a3b8",fontWeight:600}}>{hora}</span>
                            <span style={{fontSize:9,color:"#1e3a5f"}}>→ {franjaFin(hora)}</span>
                          </div>
                          {condFiltrados.map(c=>(
                            <CeldaTurno key={c.id} conductor={c} hora={hora} agenda={agenda} dir={direccion} listaVacia={listaVaciaTarde} seleccionada={condSelId===c.id&&horaSelec===hora} onSelect={seleccionarTurno}/>
                          ))}
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* IA */}
              <div style={{background:"linear-gradient(135deg,#0d1b3e,#0b1220)",border:"1px solid #1e3a5f",borderRadius:12,padding:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:iaPanel?12:0}}>
                  <div style={{fontSize:11,color:"#4f46e5",letterSpacing:".1em",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>✦</span> ASISTENTE IA LOGÍSTICO
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn bg_" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>setIaPanel(!iaPanel)}>{iaPanel?"Cerrar":"Abrir"}</button>
                    {iaPanel&&<button className="btn" style={{fontSize:10,padding:"4px 10px",background:"#1d4ed8",color:"#fff"}} onClick={consultarIA} disabled={iaLoad}>
                      {iaLoad?<span style={{display:"inline-block",animation:"spin .7s linear infinite"}}>⟳</span>:"Consultar"}
                    </button>}
                  </div>
                </div>
                {iaPanel&&(
                  <div className="fade">
                    {iaLoad&&<div style={{color:"#6366f1",fontSize:12}}>● Analizando…</div>}
                    {iaResp&&<div style={{fontSize:12,color:"#a5b4fc",lineHeight:1.7,borderTop:"1px solid #1e3a5f",paddingTop:10}}>{iaResp}</div>}
                    {!iaResp&&!iaLoad&&<div style={{fontSize:11,color:"#1e3a5f"}}>Completá los datos y tocá "Consultar".</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ AGENDA ══ */}
        {vista==="agenda"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>AGENDA — HOY · {fechaHoy()}</div>
              <button className="btn bg_" style={{fontSize:11,padding:"5px 12px"}} onClick={cargarDatos}>⟳ Refrescar</button>
            </div>
            <div className="card" style={{overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:`80px repeat(${CONDUCTORES.length},minmax(65px,1fr))`,gap:3,minWidth:900}}>
                <div style={{padding:"6px",fontSize:10,color:"#1e3a5f"}}>HORA</div>
                {CONDUCTORES.map(c=>(
                  <div key={c.id} style={{fontSize:9.5,textAlign:"center",padding:"4px 2px",color:c.color,borderBottom:`2px solid ${c.color}33`,lineHeight:1.4}}>
                    <div style={{fontWeight:600}}>{c.nombre}</div>
                    <div style={{opacity:.5}}>{c.transporte==="moto"?"🏍":"🚲"}</div>
                  </div>
                ))}
                {FRANJAS.map(hora=>(
                  <>
                    <div key={`h_${hora}`} style={{fontSize:11,padding:"10px 6px",color:esTarde(hora)?"#a78bfa":"#64748b",fontWeight:600}}>{hora}</div>
                    {CONDUCTORES.map(c=>{
                      const est=agenda[`${c.id}_${hora}`]?.estado;
                      return <div key={c.id} style={{padding:"9px 4px",borderRadius:6,textAlign:"center",fontSize:10,
                        background:est==="ocupado"?`${c.color}18`:est==="bloqueado"?"#ef444410":"#0b122088",
                        border:`1px solid ${est==="ocupado"?c.color+"44":est==="bloqueado"?"#ef444422":"#1e2d40"}`,
                        color:est==="ocupado"?c.color:est==="bloqueado"?"#374151":"#1e3a5f"}}>
                        {est==="ocupado"?"● turno":est==="bloqueado"?"— bloq":"·"}
                      </div>;
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ STAFF ══ */}
        {vista==="staff"&&(
          <div className="fade">
            <div style={{fontSize:10,color:"#334155",letterSpacing:".15em",marginBottom:16}}>DIRECTORIO — {CONDUCTORES.length} LAVADORES</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10}}>
              {CONDUCTORES.map(c=>(
                <div key={c.id} className="card" style={{borderColor:`${c.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:`${c.color}22`,border:`2px solid ${c.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
                      {c.transporte==="moto"?"🏍":"🚲"}
                    </div>
                    <div>
                      <div style={{fontWeight:600,color:c.color,fontSize:13}}>{c.nombre}</div>
                      <div style={{fontSize:10,color:"#475569"}}>{c.transporte} · {c.radio} cuas.</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    <span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:c.whatsapp?"#34d39918":"#ef444418",border:`1px solid ${c.whatsapp?"#34d39944":"#ef444444"}`,color:c.whatsapp?"#6ee7b7":"#fca5a5"}}>
                      {c.whatsapp?"✓ WhatsApp":"✗ Sin WA"}
                    </span>
                    {c.especial==="rapido"&&<span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:"#fbbf2418",border:"1px solid #fbbf2444",color:"#fde68a"}}>⚡ Rápido</span>}
                    {c.especial==="avisar_presencia"&&<span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:"#f8717118",border:"1px solid #f8717144",color:"#fca5a5"}}>👁 Avisar presencia</span>}
                    {c.especial==="llamar_telefono"&&<span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:"#fb923c18",border:"1px solid #fb923c44",color:"#fdba74"}}>📞 Llamar tel.</span>}
                  </div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {FRANJAS.map(h=>{
                      const s=agenda[`${c.id}_${h}`]?.estado;
                      return <div key={h} title={h} style={{width:28,height:18,borderRadius:4,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",
                        background:s==="ocupado"?`${c.color}33`:s==="bloqueado"?"#ef444422":"#1e2d40",
                        border:`1px solid ${s==="ocupado"?c.color+"55":"#1e2d40"}`,color:s==="ocupado"?c.color:"#334155"}}>
                        {h.replace(":","").slice(0,3)}
                      </div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CIERRE ══ */}
        {vista==="cierre"&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:10,color:"#334155",letterSpacing:".15em"}}>CIERRE DEL DÍA · {fechaHoy()}</div>
              <button className="btn bg_" style={{fontSize:11,padding:"5px 12px"}} onClick={cargarDatos}>⟳ Refrescar</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
              {[{l:"TOTAL DÍA",v:formatPesos(totalDia),c:"#22d3ee"},{l:"MERCADO PAGO",v:formatPesos(totalMP),c:"#a78bfa"},{l:"EFECTIVO",v:formatPesos(totalEfect),c:"#34d399"},{l:"TURNOS FZ",v:registros.filter(r=>r.esFZ).length,c:"#fbbf24"}].map(s=>(
                <div key={s.l} className="card" style={{textAlign:"center",borderColor:`${s.c}33`}}>
                  <div style={{fontSize:9,color:"#334155",marginBottom:8,letterSpacing:".15em"}}>{s.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {registros.length===0
              ? <div className="card" style={{textAlign:"center",color:"#1e3a5f",padding:40}}>Sin registros todavía.</div>
              : <div className="card" style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{borderBottom:"1px solid #1e2d40"}}>
                      {["HORA","LAVADOR","CLIENTE","DIRECCIÓN","AUTOS","SERVICIO","TOTAL","PAGO","FZ","NOTAS"].map(h=>(
                        <th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#334155",fontSize:9.5,letterSpacing:".1em",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {registros.map((r,i)=>(
                        <tr key={r.id||i} style={{borderBottom:"1px solid #0b1220"}}>
                          <td style={{padding:"10px",color:"#22d3ee",whiteSpace:"nowrap"}}>{r.hora}</td>
                          <td style={{padding:"10px"}}>{r.conductor}</td>
                          <td style={{padding:"10px",color:"#64748b"}}>{r.cliente||"—"}</td>
                          <td style={{padding:"10px",color:"#475569",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.direccion}</td>
                          <td style={{padding:"10px",textAlign:"center"}}>{r.autos}</td>
                          <td style={{padding:"10px",color:"#94a3b8"}}>{r.servicio}</td>
                          <td style={{padding:"10px",color:"#34d399",fontWeight:600}}>{formatPesos(r.total)}</td>
                          <td style={{padding:"10px"}}>
                            <span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:r.metodo==="mp"?"#a78bfa18":"#34d39918",border:`1px solid ${r.metodo==="mp"?"#a78bfa44":"#34d39944"}`,color:r.metodo==="mp"?"#c4b5fd":"#6ee7b7"}}>
                              {r.metodo==="mp"?"MP":"Efect."}
                            </span>
                          </td>
                          <td style={{padding:"10px"}}>{r.esFZ&&<span style={{padding:"2px 7px",borderRadius:4,fontSize:10,background:"#a78bfa18",border:"1px solid #a78bfa44",color:"#c4b5fd"}}>⬡ FZ</span>}</td>
                          <td style={{padding:"10px",color:"#334155",fontSize:11,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.notas||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{borderTop:"2px solid #1e3a5f"}}>
                      <td colSpan={6} style={{padding:"12px 10px",color:"#475569",fontSize:11}}>TOTALES</td>
                      <td style={{padding:"12px 10px",color:"#22d3ee",fontFamily:"'Bebas Neue',sans-serif",fontSize:18}}>{formatPesos(totalDia)}</td>
                      <td colSpan={3} style={{padding:"12px 10px",color:"#475569",fontSize:11}}>MP: {formatPesos(totalMP)} · Ef: {formatPesos(totalEfect)}</td>
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
