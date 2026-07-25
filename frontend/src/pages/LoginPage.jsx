import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import TextInput from '@/components/auth/TextInput';
import PasswordInput from '@/components/auth/PasswordInput';
import SubmitButton from '@/components/auth/SubmitButton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back to TickerSim!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter details to access your virtual paper-trading desk"
      footerText="Don't have an account?"
      footerLinkText="Register for free"
      footerLinkUrl="/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
        <TextInput
          id="email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          error={errors.email}
          success={touchedFields.email && !errors.email && emailValue}
          {...register('email')}
        />

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">
              Password
            </span>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 dark:text-blue-500 hover:underline focus:outline-none"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            error={errors.password}
            success={touchedFields.password && !errors.password && passwordValue}
            {...register('password')}
          />
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 rounded border-slate-200 dark:border-dark-border text-blue-600 focus:ring-blue-500 dark:bg-dark-bg/40 focus:ring-offset-0"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Remember me</span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <SubmitButton isLoading={isSubmitting}>
            Sign In
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
