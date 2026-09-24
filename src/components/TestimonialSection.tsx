import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { sectionSurfaceClass } from "@shared/page-sections";
import type { TestimonialSection as TestimonialContent } from "@shared/types";
import clothespegUrl from "../icons/clothespeg.png";

const NOTE_ROTATIONS = [-2.6, 1.8, -1.3, 2.4, -0.9, 1.5];
const NOTE_OFFSETS = ["0.35rem", "0", "0.55rem", "0.15rem", "0.4rem", "0.1rem"];
const PEG_ROTATIONS = [-7.5, 5.2, -3.8, 8.1, -5.6, 2.4, -9.2, 4.1];

const NOTE_MIN_WIDTH_PX = 248; // 15.5rem
const NOTE_GAP_PX = 22; // ~1.4rem

function chunkRows<T>(items: T[], columns: number): T[][] {
  const cols = Math.max(1, columns);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

function ClotheslineWire() {
  return (
    <svg
      className="clothesline__wire"
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 12 Q500 36 1000 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TestimonialNote({
  item,
  index,
}: {
  item: TestimonialContent;
  index: number;
}) {
  return (
    <li
      className="clothesline__note"
      style={
        {
          "--note-rotate": `${NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]}deg`,
          "--note-offset": NOTE_OFFSETS[index % NOTE_OFFSETS.length],
          "--peg-rotate": `${PEG_ROTATIONS[index % PEG_ROTATIONS.length]}deg`,
        } as CSSProperties
      }
    >
      <img
        className="clothesline__peg"
        src={clothespegUrl}
        alt=""
        width={48}
        height={96}
        aria-hidden="true"
      />
      <figure
        className={
          item.imageUrl ? "testimonial testimonial--with-image" : "testimonial"
        }
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" width={88} height={88} />
        ) : null}
        <div>
          {item.quote ? <blockquote>“{item.quote}”</blockquote> : null}
          {item.authorName || item.authorRole ? (
            <figcaption>
              {item.authorName ? <strong>{item.authorName}</strong> : null}
              {item.authorRole ? ` · ${item.authorRole}` : ""}
            </figcaption>
          ) : null}
        </div>
      </figure>
    </li>
  );
}

export function TestimonialsClothesline({
  items,
}: {
  items: TestimonialContent[];
}) {
  const visible = items.filter((item) => item.quote || item.authorName);
  const measureRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || visible.length === 0) return;

    const update = () => {
      const width = el.clientWidth;
      const next = Math.max(
        1,
        Math.min(
          visible.length,
          Math.floor((width + NOTE_GAP_PX) / (NOTE_MIN_WIDTH_PX + NOTE_GAP_PX)),
        ),
      );
      setColumns(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible.length]);

  if (visible.length === 0) return null;

  const background = visible[0].background;
  const rows = chunkRows(
    visible.map((item, index) => ({ item, index })),
    columns,
  );

  return (
    <section
      className={["testimonial-section", sectionSurfaceClass(background)]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="clothesline">
        <div
          className="page clothesline__measure"
          ref={measureRef}
          aria-hidden="true"
        />
        {rows.map((row, rowIndex) => (
          <div
            className="clothesline__row"
            key={row.map(({ item }) => item.id).join("-")}
            style={{ "--row-cols": row.length } as CSSProperties}
          >
            <ClotheslineWire />
            <div className="page">
              <ul
                className="clothesline__notes"
                aria-label={
                  rowIndex === 0
                    ? "Testimonials"
                    : `Testimonials row ${rowIndex + 1}`
                }
              >
                {row.map(({ item, index }) => (
                  <TestimonialNote key={item.id} item={item} index={index} />
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TestimonialSection({ item }: { item: TestimonialContent }) {
  return <TestimonialsClothesline items={[item]} />;
}
