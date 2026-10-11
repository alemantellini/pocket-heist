import AuthForm from "@/components/AuthForm"

export default function SignupPage() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1 className="form-title">Signup for an Account</h1>
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}
