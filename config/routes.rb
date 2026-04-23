scope '/passkeys' do
  get    'new',              to: 'passkeys#new',                    as: :new_passkey
  post   'reg_options',      to: 'passkeys#registration_options',   as: :passkey_registration_options
  post   'reg_verify',       to: 'passkeys#registration_verify',    as: :passkey_registration_verify
  post   'auth_options',     to: 'passkeys#authentication_options', as: :passkey_authentication_options
  post   'auth_verify',      to: 'passkeys#authentication_verify',  as: :passkey_authentication_verify
  delete ':id',              to: 'passkeys#destroy',                as: :passkey
end
