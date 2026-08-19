import thunderLogo from "@/assets/logo-thunder.png";

export function Footer() {
  return (
    <footer className="w-full px-4 py-5">
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 text-center text-[11px] font-medium tracking-wide"
        style={{ color: "#c4cbd7" }}
      >
        <span>feito com</span>
        <span aria-hidden>💙</span>
        <span>por</span>
        <a
          href="https://www.agenciathunder.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 inline-flex items-center transition-opacity hover:opacity-70"
          aria-label="Agência Thunder"
        >
          <img
            src={thunderLogo}
            alt="Thunder"
            className="h-3.5 w-auto"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(87%) sepia(6%) saturate(438%) hue-rotate(182deg) brightness(94%) contrast(88%)",
            }}
          />
        </a>
      </div>
    </footer>
  );
}

