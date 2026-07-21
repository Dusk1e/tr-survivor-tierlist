"use client";

import { useEffect, useReducer, useState } from "react";
import DefaultMouse from "./DefaultMouse";

/**
 * Player avatar. Priority:
 *   1. the player's pasted image URL (if any / not broken)
 *   2. /public/mouse.png  (drop your exact Transformice PNG there)
 *   3. the built-in DefaultMouse SVG
 */

type PngStatus = "loading" | "ok" | "missing";
let pngStatus: PngStatus = "loading";
let probed = false;
const subscribers = new Set<() => void>();

function probePng() {
  if (probed || typeof window === "undefined") return;
  probed = true;
  const img = new Image();
  img.onload = () => {
    pngStatus = "ok";
    subscribers.forEach((f) => f());
  };
  img.onerror = () => {
    pngStatus = "missing";
    subscribers.forEach((f) => f());
  };
  img.src = "/mouse.png";
}

function useDefaultPng(): PngStatus {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    probePng();
    const f = () => force();
    subscribers.add(f);
    return () => {
      subscribers.delete(f);
    };
  }, []);
  return pngStatus;
}

export default function MouseAvatar({
  src,
  alt,
  accent,
  className = "",
}: {
  src?: string;
  alt: string;
  accent: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const png = useDefaultPng();
  const hasCustom = !!src && src.trim().length > 0 && !broken;

  if (hasCustom) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 42%, ${accent}1f, transparent 72%)`,
      }}
    >
      {png === "ok" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/mouse.png"
          alt={alt}
          loading="lazy"
          className="h-full w-full object-contain p-0.5"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <DefaultMouse />
      )}
    </div>
  );
}
