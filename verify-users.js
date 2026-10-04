const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log("Checking all users in Supabase Auth...");
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error.message);
    return;
  }
  
  if (data.users.length === 0) {
    console.log("No users found in Supabase Auth.");
  } else {
    data.users.forEach(user => {
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Email Confirmed: ${user.email_confirmed_at ? 'YES (' + user.email_confirmed_at + ')' : 'NO'}`);
      console.log(`Created At: ${user.created_at}`);
      console.log('-----------------------------------');
    });
  }
}

checkUsers();
