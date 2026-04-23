# redmine_passkey

Redmine用WebAuthn/Passkeyプラグイン。

## 動作環境

- Redmine 4.2以上（Rails 7対応）
- Ruby 3.x
- MySQL/MariaDB（`users.id` が `int(11)` のRedmine標準スキーマ前提）
- HTTPS必須（WebAuthn仕様。localhostは除く）

## インストール

```bash
# 1. プラグインを配置
cp -r redmine_passkey /path/to/redmine/plugins/

# 2. gem インストール
bundle install

# 3. マイグレーション
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

# 4. Redmine再起動
touch /var/lib/redmine/tmp/restart.txt
```

## WebAuthn設定

`/var/lib/redmine/config/initializers/webauthn.rb` を作成：

```ruby
WebAuthn.configure do |config|
  config.allowed_origins = ["https://your-redmine.example.com"]
  config.rp_name         = "Redmine"
  config.rp_id           = "your-redmine.example.com"
end
```

> `config.origin =` は webauthn gem 3.x で非推奨。`config.allowed_origins = [...]`（配列）を使うこと。

Coolify + Cloudflare Tunnel環境では `allowed_origins` と `rp_id` をTunnelのパブリックURLに設定する。

## ハマりどころ

### `require_dependency` エラー（Rails 7）

Rails 7 + Zeitwerk環境では `require_dependency` が廃止されている。
`init.rb` では `require_relative` を使う：

```ruby
# NG
require_dependency 'redmine_passkey/hooks'

# OK
require_relative 'lib/redmine_passkey/hooks'
```

### `config/routes.rb` のラッパー不要

Redmineのプラグインローダーが `config/routes.rb` を自動でラップするため、
`RedmineApp::Application.routes.draw do...end` を書くとRedmine全体のルーティングが壊れる（`/login` が404になる）。
ルート定義のみを記述する：

```ruby
# NG
RedmineApp::Application.routes.draw do
  scope '/passkeys' do ... end
end

# OK
scope '/passkeys' do
  ...
end
```

### 外部キー型不一致（MySQL）

Redmineの `users.id` は `int(11)`。`t.references` はデフォルトで `bigint` を生成するため外部キー制約が張れない。
`t.integer` で明示する：

```ruby
# NG
t.references :user, null: false, foreign_key: true

# OK
t.integer :user_id, null: false
# テーブル作成後に add_foreign_key :passkey_credentials, :users
```
