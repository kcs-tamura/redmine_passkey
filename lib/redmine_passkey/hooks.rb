module RedminePasskey
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_account_login_bottom,   partial: 'passkeys/login_button'
    render_on :view_my_account_preferences, partial: 'passkeys/my_account_link'
  end
end
