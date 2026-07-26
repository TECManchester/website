import Image from "next/image";
import { leadership } from "@/lib/church";

/**
 * Leadership portraits.
 *
 * Images are pre-cropped to 4:5, so the cards align without any per-image
 * fiddling. The gradient scrim sits under the name so text stays legible
 * whatever the photo does behind it.
 */
export function LeadershipGrid() {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {leadership.map((person, index) => (
        <li key={person.name} className="reveal group">
          <div className="bg-grey-100 shadow-card group-hover:shadow-card-lg relative aspect-4/5 overflow-hidden rounded-2xl transition duration-300">
            <Image
              src={person.photo}
              alt={`Portrait of ${person.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              // The first card is usually above the fold on /about.
              priority={index === 0}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="from-ink/85 absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t via-ink/40 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="font-heading text-xl font-bold text-white">
                {person.name}
              </h3>
              <p className="text-green mt-1 text-xs font-bold tracking-[0.14em] uppercase">
                {person.role}
              </p>
            </div>
          </div>
          <p className="text-grey-500 mt-5 text-[15px] leading-relaxed">
            {person.bio}
          </p>
        </li>
      ))}
    </ul>
  );
}
