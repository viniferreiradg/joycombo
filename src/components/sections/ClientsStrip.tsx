import Image from 'next/image'
import type { ClientDoc } from '@/lib/data'

// Faixa de logos em loop. A lista vai duplicada para o loop nao ter emenda.
export default function ClientsStrip({ clients }: { clients: ClientDoc[] }) {
  if (!clients.length) return null
  const items = [...clients, ...clients]

  return (
    <section aria-label="Clientes" className="on-light overflow-hidden bg-white py-10 text-black md:py-14">
      <div className="flex w-full">
        <ul
          className="flex shrink-0 animate-marquee items-center gap-16 pr-16 md:gap-24 md:pr-24"
          style={{ ['--marquee-duration' as string]: `${Math.max(clients.length * 5, 20)}s` }}
        >
          {items.map((client, i) => (
            <li key={`${client.id}-${i}`} aria-hidden={i >= clients.length} className="flex h-12 shrink-0 items-center md:h-14">
              {client.logo?.url ? (
                <Image
                  src={client.logo.url}
                  alt={client.logo.alt || client.name}
                  width={client.logo.width || 200}
                  height={client.logo.height || 80}
                  className="h-full w-auto object-contain opacity-80 brightness-0 transition-opacity hover:opacity-100"
                />
              ) : (
                <span className="font-title text-xl font-bold uppercase whitespace-nowrap">{client.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
