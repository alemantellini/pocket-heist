import AuthForm from "@/components/AuthForm"

export default function LoginPage() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1 className="form-title">Log in to Your Account</h1>
        <AuthForm mode="login" />
      </div>
    </div>
  )
}
