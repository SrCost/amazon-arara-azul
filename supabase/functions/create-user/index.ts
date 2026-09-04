// Edge Function para criar usuários administrativamente
// Requer SUPABASE_SERVICE_ROLE_KEY para criar usuários via Admin API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_MODULES = [
  'dashboard', 'calendar', 'reservations', 'messages', 'gallery', 'carousel',
  'automation', 'forms', 'fnrh', 'packages', 'bungalows', 'experiences',
  'payments', 'users', 'audit',
]

interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  role: 'super_admin' | 'admin' | 'user'
  modules?: string[]
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an authenticated super admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || roleData?.role !== 'super_admin') {
      throw new Error('Only super administrators can create users')
    }

    // Get request body
    const { email, password, full_name, role }: CreateUserRequest = await req.json()

    // Validate input
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role')
    }

    if (!['super_admin', 'admin', 'user'].includes(role)) {
      throw new Error('Invalid role. Must be: super_admin, admin, or user')
    }

    // Create user using Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      throw createError
    }

    // The trigger handle_new_user will automatically create profile and assign default role
    // Now we need to update the role if it's not 'user'
    if (role !== 'user') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', newUser.user.id)

      if (roleUpdateError) {
        console.error('Error updating role:', roleUpdateError)
        throw new Error('User created but failed to assign role')
      }
    }

    console.log('User created successfully:', { userId: newUser.user.id, email, role })

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name,
          role
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
