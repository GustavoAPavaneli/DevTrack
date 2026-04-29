'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type Project, type ProjectStatus } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'done']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

type FormData = z.infer<typeof schema>

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'done', label: 'Concluído' },
]

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: (project?.status as ProjectStatus) ?? 'active',
      color: project?.color ?? '#6366f1',
    },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Nome" error={errors.name?.message} {...register('name')} />

      <Textarea
        label="Descrição"
        placeholder="Descreva o projeto..."
        {...register('description')}
      />

      <Select
        label="Status"
        options={STATUS_OPTIONS}
        error={errors.status?.message}
        {...register('status')}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Cor</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={[
                'h-7 w-7 rounded-full border-2 transition-transform',
                selectedColor === color ? 'border-white scale-110' : 'border-transparent',
              ].join(' ')}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setValue('color', e.target.value)}
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent"
          />
        </div>
        {errors.color && <p className="text-xs text-red-400">{errors.color.message}</p>}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {project ? 'Atualizar' : 'Criar'} Projeto
        </Button>
      </div>
    </form>
  )
}
