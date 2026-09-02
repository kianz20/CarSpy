export function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-5 text-center text-xs text-muted">
      <p>
        © {new Date().getFullYear()}{" "}
        <a href="https://github.com/kianz20" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
          Kian Jazayeri
        </a>{" "}
        ·{" "}
        <a href="https://github.com/kianz20/CarValue" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
          Source on GitHub
        </a>{" "}
        · MIT Licensed
      </p>
    </footer>
  );
}
