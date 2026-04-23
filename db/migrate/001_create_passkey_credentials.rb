class CreatePasskeyCredentials < ActiveRecord::Migration[6.1]
  def change
    create_table :passkey_credentials do |t|
      t.references :user,        null: false, foreign_key: true
      t.string     :external_id, null: false
      t.string     :nickname,    null: false, default: 'My Passkey'
      t.string     :public_key,  null: false
      t.integer    :sign_count,  null: false, default: 0
      t.timestamps
    end
    add_index :passkey_credentials, :external_id, unique: true
  end
end
