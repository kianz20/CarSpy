export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 px-4 py-4 text-center text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
      <p>
        © {new Date().getFullYear()}{" "}
        <a href="https://github.com/kianz20" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Kian Jazayeri
        </a>{" "}
        ·{" "}
        <a href="https://github.com/kianz20/CarValue" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Source on GitHub
        </a>{" "}
        · MIT Licensed
      </p>
    </footer>
  );
}
