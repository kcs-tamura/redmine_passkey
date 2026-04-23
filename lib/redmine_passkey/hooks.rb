module RedminePasskey
  class Hooks < Redmine::Hook::ViewListener
    # ログインフォームの下にPasskeyボタンを追加
    def view_account_login_bottom(context = {})
      context[:controller].send(:render_to_string, {
        partial: 'passkeys/login_button',
        locals:  context
      })
    end
  end
end
