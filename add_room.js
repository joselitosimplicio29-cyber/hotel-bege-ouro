const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qdwubljlkrgugqkiepuf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3VibGpsa3JndWdxa2llcHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MDE2NSwiZXhwIjoyMDk0MzU2MTY1fQ.mJmgCYWVK6pE9Y3bEwP3TlYRL4VBrk6WX9e3cN7MQrk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('rooms')
    .upsert([
      { 
        id: 'q104', 
        numero: '104', 
        tipo: 'Casal Duplo', 
        capacidade: 3, 
        preco: 270.00, 
        status: 'disponivel', 
        descricao: 'Quarto espaçoso com uma cama de casal e uma cama de solteiro. Ideal para pequenos grupos. Ar-condicionado, TV e frigobar inclusos.',
        amenities: ['Wi-Fi', 'TV 32"', 'Ar-cond.', 'Frigobar']
      }
    ]);
  console.log('Error:', error);
  console.log('Room Added successfully');
}
main();
