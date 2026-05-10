import { Building2, Store, UserRound } from 'lucide-react'

import type { MarketplaceStatsBlock } from '@/payload-types'

import { AnimatedStatValue } from '@/blocks/MarketplaceStats/AnimatedStatValue'
import { SmartLink } from '@/components/SmartLink'

type Props = MarketplaceStatsBlock

function StatIcon({ icon }: { icon?: string | null }) {
  const className = 'h-20 w-20 text-[#1f63c6] md:h-24 md:w-24'

  switch (icon) {
    case 'sale':
      return <Store className={className} strokeWidth={1.8} />
    case 'rent':
      return <Building2 className={className} strokeWidth={1.8} />
    case 'users':
    default:
      return <UserRound className={className} strokeWidth={1.8} />
  }
}

export function MarketplaceStatsBlockComponent(props: Props) {
  const title = props.title?.trim()
  const subtitle = props.subtitle?.trim()
  const items = (props.items ?? []).filter((item) => item?.value?.trim() && item?.label?.trim())
  const buttonUrl = props.buttonUrl?.trim() ?? ''
  const buttonLabel = props.buttonLabel?.trim() ?? 'Bắt đầu ngay'

  if (!title || !items.length) return null

  return (
    <section className="container">
      <div className="rounded-[28px] bg-slate-50 px-6 py-10 text-center md:px-10 md:py-12">
        <header className="mx-auto max-w-3xl">
          <h2 className="text-[22px] font-bold uppercase tracking-tight text-slate-800 md:text-[22px]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-[14px] text-slate-600 md:text-[14px]">{subtitle}</p>
          ) : null}
        </header>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
              key={item.id ?? `${item.value}-${index}`}
            >
              <div className="flex justify-center">
                <StatIcon icon={item.icon} />
              </div>
              <AnimatedStatValue value={item.value} />
              <p className="mt-1 text-[12px] text-slate-600 md:text-[12px]">{item.label}</p>
            </article>
          ))}
        </div>

        {buttonUrl ? (
          <div className="mt-8">
            <SmartLink
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1677ff] px-6 text-[12px] font-semibold text-white transition-colors hover:bg-[#0f67df]"
              href={buttonUrl}
            >
              {buttonLabel}
            </SmartLink>
          </div>
        ) : null}
      </div>
    </section>
  )
}
