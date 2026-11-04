import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';


interface AuthFormData {
  user_name?: string;
  email: string;
  password: string;
}

interface EmailAuthFormProps {
  isLogin: boolean;
  formData: AuthFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
  isLogin,
  formData,
  onChange,
  onSubmit,
  isLoading
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isLogin && (
        <div className="space-y-2">
          <label htmlFor="user_name" className="text-sm font-medium">Username</label>
          <Input
            id="user_name"
            name="user_name"
            autoComplete="username"
            value={formData.user_name}
            onChange={onChange}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={isLogin ? undefined : 8}
          value={formData.password}
          onChange={onChange}
          required
          aria-describedby={isLogin ? undefined : "password-rules"}
        />
        {!isLogin && (
          <p id="password-rules" className="text-sm text-faint">
            At least 8 characters, with a capital letter and a number.
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full"
      >
        {isLoading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
};
