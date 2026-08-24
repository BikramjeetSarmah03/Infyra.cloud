import { Link } from "@tanstack/react-router";

import "./not-found.css";

export function NotFound() {
  return (
    <section className="page_404">
      <div className="four_zero_four_bg" />
      <div className="contant_box_404">
        <h3 className="h2">Look like you're lost</h3>
        <p>the page you are looking for is not available!</p>
        <Link to="/" className="link_404">
          Go to Home
        </Link>
      </div>
    </section>
  );
}
