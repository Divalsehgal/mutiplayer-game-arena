import React, { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "../../store/auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { Card, CardContent } from "../../components/ui/card";
import { usePageMeta } from "../../hooks/usePageMeta";
import { EmailAuthForm } from "./components/EmailAuthForm";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AuthScreen = () => {
  usePageMeta({ title: "Sign in", path: "/login", noindex: true });

  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    password: "",
  });
  const { googleLogin, setAuth, error, setError, isAuthenticated, isLoading } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/play";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = isLogin ? "/signin" : "/signup";
      const res = await apiFetch(`/auth${endpoint}`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { ok, data } = res as any;

      if (ok && data?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { user, accessToken = null } = data.data as any;
        setAuth(user, accessToken);
        navigate(redirectTo);
      } else {
        setError((data && data.message) || "Couldn't sign you in. Check your details and try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (credentialResponse.credential) {
      await googleLogin(credentialResponse.credential);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-96">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">
          {isLogin ? "Sign in" : "Create an account"}
        </h1>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex rounded-full bg-secondary p-1" role="group" aria-label="Sign in or sign up">
              <button type="button" aria-pressed={isLogin} className={tabClass(isLogin)} onClick={() => setIsLogin(true)}>
                Sign in
              </button>
              <button type="button" aria-pressed={!isLogin} className={tabClass(!isLogin)} onClick={() => setIsLogin(false)}>
                Sign up
              </button>
            </div>

            <EmailAuthForm
              isLogin={isLogin}
              formData={formData}
              onChange={handleChange}
              onSubmit={handleEmailAuth}
              isLoading={isLoading || submitting}
            />

            <div className="flex items-center gap-3 text-sm text-faint">
              <span className="h-px flex-1 bg-raised" />
              or
              <span className="h-px flex-1 bg-raised" />
            </div>

            <div className="flex justify-center">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in didn't work. Please try again.")}
                  theme="filled_black"
                  shape="pill"
                  width="240"
                />
              </GoogleOAuthProvider>
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-[#2c1a20] p-3 text-center text-sm text-[#e5566f]">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;
