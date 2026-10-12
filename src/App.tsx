import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
  Minus,
  Menu,
  X,
  Check,
  Copy,
  Download,
  LoaderCircle,
} from "lucide-react";
import { PortableText } from "@portabletext/react";
import "./styles.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import { fallbackContent, getContent, safeUrl, cmsConfigured } from "./content";
import { Artwork, Star } from "./Artwork";
import type { Section, Settings, Item } from "./types";

function Heading({
  section,
  children,
}: {
  section: Section;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{section.eyebrow}</p>
        <h2>
          {section.headline}
          {section.highlight && (
            <>
              <br />
              <span>{section.highlight}</span>
            </>
          )}
        </h2>
      </div>
      {children ??
        (section.description && (
          <p className="section-description">{section.description}</p>
        ))}
    </div>
  );
}
function ProjectModal({
  project,
  close,
}: {
  project: Item;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="dialog-close icon-button"
        aria-label="Close project"
        onClick={close}
      >
        <X />
      </button>
      {project.image?.asset?.url ? (
        <img
          src={project.image.asset.url}
          alt={project.image.alt || project.title || ""}
        />
      ) : (
        <Artwork variant={project.artwork} />
      )}
      <div className="dialog-content">
        <p className="eyebrow">
          {project.label} · {project.category}
        </p>
        <h2 id="project-title">{project.title}</h2>
        <p>{project.summary}</p>
        <a href="#contact" className="button dark" onClick={close}>
          Create something like this <ArrowUpRight size={18} />
        </a>
      </div>
    </dialog>
  );
}
function Contact({
  section,
  settings,
}: {
  section: Section;
  settings: Settings;
}) {
  const [result, setResult] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [emailOpened, setEmailOpened] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail || "")
    ? settings.contactEmail
    : "";
  const labels = section.formLabels || {};
  const phone = (settings.whatsappNumber || "").replace(/[+\s()-]/g, "");
  const whatsapp = /^[1-9]\d{6,14}$/.test(phone) ? phone : "";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setDraft(
      Object.fromEntries(
        Array.from(data.entries()).map(([key, value]) => [key, String(value)]),
      ),
    );
    const brief = `Project enquiry for ${settings.brandName}\n\nName: ${data.get("name")}\nEmail: ${data.get("email")}\nInterested in: ${data.get("service")}\n\n${data.get("message")}`;
    setResult(brief);
    setCopied(false);
    setCopyError(false);
    setEmailOpened(false);
  }
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);
  function download() {
    const url = URL.createObjectURL(
      new Blob([result], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "nufa-project-brief.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section id={section.anchor} className="contact-section section-wrap">
      <div className="contact-copy">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2>
          {section.headline}
          <br />
          <span>{section.highlight}</span>
        </h2>
        <p>{section.description}</p>
        <Star className="contact-star" />
        {settings.responseNote && <p>{settings.responseNote}</p>}
        {settings.phoneNumber &&
          /^\+?[1-9]\d{6,14}$/.test(settings.phoneNumber) && (
            <a className="contact-email" href={`tel:${settings.phoneNumber}`}>
              {settings.phoneLabel || settings.phoneNumber}
              <ArrowUpRight size={20} />
            </a>
          )}
        {settings.officeAddress && <p>{settings.officeAddress}</p>}
        {settings.officeHours && <p>{settings.officeHours}</p>}
        {email && (
          <a className="contact-email" href={`mailto:${email}`}>
            {email}
            <ArrowUpRight size={20} />
          </a>
        )}
      </div>
      <div className="contact-form-wrap">
        {result ? (
          <div ref={resultRef} className="brief-result" tabIndex={-1}>
            <div className="success-icon">
              <Check />
            </div>
            <h3>{settings.briefReadyHeading || "Your brief is ready."}</h3>
            <p>
              {email || whatsapp
                ? settings.briefReadyDescription
                : settings.briefUnavailableDescription}
            </p>
            {email && (
              <a
                className="button dark"
                href={`mailto:${email}?subject=${encodeURIComponent("Let’s create something — project enquiry")}&body=${encodeURIComponent(result)}`}
                onClick={() => setEmailOpened(true)}
              >
                Open email draft <ArrowUpRight size={18} />
              </a>
            )}
            {whatsapp && (
              <a
                className="button dark"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(result)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open WhatsApp <ArrowUpRight size={18} />
              </a>
            )}
            {emailOpened && (
              <p className="form-note" role="status">
                If your email app did not open, copy or download your brief and
                email it to {email}.
              </p>
            )}
            <div className="brief-actions">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result);
                    setCopied(true);
                    setCopyError(false);
                  } catch {
                    setCopyError(true);
                  }
                }}
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy brief"}
              </button>
              <button type="button" onClick={download}>
                <Download size={16} />
                Download brief
              </button>
            </div>
            {copyError && (
              <p role="status">
                Clipboard access is unavailable. Use Download brief instead.
              </p>
            )}
            <button className="text-button" onClick={() => setResult("")}>
              Edit your brief <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-row">
              <label>
                {labels.nameLabel || "Your name"}
                <input
                  name="name"
                  defaultValue={draft.name}
                  placeholder={labels.namePlaceholder}
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                {labels.emailLabel || "Email address"}
                <input
                  name="email"
                  defaultValue={draft.email}
                  type="email"
                  placeholder={labels.emailPlaceholder}
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
            </div>
            <label>
              {labels.serviceLabel || "What can we help with?"}
              <select
                name="service"
                defaultValue={draft.service || ""}
                required
              >
                <option value="" disabled>
                  {labels.servicePlaceholder || "Select a service"}
                </option>
                {section.services?.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
            </label>
            <label>
              {labels.messageLabel || "A little about your project"}
              <textarea
                name="message"
                defaultValue={draft.message}
                placeholder={labels.messagePlaceholder}
                rows={4}
                required
                minLength={10}
                maxLength={5000}
              />
            </label>
            <button className="button dark" type="submit">
              {section.buttonLabel}
              <ArrowUpRight size={18} />
            </button>
            <p className="form-note">{section.formNote}</p>
          </form>
        )}
      </div>
    </section>
  );
}
function Block({
  section,
  settings,
  onProject,
}: {
  section: Section;
  settings: Settings;
  onProject: (item: Item) => void;
}) {
  switch (section._type) {
    case "heroBlock":
      return (
        <section id={section.anchor} className="hero section-wrap">
          <img
            className="hero-background"
            src={section.image?.asset?.url || "/images/hero.svg"}
            alt={section.image?.alt || ""}
          />
          <div className="hero-overlay" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              {section.eyebrow}
            </p>
            <h1>
              {section.headline}
              <br />
              <span>{section.highlight}</span>
            </h1>
            <p className="hero-description">{section.description}</p>
            <div className="hero-actions">
              <a
                className="button lime"
                href={safeUrl(section.primaryHref) || "#contact"}
              >
                {section.primaryLabel}
                <ArrowUpRight size={17} />
              </a>
              <a
                className="button outlined"
                href={safeUrl(section.secondaryHref) || "#work"}
              >
                {section.secondaryLabel}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <span className="hero-direction">{section.artCaption}</span>
          <a className="scroll-cue" href="#about">
            <ArrowDown size={15} />
            SCROLL TO EXPLORE
          </a>
        </section>
      );
    case "tickerBlock":
      return (
        <section id={section.anchor} className="ticker-section">
          <div className="ticker-label">
            <p className="eyebrow">{section.eyebrow}</p>
            <p>{section.note}</p>
          </div>
          <div className="ticker-words">
            {section.labels?.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
        </section>
      );
    case "servicesBlock":
      return (
        <section id={section.anchor} className="services-section section-wrap">
          <Heading section={section} />
          <div className="services-layout">
            <div className="services-grid">
              {section.items?.map((item, i) => (
                <article className="service-card" key={item._key}>
                  <span className="service-number">0{i + 1}</span>
                  <div>
                    <h3>
                      <a href="#contact">
                        {item.title}
                        <ArrowUpRight size={24} />
                      </a>
                    </h3>
                    <p>{item.description}</p>
                    <div className="service-tags">
                      {item.tags?.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="services-visual">
              <img
                src={section.image?.asset?.url || "/images/hero.svg"}
                alt={section.image?.alt || "Abstract architectural forms"}
              />
              <span>{section.note || "STRUCTURAL PRECISION"}</span>
            </div>
          </div>
        </section>
      );
    case "workBlock":
      return (
        <section id={section.anchor} className="work-section section-wrap">
          <Heading section={section} />
          <div className="work-grid">
            {section.items?.map((item) => (
              <button
                className="project-card"
                key={item._key}
                onClick={() => onProject(item)}
              >
                <div className="project-image">
                  {item.image?.asset?.url ? (
                    <img
                      src={item.image.asset.url}
                      alt={item.image.alt || item.title || ""}
                      loading="lazy"
                    />
                  ) : (
                    <Artwork variant={item.artwork} />
                  )}
                  <span className="project-open">
                    <ArrowUpRight size={23} />
                  </span>
                </div>
                <div className="project-info">
                  <div>
                    <p>{item.category}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      );
    case "aboutBlock":
      return (
        <section id={section.anchor} className="about-section section-wrap">
          <div className="about-copy">
            <p className="eyebrow">{section.eyebrow}</p>
            <h2>
              {section.headline}
              <br />
              <span>{section.highlight}</span>
            </h2>
            <p>{section.description}</p>
            <a
              className="text-link"
              href={safeUrl(section.buttonHref) || "#process"}
            >
              {section.buttonLabel || "Our approach"}
              <ArrowUpRight size={16} />
            </a>
          </div>
          {section.values && (
            <div className="about-values">
              {section.values.map((value) => (
                <article key={value._key}>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </article>
              ))}
            </div>
          )}
          {section.quote && <p className="about-quote">{section.quote}</p>}
          {section.image?.asset?.url && (
            <img
              className="about-image"
              src={section.image.asset.url}
              alt={section.image.alt || ""}
            />
          )}
        </section>
      );
    case "processBlock":
      return (
        <section id={section.anchor} className="process-section section-wrap">
          <Heading section={section} />
          <div className="process-grid">
            {section.steps?.map((step, i) => (
              <article key={step._key}>
                <div className="step-top">
                  <span>0{i + 1}</span>
                  <ArrowRight size={22} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case "faqBlock":
      return (
        <section id={section.anchor} className="faq-section section-wrap">
          <Heading section={section} />
          <div className="faq-list">
            {section.items?.map((item) => (
              <details key={item._key}>
                <summary>
                  {item.question}
                  <Plus className="faq-plus" size={20} />
                  <Minus className="faq-minus" size={20} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "contactBlock":
      return <Contact section={section} settings={settings} />;
    case "richTextBlock":
      return (
        <section id={section.anchor} className="richtext-section section-wrap">
          <Heading section={section} />
          <div className="prose">
            {section.body && (
              <PortableText
                value={section.body}
                components={{
                  marks: {
                    link: ({ value, children }) => {
                      const href = safeUrl(value?.href);
                      return href ? (
                        <a href={href}>{children}</a>
                      ) : (
                        <>{children}</>
                      );
                    },
                  },
                }}
              />
            )}
          </div>
        </section>
      );
    case "imageBlock":
      return (
        <section id={section.anchor} className="image-section section-wrap">
          {section.headline && <Heading section={section} />}
          <figure>
            {section.image?.asset?.url && (
              <img
                src={section.image.asset.url}
                alt={section.image.alt || ""}
                loading="lazy"
              />
            )}
            {section.caption && <figcaption>{section.caption}</figcaption>}
          </figure>
        </section>
      );
    default:
      return null;
  }
}
export default function App() {
  const [content, setContent] = useState(fallbackContent);
  const [menuOpen, setMenuOpen] = useState(false);
  const [project, setProject] = useState<Item | null>(null);
  const [loading, setLoading] = useState(cmsConfigured);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const previousMenuOpen = useRef(false);
  useEffect(() => {
    let alive = true;
    getContent(slug)
      .then((data) => {
        if (alive) {
          if (data) setContent(data);
          else setNotFound(true);
        }
      })
      .catch((error) => {
        console.error(
          "Sanity content could not be loaded; using bundled content.",
          error,
        );
        if (alive) {
          setLoadError(true);
          if (slug !== "home") setNotFound(true);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const { page } = content;
    document.title = page.seoTitle || "Nufa Media";
    const meta = document.querySelector('meta[name="description"]');
    if (meta && page.seoDescription)
      meta.setAttribute("content", page.seoDescription);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    if (page.seoDescription)
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute("content", page.seoDescription);
  }, [content]);
  useEffect(() => {
    if (menuOpen) menuRef.current?.showModal();
    else {
      menuRef.current?.close();
      if (previousMenuOpen.current) menuTrigger.current?.focus();
    }
    previousMenuOpen.current = menuOpen;
  }, [menuOpen]);
  const { settings, page } = content;
  const nav = (settings.navigation || []).filter((link) => safeUrl(link.href));
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <a
          className="brand"
          href="#main"
          aria-label={`${settings.brandName} home`}
        >
          <strong>{settings.brandName}</strong>
          <span className="brand-descriptor">{settings.brandDescriptor}</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map((link) => (
            <a key={link._key} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="nav-cta" href={safeUrl(settings.ctaHref) || "#contact"}>
          {settings.ctaLabel}
          <ArrowUpRight size={17} />
        </a>
        <button
          className="menu-toggle icon-button"
          ref={menuTrigger}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Menu />
        </button>
      </header>
      <dialog
        id="mobile-menu"
        className="mobile-menu"
        ref={menuRef}
        onCancel={() => setMenuOpen(false)}
        aria-label="Navigation"
      >
        <button
          className="icon-button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <X />
        </button>
        <nav>
          {nav.map((link) => (
            <a
              key={link._key}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              <ArrowUpRight />
            </a>
          ))}
          <a
            href={safeUrl(settings.ctaHref) || "#contact"}
            onClick={() => setMenuOpen(false)}
          >
            {settings.ctaLabel}
            <ArrowUpRight />
          </a>
        </nav>
      </dialog>
      <main id="main" tabIndex={-1}>
        {notFound ? (
          <section className="section-wrap">
            <h1>
              {loadError ? "Content temporarily unavailable" : "Page not found"}
            </h1>
            <p>
              {loadError
                ? "Please try again in a moment."
                : "This page has not been published yet."}
            </p>
            <a className="text-link" href="/">
              Back to home <ArrowRight size={16} />
            </a>
          </section>
        ) : loading ? (
          <div className="content-status" role="status">
            <LoaderCircle className="loading-icon" />
            Loading the latest from Nufa Media…
          </div>
        ) : (
          <>
            {loadError && (
              <p className="content-status" role="status">
                Showing our studio overview while the latest content is
                temporarily unavailable.
              </p>
            )}
            {page.sections.map((section) => (
              <Block
                key={section._key}
                section={section}
                settings={settings}
                onProject={setProject}
              />
            ))}
          </>
        )}
      </main>
      <footer className="footer section-wrap">
        <div className="footer-top">
          <a className="brand" href="#main">
            <strong>{settings.brandName}</strong>
          </a>
          <p>{settings.footerTagline}</p>
          <a href="#main" className="back-top">
            Back to top <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {settings.brandName}
          </p>
          <p>{settings.footerNote}</p>
          <div>
            {settings.socialLinks
              ?.filter((link) => safeUrl(link.href))
              .map((link) => (
                <a
                  key={link._key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                  <ArrowUpRight size={13} />
                </a>
              ))}
          </div>
        </div>
      </footer>
      <a
        className="floating-contact"
        href={safeUrl(settings.ctaHref) || "#contact"}
      >
        <span className="status-dot" />
        {settings.ctaLabel}
        <ArrowUpRight size={15} />
      </a>
      {project && (
        <ProjectModal project={project} close={() => setProject(null)} />
      )}
    </>
  );
}
