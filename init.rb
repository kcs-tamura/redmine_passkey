require_relative 'lib/redmine_passkey/hooks'

Redmine::Plugin.register :redmine_passkey do
  name        'Redmine Passkey'
  author      'Kitsune Creative Studio'
  description 'WebAuthn/Passkey authentication for Redmine'
  version     '0.1.0'
  url         'https://trainfo.dev'
  requires_redmine version_or_higher: '4.2.0'
end
