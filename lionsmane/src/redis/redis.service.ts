import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, Cluster } from 'ioredis';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type RedisClient = Redis | Cluster;
type RedisClientWithCommands = RedisClient & {
  getNextTimeSlot: (
    key: string,
    crawlDelay: number,
    numberOfJobs: number,
  ) => Promise<string>;
};

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClient;
  private readonly isClusterMode: boolean;

  constructor(private configService: ConfigService) {
    const mode = this.configService.get<string>('REDIS_MODE', 'single');
    this.isClusterMode = mode === 'cluster';
  }

  async onModuleInit() {
    await this.connect();
    this.loadLuaScripts();
  }
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log(`Redis client disconnected`);
    }
  }

  private async connect() {
    if (this.isClusterMode) {
      this.connectToCluster();
    } else {
      this.connectToSingle();
    }

    this.client.on('error', () => {
      this.logger.error('Redis error');
      process.exit(1);
    });

    this.client.on('connect', () => {
      this.logger.log(
        `Connected to Redis ${this.isClusterMode ? 'cluster' : 'server'}`,
      );
    });

    this.client.on('ready', () => {
      this.logger.log(`Redis client is ready`);
    });

    try {
      await this.client.ping();
      this.logger.log(`Successfully pinged Redis`);
    } catch {
      this.logger.error('Failed to ping Redis');
      process.exit(1);
    }
  }

  private connectToSingle() {
    const config = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };
    this.client = new Redis(config);
  }

  private connectToCluster() {
    const clusterNodes = this.configService
      .get<string>(
        'REDIS_CLUSTER_NODES',
        'localhost:7000,localhost:7001,localhost:7002',
      )
      .split(',')
      .map((node) => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port, 10) };
      });

    const clusterConfig = {
      connectTimeout: 10000,
      commandTimeout: 5000,
      lazyConnect: true,
      enableReadyCheck: true,
      redisOptions: {
        password: this.configService.get<string>('REDIS_PASSWORD'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
      },
      maxRetriesPerRequest: 3,
      retryDelayOnClusterDown: 300,
      enableOfflineQueue: false,
      slotsRefreshTimeout: 10000,
    };

    this.client = new Cluster(clusterNodes, clusterConfig);
  }

  private loadLuaScripts() {
    try {
      const luaScript = readFileSync(
        join(__dirname, 'reserve-time-block.lua'),
        'utf-8',
      );

      this.client.defineCommand('getNextTimeSlot', {
        numberOfKeys: 1,
        lua: luaScript,
      });
      this.logger.log(`Loaded Lua scripts into Redis`);
    } catch (error) {
      this.logger.error('Failed to load Lua scripts');
      throw error;
    }
  }

  getClient(): RedisClientWithCommands {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client as RedisClientWithCommands;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      if (this.isClusterMode) {
        const clusterInfo = await (this.client as Cluster).cluster('INFO');
        const clusterState = clusterInfo
          .split('\r\n')
          .find((line) => line.startsWith('cluster_state:'))
          ?.split(':')[1];

        return clusterState === 'ok';
      }
      return true;
    } catch {
      this.logger.error('Redis health check failed');
      return false;
    }
  }

  async getConnectionInfo(): Promise<object> {
    if (this.isClusterMode) {
      return {
        mode: 'cluster',
        nodes: await (this.client as Cluster).cluster('NODES'),
      };
    } else {
      return {
        mode: 'single',
        info: await (this.client as Redis).info(),
      };
    }
  }
}
