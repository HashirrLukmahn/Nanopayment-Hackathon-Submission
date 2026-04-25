export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-accent mb-3">404</div>
        <h1 className="font-serif text-4xl tracking-tight">Page not found.</h1>
        <p className="mt-3 text-muted-foreground">
          <a href="/" className="underline hover:text-foreground transition">
            Back home
          </a>
        </p>
      </div>
    </main>
  );
}
