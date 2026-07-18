import { Migration } from "@mikro-orm/migrations";

export class Migration20260718030302 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "folders" add constraint "folders_name_user_id_id_unique" unique ("name", "user_id_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "folders" drop constraint "folders_name_user_id_id_unique";`);
  }
}
