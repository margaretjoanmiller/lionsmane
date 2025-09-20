import { Injectable } from '@nestjs/common';
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

  async readSecret(
    secretPath: string,
  ): Promise<{ apiKey: string; apiUrl: string }> {
    try {
      const roleId = this.config.getOrThrow<string>('ROLE_ID');
      const secretId = this.config.getOrThrow<string>('SECRET_ID');

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
    const roleId = this.config.getOrThrow<string>('ROLE_ID');
    const secretId = this.config.getOrThrow<string>('SECRET_ID');

    const result = await this.vaultClient.approleLogin({
      role_id: roleId,
      secret_id: secretId,
    });
    this.vaultClient.token = result.auth.client_token;
    await this.vaultClient.write(secretPath, { data: secretData });
  }
}
