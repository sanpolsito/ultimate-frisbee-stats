# 🚀 Configuración de Supabase para Ultimate Frisbee Stats App

Esta guía te ayudará a configurar tu proyecto Supabase para la aplicación de estadísticas de Ultimate Frisbee.

## 📋 Prerrequisitos

- Cuenta de Supabase (gratuita)
- Node.js instalado
- Git instalado

## 🛠️ Pasos de Configuración

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - **Name**: Ultimate Frisbee Stats
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la región más cercana
5. Haz clic en "Create new project"
6. Espera a que se complete la configuración (2-3 minutos)

### 2. Configurar la Base de Datos

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido del archivo `supabase-schema.sql`
3. Haz clic en **Run** para ejecutar el script
4. Verifica que todas las tablas se crearon correctamente

### 3. Obtener Credenciales

1. En el dashboard, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** (https://bqrrcnxkjifjqgxhtiao.supabase.co)
   - **anon public** key (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnJjbnhramlmanFneGh0aWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzY2MzcsImV4cCI6MjA3NDE1MjYzN30.H6_klxPhzS_pBa7PZ4Mod8oCXyOiK1JwEmt6CT1IiG4)

### 4. Configurar Variables de Entorno

1. Copia el archivo `env.example` y renómbralo a `.env`
2. Reemplaza los valores con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 5. Configurar Autenticación

1. En el dashboard, ve a **Authentication** > **Settings**
2. En **Site URL**, agrega: `http://localhost:5173`
3. En **Redirect URLs**, agrega: `http://localhost:5173/**`
4. Guarda los cambios

### 6. Instalar Dependencias

```bash
npm install
```

### 7. Ejecutar la Aplicación

```bash
npm run dev
```

## 🔧 Configuración Avanzada

### Políticas de Seguridad (RLS)

El script SQL incluye políticas de Row Level Security (RLS) que:
- Permiten a los usuarios ver todos los equipos y partidos
- Solo permiten modificar datos propios
- Protegen la información sensible

### Funciones de Base de Datos

El esquema incluye funciones útiles:
- `get_player_stats()`: Obtiene estadísticas de un jugador
- `get_team_stats()`: Obtiene estadísticas de un equipo

### Índices de Rendimiento

Se crearon índices para optimizar consultas frecuentes:
- Búsquedas por usuario
- Filtros por fecha
- Consultas de partidos activos

## 🚀 Funcionalidades Habilitadas

Con Supabase configurado, tendrás acceso a:

### ✅ Sincronización en Tiempo Real
- Cambios instantáneos entre dispositivos
- Colaboración en vivo durante partidos
- Notificaciones automáticas

### ✅ Autenticación de Usuarios
- Registro e inicio de sesión
- Perfiles de usuario
- Gestión de sesiones

### ✅ Respaldo en la Nube
- Datos seguros en la nube
- Sincronización automática
- Recuperación de datos

### ✅ Escalabilidad
- Base de datos PostgreSQL robusta
- CDN global
- Infraestructura confiable

## 🔍 Verificación de la Configuración

Para verificar que todo está funcionando:

1. Abre la aplicación en `http://localhost:5173`
2. Intenta crear una cuenta
3. Crea un equipo
4. Inicia un partido
5. Verifica que los datos se guarden en Supabase

## 🆘 Solución de Problemas

### Error de Conexión
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto Supabase esté activo

### Error de Autenticación
- Verifica la configuración de Site URL y Redirect URLs
- Revisa que las políticas RLS estén activas

### Error de Migración
- Asegúrate de estar autenticado
- Verifica que las tablas existan en la base de datos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la consola del navegador
2. Verifica la configuración en Supabase
3. Consulta la documentación de Supabase
4. Revisa los issues en el repositorio

## 🎉 ¡Listo!

Una vez completada la configuración, tu aplicación estará lista para usar con todas las funcionalidades de Supabase habilitadas.

¡Disfruta registrando estadísticas de Ultimate Frisbee! 🥏
