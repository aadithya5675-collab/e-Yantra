import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://arhbnjebavzqygenpuic.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyaGJuamViYXZ6cXlnZW5wdWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg5OTc3NywiZXhwIjoyMTAxNDc1Nzc3fQ.OPNtfRHEVj-Q-LRBjPoBzEzvgZDTQs7SRXN4hlCIN4U';

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

async function main() {
  console.log(`Setting up single admin account: ${adminUser.username} (${adminUser.email})...`);

  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  
  if (usersErr) {
    console.error('Error listing users:', usersErr.message);
    process.exit(1);
  }

  let user = usersData?.users?.find(u => u.email === adminUser.email);
  let userId = user?.id;

  if (!user) {
    console.log(`User ${adminUser.email} not found, creating user...`);
    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email: adminUser.email,
      password: adminUser.password,
      email_confirm: true,
      user_metadata: { username: adminUser.username, display_name: adminUser.display_name, role: adminUser.role },
    });

    if (createErr) {
      console.error('Error creating admin user:', createErr.message);
      process.exit(1);
    }
    userId = createData.user.id;
  } else {
    console.log(`Updating existing admin password for ${adminUser.email}...`);
    await supabase.auth.admin.updateUserById(userId, { password: adminUser.password });
  }

  if (userId) {
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username: adminUser.username,
      display_name: adminUser.display_name,
      role: adminUser.role,
      must_change_password: false,
    });

    if (profileErr) {
      console.log('Profile table notice:', profileErr.message);
    } else {
      console.log('✅ Admin profile setup complete!');
    }
  }

  console.log('\n=========================================');
  console.log(' Single Admin Credentials:');
  console.log(`   Email / Login: ${adminUser.email}`);
  console.log(`   Username:      ${adminUser.username}`);
  console.log(`   Password:      ${adminUser.password}`);
  console.log('=========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
