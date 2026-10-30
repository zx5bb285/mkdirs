import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { urlForIcon } from "@/lib/image";
import { formatLongDate } from "@/lib/utils";
import type { ItemFullInfo } from "@/types";
import {
  BookOpenIcon,
  CalendarCheckIcon,
  CheckIcon,
  ExternalLinkIcon,
  MinusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import Image from "next/image";

type Item = NonNullable<ItemFullInfo>;

function formatStartingPrice(item: Item) {
  if (item.startingPrice == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.priceCurrency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(item.startingPrice);
}

function getReviewerName(item: Item) {
  return item.reviewer?.name?.trim() || null;
}

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl tracking-wider font-semibold text-gradient_indigo-purple">
        {children}
      </h2>
    </div>
  );
}

export function ItemVerdict({ item }: { item: Item }) {
  const price = formatStartingPrice(item);
  const reviewer = getReviewerName(item);
  const facts = [
    item.hasFreePlan === true && { label: "Free plan", value: "Yes" },
    item.hasFreePlan === false && { label: "Free plan", value: "No" },
    price && { label: "Paid plans from", value: `${price}/mo` },
    item.lastVerified && {
      label: "Last verified",
      value: formatLongDate(item.lastVerified),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  if (!item.verdict && !item.bestFor && !reviewer && facts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border bg-muted/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <SectionHeading
            icon={<SparklesIcon className="size-4 text-indigo-500" />}
          >
            Our verdict
          </SectionHeading>
          {item.bestFor && (
            <Badge variant="secondary" className="mt-4">
              Best for: {item.bestFor}
            </Badge>
          )}
          {item.verdict && (
            <p className="mt-4 text-balance leading-relaxed text-muted-foreground">
              {item.verdict}
            </p>
          )}
        </div>

        {(facts.length > 0 || reviewer) && (
          <div className="w-full shrink-0 space-y-3 rounded-lg border bg-background/70 p-4 text-sm sm:w-auto sm:min-w-64">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between gap-6">
                <span className="text-muted-foreground">{fact.label}</span>
                <span className="font-medium">{fact.value}</span>
              </div>
            ))}
            {reviewer && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Reviewed by</span>
                <span className="flex items-center gap-2 font-medium">
                  <UserAvatar
                    className="size-5"
                    name={reviewer}
                    image={item.reviewer?.image}
                  />
                  {item.reviewer?.slug?.current ? (
                    <Link
                      href={`/blog/author/${item.reviewer.slug.current}`}
                      className="link-underline"
                    >
                      {reviewer}
                    </Link>
                  ) : (
                    reviewer
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function ItemKeyFeatures({ item }: { item: Item }) {
  if (!item.keyFeatures?.length) return null;

  return (
    <section className="flex flex-col gap-6">
      <SectionHeading
        icon={<ShieldCheckIcon className="size-4 text-indigo-500" />}
      >
        What {item.name} can do
      </SectionHeading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {item.keyFeatures.map((feature, index) => (
          <div
            key={`${feature.title}-${index}`}
            className="rounded-lg border bg-muted/40 p-5"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 font-semibold">{feature.title}</h3>
            {feature.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ItemProsCons({ item }: { item: Item }) {
  if (!item.pros?.length && !item.cons?.length) return null;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {item.pros?.length ? (
        <div className="rounded-lg border bg-muted/40 p-6">
          <h2 className="text-lg font-semibold">Pros</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {item.pros.map((pro) => (
              <li key={pro} className="flex gap-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span className="text-muted-foreground">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {item.cons?.length ? (
        <div className="rounded-lg border bg-muted/40 p-6">
          <h2 className="text-lg font-semibold">Cons</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {item.cons.map((con) => (
              <li key={con} className="flex gap-3">
                <MinusIcon className="mt-0.5 size-4 shrink-0 text-rose-600" />
                <span className="text-muted-foreground">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ItemPricing({ item }: { item: Item }) {
  if (!item.pricingSummary && !item.pricingRows?.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        icon={<CalendarCheckIcon className="size-4 text-indigo-500" />}
      >
        {item.name} pricing
      </SectionHeading>
      {item.pricingSummary && (
        <p className="leading-relaxed text-muted-foreground">
          {item.pricingSummary}
        </p>
      )}
      {item.pricingRows?.length ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Billing</TableHead>
                <TableHead className="hidden md:table-cell">
                  What&apos;s included
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.pricingRows.map((row, index) => (
                <TableRow key={`${row.plan}-${index}`}>
                  <TableCell className="font-medium">{row.plan}</TableCell>
                  <TableCell>{row.price}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.billing}
                  </TableCell>
                  <TableCell className="hidden whitespace-pre-line md:table-cell">
                    {row.includes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {item.pricingUrl && (
          <Link
            href={item.pricingUrl}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium link-underline"
          >
            View official pricing
            <ExternalLinkIcon className="size-3" />
          </Link>
        )}
        {item.lastVerified && (
          <span>Pricing verified on {formatLongDate(item.lastVerified)}.</span>
        )}
      </div>
    </section>
  );
}

export function ItemAlternatives({ item }: { item: Item }) {
  if (!item.alternatives?.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        icon={<SparklesIcon className="size-4 text-indigo-500" />}
      >
        Alternatives to {item.name}
      </SectionHeading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {item.alternatives.map((alternative, index) => {
          const internal = alternative.item;
          const href = internal?.slug?.current
            ? `/item/${internal.slug.current}`
            : alternative.url;
          const name = alternative.name || internal?.name || "Alternative";
          const description = alternative.note || internal?.description || null;
          const icon = internal?.icon ? urlForIcon(internal.icon) : null;

          return (
            <div
              key={alternative._key || `${name}-${index}`}
              className="rounded-lg border bg-muted/40 p-5"
            >
              <div className="flex items-start gap-3">
                {icon && (
                  <Image
                    src={icon.src}
                    alt={`${name} logo`}
                    width={28}
                    height={28}
                    className="mt-0.5 size-7 rounded object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">
                    {href ? (
                      <Link
                        href={href}
                        {...(internal
                          ? {}
                          : {
                              target: "_blank",
                              prefetch: false,
                              rel: "noopener noreferrer",
                            })}
                        className="link-underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </h3>
                  {description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ItemFaqs({ item }: { item: Item }) {
  if (!item.faqs?.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        icon={<UserRoundIcon className="size-4 text-indigo-500" />}
      >
        {item.name} FAQs
      </SectionHeading>
      <Accordion type="single" collapsible className="w-full">
        {item.faqs.map((faq, index) => (
          <AccordionItem
            key={`${faq.question}-${index}`}
            value={`faq-${index}`}
          >
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

type RelatedPost = {
  _id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
};

export function ItemRelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        icon={<BookOpenIcon className="size-4 text-indigo-500" />}
      >
        Related comparisons
      </SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) =>
          post.slug ? (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
            >
              <h3 className="font-semibold leading-snug">{post.title}</h3>
              {post.excerpt && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </Link>
          ) : null,
        )}
      </div>
    </section>
  );
}

export function ItemSources({ item }: { item: Item }) {
  if (!item.sources?.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        icon={<ShieldCheckIcon className="size-4 text-indigo-500" />}
      >
        Sources
      </SectionHeading>
      <ul className="space-y-2 text-sm">
        {item.sources.map((source, index) => (
          <li key={`${source.url}-${index}`}>
            <Link
              href={source.url}
              target="_blank"
              prefetch={false}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground link-underline"
            >
              {source.title}
              <ExternalLinkIcon className="size-3" />
            </Link>
          </li>
        ))}
      </ul>
      {item.lastVerified && (
        <p className="text-xs text-muted-foreground">
          Facts checked on {formatLongDate(item.lastVerified)}.
        </p>
      )}
    </section>
  );
}
