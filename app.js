"use strict";

/* =====================================================================
   CONFIGURACIÓN
   ===================================================================== */
const CONFIG = {
  // Opcional: pega aquí la URL de la implementación de Google Apps Script
  // (ver code.gs). Si queda vacía, el quiz funciona igual pero no envía resultados.
  APPS_SCRIPT_URL: "",
  PREGUNTAS_POR_RONDA: 10
};

/* =====================================================================
   DATOS: EQUIPOS DE UNA SUBESTACIÓN
   ===================================================================== */
const EQUIPOS = [
  {
    id: "linea", nombre: "Línea de transmisión (bahía de línea)", sigla: "Línea", enDiagrama: true,
    funcion: "Conecta la subestación con el resto del sistema y transporta la energía en alta tensión hacia otras subestaciones o centrales.",
    ubicacion: "Llega o sale de la subestación por un pórtico de línea; cada línea ocupa una bahía.",
    contexto: "En el STN colombiano las líneas operan principalmente a 230 kV y 500 kV; en el STR, a 110/115 kV.",
    alerta: "Una línea no se considera desenergizada hasta verificar ausencia de tensión y poner a tierra."
  },
  {
    id: "pararrayos", nombre: "Pararrayos (descargador de sobretensiones)", sigla: "DPS / Pararrayos", enDiagrama: true,
    funcion: "Limita las sobretensiones atmosféricas y de maniobra, derivando la corriente excesiva a tierra para proteger al transformador y demás equipos.",
    ubicacion: "Cerca de los bornes del transformador y en la entrada de las líneas.",
    contexto: "Los modernos son de óxido de zinc (ZnO). Su coordinación de aislamiento define el nivel de protección de la subestación.",
    alerta: "Debe conectarse a la malla de tierra con el conductor más corto y directo posible."
  },
  {
    id: "tp", nombre: "Transformador de potencial", sigla: "TP / PT (CCVT en alta tensión)", enDiagrama: true,
    funcion: "Reduce la tensión de la red a un valor normalizado (p. ej. 115 V o 115/√3 V) para alimentar medidores, protecciones y sincronización.",
    ubicacion: "En las bahías de línea y en los barrajes, conectado en paralelo con el circuito.",
    contexto: "En alta tensión es frecuente el divisor capacitivo (CCVT), que además puede servir de acople para onda portadora.",
    alerta: "El secundario de un TP nunca debe ponerse en cortocircuito."
  },
  {
    id: "seccionador", nombre: "Seccionador (cuchilla)", sigla: "Seccionador · ANSI 89", enDiagrama: true,
    funcion: "Abre o cierra un circuito sin carga para aislarlo de forma visible, de modo que se pueda trabajar con seguridad en el equipo asociado.",
    ubicacion: "A ambos lados del interruptor y en la conexión a los barrajes. Puede tener cuchillas de puesta a tierra.",
    contexto: "Su apertura permite ver físicamente el aislamiento, requisito de las maniobras de mantenimiento.",
    alerta: "No tiene capacidad para interrumpir corriente de carga ni de falla: se maniobra solo con el interruptor abierto (enclavamientos)."
  },
  {
    id: "interruptor", nombre: "Interruptor de potencia", sigla: "Interruptor · ANSI 52", enDiagrama: true,
    funcion: "Conecta y desconecta el circuito en operación normal y, sobre todo, interrumpe las corrientes de cortocircuito cuando las protecciones lo ordenan.",
    ubicacion: "En cada bahía (línea, transformador, acople), entre dos seccionadores.",
    contexto: "En alta tensión predominan los interruptores con gas SF₆ como medio de extinción del arco.",
    alerta: "Es el único equipo de maniobra capaz de abrir bajo falla; su capacidad de interrupción debe superar la corriente de cortocircuito del punto."
  },
  {
    id: "tc", nombre: "Transformador de corriente", sigla: "TC / CT", enDiagrama: true,
    funcion: "Reduce la corriente de la red a valores normalizados (1 A o 5 A) para medida y protecciones, aislando el circuito de control del de alta tensión.",
    ubicacion: "En serie con la fase, normalmente junto al interruptor.",
    contexto: "Tiene núcleos separados para medida (precisión) y para protección (no saturarse en falla).",
    alerta: "Nunca se debe abrir el secundario de un TC energizado: aparecen sobretensiones peligrosas."
  },
  {
    id: "barraje", nombre: "Barraje (barras colectoras)", sigla: "Barra", enDiagrama: true,
    funcion: "Es el nodo común al que se conectan las bahías de línea y de transformador; concentra y reparte la energía.",
    ubicacion: "En el patio, como tubos o cables tendidos sobre aisladores.",
    contexto: "Configuraciones típicas: barra sencilla, doble barra, anillo e interruptor y medio. Esta última es frecuente en subestaciones de alta confiabilidad.",
    alerta: "La configuración de barras define la flexibilidad y la confiabilidad de la subestación."
  },
  {
    id: "trafo", nombre: "Transformador de potencia", sigla: "Trafo / Autotransformador", enDiagrama: true,
    funcion: "Cambia el nivel de tensión (p. ej. 230/115 kV) manteniendo la potencia, para interconectar los sistemas de transmisión.",
    ubicacion: "En el patio, entre los barrajes de dos niveles de tensión, con muro cortafuego y foso para aceite.",
    contexto: "En 500/230 kV se usan autotransformadores. Accesorios: relé Buchholz, conservador de aceite y cambiador de derivaciones (taps).",
    alerta: "Es el equipo más costoso y crítico; su protección diferencial (87T) es fundamental."
  },
  {
    id: "control", nombre: "Sala de control y protecciones", sigla: "Control / Relés", enDiagrama: true,
    funcion: "Aloja los relés de protección, la medición y los sistemas de supervisión y mando (SCADA) de la subestación.",
    ubicacion: "En una caseta o edificio, conectado al patio mediante cables de control y fibra óptica.",
    contexto: "Se comunica con los centros de control y con el CND de XM. Funciones típicas: 21 (distancia), 50/51 (sobrecorriente), 87T (diferencial de transformador).",
    alerta: "Las protecciones deben aislar solo el elemento en falla (selectividad) y hacerlo rápido."
  },
  {
    id: "malla", nombre: "Malla de puesta a tierra", sigla: "SPT", enDiagrama: true,
    funcion: "Dispersa las corrientes de falla en el terreno y mantiene las tensiones de paso y de contacto dentro de límites seguros para las personas.",
    ubicacion: "Enterrada bajo todo el patio, conectada a estructuras, equipos y pararrayos.",
    contexto: "El RETIE exige un sistema de puesta a tierra diseñado para controlar las tensiones de paso y de contacto.",
    alerta: "Su resistencia y la integridad de las uniones se verifican periódicamente."
  },
  {
    id: "baterias", nombre: "Servicios auxiliares y banco de baterías", sigla: "SSAA / DC", enDiagrama: false,
    funcion: "Alimentan con corriente continua (típicamente 110–125 Vdc) las protecciones, el control y las bobinas de disparo, aun sin tensión alterna.",
    ubicacion: "En la sala de baterías o de servicios auxiliares, con cargadores y tableros de distribución.",
    contexto: "Complementan los servicios auxiliares de corriente alterna y suelen contar con respaldo (planta diésel).",
    alerta: "Si fallan, la subestación pierde capacidad de disparo: es un punto crítico de mantenimiento."
  },
  {
    id: "compensacion", nombre: "Compensación reactiva (reactores y bancos de condensadores)", sigla: "Reactor / Capacitor", enDiagrama: false,
    funcion: "Controlan la potencia reactiva y la tensión: los reactores absorben reactiva y los condensadores la suministran.",
    ubicacion: "Conectados en paralelo a los barrajes o a las líneas.",
    contexto: "Los reactores son comunes en líneas largas de alta tensión; los bancos de condensadores, en STR y SDL para sostener la tensión.",
    alerta: "Su maniobra puede producir transitorios; requiere interruptores con características apropiadas."
  }
];

const BANCO_SEP = [
  {
    enunciado: "¿A partir de qué nivel de tensión se considera un activo parte del Sistema de Transmisión Nacional (STN)?",
    correcta: "220 kV o más",
    incorrectas: ["57,5 kV o más", "110 kV o más", "Solo 500 kV"],
    explicacion: "El STN comprende los activos de 220 kV o más (en la práctica 230 kV y 500 kV)."
  },
  {
    enunciado: "¿Qué entidad opera el Sistema Interconectado Nacional y administra el mercado de energía mayorista?",
    correcta: "XM",
    incorrectas: ["CREG", "UPME", "RETIE"],
    explicacion: "XM tiene a su cargo el Centro Nacional de Despacho y la administración del mercado mayorista."
  },
  {
    enunciado: "¿Cuál es el reglamento técnico que fija los requisitos de seguridad de las instalaciones eléctricas en Colombia?",
    correcta: "RETIE",
    incorrectas: ["Código de Redes", "Plan de Expansión de la UPME", "Resolución del CND"],
    explicacion: "El RETIE (Reglamento Técnico de Instalaciones Eléctricas) establece requisitos de seguridad para las instalaciones."
  },
  {
    enunciado: "¿Cuál es la frecuencia nominal del Sistema Interconectado Nacional?",
    correcta: "60 Hz",
    incorrectas: ["50 Hz", "120 Hz", "30 Hz"],
    explicacion: "El sistema colombiano opera a 60 Hz."
  },
  {
    enunciado: "Una subestación 230/115 kV conecta principalmente:",
    correcta: "El STN con un STR",
    incorrectas: ["Un STR con un SDL de 13,2 kV", "Dos sistemas de 500 kV", "Una central con la red de distribución residencial"],
    explicacion: "Los 230 kV pertenecen al STN y los 115 kV al STR: es un punto de interconexión entre ambos."
  }
];

/* =====================================================================
   UTILIDADES
   ===================================================================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const equipoPorId = (id) => EQUIPOS.find((e) => e.id === id);
const nombreDe = (id) => (equipoPorId(id) || { nombre: id }).nombre;

function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* sin almacenamiento */ }
}
function leer(clave, defecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  } catch (_) { return defecto; }
}

/* =====================================================================
   DIAGRAMA UNIFILAR (SVG)
   ===================================================================== */
function diagramaSVG(interactivo) {
  const attrs = (id) => interactivo
    ? ` tabindex="0" role="button" aria-label="${nombreDe(id)}"`
    : ` aria-hidden="true"`;
  const eq = (id, cuerpo) => `<g class="eq" data-id="${id}"${attrs(id)}>${cuerpo}</g>`;
  const txt = (x, y, s, anchor = "start", cls = "lbl") =>
    `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
  const tierra = (x, y) =>
    `<path class="ln" d="M${x} ${y}v8M${x - 8} ${y + 8}h16M${x - 5} ${y + 11}h10M${x - 2} ${y + 14}h4"/>`;

  // Malla de tierra (al fondo)
  let rejilla = "";
  for (let x = 80; x < 320; x += 40) rejilla += `<line class="grid" x1="${x}" y1="470" x2="${x}" y2="510"/>`;
  rejilla += `<line class="grid" x1="40" y1="490" x2="320" y2="490"/>`;

  const partes = [
    eq("malla",
      `<rect class="hit" x="40" y="470" width="280" height="40"/>
       <rect class="ln" x="40" y="470" width="280" height="40"/>${rejilla}
       ${txt(180, 462, "Malla de puesta a tierra", "middle")}`),

    eq("barraje",
      `<rect class="hit" x="40" y="222" width="280" height="16"/>
       <line class="ln thick" x1="40" y1="230" x2="320" y2="230"/>
       <rect class="hit" x="60" y="422" width="240" height="16"/>
       <line class="ln thick" x1="60" y1="430" x2="300" y2="430"/>
       ${txt(320, 220, "Barraje", "end")}
       ${txt(300, 420, "Barraje", "end")}`),
    txt(44, 220, "230 kV", "start", "volt"),
    txt(64, 420, "115 kV", "start", "volt"),

    eq("linea",
      `<rect class="hit" x="165" y="6" width="30" height="40"/>
       <line class="ln thick" x1="180" y1="10" x2="180" y2="100"/>
       ${txt(192, 28, "Línea de transmisión")}`),
    txt(192, 42, "230 kV", "start", "volt"),

    eq("pararrayos",
      `<rect class="hit" x="104" y="44" width="30" height="58"/>
       <path class="ln" d="M180 50H120V52"/>
       <rect class="ln box" x="112" y="52" width="16" height="26"/>
       <path class="ln" d="M120 78V86"/>${tierra(120, 86)}
       ${txt(104, 66, "Pararrayos", "end")}`),

    eq("tp",
      `<rect class="hit" x="212" y="56" width="36" height="58"/>
       <path class="ln" d="M180 62H230V67"/>
       <circle class="ln box" cx="230" cy="76" r="9"/>
       <circle class="ln box" cx="230" cy="88" r="9"/>
       ${tierra(230, 97)}
       ${txt(248, 84, "Transf. de potencial")}`),

    eq("seccionador",
      `<rect class="hit" x="168" y="98" width="34" height="46"/>
       <path class="ln" d="M180 100V108M180 108L193 124M180 128V140"/>
       <circle class="pt" cx="180" cy="108" r="2.6"/><circle class="pt" cx="180" cy="128" r="2.6"/>
       <rect class="hit" x="168" y="236" width="34" height="38"/>
       <path class="ln" d="M180 230V246M180 246L193 262M180 266V275"/>
       <circle class="pt" cx="180" cy="246" r="2.6"/><circle class="pt" cx="180" cy="266" r="2.6"/>
       ${txt(206, 126, "Seccionador")}
       ${txt(206, 264, "Seccionador")}`),

    eq("interruptor",
      `<rect class="hit" x="164" y="142" width="34" height="38"/>
       <path class="ln" d="M180 140V145M180 169V180"/>
       <rect class="ln solid" x="172" y="145" width="16" height="24"/>
       <rect class="hit" x="164" y="274" width="34" height="46"/>
       <path class="ln" d="M180 275V279M180 299V318"/>
       <rect class="ln solid" x="172" y="279" width="16" height="20"/>
       ${txt(198, 161, "Interruptor")}
       ${txt(198, 294, "Interruptor")}`),

    eq("tc",
      `<rect class="hit" x="164" y="184" width="34" height="40"/>
       <path class="ln" d="M180 180V230"/>
       <circle class="ln box" cx="180" cy="196" r="8"/>
       ${txt(166, 199, "Transf. de corriente", "end")}`),

    eq("trafo",
      `<rect class="hit" x="154" y="318" width="52" height="56"/>
       <circle class="ln box" cx="180" cy="335" r="17"/>
       <circle class="ln box" cx="180" cy="353" r="17"/>
       <path class="ln" d="M180 370V430"/>
       <text class="lbl" text-anchor="end"><tspan x="156" y="340">Transformador</tspan><tspan x="156" dy="12">de potencia</tspan></text>`),

    `<path class="dash" d="M188 196H295V300"/>`,

    eq("control",
      `<rect class="ln box" x="250" y="300" width="90" height="60" rx="6"/>
       ${txt(295, 334, "Sala de control", "middle")}`)
  ];

  return `<svg class="sub-svg${interactivo ? " show-labels" : " quiz"}" viewBox="0 0 360 530" role="img"
    aria-label="Diagrama unifilar simplificado de una subestación 230/115 kV">${partes.join("")}</svg>`;
}

/* ---------- Pestaña Explorar ---------- */
function iniciarExplorar() {
  const cont = $("#diagrama");
  cont.innerHTML = diagramaSVG(true);
  const svg = $(".sub-svg", cont);

  const seleccionar = (id) => {
    $$(".eq", svg).forEach((g) => g.classList.toggle("selected", g.dataset.id === id));
    mostrarInfo(id);
  };

  cont.addEventListener("click", (e) => {
    const g = e.target.closest(".eq");
    if (g) seleccionar(g.dataset.id);
  });
  cont.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const g = e.target.closest(".eq");
    if (g) { e.preventDefault(); seleccionar(g.dataset.id); }
  });

  $("#chk-nombres").addEventListener("change", (e) => {
    svg.classList.toggle("show-labels", e.target.checked);
  });
}

function mostrarInfo(id) {
  const q = equipoPorId(id);
  if (!q) return;
  $("#info").innerHTML = `
    <h3>${q.nombre}</h3>
    <p class="sigla">${q.sigla}</p>
    <dl>
      <dt>Función</dt><dd>${q.funcion}</dd>
      <dt>Ubicación</dt><dd>${q.ubicacion}</dd>
      <dt>En el SEP colombiano</dt><dd>${q.contexto}</dd>
    </dl>
    <p class="alerta"><strong>Ojo:</strong> ${q.alerta}</p>`;
}

/* =====================================================================
   TARJETAS DE REPASO
   ===================================================================== */
const Tarjetas = {
  mazo: [],
  i: 0,
  volteada: false,
  conocidas: new Set(leer("sub.conocidas", []))
};

function armarMazo() {
  const soloRepasar = $("#filtro-tarjetas").value === "repasar";
  let base = EQUIPOS.slice();
  if (soloRepasar) base = base.filter((e) => !Tarjetas.conocidas.has(e.id));
  Tarjetas.mazo = shuffle(base);
  Tarjetas.i = 0;
  Tarjetas.volteada = false;
  pintarTarjeta();
}

function pintarTarjeta() {
  const cont = $("#tarjeta");
  const total = Tarjetas.mazo.length;
  $("#progreso-tarjetas").textContent =
    `Dominadas: ${Tarjetas.conocidas.size}/${EQUIPOS.length}` + (total ? ` · Tarjeta ${Tarjetas.i + 1}/${total}` : "");

  if (!total) {
    cont.innerHTML = `<h3>¡Mazo vacío!</h3><p class="sigla">Ya dominas todas las tarjetas. Cambia el filtro a «Todas» para repasar.</p>`;
    return;
  }
  const q = Tarjetas.mazo[Tarjetas.i];
  const sabida = Tarjetas.conocidas.has(q.id);
  if (!Tarjetas.volteada) {
    cont.innerHTML = `
      <div class="cara-tag">¿Qué función cumple?</div>
      <h3>${q.nombre}</h3>
      <p class="sigla">${q.sigla}</p>
      ${sabida ? `<p class="estado">✓ Marcada como dominada</p>` : ""}`;
  } else {
    cont.innerHTML = `
      <div class="cara-tag">Respuesta</div>
      <dl>
        <dt>Función</dt><dd>${q.funcion}</dd>
        <dt>Ubicación</dt><dd>${q.ubicacion}</dd>
        <dt>En Colombia</dt><dd>${q.contexto}</dd>
      </dl>`;
  }
}

function iniciarTarjetas() {
  const cont = $("#tarjeta");
  const voltear = () => { Tarjetas.volteada = !Tarjetas.volteada; pintarTarjeta(); };
  cont.addEventListener("click", voltear);
  cont.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); voltear(); }
  });

  const mover = (d) => {
    const n = Tarjetas.mazo.length;
    if (!n) return;
    Tarjetas.i = (Tarjetas.i + d + n) % n;
    Tarjetas.volteada = false;
    pintarTarjeta();
  };
  $("#t-next").addEventListener("click", () => mover(1));
  $("#t-prev").addEventListener("click", () => mover(-1));

  $("#t-sabe").addEventListener("click", () => {
    const q = Tarjetas.mazo[Tarjetas.i];
    if (!q) return;
    Tarjetas.conocidas.add(q.id);
    guardar("sub.conocidas", [...Tarjetas.conocidas]);
    mover(1);
  });
  $("#t-repasar").addEventListener("click", () => {
    const q = Tarjetas.mazo[Tarjetas.i];
    if (!q) return;
    Tarjetas.conocidas.delete(q.id);
    guardar("sub.conocidas", [...Tarjetas.conocidas]);
    mover(1);
  });
  $("#filtro-tarjetas").addEventListener("change", armarMazo);
  armarMazo();
}

/* =====================================================================
   QUIZ
   ===================================================================== */
const Quiz = { preguntas: [], i: 0, aciertos: 0, falladas: [], respondida: false, inicio: 0 };

function opcionesNombres(correctoId) {
  const otros = shuffle(EQUIPOS.filter((e) => e.id !== correctoId)).slice(0, 3);
  return shuffle([
    { texto: nombreDe(correctoId), correcta: true },
    ...otros.map((e) => ({ texto: e.nombre, correcta: false }))
  ]);
}

function generarPreguntas(n) {
  const resultado = [];
  const sep = shuffle(BANCO_SEP).slice(0, 2);
  const cuantosEquipos = Math.max(0, n - sep.length);
  shuffle(EQUIPOS).slice(0, cuantosEquipos).forEach((q) => {
    const porDiagrama = q.enDiagrama && Math.random() < 0.5;
    if (porDiagrama) {
      resultado.push({
        tipo: "diagrama",
        objetivo: q.id,
        enunciado: "¿Qué equipo está resaltado en el diagrama?",
        opciones: opcionesNombres(q.id),
        explicacion: `${q.nombre}: ${q.funcion}`
      });
    } else {
      resultado.push({
        tipo: "funcion",
        enunciado: "¿Qué equipo cumple esta función?",
        detalle: q.funcion,
        opciones: opcionesNombres(q.id),
        explicacion: `Es el/la ${q.nombre}. ${q.contexto}`
      });
    }
  });
  sep.forEach((p) => {
    resultado.push({
      tipo: "sep",
      enunciado: p.enunciado,
      opciones: shuffle([
        { texto: p.correcta, correcta: true },
        ...p.incorrectas.map((t) => ({ texto: t, correcta: false }))
      ]),
      explicacion: p.explicacion
    });
  });
  return shuffle(resultado);
}

function iniciarQuiz() {
  const mejor = leer("sub.mejor", null);
  $("#quiz").innerHTML = `
    <div class="resultado">
      <h2>Pon a prueba lo aprendido</h2>
      <p class="muted">${CONFIG.PREGUNTAS_POR_RONDA} preguntas: identificación en el diagrama, funciones y contexto del SEP colombiano.</p>
      ${mejor !== null ? `<p class="muted">Tu mejor puntaje: <strong>${mejor}%</strong></p>` : ""}
      <button class="btn" id="q-empezar">Comenzar</button>
    </div>`;
  $("#q-empezar").addEventListener("click", nuevaRonda);
}

function nuevaRonda() {
  Quiz.preguntas = generarPreguntas(CONFIG.PREGUNTAS_POR_RONDA);
  Quiz.i = 0;
  Quiz.aciertos = 0;
  Quiz.falladas = [];
  Quiz.inicio = Date.now();
  pintarPregunta();
}

function pintarPregunta() {
  const p = Quiz.preguntas[Quiz.i];
  const total = Quiz.preguntas.length;
  Quiz.respondida = false;

  $("#quiz").innerHTML = `
    <div class="quiz-head"><span>Pregunta ${Quiz.i + 1} de ${total}</span><span>Aciertos: ${Quiz.aciertos}</span></div>
    <div class="barra"><i style="width:${(Quiz.i / total) * 100}%"></i></div>
    <p class="pregunta">${p.enunciado}${p.detalle ? `<span class="detalle">${p.detalle}</span>` : ""}</p>
    ${p.tipo === "diagrama" ? `<div class="diagrama" id="q-diag"></div>` : ""}
    <div class="opciones">
      ${p.opciones.map((o, k) => `<button class="opcion" data-k="${k}">${o.texto}</button>`).join("")}
    </div>
    <div id="q-retro"></div>`;

  if (p.tipo === "diagrama") {
    $("#q-diag").innerHTML = diagramaSVG(false);
    const svg = $("#q-diag .sub-svg");
    svg.classList.add("dim");
    $$(`.eq[data-id="${p.objetivo}"]`, svg).forEach((g) => g.classList.add("target"));
  }

  $$(".opcion").forEach((b) => b.addEventListener("click", () => responder(Number(b.dataset.k))));
}

function responder(k) {
  if (Quiz.respondida) return;
  Quiz.respondida = true;
  const p = Quiz.preguntas[Quiz.i];
  const acierto = p.opciones[k].correcta;

  $$(".opcion").forEach((b, idx) => {
    b.disabled = true;
    if (p.opciones[idx].correcta) b.classList.add("correcta");
    else if (idx === k) b.classList.add("incorrecta");
  });

  if (acierto) Quiz.aciertos++;
  else Quiz.falladas.push(p.tipo === "diagrama" ? nombreDe(p.objetivo) : p.opciones.find((o) => o.correcta).texto);

  const ultima = Quiz.i === Quiz.preguntas.length - 1;
  $("#q-retro").innerHTML = `
    <div class="retro"><strong>${acierto ? "¡Correcto!" : "No exactamente."}</strong> ${p.explicacion}</div>
    <div class="row center"><button class="btn" id="q-sig">${ultima ? "Ver resultado" : "Siguiente"}</button></div>`;
  $("#q-sig").addEventListener("click", () => {
    if (ultima) pintarResultado();
    else { Quiz.i++; pintarPregunta(); }
  });
}

function pintarResultado() {
  const total = Quiz.preguntas.length;
  const pct = Math.round((Quiz.aciertos / total) * 100);
  const mejor = leer("sub.mejor", 0);
  if (pct > mejor) guardar("sub.mejor", pct);

  const hayEnvio = Boolean(CONFIG.APPS_SCRIPT_URL);
  $("#quiz").innerHTML = `
    <div class="resultado">
      <p class="muted">Tu resultado</p>
      <p class="puntaje">${pct}%</p>
      <p>${Quiz.aciertos} de ${total} respuestas correctas</p>
      ${Quiz.falladas.length ? `<p class="muted">Para repasar:</p>
        <ol class="falladas">${Quiz.falladas.map((f) => `<li>${f}</li>`).join("")}</ol>` : `<p>¡Ronda perfecta!</p>`}
      ${hayEnvio ? `
        <div class="envio">
          <input type="text" id="q-nombre" placeholder="Tu nombre o código (opcional)" maxlength="60">
          <button class="btn ghost" id="q-enviar">Enviar resultado</button>
        </div>
        <p class="msg" id="q-msg"></p>` : ""}
      <button class="btn" id="q-otra">Nueva ronda</button>
    </div>`;

  $("#q-otra").addEventListener("click", nuevaRonda);
  if (hayEnvio) $("#q-enviar").addEventListener("click", enviarResultado);
}

function enviarResultado() {
  const btn = $("#q-enviar");
  const msg = $("#q-msg");
  const total = Quiz.preguntas.length;
  const payload = {
    participante: ($("#q-nombre").value || "").trim() || "Anónimo",
    puntaje: Quiz.aciertos,
    total: total,
    porcentaje: Math.round((Quiz.aciertos / total) * 100),
    falladas: Quiz.falladas,
    duracion_s: Math.round((Date.now() - Quiz.inicio) / 1000)
  };
  btn.disabled = true;
  msg.textContent = "Enviando…";

  // 'no-cors' + text/plain evita el preflight de CORS con Apps Script.
  // La respuesta es opaca: si no hay error de red, se asume enviado.
  fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(() => {
    msg.textContent = "Resultado enviado. ¡Gracias!";
  }).catch(() => {
    msg.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
    btn.disabled = false;
  });
}

/* =====================================================================
   PESTAÑAS E INICIO
   ===================================================================== */
function iniciarPestanas() {
  const botones = $$(".tabs button");
  botones.forEach((b) => b.addEventListener("click", () => {
    botones.forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$(".panel").forEach((p) => { p.hidden = p.id !== `tab-${b.dataset.tab}`; });
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarPestanas();
  iniciarExplorar();
  iniciarTarjetas();
  iniciarQuiz();
});
