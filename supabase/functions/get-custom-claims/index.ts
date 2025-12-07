// IMPORTANT: This function is called by Supabase Auth for every new session.
// It runs in a Deno edge environment and has access to the user's JWT.
// It's responsible for looking up the user's role from the 'users' table
// and adding it as a custom claim to the JWT. This claim is then readable
// by Row Level Security (RLS) policies in the database.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

// Main function handler
Deno.serve(async (req) => {
  // This is a preflight request. We don't need to do anything.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    // Check if the user object and ID exist
    if (!record || !record.id) {
      throw new Error('User record or user ID is missing in the request body.');
    }

    const userId = record.id;

    // Create a Supabase admin client. This is necessary because we are operating
    // inside a Supabase Function and need to bypass RLS to read the users table.
    // The service_role key is automatically available in the Edge Function environment.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the user's role from the 'users' table
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      // If the profile doesn't exist yet (e.g., during signup), we can't assign a role.
      // We can return an empty object or default claims.
      if (error.code === 'PGRST116') {
         console.warn(`Profile for user ${userId} not found. This is expected during signup.`);
         return new Response(JSON.stringify({}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      // For other errors, throw and let the logs capture it.
      throw error;
    }

    const customClaims = {
      user_role: profile?.role || 'customer', // Default to 'customer' if role is null
    };

    // Return the custom claims to be added to the JWT
    return new Response(JSON.stringify(customClaims), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
