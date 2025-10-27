// Script de prueba para verificar conexión a Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juipiurmgphxlmxdlbme.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aXBpdXJtZ3BoeGxteGRsYm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjU4OTcsImV4cCI6MjA3NjU0MTg5N30.gIbbnfGFjCtVuGQ5RgQLtTVdjEqmKYjm81Hp1jpciOY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Probando conexión a Supabase...\n')

// Test 1: Probar conexión básica
async function testConexion() {
  console.log('📡 Test 1: Conexión básica')
  try {
    const { data, error } = await supabase.from('usuarios').select('count')
    if (error) {
      console.error('❌ Error:', error.message)
      console.error('Detalles:', error)
    } else {
      console.log('✅ Conexión exitosa')
      console.log('Datos:', data)
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err)
  }
  console.log('\n---\n')
}

// Test 2: Listar tablas disponibles
async function testTablas() {
  console.log('📋 Test 2: Verificando tablas')
  
  const tablasEsperadas = [
    'usuarios',
    'clientes', 
    'agentes_servicio',
    'coordinadores_campo',
    'tecnicos',
    'especialidades_tecnicos',
    'ordenes_servicio',
    'citas',
    'ejecuciones_servicio',
    'impedimentos',
    'notificaciones',
    'logs_auditoria'
  ]

  for (const tabla of tablasEsperadas) {
    try {
      const { data, error } = await supabase.from(tabla).select('*').limit(1)
      if (error) {
        console.log(`❌ ${tabla}: ${error.message}`)
      } else {
        console.log(`✅ ${tabla}: Existe (${data ? data.length : 0} registros de muestra)`)
      }
    } catch (err) {
      console.log(`❌ ${tabla}: Error de conexión`)
    }
  }
  console.log('\n---\n')
}

// Test 3: Verificar usuarios
async function testUsuarios() {
  console.log('👤 Test 3: Verificando usuarios')
  try {
    const { data, error } = await supabase.from('usuarios').select('*').limit(5)
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} usuarios`)
      if (data && data.length > 0) {
        console.log('Primeros usuarios:', data.map(u => ({ id: u.id_usuario, nombre: u.nombre_completo, tipo: u.tipo_usuario })))
      }
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
  console.log('\n---\n')
}

// Test 4: Verificar órdenes de servicio
async function testOrdenes() {
  console.log('📦 Test 4: Verificando órdenes de servicio')
  try {
    const { data, error } = await supabase.from('ordenes_servicio').select('*').limit(5)
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Encontradas ${data?.length || 0} órdenes`)
      if (data && data.length > 0) {
        console.log('Primeras órdenes:', data.map(o => ({ 
          id: o.id_orden, 
          numero: o.numero_orden, 
          estado: o.estado,
          tipo: o.tipo_servicio
        })))
      } else {
        console.log('⚠️ No hay órdenes creadas aún')
      }
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
  console.log('\n---\n')
}

// Ejecutar todos los tests
async function runAllTests() {
  await testConexion()
  await testTablas()
  await testUsuarios()
  await testOrdenes()
  
  console.log('✅ Tests completados')
  console.log('\n📋 RESUMEN:')
  console.log('Si ves errores arriba, puede ser:')
  console.log('1. RLS (Row Level Security) está bloqueando el acceso')
  console.log('2. Los nombres de las tablas no coinciden')
  console.log('3. No hay datos en las tablas')
  console.log('\nPara solucionar:')
  console.log('- Ve a Supabase → Table Editor → Verifica nombres de tablas')
  console.log('- Ve a Supabase → Authentication → Policies → Desactiva RLS o crea políticas')
}

runAllTests()


