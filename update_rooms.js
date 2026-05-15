const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qdwubljlkrgugqkiepuf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3VibGpsa3JndWdxa2llcHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MDE2NSwiZXhwIjoyMDk0MzU2MTY1fQ.mJmgCYWVK6pE9Y3bEwP3TlYRL4VBrk6WX9e3cN7MQrk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Clear all existing rooms
  const { error: delErr } = await supabase.from('rooms').delete().neq('id', 'something_impossible');
  if (delErr) {
    console.error('Error deleting rooms:', delErr);
    return;
  }

  // Insert the 3 specific rooms
  const { data, error } = await supabase.from('rooms').insert([
    {
      id: 'q101',
      numero: '101',
      tipo: 'Individual',
      capacidade: 1,
      preco: 190.00,
      status: 'disponivel',
      descricao: 'Quarto aconchegante com cama de solteiro, ideal para viajantes solo. Wi-Fi, TV e ar-condicionado inclusos.',
      amenities: ['Wi-Fi', 'Smart TV', 'Ar-cond.']
    },
    {
      id: 'q102',
      numero: '102',
      tipo: 'Casal Duplo',
      capacidade: 2,
      preco: 250.00,
      status: 'disponivel',
      descricao: 'Quarto espaçoso com cama de casal, ideal para casais. Ar-condicionado, TV e frigobar inclusos.',
      amenities: ['Wi-Fi', 'Smart TV', 'Ar-cond.', 'Frigobar']
    },
    {
      id: 'q103',
      numero: '103',
      tipo: 'Triplo',
      capacidade: 3,
      preco: 290.00,
      status: 'disponivel',
      descricao: 'Quarto amplo com três camas, ideal para grupos e famílias. Wi-Fi, TV 32", ar-condicionado e frigobar inclusos.',
      amenities: ['Wi-Fi', 'TV 32"', 'Ar-cond.', 'Frigobar']
    }
  ]);
  
  if (error) {
    console.error('Error inserting rooms:', error);
  } else {
    console.log('Rooms successfully updated!');
  }
}

main();
