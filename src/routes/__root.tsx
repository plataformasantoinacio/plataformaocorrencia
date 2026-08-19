import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1a1f3a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Ocorrências CSI" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Livro de Ocorrências — Colégio Santo Inácio" },

      {
        name: "description",
        content:
          "Plataforma interna do Colégio Santo Inácio para registro e acompanhamento de ocorrências disciplinares.",
      },
      { property: "og:title", content: "Livro de Ocorrências — Colégio Santo Inácio" },
      {
        property: "og:description",
        content: "Sistema interno de gestão de ocorrências disciplinares.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Livro de Ocorrências — Colégio Santo Inácio" },
      { name: "description", content: "Ocorrência Conectada: Plataforma digital para registro e gestão de ocorrências escolares." },
      { property: "og:description", content: "Ocorrência Conectada: Plataforma digital para registro e gestão de ocorrências escolares." },
      { name: "twitter:description", content: "Ocorrência Conectada: Plataforma digital para registro e gestão de ocorrências escolares." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6209acae-29ae-4697-9920-b2173c001e00/id-preview-36d92c0a--98c5e1d0-1d6d-46c1-98ea-251caaa96f5a.lovable.app-1777052947077.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6209acae-29ae-4697-9920-b2173c001e00/id-preview-36d92c0a--98c5e1d0-1d6d-46c1-98ea-251caaa96f5a.lovable.app-1777052947077.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap",
      },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  );
}
