export default function Footer() {
  return (
    <footer className="mt-16 border-t border-textSecondary/20 bg-card">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-textSecondary text-sm">
        <p>© {new Date().getFullYear()} Eduweb. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <a className="hover:text-textPrimary" href="#">About</a>
          <a className="hover:text-textPrimary" href="#">Contact</a>
          <a className="hover:text-textPrimary" href="#">Terms</a>
        </nav>
      </div>
    </footer>
  );
}
