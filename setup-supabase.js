const SB_URL = 'https://qdwubljlkrgugqkiepuf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3VibGpsa3JndWdxa2llcHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MDE2NSwiZXhwIjoyMDk0MzU2MTY1fQ.mJmgCYWVK6pE9Y3bEwP3TlYRL4VBrk6WX9e3cN7MQrk';
const H = { 'Content-Type':'application/json', 'Authorization':`Bearer ${SB_KEY}`, 'apikey':SB_KEY };

async function api(method, path, body) {
  const r = await fetch(`${SB_URL}${path}`, { method, headers:H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { ok:r.ok, s:r.status, d:JSON.parse(t) }; } catch { return { ok:r.ok, s:r.status, d:t }; }
}

async function createUser(email, password, nome, perfil) {
  console.log(`\n→ ${email}`);
  const r = await api('POST', '/auth/v1/admin/users', { email, password, email_confirm:true });
  let uid = r.d?.id;
  if (!uid) {
    const list = await api('GET', '/auth/v1/admin/users?per_page=50');
    uid = list.d?.users?.find(u => u.email === email)?.id;
  }
  if (!uid) { console.error('  ERRO: não encontrou uid'); return; }
  console.log(`  ✓ uid: ${uid}`);
  const p = await api('POST', '/rest/v1/profiles', { id:uid, nome, perfil });
  console.log(p.ok ? `  ✓ profile: ${perfil}` : `  profile: ${JSON.stringify(p.d).slice(0,100)}`);
}

async function main() {
  console.log('=== Setup Hotel Bege Ouro ===');
  const check = await api('GET', '/rest/v1/rooms?limit=1');
  console.log(check.ok ? `✓ Banco OK (${Array.isArray(check.d)?check.d.length:0} quartos encontrados)` : '❌ Erro: '+JSON.stringify(check.d));
  await createUser('admin@begeouro.com','Admin@123','Administrador','admin');
  await createUser('maria@begeouro.com','Maria@123','Maria Recepção','funcionario');
  await createUser('joao@begeouro.com','Joao@123','João Financeiro','financeiro');
  console.log('\n✅ Pronto! Login: admin@begeouro.com / Admin@123');
}
main().catch(console.error);
