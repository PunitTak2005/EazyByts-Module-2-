import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import TextInput from '@/components/auth/TextInput';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import SubmitButton from '@/components/auth/SubmitButton';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const nameValue = watch('name');
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await signup(data.name, data.email, data.password);
      toast.success('Account created successfully! Welcome to TickerSim.');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Get ₹10,00,000 starting virtual capital instantly"
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkUrl="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name field */}
        <TextInput
          id="name"
          label="Full Name"
          type="text"
          icon={User}
          placeholder="John Doe"
          error={errors.name}
          success={touchedFields.name && !errors.name && nameValue}
          {...register('name')}
        />

        {/* Email field */}
        <TextInput
          id="email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="john@example.com"
          error={errors.email}
          success={touchedFields.email && !errors.email && emailValue}
          {...register('email')}
        />

        {/* Password field */}
        <div className="space-y-1.5">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Min 6 characters"
            error={errors.password}
            success={touchedFields.password && !errors.password && passwordValue}
            {...register('password')}
          />
          <PasswordStrengthMeter password={passwordValue} email={emailValue} name={nameValue} />
        </div>

        {/* Confirm Password field */}
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Repeat password"
          error={errors.confirmPassword}
          success={touchedFields.confirmPassword && !errors.confirmPassword && confirmPasswordValue}
          {...register('confirmPassword')}
        />

        {/* Submit */}
        <div className="pt-2">
          <SubmitButton isLoading={isSubmitting}>
            Create Account
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
