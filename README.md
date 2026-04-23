# redmine_passkey

A Redmine plugin that adds WebAuthn/Passkey authentication.

## Requirements

- Redmine 4.2+ (Rails 7, tested on Redmine 6)
- Ruby 3.x
- PostgreSQL, MySQL/MariaDB, or SQLite (any database supported by Redmine)
- HTTPS (required by WebAuthn spec; localhost is exempt)

## Installation

```bash
# 1. Place the plugin under Redmine's plugins directory
cp -r redmine_passkey /path/to/redmine/plugins/

# 2. Install dependencies
bundle install

# 3. Run database migration
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

# 4. Restart Redmine
touch /path/to/redmine/tmp/restart.txt
```

## Configuration

Create `config/initializers/webauthn.rb` inside your Redmine installation:

```ruby
WebAuthn.configure do |config|
  config.allowed_origins = ["https://your-redmine.example.com"]
  config.rp_name         = "Redmine"
  config.rp_id           = "your-redmine.example.com"
end
```

## Features

- **Login page** — "Sign in with Passkey" button below the login form
- **My account page** — Link to Passkey management
- **Management page** (`/passkeys/new`) — Register, view, and delete passkeys

---

# redmine_passkey（日本語）

RedmineにWebAuthn/Passkey認証を追加するプラグインです。

## 動作環境

- Redmine 4.2以上（Rails 7対応、Redmine 6で動作確認済み）
- Ruby 3.x
- PostgreSQL, MySQL/MariaDB, or SQLite (any database supported by Redmine)
- HTTPS必須（WebAuthn仕様、localhostは除く）

## インストール

```bash
# 1. プラグインを配置
cp -r redmine_passkey /path/to/redmine/plugins/

# 2. gemインストール
bundle install

# 3. マイグレーション実行
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

# 4. Redmine再起動
touch /path/to/redmine/tmp/restart.txt
```

## 設定

Redmineの `config/initializers/webauthn.rb` を作成：

```ruby
WebAuthn.configure do |config|
  config.allowed_origins = ["https://your-redmine.example.com"]
  config.rp_name         = "Redmine"
  config.rp_id           = "your-redmine.example.com"
end
```

> Coolify + Cloudflare Tunnel環境ではTunnelのパブリックURLを設定してください。

## 機能

- **ログインページ** — ログインフォームの下に「Passkeyでログイン」ボタンを表示
- **マイアカウントページ** — Passkey管理ページへのリンクを表示
- **管理ページ** (`/passkeys/new`) — Passkeｙの登録・一覧・削除
