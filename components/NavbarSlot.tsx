"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("./Navbar"), {
  ssr: false,
  loading: () => (
    <div className="sticky top-0 z-50 h-18 border-b border-white/10 bg-[#070b1f]/80 backdrop-blur-xl" />
  ),
});

export default function NavbarSlot() {
  return <Navbar />;
}
