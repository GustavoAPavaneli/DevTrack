'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@/lib/firebase/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await signIn(data.email, data.password)
      router.push('/')
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      const message = (e as { message?: string }).message ?? ''
      console.error('[DevTrack] signIn error:', code, message)
      if (code === 'auth/operation-not-allowed') {
        setServerError('Login por email/senha não está habilitado. Ative em Firebase Console → Authentication → Sign-in methods.')
      } else {
        setServerError('Email ou senha inválidos.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
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
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="mb-5 text-base font-semibold" style={{ color: 'var(--color-text)' }}>Entrar na sua conta</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input type="email" label="Email" placeholder="dev@crably.com.br" error={errors.email?.message} {...register('email')} />
            <Input type="password" label="Senha" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            {serverError && (
              <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#ef444415', color: 'var(--color-danger)', border: '1px solid #ef444430' }}>
                {serverError}
              </p>
            )}
            <Button type="submit" loading={isSubmitting} className="mt-1 w-full">Entrar</Button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Não tem conta?{' '}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-brand)' }}
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
