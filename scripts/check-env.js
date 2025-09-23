#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Ejecutar con: node scripts/check-env.js
 */

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar variables de entorno
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO ENCONTRADA`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('🎉 Todas las variables de entorno están configuradas correctamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Configura estas variables en Vercel Dashboard');
  console.log('2. Configura las URLs de redirección en Supabase');
  console.log('3. Despliega la aplicación');
} else {
  console.log('⚠️  Faltan variables de entorno requeridas');
  console.log('\n📋 Para solucionarlo:');
  console.log('1. Crea un archivo .env con las variables necesarias');
  console.log('2. Configura las variables en Vercel Dashboard');
  console.log('3. Verifica la configuración de Supabase');
}

console.log('\n🔗 URLs de configuración:');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');
console.log('- Documentación: ./DEPLOYMENT.md');
