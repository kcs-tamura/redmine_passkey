class ChangePasskeyCredentialsPublicKeyToText < ActiveRecord::Migration[6.1]
  def up
    change_column :passkey_credentials, :public_key, :text, null: false
  end

  def down
    change_column :passkey_credentials, :public_key, :string, null: false
  end
end
