import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pahwzqtrjhmvotdkchia.supabase.co';
const supabaseAnonKey = 'sb_publishable_V0IQ3m-L60NJO2R8JXLbxw_S0sQBZIb';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '22247071347@bosla.app', // dummy admin email from previous test
    password: 'password123'
  });

  if (authError) {
    console.log("Auth Error!", authError);
    return;
  }
  
  console.log("Logged in:", authData.user.id);
  
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log("Profiles for this user's agency:", profiles);
  
  const { data: customers } = await supabase.from('customers').select('*').limit(1);
  if (!customers || customers.length === 0) {
    console.log("No customers found.");
    return;
  }
  
  const customer = customers[0];
  console.log("Found customer:", customer.id, customer.name);
  
  const newName = customer.name + ' - edited';
  console.log("Attempting to update name to:", newName);
  
  const { error: updateError, data: updateData } = await supabase
    .from('customers')
    .update({ name: newName })
    .eq('id', customer.id)
    .select();
    
  console.log("Update result:", updateError, updateData);
}

main();
