class PasskeyMailer < Mailer
  def passkey_added(user, passkey)
    @user     = user
    @passkey  = passkey
    mail to: user.mail, subject: l(:mail_subject_passkey_added)
  end

  def passkey_deleted(user, nickname)
    @user     = user
    @nickname = nickname
    mail to: user.mail, subject: l(:mail_subject_passkey_deleted)
  end
end
