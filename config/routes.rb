RedmineApp::Application.routes.draw do
  scope '/passkeys' do
    # 登録フロー
    get    'new',                    to: 'passkeys#new',                    as: :new_passkey
    post   'registration/options',   to: 'passkeys#registration_options',   as: :passkey_registration_options
    post   'registration/verify',    to: 'passkeys#registration_verify',    as: :passkey_registration_verify

    # 認証フロー
    post   'authentication/options', to: 'passkeys#authentication_options', as: :passkey_authentication_options
    post   'authentication/verify',  to: 'passkeys#authentication_verify',  as: :passkey_authentication_verify

    # 管理
    delete ':id',                    to: 'passkeys#destroy',                as: :passkey
  end
end
