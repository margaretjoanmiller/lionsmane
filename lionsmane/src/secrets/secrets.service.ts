import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import vault from 'node-vault';

@Injectable()
export class SecretsService {
  private vaultClient: vault.client;
  constructor(private config: ConfigService) {
    const vaultAddress = this.config.getOrThrow<string>('VAULT_ADDR');
    const vaultToken = this.config.getOrThrow<string>('VAULT_TOKEN');
    this.vaultClient = vault({ endpoint: vaultAddress, token: vaultToken });
  }

  private readonly logger = new Logger(SecretsService.name);

  static mountPoint = 'approle';
  static roleName = 'lionsmanesecretservice';
  static policyName = 'lionsmanesecretpolicy';

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
            '{"path": { "secret/data/readlater/*": { "policy": "write" } } }',
        });
      }
    } catch {
      return await this.vaultClient.addPolicy({
        name: SecretsService.policyName,
        rules:
          '{"path": { "secret/data/readlater/*": { "policy": "write" } } }',
      });
    }
  }

  async getRoleAndSecretId() {
    const auths = await this.vaultClient.auths();
    if (!Object.hasOwn(auths, 'approle/')) {
      await this.vaultClient.enableAuth({
        mount_point: SecretsService.mountPoint,
        type: 'approle',
        description: 'Approle auth',
      });
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
    return { roleId: roleId.data.role_id, secretId: secretId.data.secret_id };
  }
  async readSecret(
    secretPath: string,
  ): Promise<{ apiKey: string; apiUrl: string }> {
    try {
      const { roleId, secretId } = await this.getRoleAndSecretId();
      const result = await this.vaultClient.approleLogin({
        role_id: roleId,
        secret_id: secretId,
      });
      this.vaultClient.token = result.auth.client_token;
      const secretData = await this.vaultClient.read(secretPath);
      // secretpath is the path in vault where you have stored your secrets
      return secretData.data.data;
    } catch (error) {
      console.error('Error reading secret from vault:', error);
      throw error;
    }
  }

  async writeSecret(
    secretPath: string,
    secretData: { apiUrl: string; apiKey: string },
  ): Promise<void> {
    const { roleId, secretId } = await this.getRoleAndSecretId();
    const result = await this.vaultClient.approleLogin({
      role_id: roleId,
      secret_id: secretId,
    });
    this.vaultClient.token = result.auth.client_token;
    await this.vaultClient.write(secretPath, { data: secretData });
  }
}
