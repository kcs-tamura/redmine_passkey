class PasskeysController < ApplicationController
  # WebAuthnのchallenge機構がCSRF対策を担うためスキップ（Rails 7対応）
  skip_forgery_protection

  before_action :require_login, only: %i[new registration_options registration_verify destroy]

  # GET /passkeys/new
  def new
    @credentials = PasskeyCredential.where(user: User.current)
  end

  # POST /passkeys/registration/options
  def registration_options
    options = WebAuthn::Credential.options_for_create(
      user: {
        id:           User.current.id.to_s,
        name:         User.current.login,
        display_name: User.current.name
      },
      exclude: PasskeyCredential.where(user: User.current).pluck(:external_id)
    )
    session[:passkey_registration_challenge] = options.challenge
    render json: options
  end

  # POST /passkeys/registration/verify
  def registration_verify
    webauthn_credential = WebAuthn::Credential.from_create(params)
    webauthn_credential.verify(session[:passkey_registration_challenge])

    PasskeyCredential.create!(
      user:        User.current,
      external_id: Base64.urlsafe_encode64(webauthn_credential.raw_id, padding: false),
      public_key:  webauthn_credential.public_key,
      sign_count:  webauthn_credential.sign_count,
      nickname:    params[:nickname].presence || 'My Passkey'
    )
    render json: { status: 'ok' }
  rescue WebAuthn::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /passkeys/authentication/options  (ログイン前でも呼ばれる)
  def authentication_options
    options = WebAuthn::Credential.options_for_get
    session[:passkey_authentication_challenge] = options.challenge
    render json: options
  end

  # POST /passkeys/authentication/verify
  def authentication_verify
    webauthn_credential = WebAuthn::Credential.from_get(params)
    stored = PasskeyCredential.find_by_credential_id(webauthn_credential.raw_id)
    return render json: { error: 'Credential not found' }, status: :unauthorized unless stored

    webauthn_credential.verify(
      session[:passkey_authentication_challenge],
      public_key:  stored.public_key,
      sign_count:  stored.sign_count
    )
    stored.update!(sign_count: webauthn_credential.sign_count)

    # Redmineのセッション確立
    self.logged_user = stored.user
    render json: { status: 'ok', redirect: home_url }
  rescue WebAuthn::Error => e
    render json: { error: e.message }, status: :unauthorized
  end

  # DELETE /passkeys/:id
  def destroy
    credential = PasskeyCredential.find_by!(id: params[:id], user: User.current)
    credential.destroy
    redirect_to new_passkey_path, notice: 'Passkey を削除しました'
  end
end
