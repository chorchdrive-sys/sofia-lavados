import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  addDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp,
  updateDoc
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
//  CONSTANTES & HELPERS
// ═══════════════════════════════════════════════════════════════
const BASE_LAT  = -34.5128;
const BASE_LNG  = -58.4985;
const FRANJAS = ["09:00","10:30","12:00","13:30","15:00","16:30","18:00"];

const formatP = n => "$" + Number(n || 0).toLocaleString("es-AR");
const franjaFin = h => { 
  const [hr, mn] = h.split(":").map(Number); 
  const t = hr * 60 + mn + 90; 
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; 
};

const MOTIVOS_DESCUENTO = ["Error de cambio", "Descuento por queja", "Lavado gratis (compensación total)", "Lavado con descuento (compensación parcial)", "Cliente no pagó (deuda)", "Otro"];
const MOTIVOS_OPERACION = ["Préstamo (lavador recibe)", "Adelanto de sueldo (lavador recibe)", "Regalo / Premio (lavador recibe)", "Devolución de préstamo (lavador paga)", "Aporte voluntario (lavador paga)", "Otro"];

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES BASE (Refactorizados con Tailwind CSS)
// ═══════════════════════════════════════════════════════════════

export function Toast({ msg, tipo, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    ok: { border: "border-cyan-500/30", text: "text-cyan-400", icon: "✓" },
    error: { border: "border-red-500/30", text: "text-red-400", icon: "✗" },
    warn: { border: "border-amber-500/30", text: "text-amber-400", icon: "⚠" }
  }[tipo] || { border: "border-cyan-500/30", text: "text-cyan-400", icon: "✓" };

  return (
    <div className={`fixed bottom-5 right-5 z-[9999] bg-[#0b1220] border ${config.border} ${config.text} px-4 py-3 rounded-xl text-xs font-medium shadow-lg shadow-black/40 max-w-[280px] animate-fade-in-up`}>
      <span className="mr-2 font-bold">{config.icon}</span> {msg}
    </div>
  );
}

export function Modal({ titulo, onClose, children, wide }) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-3 transition-all duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-[#0b1220] border border-slate-800 rounded-2xl p-5 w-full ${wide ? "max-w-xl" : "max-w-md"} max-h-[92vh] overflow-y-auto shadow-2xl shadow-black/80`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">{titulo}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-300 transition-colors text-xl p-1 focus:outline-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, color = "bg-cyan-600 hover:bg-cyan-500", ghost, danger, disabled, full, sm, style = {} }) {
  let baseClass = "font-bold rounded-xl transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b1220]";
  
  // Condicionales de tamaño
  baseClass += sm ? " px-3 py-1.5 text-[11px]" : " px-[18px] py-2.5 text-xs";
  // Ancho completo
  baseClass += full ? " w-full" : " w-auto";

  // Variaciones de estado/estilo
  if (disabled) {
    baseClass += " bg-slate-800 text-slate-600 cursor-not-allowed";
  } else if (danger) {
    baseClass += " bg-red-600 hover:bg-red-500 text-white focus:ring-red-500";
  } else if (ghost) {
    baseClass += " bg-transparent border border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";
  } else {
    baseClass += ` text-white focus:ring-cyan-500 ${color}`;
  }

  return (
    <button onClick={disabled ? undefined : onClick} className={baseClass} style={style}>
      {children}
    </button>
  );
}

export function Inp({ label, value, onChange, placeholder, type = "text", required, style = {} }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-[#080c18] border border-slate-800 rounded-xl text-slate-200 text-xs px-3.5 py-2.5 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
        style={style}
      />
    </div>
  );
}

export function Sel({ label, value, onChange, children, style = {} }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#080c18] border border-slate-800 rounded-xl text-slate-200 text-xs px-3.5 py-2.5 outline-none appearance-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          style={style}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <button 
      onClick={() => onChange(!on)} 
      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex-shrink-0 relative ${on ? "bg-emerald-600" : "bg-slate-700"}`}
    >
      <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL WHATSAPP
// ═══════════════════════════════════════════════════════════════
export function ModalWA({ turno, staff, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const s = staff.find(x => x.id === turno.staffId) || {};
  const fin = franjaFin(turno.hora);
  
  const notesFormatted = turno.notas?.trim()
    ? `\n⚠️ *Instrucciones:*\n${turno.notas.split(",").map(n => `• ${n.trim()}`).join("\n")}`
    : "";
  const fzLine = turno.esFZ ? "\n🌐 *Servicio fuera de zona — recargo de traslado incluido.*" : "";
  const telLine = turno.clienteTel ? `\n📞 *Tel. cliente:* ${turno.clienteTel}` : "";
  const deudaLine = turno.clienteDeuda > 0 ? `\n⚠️ *ATENCIÓN: Cliente tiene deuda pendiente de ${formatP(turno.clienteDeuda)}. Recordar cobrar.*` : "";
  const icono = (turno.staffTransporte || s.transporte) === "moto" ? "🏍" : "🚲";
  
  const msg = `🚿 *SOFÍA LAVADOS — Turno confirmado*\n\n📍 *Dirección:* ${turno.direccion}\n🕐 *Llegada:* ${turno.hora} a ${fin} hs\n🚗 *Autos:* ${turno.cantAutos} auto${turno.cantAutos > 1 ? "s" : ""} (${turno.tamano || ""})\n💰 *Cobrar:* ${formatP(turno.precio)} (${turno.metodo === "mp" ? "Mercado Pago" : "Efectivo"})${fzLine}${telLine}${deudaLine}${notesFormatted}\n\n${icono} Confirmá arribo cuando llegues. ¡Gracias!`;

  async function copiar() {
    try { await navigator.clipboard.writeText(msg); } catch {}
    setCopiado(true); 
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <Modal titulo="📲 Mensaje para el lavador" onClose={onClose}>
      <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-4 mb-4">
        <pre className="font-mono text-xs text-emerald-300 white-space-pre-wrap leading-relaxed select-all break-words">{msg}</pre>
      </div>
      
      {s.especial === "avisar_presencia" && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs mb-3 font-medium">
          🔴 Hernán — Avisar en persona (sin celular)
        </div>
      )}
      {s.especial === "llamar_telefono" && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 text-xs mb-3 font-medium">
          📞 Gastón — Llamar por teléfono
        </div>
      )}
      
      <div className="space-y-2.5">
        <Btn full color="bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500" onClick={copiar}>
          {copiado ? "✓ Copiado — pegá en WhatsApp" : `📋 Copiar mensaje de ${s.nombre || "lavador"}`}
        </Btn>
        {turno.clienteTel && (
          <a href={`tel:${turno.clienteTel}`} className="block w-full">
            <Btn full ghost>📞 Llamar al cliente ({turno.clienteNombre})</Btn>
          </a>
        )}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL DETALLE TURNO
// ═══════════════════════════════════════════════════════════════
export function ModalDetalle({ turno, staff, asistencia, onCancelar, onReasignar, onPagar, onRendir, onWA, onClose }) {
  const [modo, setModo] = useState("detalle");
  const [nStaff, setNS] = useState(turno.staffId || "");
  const [nHora, setNH] = useState(turno.hora || "");
  const staffActivos = staff.filter(s => asistencia[s.id]?.presente && s.role !== "encargado");

  return (
    <Modal titulo={modo === "detalle" ? "Detalle del turno" : "Reasignar turno"} onClose={onClose}>
      {modo === "detalle" ? (
        <>
          <div className="space-y-1 text-xs mb-5">
            {[
              ["Lavador", turno.staffNombre],
              ["Hora", turno.hora],
              ["Franja", `${turno.hora} → ${franjaFin(turno.hora)} hs`],
              ["Cliente", turno.clienteNombre || turno.cliente || "—"],
              ["Teléfono", turno.clienteTel || "Sin registrar"],
              ["Dirección", turno.direccion],
              ["Autos", `${turno.cantAutos} (${turno.tamano || "—"})`],
              ["Precio", formatP(turno.precio)],
              ["Pago", turno.metodo === "mp" ? "Mercado Pago" : "Efectivo"],
              ["Estado", turno.estadoPago || "💰 Pendiente"],
              ["Notas", turno.notas || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center border-b border-slate-800/60 py-2.5">
                <span className="text-slate-400 font-medium">{k}</span>
                <span className="text-slate-200 font-semibold text-right max-w-[65%] break-words">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Btn full color="bg-emerald-600 hover:bg-emerald-500" onClick={() => onWA(turno)}>
              📲 WhatsApp Coor.
            </Btn>
            {(!turno.estadoPago || turno.estadoPago === "💰 Pendiente" || turno.estadoPago === "🔴 Cliente debe") && onPagar && (
              <Btn full color="bg-amber-600 hover:bg-amber-500" onClick={() => onPagar(turno)}>
                💰 Registrar Cobro
              </Btn>
            )}
            {turno.estadoPago === "💵 Cobrado (sin rendir)" && onRendir && (
              <Btn full color="bg-cyan-600 hover:bg-cyan-500" onClick={() => onRendir(turno)}>
                ✅ Liquidar / Rendir
              </Btn>
            )}
            <Btn full ghost onClick={() => setModo("reasignar")}>
              🔄 Reasignar Destino
            </Btn>
            <Btn full danger onClick={() => onCancelar(turno)}>
              ✕ Cancelar Turno
            </Btn>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-400 mb-4">Ajustá el personal asignado o la franja horaria correspondiente.</p>
          <Sel label="NUEVO LAVADOR" value={nStaff} onChange={setNS}>
            {staffActivos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Sel>
          <Sel label="NUEVO HORARIO" value={nHora} onChange={setNH}>
            {FRANJAS.map(h => <option key={h} value={h}>{h}</option>)}
          </Sel>
          <div className="flex gap-3 mt-2">
            <Btn ghost onClick={() => setModo("detalle")} style={{ flex: 1 }}>← Volver</Btn>
            <Btn color="bg-cyan-600 hover:bg-cyan-500" style={{ flex: 2 }} onClick={() => onReasignar(turno, nStaff, nHora)}>
              Confirmar
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL COBRO
// ═══════════════════════════════════════════════════════════════
export function ModalCobro({ turno, onRegistrar, onClose }) {
  const [importeReal, setImporteReal] = useState(turno.precio || 0);
  const [motivo, setMotivo] = useState("");
  const [motivoManual, setMotivoManual] = useState("");
  const [destinoExcedente, setDestinoExcedente] = useState("deuda");
  const importeEsperado = turno.precio || 0;
  const dif = importeReal - importeEsperado;
  const esDeudaCliente = importeReal === 0;
  const hayExcedente = dif > 0;
  const hayFaltante = dif < 0 && !esDeudaCliente;

  return (
    <Modal titulo="💰 Registrar cobro" onClose={onClose}>
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex justify-between items-center bg-[#080c18] border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-400 font-medium">Monto Esperado base:</span>
          <strong className="text-cyan-400 text-sm font-bold">{formatP(importeEsperado)}</strong>
        </div>
        
        <div>
          <label className="block text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1.5">Importe cobrado real</label>
          <input 
            type="number" 
            value={importeReal} 
            onChange={e => setImporteReal(Number(e.target.value))}
            className="w-full bg-[#080c18] border border-slate-800 rounded-xl text-slate-200 text-sm px-3.5 py-2.5 font-bold outline-none focus:border-cyan-500/50"
          />
        </div>

        {esDeudaCliente && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium">
            🔴 Sin abono percibido — Se computará como deuda directa del cliente.
          </div>
        )}

        {hayFaltante && (
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
              ⚠️ Saldo negativo de {formatP(Math.abs(dif))}. ¿Cómo procesar la diferencia?
            </div>
            <div className="flex gap-2">
              {[["deuda", "📝 Cuenta Corriente (Deuda)"], ["perdonar", "🎁 Bonificar / Perdonar"]].map(([v, l]) => (
                <button 
                  key={v} 
                  onClick={() => setDestinoExcedente(v)} 
                  className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-semibold transition-all ${destinoExcedente === v ? "bg-cyan-500/10 border-cyan-400 text-cyan-400" : "bg-transparent border-slate-800 text-slate-400"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {hayExcedente && (
          <div className="space-y-2">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300">
              💰 Saldo a favor de {formatP(dif)}. Asignación de excedente:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[["deuda", "Salda Deuda"], ["propina", "🎩 Propina"], ["perdonar", "🎁 Cortesía"]].map(([v, l]) => (
                <button 
                  key={v} 
                  onClick={() => setDestinoExcedente(v)} 
                  className={`py-2 px-1 rounded-xl border text-[10px] text-center font-semibold transition-all ${destinoExcedente === v ? "bg-purple-500/10 border-purple-400 text-purple-400" : "bg-transparent border-slate-800 text-slate-400"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {destinoExcedente === "propina" && (
              <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400">
                ✓ Comisión retenida para el lavador. No altera balance neto del negocio.
              </div>
            )}
          </div>
        )}

        {(hayFaltante || esDeudaCliente) && (
          <Sel label="MOTIVO DE AJUSTE" value={motivo} onChange={setMotivo}>
            <option value="">Seleccionar justificación...</option>
            {MOTIVOS_DESCUENTO.map(m => <option key={m} value={m}>{m}</option>)}
          </Sel>
        )}
        
        {motivo === "Otro" && (
          <Inp label="Especifique motivo" value={motivoManual} onChange={setMotivoManual} placeholder="Detalle la incidencia..." />
        )}

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-normal">
          💡 El operario permanecerá con estado <strong className="text-slate-300">"Cobrado (sin rendir)"</strong> en el tablero hasta liquidar la caja física en la base.
        </div>
        
        <div className="flex gap-3 mt-1">
          <Btn ghost onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn color="bg-amber-600 hover:bg-amber-500" style={{ flex: 1 }} onClick={() => onRegistrar(turno, importeReal, dif, motivo === "Otro" ? motivoManual : motivo, destinoExcedente)}>
            Efectuar Cobro
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL RENDICIÓN
// ═══════════════════════════════════════════════════════════════
export function ModalRendicion({ turno, onRegistrar, onClose }) {
  const [loading, setLoading] = useState(false);
  const montoARendir = turno.montoPagado || turno.precio || 0;

  return (
    <Modal titulo="💸 Rendición de Caja" onClose={onClose}>
      <div className="flex flex-col gap-4 text-xs">
        <div className="bg-[#080c18] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Lavador responsable:</span>
            <strong className="text-slate-200 text-sm">{turno.staffNombre}</strong>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
            <span className="text-slate-400 font-medium">Monto Neto a ingresar:</span>
            <strong className="text-emerald-400 text-base font-bold">{formatP(montoARendir)}</strong>
          </div>
        </div>
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-normal">
          ⚠️ Verifique la recepción de los fondos físicos (Efectivo o comprobante MP) antes de dar por asentada la transacción en la base operativa.
        </div>
        
        <div className="flex gap-3 mt-1">
          <Btn ghost onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn 
            color="bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500" 
            style={{ flex: 1 }} 
            onClick={() => { setLoading(true); onRegistrar(turno); }} 
            disabled={loading}
          >
            {loading ? "⟳ Procesando..." : "✅ Confirmar Rendición"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
