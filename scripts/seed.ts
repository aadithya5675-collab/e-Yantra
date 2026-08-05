import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://arhbnjebavzqygenpuic.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyaGJuamViYXZ6cXlnZW5wdWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg5OTc3NywiZXhwIjoyMTAxNDc1Nzc3fQ.OPNtfRHEVj-Q-LRBjPoBzEzvgZDTQs7SRXN4hlCIN4U';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adminUser = {
  username: 'uvira',
  email: 'uvira@uvira-apex.team',
  password: 'uvira@eyantra',
  display_name: 'Uvira Admin',
  role: 'admin',
};

async function seed() {
  console.log(`Setting up single admin account: ${adminUser.username} (${adminUser.email})...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminUser.email,
    password: adminUser.password,
    email_confirm: true,
    user_metadata: { username: adminUser.username, display_name: adminUser.display_name, role: adminUser.role },
  });

  let userId = data?.user?.id;

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`User ${adminUser.email} already registered, resetting password to ${adminUser.password}...`);
      const { data: existingData } = await supabase.auth.admin.listUsers();
      const existingUser = existingData?.users?.find(u => u.email === adminUser.email);
      if (existingUser) {
        userId = existingUser.id;
        await supabase.auth.admin.updateUserById(userId, { password: adminUser.password });
      }
    } else {
      console.error(`Failed to create admin ${adminUser.email}:`, error.message);
      process.exit(1);
    }
  }

  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      username: adminUser.username,
      display_name: adminUser.display_name,
      role: adminUser.role,
      must_change_password: false,
    });

    if (profileError) {
      console.error(`Profile upsert info: ${profileError.message}`);
    } else {
      console.log(`✅ Admin profile created: ${adminUser.username}`);
    }
  }

  console.log('\nSeed complete! Admin credentials:');
  console.log(`  Username / Email: ${adminUser.email}`);
  console.log(`  Password:         ${adminUser.password}`);
}

seed();
