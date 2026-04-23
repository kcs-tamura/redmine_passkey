class CreatePasskeyCredentials < ActiveRecord::Migration[6.1]
  def change
    create_table :passkey_credentials do |t|
      t.integer    :user_id,     null: false

      t.string     :external_id, null: false
      t.string     :nickname,    null: false, default: 'My Passkey'
      t.string     :public_key,  null: false
      t.integer    :sign_count,  null: false, default: 0
      t.timestamps
    end
    add_index :passkey_credentials, :user_id
    add_index :passkey_credentials, :external_id, unique: true
    add_foreign_key :passkey_credentials, :users
  end
end
