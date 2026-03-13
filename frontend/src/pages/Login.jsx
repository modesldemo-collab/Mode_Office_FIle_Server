import { useMemo, useState } from "react";

const initialForm = {
  email: "",
  password: "",
  remember: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formIsValid = useMemo(() => {
    return emailPattern.test(form.email) && form.password.length >= 6;
  }, [form.email, form.password]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
    if (statusMessage) {
      setStatusMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!emailPattern.test(form.email)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Placeholder request while backend auth is not yet connected.
      await new Promise((resolve) => setTimeout(resolve, 900));

      setStatusMessage(`Welcome back, ${form.email}. Login successful.`);
    } catch {
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="Login panel">
        <div className="brand-block">
          <p className="brand-eyebrow">Mode Office File Server</p>
          <h1>Secure Access</h1>
          <p className="brand-copy">
            Sign in to view, upload, and manage your workspace files.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <div className="form-row">
            <label className="checkbox-wrap" htmlFor="remember">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>

            <button type="button" className="link-button">
              Forgot password?
            </button>
          </div>

          {errorMessage ? (
            <p className="feedback error">{errorMessage}</p>
          ) : null}
          {statusMessage ? (
            <p className="feedback success">{statusMessage}</p>
          ) : null}

          <button
            type="submit"
            className="login-button"
            disabled={!formIsValid || isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
