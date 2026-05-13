# Pomodoro Timer

Ejercicio de React construido como parte del curso de Sistemas Web. Implementa `useState`, `useEffect` y `useRef` a través de tres niveles de dificultad progresiva.

---

## Video explicativo

> **[Ver video aquí](https://youtu.be/PDwyzF27u8g)**

---

## Stack

- React 19 + Vite 8
- CSS plano (sin frameworks)
- Claude Code para scaffolding y asistencia

---

## Niveles

| Nivel | Nombre | Qué incluye |
|-------|--------|-------------|
| 1 | Guiado | Timer básico — `useState`, `useEffect`, `useRef`, formato MM:SS |
| 2 | Semi-guiado | Alternancia trabajo/descanso + historial de sesiones |
| 3 | Reto | Configuración personalizada, barra de progreso, sonido, estadísticas y sesión parcial |

---

## Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build
```

Abre `http://localhost:5173` en tu navegador.

---

## Estructura relevante

```
src/
├── components/
│   ├── Pomodoro.jsx   # Componente principal con los 3 niveles
│   └── Pomodoro.css   # Estilos en CSS plano
├── App.jsx            # Renderiza <Pomodoro />
└── main.jsx           # Entry point
```
