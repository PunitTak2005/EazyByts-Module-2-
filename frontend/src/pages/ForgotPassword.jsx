import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import TextInput from '@/components/auth/TextInput';
import SubmitButton from '@/components/auth/SubmitButton';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmailAddress, setSentEmailAddress] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
      setSentEmailAddress(data.email);
      setEmailSent(true);
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to request reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={emailSent ? "Check Your Inbox" : "Recover Password"}
      subtitle={emailSent ? "" : "Enter your email and we'll send a password reset link"}
    >
      {!emailSent ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
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

          {/* Submit */}
          <div className="pt-2">
            <SubmitButton isLoading={isSubmitting}>
              Send Reset Link
            </SubmitButton>
          </div>

          <div className="border-t border-slate-100 dark:border-dark-border/40 pt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-2"
        >
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Email Sent!</h3>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal px-2">
            A password reset email has been sent to <span className="font-bold text-slate-700 dark:text-slate-350">{sentEmailAddress}</span>. Please check your inbox and follow the instructions to reset your password.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <Link
              to={`/reset-password?email=${encodeURIComponent(sentEmailAddress)}`}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 py-3.5 text-sm font-bold text-white hover:opacity-95 shadow-md transition-all cursor-pointer"
            >
              Enter Verification Token
            </Link>
            
            <Link to="/login" className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
