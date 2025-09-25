import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import vault from 'node-vault';

@Injectable()
export class SecretsService {
  private vaultClient: vault.client;
  private clientToken: string | null;
  constructor(private config: ConfigService) {
    const vaultAddress = this.config.getOrThrow<string>('VAULT_ADDR');
    const vaultToken = this.config.getOrThrow<string>('VAULT_TOKEN');
    this.vaultClient = vault({ endpoint: vaultAddress, token: vaultToken });
    this.clientToken = null;
  }

  private readonly logger = new Logger(SecretsService.name);

  static mountPoint = 'approle';
  static roleName = 'lionsmanesecretservice';
  static policyName = 'lionsmanesecretpolicy';

  private async ensureAuthenticated(): Promise<void> {
    if (this.clientToken) {
      this.vaultClient.token = this.clientToken;
      return;
    }

    // Set the token to the bootstrap token for setup operations
    this.vaultClient.token = this.config.getOrThrow<string>('VAULT_TOKEN');

    const approle = await this.getRoleAndSecretId();

    const result = await this.vaultClient.approleLogin({
      role_id: approle.roleId,
      secret_id: approle.secretIdResp.data.secret_id,
    });

    this.clientToken = result.auth.client_token;
    // Set the token to the new client token for data operations
    if (this.clientToken) this.vaultClient.token = this.clientToken;
  }
  async upsertPolicy() {
    try {
      const policyExists = await this.vaultClient.getPolicy({
        name: SecretsService.policyName,
      });
      if (policyExists) {
        return policyExists;
      } else {
        return await this.vaultClient.addPolicy({
          name: SecretsService.policyName,
          rules:
            '{"path": { "secret/data/readlater/*": { "capabilities": ["create", "read", "update", "delete"] } } }',
        });
      }
    } catch {
      return await this.vaultClient.addPolicy({
        name: SecretsService.policyName,
        rules:
          '{"path": { "secret/data/readlater/*": { "capabilities": ["create", "read", "update", "delete"] } } }',
      });
    }
  }

  async getRoleAndSecretId() {
    const auths = await this.vaultClient.auths();
    if (!Object.hasOwn(auths, 'approle/')) {
      try {
        this.logger.log('Enabling approle...');
        await this.vaultClient.enableAuth({
          mount_point: SecretsService.mountPoint,
          type: 'approle',
          description: 'Approle auth',
        });
      } catch (error) {
        this.logger.error('Error enabling approle', error);
        throw new Error('Error enabling approle', { cause: error });
      }
    }
    await this.upsertPolicy();
    try {
      await this.vaultClient.getApproleRole({
        role_name: SecretsService.roleName,
      });
    } catch {
      await this.vaultClient.addApproleRole({
        role_name: SecretsService.roleName,
        policies: `default, ${SecretsService.policyName}`,
      });
    }
    const roleId = await this.vaultClient.getApproleRoleId({
      role_name: SecretsService.roleName,
    });
    const secretId = await this.vaultClient.getApproleRoleSecret({
      role_name: SecretsService.roleName,
    });
    return { roleId: roleId.data.role_id, secretIdResp: secretId };
  }
  async readSecret(
    secretPath: string,
  ): Promise<{ apiKey: string; apiUrl: string }> {
    try {
      await this.ensureAuthenticated();
      const secretData = await this.vaultClient.read(secretPath);
      // secretpath is the path in vault where you have stored your secrets
      return secretData.data.data;
    } catch {
      this.clientToken = null;
      await this.ensureAuthenticated();
      const secretData = await this.vaultClient.read(secretPath);
      // secretpath is the path in vault where you have stored your secrets
      return secretData.data.data;
    }
  }

  async writeSecret(
    secretPath: string,
    secretData: { apiUrl: string; apiKey: string },
  ): Promise<void> {
    try {
      await this.ensureAuthenticated();
      await this.vaultClient.write(secretPath, { data: secretData });
    } catch {
      // assume token has expired
      this.clientToken = null;
      await this.ensureAuthenticated();
      await this.vaultClient.write(secretPath, { data: secretData });
    }
  }
}
