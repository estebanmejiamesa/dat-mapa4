import { FC, useEffect, useMemo, useRef, useState } from "react";

/**
 * Canvas Interactivo — Mapa Descriptivo del Cliente (Implementadores del Sector Público)
 * Diseño premium (inspirado en IDEO / Stanford d.school): claridad, foco, y flujo sin fricción.
 *
 * ✔️ Sin dependencias externas. Tailwind utility classes para estilos.
 * ✔️ Autosave en localStorage, barra de progreso, atajos de teclado.
 * ✔️ Exportar TXT (contenido exacto, sin modificar las preguntas).
 *
 * 🔧 Fixes de compilación:
 *  - Cierre correcto del <button> "Limpiar" en el footer de cada tarjeta (antes faltaba el cierre y rompía el JSX).
 *  - Arreglo del array `header` en exportTXT (sin token extra tras la cadena vacía).
 *
 * 🧪 Smoke tests (console.table):
 *  1) 12 bloques exactos
 *  2) IDs únicos
 *  3) Numeración secuencial "NN."
 *  4) Títulos/preguntas no vacíos y con «¿»
 *  5) Spot-check de cadenas clave
 *  6) Roundtrip de localStorage
 *  7) Generación de TXT sin "undefined" y respetando preguntas
 */

// ===== Utilidades =====
const cls = (...arr: Array<string | false | null | undefined>) =>
  arr.filter(Boolean).join(" ");
const KEY = "canvas_decisores_publico_v1";

// ===== Datos EXACTOS (no modificar) =====

type Block = {
  id: string;
  numero: string; // "01." etc.
  titulo: string; // categoría
  pregunta: string; // EXACTA
};

const BLOCKS: readonly Block[] = [
  {
    id: "b1",
    numero: "01.",
    titulo: "Barreras actuales",
    pregunta:
      "¿Qué procesos internos, burocracia o requisitos regulatorios están dificultando hoy la ejecución de proyectos de modernización digital en su ministerio o entidad?",
  },
  {
    id: "b2",
    numero: "02.",
    titulo: "Prioridades estratégicas",
    pregunta:
      "¿Qué capacidades técnicas y de gestión (automatización, ciberseguridad, interoperabilidad, analítica) son críticas para garantizar el éxito de estas iniciativas en el mediano y largo plazo?",
  },
  {
    id: "b3",
    numero: "03.",
    titulo: "Intereses profesionales",
    pregunta:
      "¿Qué especializaciones tecnológicas (cloud, DevOps, seguridad de la información, arquitectura de datos) considera prioritarias para fortalecer a su equipo en el marco de estos proyectos?",
  },
  {
    id: "b4",
    numero: "04.",
    titulo: "Riesgos percibidos",
    pregunta:
      "¿Qué riesgos operativos o de seguridad (downtime, incidentes críticos, vulnerabilidades, brechas de cumplimiento) generan mayor preocupación al implementar estas iniciativas?",
  },
  {
    id: "b5",
    numero: "05.",
    titulo: "Visión a futuro",
    pregunta:
      "¿Cómo imagina que deberían funcionar la arquitectura tecnológica y los procesos de TI de su dependencia una vez consolidadas estas transformaciones?",
  },
  {
    id: "b6",
    numero: "06.",
    titulo: "Incentivos y alineación",
    pregunta:
      "¿Qué incentivos o apoyos (recursos presupuestales, certificaciones, formación especializada, reconocimiento institucional) motivarían más a su equipo para comprometerse plenamente con estas iniciativas?",
  },
  {
    id: "b7",
    numero: "07.",
    titulo: "Red de influencia",
    pregunta:
      "¿Qué comunidades técnicas internas (equipos de arquitectura, comités de seguridad) o externas (foros de CIOs, organismos multilaterales, asociaciones sectoriales) influyen más en sus decisiones de implementación?",
  },
  {
    id: "b8",
    numero: "08.",
    titulo: "Proveedores actuales",
    pregunta:
      "¿Qué proveedores o consultoras tecnológicas (AWS, Oracle, Microsoft, Red Hat, firmas locales) han sido referencia o apoyo en proyectos similares y cómo evalúa su desempeño?",
  },
  {
    id: "b9",
    numero: "09.",
    titulo: "Madurez digital",
    pregunta:
      "¿Cómo evaluaría hoy el nivel de madurez digital de su dependencia en términos de adopción cloud, prácticas de DevOps, automatización de procesos y ciberseguridad?",
  },
  {
    id: "b10",
    numero: "10.",
    titulo: "Motivadores clave",
    pregunta:
      "¿Qué factores (resiliencia operativa, continuidad de servicios críticos, cumplimiento normativo, eficiencia en costos) son los que más le impulsan a liderar y sostener estas transformaciones?",
  },
  {
    id: "b11",
    numero: "11.",
    titulo: "Criterios de éxito",
    pregunta:
      "¿Qué mejoras concretas (aumento de uptime, despliegues más rápidos, reducción de TCO, seguridad reforzada) necesita evidenciar para considerar exitoso un proyecto?",
  },
  {
    id: "b12",
    numero: "12.",
    titulo: "Lecciones previas",
    pregunta:
      "¿Qué errores o dificultades de proyectos anteriores (migraciones inconclusas, fallos de integración, sobrecostos, falta de soporte post-implementación) quiere evitar en esta nueva etapa?",
  },
] as const;

// ===== Tipos =====

type Answers = Record<string, string>; // id -> respuesta

type Persisted = {
  answers: Answers;
  completed: string[]; // ids
};

// ===== Generación de TXT (compartido por tests y por la UI) =====
function buildTXTContent(answers: Answers): string {
  const total = BLOCKS.length;
  const filled = BLOCKS.reduce(
    (acc, b) => acc + (answers[b.id]?.trim() ? 1 : 0),
    0
  );
  const progress = Math.round((filled / total) * 100);
  const header = [
    "🗺️ Mapa Descriptivo del Cliente – Implementadores del Sector Público",
    `Progreso: ${filled}/${total} (${progress}%)`,
    "",
  ].join("\n");
  const lines: string[] = [];
  for (const b of BLOCKS) {
    lines.push(`${b.numero} ${b.titulo}`);
    lines.push(b.pregunta);
    lines.push(answers[b.id]?.trim() || "[Sin respuesta]");
    lines.push("");
  }
  return header + lines.join("\n");
}

// ===== Tests (sin UI) =====
function runSmokeTests() {
  const results: Array<{ name: string; pass: boolean; info?: string }> = [];

  // 1) Tiene 12 bloques
  results.push({
    name: "12 bloques",
    pass: BLOCKS.length === 12,
    info: `count=${BLOCKS.length}`,
  });

  // 2) IDs únicos
  const ids = BLOCKS.map((b) => b.id);
  const unique = new Set(ids).size;
  results.push({
    name: "IDs únicos",
    pass: unique === ids.length,
    info: `unique=${unique}`,
  });

  // 3) Numeración secuencial NN.
  const seq = BLOCKS.every(
    (b, i) => b.numero === `${String(i + 1).padStart(2, "0")}.`
  );
  results.push({ name: "Numeración secuencial", pass: seq });

  // 4) Título y pregunta no vacíos + signos "¿"
  const nonEmpty = BLOCKS.every(
    (b) => !!b.titulo && !!b.pregunta && b.pregunta.includes("¿")
  );
  results.push({ name: "Contenido no vacío y con ¿", pass: nonEmpty });

  // 5) Spot-check de integridad de cadenas (palabras clave)
  const spot =
    BLOCKS[0].pregunta.includes("presupuestales") &&
    BLOCKS[11].pregunta.includes("baja adopción");
  results.push({ name: "Spot-check cadenas", pass: spot });

  // 6) LocalStorage roundtrip (no rompe)
  try {
    const key = KEY + "_test";
    const payload = { answers: { b1: "ok" }, completed: ["b1"] };
    localStorage.setItem(key, JSON.stringify(payload));
    const back = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.removeItem(key);
    results.push({
      name: "localStorage roundtrip",
      pass: back.answers?.b1 === "ok",
    });
  } catch (e) {
    results.push({
      name: "localStorage roundtrip",
      pass: false,
      info: String(e),
    });
  }

  // 7) TXT generator estable y sin "undefined"
  try {
    const sample = buildTXTContent({});
    const ok =
      sample.includes("🗺️ Mapa Descriptivo del Cliente") &&
      sample.includes("01.") &&
      sample.includes("12.") &&
      !sample.includes("undefined");
    results.push({ name: "TXT generator", pass: ok });
  } catch (e) {
    results.push({ name: "TXT generator", pass: false, info: String(e) });
  }

  // eslint-disable-next-line no-console
  console.table(results);
}

// ===== Componente =====
const CanvasDecisoresPublico: FC = () => {
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string>(BLOCKS[0].id);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Cargar de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: Persisted = JSON.parse(raw);
        setAnswers(parsed.answers || {});
        setCompleted(parsed.completed || []);
      }
    } catch {}
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    const payload: Persisted = { answers, completed };
    localStorage.setItem(KEY, JSON.stringify(payload));
  }, [answers, completed]);

  // Ejecutar tests una sola vez
  useEffect(() => {
    runSmokeTests();
  }, []);

  const total = BLOCKS.length;
  const filled = useMemo(
    () => BLOCKS.reduce((acc, b) => acc + (answers[b.id]?.trim() ? 1 : 0), 0),
    [answers]
  );
  const progress = Math.round((filled / total) * 100);

  const onToggleComplete = (id: string) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const exportTXT = () => {
    const text = buildTXTContent(answers);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "canvas_implementadores_sector_publico.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navegación por teclado
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const idx = BLOCKS.findIndex((b) => b.id === focusId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = BLOCKS[Math.min(BLOCKS.length - 1, idx + 1)].id;
        setFocusId(next);
        scrollToCard(next);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = BLOCKS[Math.max(0, idx - 1)].id;
        setFocusId(prev);
        scrollToCard(prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        onToggleComplete(focusId);
      }
      if (
        e.altKey &&
        (e.key.toLowerCase() === "e" || e.key.toLowerCase() === "x")
      ) {
        e.preventDefault();
        exportTXT();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [focusId]);

  const scrollToCard = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div
      className={cls(
        "min-h-screen w-full text-white",
        "bg-gradient-to-br from-slate-900 via-blue-950 to-black"
      )}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="font-bold text-slate-900">🗺️</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                Mapa Descriptivo del Cliente – Implementadores del Sector
                Público
              </h1>
              <p className="text-xs/5 text-white/60">
                Stakeholders: CIOs, Directores de Tecnología en Ministerios y
                Agencias, CISOs y responsables de seguridad de la información
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs">
              <span className="text-white/80">Progreso</span>
              <div className="h-1.5 w-28 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="tabular-nums text-white/80">{progress}%</span>
            </div>
            <button
              onClick={exportTXT}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-3 py-1.5 text-sm shadow hover:shadow-lg active:scale-[.99]"
            >
              Exportar TXT
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Grid */}
      <div ref={mapRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {BLOCKS.map((b) => {
            const value = answers[b.id] || "";
            const isComplete = completed.includes(b.id) || !!value.trim();
            const count = value.trim().length;
            return (
              <section
                id={b.id}
                key={b.id}
                className={cls(
                  "relative rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6",
                  isComplete ? "ring-2 ring-blue-400/60" : "hover:bg-white/10"
                )}
                onClick={() => setFocusId(b.id)}
              >
                {/* esquina y número */}
                <div className="absolute -top-px -left-px rounded-tr-2xl rounded-bl-2xl bg-white text-slate-900 text-[11px] font-bold px-2 py-1">
                  {b.numero}
                </div>

                <header className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                    {b.titulo}
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(b.id);
                    }}
                    className={cls(
                      "text-[11px] rounded-full px-2 py-0.5 border",
                      isComplete
                        ? "bg-white text-slate-900 border-transparent"
                        : "border-white/20 text-white/80 hover:text-white"
                    )}
                    title="Marcar como listo (Ctrl/Cmd + Enter)"
                  >
                    {isComplete ? "Listo" : "Marcar"}
                  </button>
                </header>

                <p className="mt-1 text-sm text-white/70">{b.pregunta}</p>

                <div className="mt-3">
                  <textarea
                    value={value}
                    onChange={(e) => onChange(b.id, e.target.value)}
                    placeholder="Escribe aquí los hallazgos, citas textuales, decisiones y evidencias. Usa viñetas (•) para claridad."
                    className={cls(
                      "w-full min-h-[140px] rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white",
                      "placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                    )}
                  />
                </div>

                <footer className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                  <div>{count} caracteres</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(b.id, "");
                    }}
                    className="underline decoration-dotted hover:text-white/80"
                  >
                    Limpiar
                  </button>
                </footer>
              </section>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold text-white/90">
              Cómo usar este canvas
            </div>
            <ul className="mt-2 list-disc pl-4 text-white/70 space-y-1">
              <li>
                Escribe respuestas concisas y basadas en evidencia (citas,
                datos, ejemplos).
              </li>
              <li>
                Usa{" "}
                <span className="font-semibold text-white">
                  Ctrl/Cmd + Enter
                </span>{" "}
                para marcar un bloque como listo.
              </li>
              <li>Exporta el avance en TXT para compartirlo con el equipo.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold text-white/90">Atajos rápidos</div>
            <ul className="mt-2 list-disc pl-4 text-white/70 space-y-1">
              <li>↑ / ↓ navegan entre bloques.</li>
              <li>Alt + E exporta a TXT.</li>
              <li>Click en el número para centrar el bloque.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold text-white/90">
              Buenas prácticas (IDEO / Stanford)
            </div>
            <ul className="mt-2 list-disc pl-4 text-white/70 space-y-1">
              <li>
                Empatía primero: capturar contexto y lenguaje de los decisores.
              </li>
              <li>Definir con claridad: sintetizar en bullets accionables.</li>
              <li>
                Iterar: revisar con el equipo y refinar antes de decisiones.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-white/40">
            Canvas · Implementadores del Sector Público · ©{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #fff; }
          .bg-gradient-to-br { background: #fff !important; }
          textarea { border: 1px solid #999 !important; }
        }
      `}</style>
    </div>
  );
};

export default CanvasDecisoresPublico;
