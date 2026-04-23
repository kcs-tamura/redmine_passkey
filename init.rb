require_relative 'lib/redmine_passkey/hooks'

Redmine::Plugin.register :redmine_passkey do
  name        'Redmine Passkey'
  author      'Kitsune Creative Studio'
  description 'WebAuthn/Passkey authentication for Redmine'
  version     '1.0.1'
  author_url 'https://www.kitsune-creative.studio/'
  url         'https://github.com/kcs-tamura/redmine_passkey'
  requires_redmine version_or_higher: '4.2.0'
end
