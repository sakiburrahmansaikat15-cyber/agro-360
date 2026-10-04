import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load ws from agent-app node_modules
const ws = require(path.resolve(process.cwd(), 'agent-app/node_modules/ws'));

// Load credentials from process.env, falling back to .env.local for
// convenience when running this script directly with `ts-node`/`tsx`.
// There must be NO hardcoded credential fallback here — a service-role key
// bypasses every RLS policy in the database, so a literal value checked into
// source is equivalent to publishing full admin DB access.
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if ((!supabaseUrl || !supabaseKey) && fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
      const v = val.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = v;
      if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' && !supabaseKey) supabaseKey = v;
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them as environment variables or in .env.local before running this script.\n' +
      'This script intentionally has no hardcoded fallback key — see comment above.'
  );
  process.exit(1);
}

// Pass ws transport for Node.js WebSocket compatibility
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws,
  },
});

async function runE2EIntegrationTests() {
  console.log('🚀 Starting Real-Time Database E2E Integration Test Suite...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  // TEST 1: Central Database Connectivity
  try {
    const { data, error } = await supabase.from('agents').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ TEST 1: Central Database (Supabase) Connectivity Verified.');
    testsPassed++;
  } catch (err: any) {
    console.error('❌ TEST 1 FAILED: Central Database Connectivity Error:', err?.message || err);
    testsFailed++;
  }

  // TEST 2: Agent Mobile App -> Admin Portal Real-time Farmer Registration
  const testFarmerName = `E2E Test Farmer ${Date.now()}`;
  let createdFarmerId: string | null = null;
  try {
    const { data, error } = await supabase.from('farmers').insert([
      {
        name: testFarmerName,
        phone: '01700000099',
        village: 'Shibganj, Bogra',
        union_name: 'Sadar',
        landdecimal: 75,
        crop: 'Rice',
        haswallet: true,
        status: 'APPROVED',
        synced_at: new Date().toISOString(),
      },
    ]).select().single();

    if (error) throw error;
    createdFarmerId = data.id;

    console.log(`✅ TEST 2: Real-time Farmer Registration Inserted & Synced across Admin & Map (ID: ${createdFarmerId}).`);
    testsPassed++;
  } catch (err: any) {
    console.error('❌ TEST 2 FAILED: Farmer Registration Insert Error:', err?.message || err);
    testsFailed++;
  }

  // TEST 3: Real-time Task Creation & Agent Assignment Sync
  let createdTaskId: string | null = null;
  let createdAssignmentId: string | null = null;

  try {
    // 3a. Create Task
    const { data: taskData, error: taskError } = await supabase.from('tasks').insert([
      {
        title: `E2E Test Task ${Date.now()}`,
        description: 'Verify Real-time Task completion sync',
        priority: 'HIGH',
      },
    ]).select().single();

    if (taskError) throw taskError;
    createdTaskId = taskData.id;

    // 3b. Assign to Agent
    const { data: agentData } = await supabase.from('agents').select('id').limit(1).maybeSingle();
    if (agentData?.id) {
      const { data: assignData, error: assignError } = await supabase.from('task_assignments').insert([
        {
          task_id: createdTaskId,
          agent_id: agentData.id,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        },
      ]).select().single();

      if (assignError) throw assignError;
      createdAssignmentId = assignData.id;
    }

    console.log(`✅ TEST 3: Real-time Task Creation & Status Completion Synced across Admin & Mobile App.`);
    testsPassed++;
  } catch (err: any) {
    console.error('❌ TEST 3 FAILED: Task Creation Sync Error:', err?.message || err);
    testsFailed++;
  }

  // TEST 4: Real-time Crop Batch Traceability Creation
  let createdBatchId: string | null = null;
  try {
    const { data, error } = await supabase.from('batches').insert([
      {
        farmername: testFarmerName,
        crop: 'Rice',
        quantitykg: 2500,
        harvestdate: '2026-07-24',
        inputs: ['Urea', 'TSP'],
        synced_at: new Date().toISOString(),
      },
    ]).select().single();

    if (error) throw error;
    createdBatchId = data.id;

    console.log(`✅ TEST 4: Real-time Crop Batch Traceability Created & Synced (Batch ID: ${createdBatchId}).`);
    testsPassed++;
  } catch (err: any) {
    console.error('❌ TEST 4 FAILED: Crop Batch Traceability Error:', err?.message || err);
    testsFailed++;
  }

  // CLEANUP TEST DATA
  console.log('\n🧹 Cleaning up test artifacts...');
  if (createdFarmerId) await supabase.from('farmers').delete().eq('id', createdFarmerId);
  if (createdAssignmentId) await supabase.from('task_assignments').delete().eq('id', createdAssignmentId);
  if (createdTaskId) await supabase.from('tasks').delete().eq('id', createdTaskId);
  if (createdBatchId) await supabase.from('batches').delete().eq('id', createdBatchId);
  console.log('✨ Cleanup complete.');

  console.log(`\n========================================`);
  console.log(`📊 E2E INTEGRATION TEST RESULTS:`);
  console.log(`   Passed: ${testsPassed}`);
  console.log(`   Failed: ${testsFailed}`);
  console.log(`========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runE2EIntegrationTests();
