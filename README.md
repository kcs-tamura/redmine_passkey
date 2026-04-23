# redmine_passkey

Redmine用WebAuthn/Passkeyプラグイン。

## 動作環境

- Redmine 4.2以上
- Ruby 3.x
- HTTPS必須（WebAuthn仕様）

## インストール

```bash
# 1. プラグインを配置
cp -r redmine_passkey /path/to/redmine/plugins/

# 2. gem インストール
bundle install

# 3. マイグレーション
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

# 4. Redmine再起動
```

## WebAuthn設定

`config/initializers/webauthn.rb` をRedmineのconfigディレクトリに作成：

```ruby
WebAuthn.configure do |config|
  config.origin = "https://your-redmine.example.com"
  config.rp_name = "Redmine"
  config.rp_id  = "your-redmine.example.com"
end
```

## 注意事項

- HTTP環境では動作しません（localhost除く）
- Coolify + Cloudflare Tunnel環境ではoriginをhttps://ドメイン名に設定
