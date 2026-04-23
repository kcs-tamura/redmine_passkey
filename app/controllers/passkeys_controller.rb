class PasskeysController < ApplicationController
  # WebAuthn challenge mechanism handles CSRF protection
  skip_forgery_protection

  # Authentication endpoints are called before login
  skip_before_action :check_if_login_required, only: %i[authentication_options authentication_verify]

  before_action :require_login, only: %i[new registration_options registration_verify destroy]

  def new
    @credentials = PasskeyCredential.where(user: User.current)
  end

  def registration_options
    options = WebAuthn::Credential.options_for_create(
      user: {
        id:           Base64.urlsafe_encode64(User.current.id.to_s, padding: false),
        name:         User.current.login,
        display_name: User.current.name
      },
      exclude: PasskeyCredential.where(user: User.current).pluck(:external_id)
    )
    session[:passkey_registration_challenge] = options.challenge
    render json: options.as_json
  end

  def registration_verify
    webauthn_credential = WebAuthn::Credential.from_create(params)
    webauthn_credential.verify(session[:passkey_registration_challenge])

    passkey = PasskeyCredential.create!(
      user:        User.current,
      external_id: Base64.urlsafe_encode64(webauthn_credential.raw_id, padding: false),
      public_key:  webauthn_credential.public_key,
      sign_count:  webauthn_credential.sign_count,
      nickname:    params[:nickname].presence || 'My Passkey'
    )
    PasskeyMailer.passkey_added(User.current, passkey).deliver_now if notify?
    render json: { status: 'ok' }
  rescue WebAuthn::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def authentication_options
    options = WebAuthn::Credential.options_for_get
    session[:passkey_authentication_challenge] = options.challenge
    render json: options.as_json
  end

  def authentication_verify
    webauthn_credential = WebAuthn::Credential.from_get(params)
    stored = PasskeyCredential.find_by_credential_id(webauthn_credential.raw_id)
    return render json: { error: 'Credential not found' }, status: :unauthorized unless stored

    webauthn_credential.verify(
      session[:passkey_authentication_challenge],
      public_key: stored.public_key,
      sign_count: stored.sign_count
    )
    stored.update!(sign_count: webauthn_credential.sign_count)

    self.logged_user = stored.user
    render json: { status: 'ok', redirect: home_url }
  rescue WebAuthn::Error => e
    render json: { error: e.message }, status: :unauthorized
  end

  def destroy
    credential = PasskeyCredential.find_by!(id: params[:id], user: User.current)
    nickname   = credential.nickname
    credential.destroy
    PasskeyMailer.passkey_deleted(User.current, nickname).deliver_now if notify?
    redirect_to new_passkey_path, notice: l(:notice_passkey_deleted)
  end

  private

  def notify?
    Setting.plugin_redmine_passkey['send_notification'] == '1'
  end
end
