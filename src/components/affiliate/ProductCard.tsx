"use client";

import Image from "next/image";
import { useState } from "react";
import { Headphones } from "lucide-react";
import type { AffiliateProduct } from "@/types/affiliate";

export function ProductCard({ product }: { product: AffiliateProduct }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageSrc = product.imageSrc?.startsWith("/") && !product.imageSrc.startsWith("//")
    ? product.imageSrc : undefined;
  return (
    <article className="affiliate-card">
      <div className="affiliate-image">
        {imageSrc && failedImage !== imageSrc ? (
          <Image src={imageSrc} alt={product.name} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 360px" onError={() => setFailedImage(imageSrc)} />
        ) : (
          <div className="affiliate-placeholder"><Headphones size={32} strokeWidth={1} aria-hidden="true" /><span>Image to come</span></div>
        )}
      </div>
      <div className="affiliate-card-copy">
        {product.badge && <span className="affiliate-badge">{product.badge}</span>}
        <h3>{product.name}</h3>
        <p>{product.shortDescription}</p>
        {!!product.recommendedFor?.length && (
          <ul className="affiliate-tags" aria-label="Recommended for">
            {product.recommendedFor.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
        <a className="text-button affiliate-cta" href={product.affiliateUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
          View on eBay →<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
