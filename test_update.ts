import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  // First login with dummy admin user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '22247071347@bosla.app', // Assuming this is an admin email created
    password: 'password123'         // Let's use generic password, or we can just bypass and test RLS
  });

  if (authError) {
    console.log("Auth Error!", authError.message);
    return;
  }
  
  console.log("Logged in user:", authData.user.id);
  
  const { data: customers, error: fetchError } = await supabase.from('customers').select('*').limit(1);
  if (fetchError) {
    console.log("Fetch Error", fetchError);
    return;
  }
  
  if (customers && customers.length > 0) {
    const customer = customers[0];
    console.log("Trying to update customer:", customer.id);
    
    // Attempt update
    const { data: updateData, error: updateError } = await supabase
      .from('customers')
      .update({ name: customer.name + ' - Updated' })
      .eq('id', customer.id)
      .select();
      
    console.log("Update Result:", { updateData, updateError });
  } else {
    console.log("No customers found for this user.");
  }
}

main();
