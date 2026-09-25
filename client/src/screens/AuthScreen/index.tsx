import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { EmailAuthForm } from "./components/EmailAuthForm";
import { HowItsBuiltWidget } from "./components/HowItsBuiltWidget";

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
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
      ?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (credentialResponse.credential) {
      await googleLogin(credentialResponse.credential);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-96"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Game Arena</h1>
          <p className="text-muted-foreground text-sm">
            Play quick games with friends, right in your browser.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex p-1 bg-secondary/50 rounded-lg border border-border mb-4">
              <Button
                variant={isLogin ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsLogin(true)}
              >
                Sign in
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </Button>
            </div>
            <CardTitle className="text-xl font-semibold text-center">
              {isLogin ? "Welcome back" : "Create your account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <EmailAuthForm
              isLogin={isLogin}
              formData={formData}
              onChange={handleChange}
              onSubmit={handleEmailAuth}
              isLoading={isLoading}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in didn't work. Please try again.")}
                theme="filled_black"
                shape="pill"
                width="240"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
              >
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <HowItsBuiltWidget />
      </motion.div>
    </div>
  );
};

export default AuthScreen;
