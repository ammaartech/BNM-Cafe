require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: cols, error: errCol } = await supabase.rpc('query_columns', {});
    // if rpc fails, we can just try to select
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    console.log(error ? error : Object.keys(data[0] || {}));
}

checkSchema();
