import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://pahwzqtrjhmvotdkchia.supabase.co';
const supabaseAnonKey = 'sb_publishable_V0IQ3m-L60NJO2R8JXLbxw_S0sQBZIb';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '22247071347@bosla.app', // A dummy admin email
    password: 'password123'
  });
  
  if (authError || !authData.user) {
    console.log("Could not log in, but we can try to create a new user...");
    const email = `test_updates_${Date.now()}@bosla.app`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: 'password123'
    });
    
    if (signUpError) {
      console.log("Sign up failed", signUpError);
      return;
    }
    
    const { data } = await supabase.from('agencies').insert({ name: 'Test Agency' }).select().single();
    if (data) {
        await supabase.from('profiles').insert({ id: signUpData.user.id, agency_id: data.id, full_name: 'Tester', role: 'admin' });
        
        const { data: customer } = await supabase.from('customers').insert({ name: 'Test Customer', phone: '111', agency_id: data.id }).select().single();
        
        console.log("Created customer:", customer);
        
        if (customer) {
            const { error: updErr, data: updData } = await supabase.from('customers').update({ name: 'Updated name' }).eq('id', customer.id).select();
            console.log("Update output:", updData, updErr);
        }
    }
    return;
  }
}
main();
