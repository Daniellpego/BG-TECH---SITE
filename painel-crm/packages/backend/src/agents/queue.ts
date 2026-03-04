import { Queue, Worker, Job } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'agent-jobs';

/** Parse REDIS_URL into a BullMQ-compatible connection config. */
function getConnectionOpts() {
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

/**
 * Agent job queue — enqueues agent execution requests.
 * Jobs are processed asynchronously by the worker process.
 */
let _queueInstance: Queue | null = null;
export function getAgentQueue(): Queue {
  if (!_queueInstance) {
    _queueInstance = new Queue(QUEUE_NAME, { connection: getConnectionOpts() });
  }
  return _queueInstance;
}

export interface AgentJobData {
  tenantId: string;
  agentName: string;
  action: string;
  payload: Record<string, any>;
}

export interface AgentJobResult {
  agentName: string;
  status: 'success' | 'error';
  output: any;
  tokensUsed: number;
  latencyMs: number;
  model: string;
}

/**
 * Create and start the agent worker.
 * `processor` receives each job and returns AgentJobResult.
 */
export function createAgentWorker(
  processor: (job: Job<AgentJobData>) => Promise<AgentJobResult>,
): Worker<AgentJobData, AgentJobResult> {
  const worker = new Worker<AgentJobData, AgentJobResult>(
    QUEUE_NAME,
    processor,
    {
      connection: getConnectionOpts(),
      concurrency: Number(process.env.WORKER_CONCURRENCY) || 3,
    },
  );

  worker.on('completed', (job) => {
    console.log(
      `[agent-worker] Job ${job.id} completed — agent=${job.data.agentName}`,
    );
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[agent-worker] Job ${job?.id} failed — agent=${job?.data.agentName}: ${err.message}`,
    );
  });

  return worker;
}

/**
 * Enqueue an agent job and return the job ID for polling.
 */
export async function enqueueAgentJob(
  data: AgentJobData,
): Promise<{ jobId: string }> {
  const queue = getAgentQueue();
  const job = await queue.add(data.agentName, data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  });
  return { jobId: job.id! };
}
