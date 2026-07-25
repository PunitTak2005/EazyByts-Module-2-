import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import TextInput from '@/components/auth/TextInput';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import SubmitButton from '@/components/auth/SubmitButton';

const resetSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: {
      token: tokenParam,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const tokenValue = watch('token');
  const newPasswordValue = watch('newPassword');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.token, data.newPassword);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Token verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={
        emailParam 
          ? `Recovering account for ${emailParam}`
          : "Enter your new password to regain access"
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Token Input */}
        <TextInput
          id="token"
          label="Verification Token"
          type="text"
          icon={KeyRound}
          placeholder="Enter verification token"
          error={errors.token}
          success={touchedFields.token && !errors.token && tokenValue}
          {...register('token')}
        />

        {/* New Password Input */}
        <div className="space-y-1.5">
          <PasswordInput
            id="newPassword"
            label="New Password"
            placeholder="Min 6 characters"
            error={errors.newPassword}
            success={touchedFields.newPassword && !errors.newPassword && newPasswordValue}
            {...register('newPassword')}
          />
          <PasswordStrengthMeter password={newPasswordValue} />
        </div>

        {/* Confirm Password Input */}
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Repeat new password"
          error={errors.confirmPassword}
          success={touchedFields.confirmPassword && !errors.confirmPassword && confirmPasswordValue}
          {...register('confirmPassword')}
        />

        {/* Submit */}
        <div className="pt-2">
          <SubmitButton isLoading={isSubmitting}>
            Reset Password
          </SubmitButton>
        </div>

        <div className="border-t border-slate-100 dark:border-dark-border/40 pt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Cancel and Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
