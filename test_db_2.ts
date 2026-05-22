import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pahwzqtrjhmvotdkchia.supabase.co';
const supabaseAnonKey = 'sb_publishable_V0IQ3m-L60NJO2R8JXLbxw_S0sQBZIb';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const dummyEmail = `test_${Date.now()}@bosla.app`;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: dummyEmail,
    password: 'password123' // generic password
  });

  if (authError) {
    console.log("Signup Error!", authError);
    return;
  }
  
  console.log("Signed up:", dummyEmail);
  
  // Now we need to create an agency
  const { data: agencyData, error: agencyError } = await supabase
    .from('agencies')
    .insert([{ name: 'Test Agency' }])
    .select()
    .single();
    
  if (agencyError) {
    console.log("Agency Error!", agencyError);
    return;
  }
  
  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: authData.user!.id,
      agency_id: agencyData.id,
      full_name: 'Test Setup',
      role: 'admin'
    }]);
    
  if (profileError) {
    console.log("Profile Error!", profileError);
    return;
  }

  console.log("Agency and Profile setup successful.");
  
  // Insert a customer
  const { data: insertData, error: insertError } = await supabase
    .from('customers')
    .insert([{ name: 'Customer A', phone: '123', agency_id: agencyData.id }])
    .select()
    .single();
    
  if (insertError) {
    console.log("Customer Insert Error!", insertError);
    return;
  }
  
  console.log("Inserted customer:", insertData.id);
  
  // Update it
  const { data: updateData, error: updateError } = await supabase
    .from('customers')
    .update({ name: 'Customer A - Edited' })
    .eq('id', insertData.id)
    .select();
    
  console.log("Update result:", updateError, updateData);
  
  // Delete it
  const { data: deleteData, error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', insertData.id)
    .select();
    
  console.log("Delete result:", deleteError, deleteData);
}

main();
