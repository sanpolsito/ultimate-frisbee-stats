# 🚀 Guía de Despliegue - Ultimate Frisbee Stats App

## 📋 Configuración en Vercel

### 1. Variables de Entorno

Configura las siguientes variables de entorno en tu dashboard de Vercel:

```bash
VITE_SUPABASE_URL=https://bqrrcnxkjifjqgxhtiao.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnJjbnhramlmanFneGh0aWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzY2MzcsImV4cCI6MjA3NDE1MjYzN30.H6_klxPhzS_pBa7PZ4Mod8oCXyOiK1JwEmt6CT1IiG4
```

### 2. Pasos para Configurar en Vercel

1. **Conecta tu repositorio de GitHub a Vercel**
2. **Ve a Settings > Environment Variables**
3. **Agrega las variables:**
   - `VITE_SUPABASE_URL` = `https://bqrrcnxkjifjqgxhtiao.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnJjbnhramlmanFneGh0aWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzY2MzcsImV4cCI6MjA3NDE1MjYzN30.H6_klxPhzS_pBa7PZ4Mod8oCXyOiK1JwEmt6CT1IiG4`

### 3. Configuración de Supabase

En tu dashboard de Supabase:

1. **Ve a Authentication > Settings**
2. **Configura las URLs:**
   - **Site URL**: `https://tu-app.vercel.app`
   - **Redirect URLs**: 
     - `https://tu-app.vercel.app/**`
     - `https://tu-app.vercel.app`

## 🔧 Configuración de Build

El archivo `vercel.json` ya está configurado con:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `build`
- Rewrites para SPA

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de que los nombres sean exactos: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### Error de Autenticación
- Verifica que las URLs de redirección estén configuradas en Supabase
- Asegúrate de que el dominio de Vercel esté en la lista de URLs permitidas

### La aplicación funciona en modo desarrollo en producción
- Esto se ha corregido en el código - ahora solo detecta desarrollo en localhost

## 📱 Verificación del Despliegue

1. **Despliega la aplicación en Vercel**
2. **Abre la URL de producción**
3. **Verifica que:**
   - No aparezca el banner de "MODO DESARROLLO"
   - La autenticación funcione correctamente
   - Los datos se guarden en Supabase

## 🔄 Re-despliegue

Después de hacer cambios:
1. Haz commit y push a tu repositorio
2. Vercel desplegará automáticamente
3. Verifica que las variables de entorno sigan configuradas

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Vercel en el dashboard
2. Verifica la consola del navegador para errores
3. Confirma que las variables de entorno estén correctas
