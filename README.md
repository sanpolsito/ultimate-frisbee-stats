# 🥏 Ultimate Frisbee Stats App

Aplicación web progresiva (**PWA**) para registrar y analizar estadísticas de partidos de **Ultimate Frisbee** en tiempo real.  
Construida con **React + TypeScript + Vite**, con soporte para instalación en móviles y persistencia de datos local con opción de integrarse a Supabase.

---

## ✨ Características

- 📊 **Marcador en vivo** entre dos equipos.  
- 📝 **Registro de eventos** principales: puntos, asistencias, drops, blocks, turnovers, pulls.  
- 🧑‍🤝‍🧑 **Gestión de jugadores y equipos**.  
- 🥏 **Pull stats (Modo Coach)**: jugador que lanza, hangtime, distancia, in/out.  
- 📈 **Historial del partido** con timeline de eventos.  
- 📲 **PWA instalable en móvil** (soporta uso offline).  
- 💾 **Persistencia local con LocalStorage/IndexedDB** + integración con **Supabase** para almacenamiento en la nube.  

---

## 🚀 Stack Tecnológico

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)  
- [Vite](https://vitejs.dev/) – Bundler ultrarrápido  
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) – PWA y Service Workers  
- [Supabase](https://supabase.com/) – (opcional) backend en la nube con Postgres + Auth  
- [TailwindCSS](https://tailwindcss.com/) (opcional) – utilidades de estilos  

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/ultimate-frisbee-stats.git
cd ultimate-frisbee-stats
