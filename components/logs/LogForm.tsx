'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type Project, type TimeLog } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  projectId: z.string().min(1, 'Selecione um projeto'),
  hours: z.string().refine((v) => { const n = Number(v); return n > 0 && n <= 24 }, 'Entre 0.25 e 24 horas'),
  description: z.string().min(5, 'Mínimo 5 caracteres'),
})

type FormInput = { date: string; projectId: string; hours: string; description: string }

export type LogFormData = { date: string; projectId: string; hours: number; description: string }

interface LogFormProps {
  projects: Project[]
  log?: TimeLog
  onSubmit: (data: LogFormData) => Promise<void>
  onCancel?: () => void
}

export function LogForm({ projects, log, onSubmit, onCancel }: LogFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: log?.date ?? new Date().toISOString().split('T')[0],
      projectId: log?.projectId ?? '',
      hours: log ? String(log.hours) : '',
      description: log?.description ?? '',
    },
  })

  async function onValid(raw: FormInput) {
    await onSubmit({ date: raw.date, projectId: raw.projectId, hours: Number(raw.hours), description: raw.description })
    if (!log) reset()
  }

  const projectOptions = [
    { value: '', label: 'Selecione um projeto' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Data" error={errors.date?.message} {...register('date')} />
        <Input type="number" step="0.25" min="0.25" max="24" label="Horas" placeholder="2.5" error={errors.hours?.message} {...register('hours')} />
      </div>
      <Select label="Projeto" options={projectOptions} error={errors.projectId?.message} {...register('projectId')} />
      <Textarea label="O que foi feito?" placeholder="Descreva as atividades realizadas..." rows={4} error={errors.description?.message} {...register('description')} />
      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={isSubmitting}>{log ? 'Atualizar' : 'Registrar Horas'}</Button>
      </div>
    </form>
  )
}
