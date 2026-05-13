// ─────────────────────────────────────────────────────────────────────────────
// Pomodoro Timer — Niveles 1, 2 y 3 integrados
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import './Pomodoro.css';

// ── NIVEL 2: constantes fuera del componente para evitar recrearlas en cada
//    render. Son los valores por defecto; el usuario puede ajustarlos (Nivel 3).
const DEFAULT_WORK_MINS = 25;  // 25 minutos de trabajo
const DEFAULT_BREAK_MINS = 5;  // 5 minutos de descanso

// ─────────────────────────────────────────────────────────────────────────────
function Pomodoro() {

  // ── NIVEL 3: configuración editable por el usuario ───────────────────────
  const [workMins, setWorkMins] = useState(DEFAULT_WORK_MINS);
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK_MINS);

  // Tiempo total del modo actual en segundos, derivado de la configuración.
  // Se recalcula cada vez que cambia workMins, breakMins o mode.
  // Lo guardamos en una ref para que el efecto de progreso siempre lea el valor
  // correcto sin necesitar dependencias extra.
  const workTime = workMins * 60;
  const breakTime = breakMins * 60;

  // ── NIVEL 1: estados principales ─────────────────────────────────────────
  // timeLeft — segundos restantes. Inicia con el tiempo de trabajo.
  const [timeLeft, setTimeLeft] = useState(workTime);
  // isRunning — si el intervalo está activo.
  const [isRunning, setIsRunning] = useState(false);

  // ── NIVEL 2: modo actual y lista de sesiones completadas ─────────────────
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [sessions, setSessions] = useState([]);

  // ── NIVEL 1: ref para guardar el ID del intervalo.
  //    Usar ref en lugar de estado evita re-renders al cambiar el ID.
  const intervalRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — useEffect principal: gestiona el intervalo del countdown
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Solo arrancamos el intervalo si el timer está corriendo y queda tiempo.
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        // Forma funcional: siempre lee el valor más reciente, evita closures obsoletos.
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    // Limpieza: se ejecuta antes de que el efecto corra de nuevo y al desmontar.
    // Es crucial para no acumular múltiples intervalos.
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 2 — useEffect separado: detecta fin de sesión (timeLeft === 0)
  // Responsabilidad única: cambia de modo y registra la sesión.
  // Está separado del efecto del timer para no mezclar lógicas.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return; // Solo actúa cuando llega a cero.

    if (mode === 'work') {
      // Registrar sesión de trabajo completada usando el spread operator
      // (nunca push, que mutaría el array original).
      const nuevaSesion = {
        id: Date.now(),
        type: 'work',
        duration: workTime,       // duración configurada, no hardcodeada
        completedAt: new Date(),
      };
      setSessions(prev => [...prev, nuevaSesion]);
      // Cambiar a modo descanso y cargar su tiempo.
      setMode('break');
      setTimeLeft(breakTime);
    } else {
      // Fin del descanso: volver a modo trabajo.
      setMode('work');
      setTimeLeft(workTime);
    }

    // Arrancar automáticamente el siguiente ciclo.
    setIsRunning(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]); // Solo depende de timeLeft para no ejecutarse en cada render.
                  // workTime y breakTime son valores estables por ciclo.

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — useEffect de sonido: se activa independientemente al llegar a 0
  // Está en su propio efecto (responsabilidad única: reproducir audio).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return;
    try {
      // Audio corto de alarma. try-catch porque play() puede fallar si el
      // navegador bloquea audio sin interacción del usuario.
      new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    } catch (err) {
      // Silencioso: el sonido es opcional, no debe romper la app.
      console.warn('No se pudo reproducir el sonido:', err);
    }
  }, [timeLeft]);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — formatTime: convierte segundos a "MM:SS"
  // Math.floor para parte entera; padStart garantiza dos dígitos.
  // ─────────────────────────────────────────────────────────────────────────
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — toggleTimer y resetTimer
  // ─────────────────────────────────────────────────────────────────────────
  function toggleTimer() {
    setIsRunning(prev => !prev);
  }

  // Reset completo: vuelve al estado inicial de trabajo con configuración actual.
  function resetTimer() {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workTime);   // Usa la configuración actual, no la constante original.
    setSessions([]);          // NIVEL 2: limpiar historial también.
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Guardar sesión parcial sin detener el timer
  // ─────────────────────────────────────────────────────────────────────────
  function guardarSesionParcial() {
    // Solo tiene sentido en modo trabajo y si algo ha transcurrido.
    const tiempoTranscurrido = totalTime - timeLeft;
    if (tiempoTranscurrido <= 0) return;

    const sesionParcial = {
      id: Date.now(),
      type: 'work (parcial)',
      duration: tiempoTranscurrido,
      completedAt: new Date(),
    };
    setSessions(prev => [...prev, sesionParcial]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Configuración de inputs numéricos
  // Solo se puede cambiar cuando el timer está pausado.
  // ─────────────────────────────────────────────────────────────────────────
  function handleWorkMinsChange(e) {
    const val = parseInt(e.target.value, 10);
    // Validar: entre 1 y 60, nunca vacío ni negativo.
    if (isNaN(val) || val < 1 || val > 60) return;
    setWorkMins(val);
    // Si estamos en modo trabajo y el timer está parado, sincronizar timeLeft.
    if (mode === 'work' && !isRunning) {
      setTimeLeft(val * 60);
    }
  }

  function handleBreakMinsChange(e) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1 || val > 60) return;
    setBreakMins(val);
    if (mode === 'break' && !isRunning) {
      setTimeLeft(val * 60);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Cálculo de progreso
  // totalTime es la duración configurada del modo actual.
  // ─────────────────────────────────────────────────────────────────────────
  const totalTime = mode === 'work' ? workTime : breakTime;
  const progressPercent = totalTime > 0
    ? ((totalTime - timeLeft) / totalTime) * 100
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Estadísticas derivadas directamente de sessions
  // No hay estado extra: se calculan con filter + reduce en cada render.
  // ─────────────────────────────────────────────────────────────────────────
  const totalWorkSessions = sessions.filter(
    s => s.type === 'work' || s.type === 'work (parcial)'
  ).length;

  const totalTimeSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pomodoro-container">
      <h1 className="pomodoro-title">Pomodoro Timer</h1>

      {/* ── NIVEL 3: Configuración ── */}
      <div className="config-section">
        <label className="config-label">
          Trabajo (min):
          <input
            type="number"
            min={1}
            max={60}
            value={workMins}
            onChange={handleWorkMinsChange}
            disabled={isRunning}
            className="config-input"
          />
        </label>
        <label className="config-label">
          Descanso (min):
          <input
            type="number"
            min={1}
            max={60}
            value={breakMins}
            onChange={handleBreakMinsChange}
            disabled={isRunning}
            className="config-input"
          />
        </label>
      </div>

      {/* ── NIVEL 2: Indicador de modo ── */}
      <div className={`mode-indicator mode-${mode}`}>
        {mode === 'work' ? '🔴 Trabajo' : '🟢 Descanso'}
      </div>

      {/* ── NIVEL 1: Display del tiempo ── */}
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>

      {/* ── NIVEL 3: Barra de progreso ── */}
      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill progress-bar-${mode}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── NIVEL 1: Botones principales ── */}
      <div className="button-group">
        <button className="btn btn-primary" onClick={toggleTimer}>
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer}>
          Reiniciar
        </button>
        {/* ── NIVEL 3: Guardar sesión parcial (solo en modo trabajo) ── */}
        {mode === 'work' && (
          <button
            className="btn btn-partial"
            onClick={guardarSesionParcial}
            disabled={totalTime - timeLeft <= 0}
          >
            Guardar sesión
          </button>
        )}
      </div>

      {/* ── NIVEL 3: Estadísticas ── */}
      <div className="stats-section">
        <h2 className="stats-title">Estadísticas</h2>
        <p>Sesiones de trabajo: <strong>{totalWorkSessions}</strong></p>
        <p>Tiempo total acumulado: <strong>{formatTime(totalTimeSeconds)}</strong></p>
      </div>

      {/* ── NIVEL 2: Historial de sesiones ── */}
      {sessions.length > 0 && (
        <div className="sessions-section">
          <h2 className="sessions-title">Historial</h2>
          <ul className="sessions-list">
            {sessions.map((session, index) => (
              // session.id (Date.now()) como key garantiza unicidad incluso si
              // dos sesiones se crean en el mismo render.
              <li key={session.id} className="session-item">
                <span className="session-number">#{index + 1}</span>
                <span className={`session-type session-type-${session.type === 'work' ? 'work' : 'partial'}`}>
                  {session.type === 'work' ? 'Trabajo' : 'Parcial'}
                </span>
                <span className="session-duration">{formatTime(session.duration)}</span>
                <span className="session-time">
                  {session.completedAt.toLocaleTimeString('es-GT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Pomodoro;
