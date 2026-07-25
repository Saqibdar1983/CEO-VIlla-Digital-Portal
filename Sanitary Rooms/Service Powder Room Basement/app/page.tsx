"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  item: string;
  manufacturer: string;
  model: string;
  finish: string;
  po: string;
  image: string;
  category: string;
  description: string;
  status: string;
  quantity: number;
  warranty: string;
  location: string;
};

const products: Product[] = [
  { id: "S-01", item: "WC + Tank + Cover", manufacturer: "ROCA", model: "DEBBA A034S999000", finish: "White", po: "12052", image: "/products/product-01.webp", category: "Ceramic ware", description: "Close-coupled floor-mounted WC with matching tank and seat cover.", status: "Installed", quantity: 1, warranty: "5 years", location: "Service Area Powder Room — Basement" },
  { id: "S-02", item: "Wash Basin", manufacturer: "ROCA", model: "325995000", finish: "White", po: "12052", image: "/products/product-02.webp", category: "Ceramic ware", description: "Wall-mounted wash basin with single mixer tap hole and overflow.", status: "Installed", quantity: 1, warranty: "5 years", location: "Service Area Powder Room — Basement" },
  { id: "S-03", item: "Pedestal", manufacturer: "ROCA", model: "A337991000", finish: "White", po: "12052", image: "/products/product-03.webp", category: "Ceramic ware", description: "Matching semi-pedestal for concealed basin pipework and a clean finish.", status: "Installed", quantity: 1, warranty: "5 years", location: "Service Area Powder Room — Basement" },
  { id: "S-04", item: "Wash Basin Mixer", manufacturer: "ROCA", model: "A05A3098C00", finish: "Chrome", po: "12052", image: "/products/product-04.webp", category: "Brassware", description: "Single-lever basin mixer with chrome finish and aerated outlet.", status: "Installed", quantity: 1, warranty: "5 years", location: "Service Area Powder Room — Basement" },
  { id: "S-05", item: "Bottle Trap", manufacturer: "VAEGA", model: "1¼\" / 100–176", finish: "Chrome", po: "12052", image: "/products/product-05.webp", category: "Drainage", description: "Adjustable chrome-plated bottle trap for exposed basin installation.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-06", item: "Robe Hook", manufacturer: "ROCA", model: "A4703-1 / A815491001", finish: "Chrome", po: "12052", image: "/products/product-06.webp", category: "Accessories", description: "Double robe hook with concealed wall fixing and polished chrome finish.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-07", item: "Angle Valve HS & WB", manufacturer: "ARCO", model: "A80, 000NOV06", finish: "Chrome", po: "12052", image: "/products/product-07.webp", category: "Valves", description: "Chrome angle isolation valve serving the hand shower and wash basin.", status: "Installed", quantity: 2, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-08", item: "Paper Holder", manufacturer: "ROCA", model: "816662001 VICTORIA", finish: "Chrome", po: "12052", image: "/products/product-08.webp", category: "Accessories", description: "Wall-mounted toilet paper holder with protective cover.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-09", item: "Hand Shower", manufacturer: "GROHE", model: "26354000 + 27 512 001", finish: "Chrome", po: "12076", image: "/products/product-09.webp", category: "Brassware", description: "Hand shower set including spray head, flexible hose and wall bracket.", status: "Installed", quantity: 1, warranty: "5 years", location: "Service Area Powder Room — Basement" },
  { id: "S-10", item: "Towel Rail", manufacturer: "ROCA", model: "Hotels 43, A816729001", finish: "Chrome", po: "12052", image: "/products/product-10.webp", category: "Accessories", description: "Wall-mounted single towel rail with concealed fixings.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-11", item: "Floor Drain", manufacturer: "AQUA", model: "ADQ 615P SS", finish: "Chrome", po: "12052", image: "/products/product-11.webp", category: "Drainage", description: "Stainless-steel floor drain with removable round cover and strainer.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-12", item: "Pop-Up Drain", manufacturer: "ROCA", model: "A05A3098C00", finish: "Chrome", po: "12052", image: "/products/product-12.webp", category: "Drainage", description: "Chrome pop-up basin waste with operating linkage.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
  { id: "S-13", item: "Floor Clean Out", manufacturer: "Saudi Cast", model: "FD 7030", finish: "Chrome", po: "12052", image: "/products/product-13.webp", category: "Drainage", description: "Recessed access cover for maintenance of the floor drainage system.", status: "Installed", quantity: 1, warranty: "2 years", location: "Service Area Powder Room — Basement" },
];

export default function Home() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", close);
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [selected]);

  const visible = products.filter((p) => `${p.item} ${p.manufacturer} ${p.model}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main>
      <section className="hero" id="top">
        <div className="crumbs">CEO Villa <b>/</b> Basement <b>/</b> Service Area</div>
        <div className="hero-row">
          <div>
            <p className="eyebrow">SANITARY ASSET SCHEDULE</p>
            <h1>Service Area <em>Powder Room</em></h1>
            <p className="intro">A complete, interactive record of sanitary fixtures, brassware and accessories installed in this room.</p>
          </div>
          <p className="villa-label">CEO VILLA ASSET REGISTER</p>
        </div>
      </section>

      <section className="catalogue">
        <div className="catalogue-head">
          <div><p className="eyebrow">ROOM INVENTORY</p><h2>Sanitary details</h2></div>
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item, brand or model…" /></label>
        </div>

        <div className="grid">
          {visible.map((product, index) => (
            <button className="product-card" key={product.id} onClick={() => setSelected(product)} style={{ animationDelay: `${index * 35}ms` }}>
              <div className="image-wrap">
                <span className="reference">{product.id}</span>
                <Image src={product.image} alt={product.item} width={640} height={460} />
                <span className="view">View details <b>↗</b></span>
              </div>
              <div className="card-body">
                <p>{product.category}</p><h3>{product.item}</h3>
                <dl>
                  <div><dt>Manufacturer</dt><dd>{product.manufacturer}</dd></div>
                  <div><dt>Model</dt><dd>{product.model}</dd></div>
                  <div><dt>Finish</dt><dd>{product.finish}</dd></div>
                  <div><dt>PO</dt><dd>{product.po}</dd></div>
                </dl>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer><span>CEO Villa — MEP Handover Documentation</span><span>Basement · Service Area Powder Room</span></footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <article className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="close" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            <div className="modal-image"><span className="reference">{selected.id}</span><Image src={selected.image} alt={selected.item} width={900} height={720} /></div>
            <div className="modal-content">
              <p className="eyebrow">{selected.category} · {selected.id}</p>
              <h2 id="modal-title">{selected.item}</h2>
              <p className="description">{selected.description}</p>
              <div className="status"><i /> {selected.status} <span>Verified for handover</span></div>
              <dl className="details">
                <div><dt>Manufacturer</dt><dd>{selected.manufacturer}</dd></div>
                <div><dt>Model</dt><dd>{selected.model}</dd></div>
                <div><dt>Finish</dt><dd>{selected.finish}</dd></div>
                <div><dt>Purchase order</dt><dd>PO {selected.po}</dd></div>
                <div><dt>Quantity</dt><dd>{selected.quantity} No.</dd></div>
                <div><dt>Warranty</dt><dd>{selected.warranty}</dd></div>
                <div className="wide"><dt>Installed location</dt><dd>{selected.location}</dd></div>
              </dl>
              <div className="actions"><button>Technical datasheet <span>↓</span></button><button>Maintenance manual <span>↓</span></button></div>
              <p className="demo-note">Demo buttons — your PDF documents can be connected here.</p>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
