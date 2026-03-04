/**
 * ETL Pipeline — Extração incremental de dados do CRM para data warehouse.
 * MVP: Delta extraction baseado em updated_at > last_run usando cron job.
 * Roadmap: Migrar para CDC via Debezium/pg_recvlogical.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const STATE_FILE = path.join(__dirname, '.etl-state.json');

interface EtlState {
  lastRun: string;
  tables: Record<string, { lastUpdated: string; rowsExtracted: number }>;
}

function loadState(): EtlState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {
      lastRun: new Date(0).toISOString(),
      tables: {},
    };
  }
}

function saveState(state: EtlState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function extractDelta(tableName: string, lastUpdated: Date) {
  const query = `
    SELECT * FROM "${tableName}"
    WHERE updated_at > $1
    ORDER BY updated_at ASC
  `;

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(query, lastUpdated);
    return rows;
  } catch (error) {
    // Fallback for tables without updated_at (agent_logs uses created_at)
    const fallbackQuery = `
      SELECT * FROM "${tableName}"
      WHERE created_at > $1
      ORDER BY created_at ASC
    `;
    return prisma.$queryRawUnsafe(fallbackQuery, lastUpdated) as Promise<any[]>;
  }
}

async function loadToWarehouse(tableName: string, rows: any[]) {
  // MVP: Write to local JSON files simulating data warehouse load
  // Production: Replace with BigQuery/Redshift/Snowflake client
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(outputDir, `${tableName}_${timestamp}.json`);

  fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
  console.log(`  → Wrote ${rows.length} rows to ${outputFile}`);
}

const TABLES = [
  'tenants',
  'users',
  'accounts',
  'contacts',
  'opportunities',
  'resources',
  'projects',
  'slas',
  'proposals',
  'contracts',
  'agent_logs',
];

async function runEtl() {
  console.log('🔄 Starting ETL pipeline...');
  const state = loadState();
  const runStart = new Date();

  for (const table of TABLES) {
    const lastUpdated = new Date(state.tables[table]?.lastUpdated || state.lastRun);
    console.log(`\n📊 Extracting ${table} (since ${lastUpdated.toISOString()})...`);

    try {
      const rows = await extractDelta(table, lastUpdated);

      if (rows.length > 0) {
        await loadToWarehouse(table, rows);
        state.tables[table] = {
          lastUpdated: runStart.toISOString(),
          rowsExtracted: rows.length,
        };
      } else {
        console.log(`  → No new rows`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error extracting ${table}: ${error.message}`);
    }
  }

  state.lastRun = runStart.toISOString();
  saveState(state);

  console.log('\n✅ ETL pipeline completed');
  console.log(`   Run at: ${runStart.toISOString()}`);
}

// Run if executed directly
runEtl()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
