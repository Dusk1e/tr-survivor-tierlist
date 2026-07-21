"use client";

import SessionProvider from "./SessionProvider";
import Header from "./Header";
import Tierlist from "./Tierlist";
import Footer from "./Footer";
import HeaderAuthControls from "./HeaderAuthControls";
import FlagBanner from "./FlagBanner";

/**
 * Public app shell — wraps the tier list in the session context so cards can
 * read login state, cast votes, and open the detail modal.
 */
export default function PublicApp() {
  return (
    <SessionProvider>
      <main className="relative min-h-screen">
        <FlagBanner />
        <Header right={<HeaderAuthControls />} />
        <Tierlist />
        <Footer />
      </main>
    </SessionProvider>
  );
}
