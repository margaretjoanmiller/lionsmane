import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import vault from 'node-vault';

@Injectable()
export class SecretsService {
  private vaultClient: vault.client;
  constructor(private config: ConfigService) {
    const vaultAddress = this.config.get<string>('VAULT_ADDR');
    const vaultToken = this.config.get<string>('VAULT_TOKEN');
    this.vaultClient = vault({ endpoint: vaultAddress, token: vaultToken });
  }

  async readSecret(secretPath: string): Promise<string> {
    try {
      const roleId = process.env.ROLE_ID;
      const secretId = process.env.SECRET_ID;

      const result = await this.vaultClient.approleLogin({
        role_id: roleId,
        secret_id: secretId,
      });
      this.vaultClient.token = result.auth.client_token;
      const secretData = await this.vaultClient.read(secretPath);
      // secretpath is the path in vault where you have stored your secrets
      return secretData.data;
    } catch (error) {
      console.error('Error reading secret from vault:', error);
      throw error;
    }
  }

  async writeSecret(secretPath: string, secretData: string): Promise<void> {
    try {
      const roleId = process.env.ROLE_ID;
      const secretId = process.env.SECRET_ID;

      const result = await this.vaultClient.approleLogin({
        role_id: roleId,
        secret_id: secretId,
      });
      this.vaultClient.token = result.auth.client_token;
      await this.vaultClient.write(secretPath, secretData);
    } catch (error) {
      console.error('Error writing secret to vault:', error);
      throw error;
    }
  }
}
