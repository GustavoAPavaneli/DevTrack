'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp } from '@/lib/firebase/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/email-already-in-use':      'Este email já está cadastrado.',
  'auth/invalid-email':             'Email inválido.',
  'auth/weak-password':             'Senha muito fraca. Use ao menos 6 caracteres.',
  'auth/operation-not-allowed':     'Login por email/senha não está habilitado no Firebase Console. Vá em Authentication → Sign-in methods → Email/Password e ative.',
  'auth/network-request-failed':    'Sem conexão. Verifique sua internet e tente novamente.',
  'auth/too-many-requests':         'Muitas tentativas. Aguarde alguns minutos.',
  'auth/configuration-not-found':   'Configuração do Firebase inválida. Verifique as variáveis de ambiente.',
}

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await signUp(data.name, data.email, data.password)
      router.push('/')
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      const message = (e as { message?: string }).message ?? ''
      setServerError(FIREBASE_ERRORS[code] ?? message ?? 'Erro ao criar conta. Tente novamente.')
      console.error('[DevTrack] signUp error:', code, message)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: '#000' }}>
            <Image src="/logo.png" alt="Crably" width={72} height={72} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tracking-tight" style={{ color: '#fff' }}>crably</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>DevTrack</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="mb-1 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Criar conta
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Preencha os dados para entrar no time.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="João Silva"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              type="email"
              label="Email"
              placeholder="dev@crably.com.br"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              type="password"
              label="Senha"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              type="password"
              label="Confirmar senha"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: '#ef444415',
                  color: 'var(--color-danger)',
                  border: '1px solid #ef444430',
                }}
              >
                {serverError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
              Criar conta
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-brand)' }}
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
