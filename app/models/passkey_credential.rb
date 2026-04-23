class PasskeyCredential < ActiveRecord::Base
  belongs_to :user

  validates :external_id, presence: true, uniqueness: true
  validates :public_key,  presence: true
  validates :nickname,    presence: true

  def self.find_by_credential_id(credential_id)
    find_by(external_id: Base64.urlsafe_encode64(credential_id, padding: false))
  end
end
