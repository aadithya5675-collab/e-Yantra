import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const members = [
  { username: 'aadithya', display_name: 'Aadithya', role: 'admin' },
  { username: 'riswandh', display_name: 'Riswandh', role: 'admin' },
  { username: 'devin', display_name: 'Devin', role: 'member' },
  { username: 'mohish', display_name: 'Mohish', role: 'member' },
] as const;

async function seed() {
  for (const m of members) {
    const email = `${m.username}@uvira-apex.team`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: '123456',
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`User ${m.username} already exists, skipping`);
        continue;
      }
      console.error(`Failed to create ${m.username}:`, error.message);
      continue;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: m.username,
      display_name: m.display_name,
      role: m.role,
      must_change_password: true,
    });

    if (profileError) {
      console.error(`Failed to create profile for ${m.username}:`, profileError.message);
    } else {
      console.log(`Created ${m.role}: ${m.username}`);
    }
  }

  console.log('\nSeed complete! All passwords are: 123456');
}

seed();
