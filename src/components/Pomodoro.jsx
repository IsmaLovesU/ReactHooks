import { useState, useEffect, useRef } from 'react';
import './Pomodoro.css';

const DEFAULT_WORK_MINS = 25;
const DEFAULT_BREAK_MINS = 5;

const TAB_LABELS = [
  'Nivel 1 — Guiado',
  'Nivel 2 — Semi-guiado',
  'Nivel 3 — Reto',
];

function Pomodoro() {

  // Tab activo 
  const [activeLevel, setActiveLevel] = useState(1);

  // NIVEL 3: configuración editable
  const [workMins, setWorkMins]   = useState(DEFAULT_WORK_MINS);
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK_MINS);

  const workTime  = workMins  * 60;
  const breakTime = breakMins * 60;

  // NIVEL 1: estados principales
  const [timeLeft,   setTimeLeft]   = useState(workTime);
  const [isRunning,  setIsRunning]  = useState(false);

  // NIVEL 2: modo y sesiones
  const [mode,     setMode]     = useState('work');
  const [sessions, setSessions] = useState([]);

  // NIVEL 1: ref para el intervalo (sin re-renders al mutar .current)
  const intervalRef = useRef(null);

  // NIVEL 1 — Intervalo del countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        // Evita clausuras obsoletas de timeLeft
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // NIVEL 2 — Cambio de modo al llegar a 0 (responsabilidad única)
  useEffect(() => {
    if (timeLeft !== 0) return;

    if (mode === 'work') {
      setSessions(prev => [
        ...prev,
        { id: Date.now(), type: 'work', duration: workTime, completedAt: new Date() },
      ]);
      setMode('break');
      setTimeLeft(breakTime);
    } else {
      setMode('work');
      setTimeLeft(workTime);
    }

    setIsRunning(true);

  }, [timeLeft]);

  // NIVEL 3 — Sonido al llegar a 0 (responsabilidad única)
  useEffect(() => {
    if (timeLeft !== 0) return;
    try {
      new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    } catch (err) {
      console.warn('No se pudo reproducir el sonido:', err);
    }
  }, [timeLeft]);

  // NIVEL 1 — formatTime / toggleTimer / resetTimer
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function toggleTimer() {
    setIsRunning(prev => !prev);
  }

  function resetTimer() {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workTime);
    setSessions([]);
  }

  // NIVEL 3 — Configuración, sesión parcial, estadísticas y progreso
  function handleWorkMinsChange(e) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1 || val > 60) return;
    setWorkMins(val);
    if (mode === 'work' && !isRunning) setTimeLeft(val * 60);
  }

  function handleBreakMinsChange(e) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1 || val > 60) return;
    setBreakMins(val);
    if (mode === 'break' && !isRunning) setTimeLeft(val * 60);
  }

  function guardarSesionParcial() {
    const tiempoTranscurrido = totalTime - timeLeft;
    if (tiempoTranscurrido <= 0) return;
    setSessions(prev => [
      ...prev,
      { id: Date.now(), type: 'work (parcial)', duration: tiempoTranscurrido, completedAt: new Date() },
    ]);
  }

  const totalTime = mode === 'work' ? workTime : breakTime;
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const totalWorkSessions = sessions.filter(
    s => s.type === 'work' || s.type === 'work (parcial)'
  ).length;
  const totalTimeSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);

  // Render
  return (
    <div className="pomodoro-container">
      <h1 className="pomodoro-title">Pomodoro Timer</h1>

      {/* ── Tabs de nivel ── */}
      <div className="tabs-container">
        {TAB_LABELS.map((label, i) => {
          const level = i + 1;
          return (
            <button
              key={level}
              className={`tab-btn${activeLevel === level ? ' tab-active' : ''}`}
              onClick={() => setActiveLevel(level)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── NIVEL 3: Configuración ── */}
      {activeLevel === 3 && (
        <div className="config-section">
          <label className="config-label">
            Trabajo (min):
            <input
              type="number" min={1} max={60}
              value={workMins}
              onChange={handleWorkMinsChange}
              disabled={isRunning}
              className="config-input"
            />
          </label>
          <label className="config-label">
            Descanso (min):
            <input
              type="number" min={1} max={60}
              value={breakMins}
              onChange={handleBreakMinsChange}
              disabled={isRunning}
              className="config-input"
            />
          </label>
        </div>
      )}

      {/* ── NIVEL 2 y 3: Indicador de modo ── */}
      {activeLevel >= 2 && (
        <div className={`mode-indicator mode-${mode}`}>
          {mode === 'work' ? '🔴 Trabajo' : '🟢 Descanso'}
        </div>
      )}

      {/* ── NIVEL 1, 2 y 3: Display del tiempo ── */}
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>

      {/* ── NIVEL 3: Barra de progreso ── */}
      {activeLevel === 3 && (
        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill progress-bar-${mode}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* ── TODOS LOS NIVELES: Botones principales ── */}
      <div className="button-group">
        <button className="btn btn-primary" onClick={toggleTimer}>
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button className="btn btn-secondary" onClick={resetTimer}>
          Reiniciar
        </button>
        {/* Guardar sesión parcial solo en Nivel 3 y en modo trabajo */}
        {activeLevel === 3 && mode === 'work' && (
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
      {activeLevel === 3 && (
        <div className="stats-section">
          <h2 className="stats-title">Estadísticas</h2>
          <p>Sesiones de trabajo: <strong>{totalWorkSessions}</strong></p>
          <p>Tiempo total acumulado: <strong>{formatTime(totalTimeSeconds)}</strong></p>
        </div>
      )}

      {/* ── NIVEL 2 y 3: Historial de sesiones ── */}
      {activeLevel >= 2 && sessions.length > 0 && (
        <div className="sessions-section">
          <h2 className="sessions-title">Historial</h2>
          <ul className="sessions-list">
            {sessions.map((session, index) => (
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
