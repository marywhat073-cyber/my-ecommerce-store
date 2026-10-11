import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageDirectory = path.join(root, "public", "catalog");
const outputPath = path.join(root, "data", "products.json");
const palette = [
  ["Obsidian", "#252a37"],
  ["Porcelain", "#f1e9dc"],
  ["Sapphire", "#315ca8"],
  ["Forest", "#36735b"],
  ["Rose", "#bd7186"],
  ["Champagne", "#c2a36b"],
  ["Graphite", "#777b84"],
  ["Lavender", "#9382b4"],
  ["Cobalt", "#397bc1"],
  ["Terracotta", "#b7664b"],
  ["Ivory", "#efe2c9"],
  ["Emerald", "#27816b"],
  ["Plum", "#794a70"],
  ["Silver", "#bac3cc"],
  ["Sage", "#8c9e80"],
  ["Ruby", "#a43c4c"],
];

const catalog = [
  {
    category: "Tech, Phones & Computers",
    count: 70,
    brands: ["Samsung", "Apple", "Google", "OnePlus", "Xiaomi", "ASUS", "Lenovo", "Dell", "Sony", "Anker", "JBL", "Logitech", "Razer", "Acer"],
    types: [
      "Flagship 5G Smartphone", "Foldable 5G Smartphone", "Pro Camera Smartphone", "Creator Laptop", "Business Ultrabook",
      "Gaming Laptop", "Premium Tablet", "AMOLED Smartwatch", "Wireless Earbuds", "Noise-Cancelling Headphones",
      "Portable Bluetooth Speaker", "Studio Monitor Speaker Pair", "4K HDR Monitor", "USB-C Docking Station",
      "Mechanical Keyboard", "Precision Wireless Mouse", "Thunderbolt SSD", "Wi-Fi 7 Mesh Router",
      "100W GaN Fast Charger Set", "30,000mAh Power Bank", "Laptop Commuter Bag", "Dual-Arm Monitor Stand",
      "2K Video Conference Camera", "Line-Interactive UPS", "65W USB-C Travel Adapter", "MagSafe-Compatible Phone Case",
      "9H Ceramic Tempered Glass Bundle", "4K Portable Projector", "Wi-Fi Smart Display", "Creator Graphics Tablet",
      "Portable SSD Backup Kit", "Bluetooth Numeric Keypad", "Ergonomic Trackball Mouse", "USB-C KVM Switch",
      "Wi-Fi 7 Tri-Band Router", "Smart Home Hub", "Wireless Charging Stand", "Premium E-Reader",
    ],
    specs: ["512GB storage · 12GB RAM", "1TB storage · OLED display", "16GB memory · Wi-Fi 7", "4K HDR · 144Hz panel", "65W USB-C · 3-device kit", "Bluetooth 5.4 · multipoint", "120W fast-charge compatible", "2.5GbE · mesh-ready", "4K60 video · USB-C", "80 PLUS Gold · 1500VA"],
    stories: ["A flagship-grade component set combines fast everyday performance with a durable, premium-finish chassis.", "Carefully selected connectivity, display, and power specifications make this model suitable for demanding work and travel.", "A balanced premium configuration pairs reliable construction with modern standards and thoughtful thermal design."],
    min: 320_000,
    max: 12_800_000,
    art: "tech",
  },
  {
    category: "Men's Fashion & Grooming",
    count: 70,
    brands: ["Evergreen Atelier", "Polo Ralph Lauren", "Nike", "Adidas", "Clarks", "Timberland", "Philips", "Kiehl's", "Clinique", "The Body Shop"],
    types: [
      "Supima Cotton Oxford Shirt", "Merino Wool Dress Shirt", "Performance Piqué Polo", "Heavyweight Organic T-Shirt",
      "Japanese Selvedge Denim", "Tailored Italian Wool Trousers", "Stretch Chino Trousers", "Technical Trail Shorts",
      "Linen Weekend Shorts", "Premium Leather Derby Shoes", "Full-Grain Leather Sneakers", "Suede Chelsea Boots",
      "Hand-Finished Leather Belt", "Reversible Dress Belt", "Cotton Modal Innerwear Set", "Merino Base-Layer Set",
      "Four-Zone Facial Cleanser Set", "Barrier Repair Moisturizer Kit", "Daily SPF50 Sunscreen Duo",
      "Precision Shaving Cream & Brush Set", "Sensitive-Skin Shave Gel Collection", "Hydrating Body Wash Quartet",
      "Matte Clay Hair Styling Kit", "Sea-Salt Texture Spray Set", "Carbon-Fibre Watch Strap", "Premium Travel Grooming Kit",
    ],
    specs: ["long-staple cotton · tailored fit", "merino blend · 180 g/m²", "full-grain leather · hand-finished", "SPF50+ · broad spectrum · 3-pack", "sensitive-skin formula · 4-piece kit", "sizes S–XXL · reinforced seams", "water-resistant · all-season", "recycled performance fabric · 4-way stretch", "12-hour matte finish · 3-piece grooming set", "gift-ready six-piece collection"],
    stories: ["Cut from premium, traceable materials with reinforced finishing for comfortable, repeated wear.", "A considered fit and refined colorway bring an elevated finish to both weekday and weekend wardrobes.", "A premium multi-piece grooming edit is selected for dependable ingredients, easy layering, and daily use."],
    min: 310_000,
    max: 4_900_000,
    art: "fashion",
  },
  {
    category: "Women's Fashion, Clothing & Lingerie",
    count: 130,
    brands: ["Evergreen Atelier", "COS", "Coach", "Kate Spade", "Charles & Keith", "Tory Burch", "Calvin Klein", "Aerie", "Swarovski", "Pandora"],
    types: [
      "Everyday Organic Cotton Wrap Dress", "Linen Resort Midi Dress", "Silk-Blend Evening Gown", "Tailored Office Blazer",
      "Italian Crepe Office Trousers", "Cashmere-Blend Cardigan", "Premium Poplin Shirt", "Embroidered Traditional Longyi Set",
      "Handwoven Silk Ceremony Dress", "Beaded Party Cocktail Dress", "Merino-Lined Knit Skirt", "High-Rise Wide-Leg Jeans",
      "Satin Two-Piece Nightwear Set", "Silk Kimono Robe", "Supportive Lace Lingerie Set", "Seamless Everyday Underwear Set",
      "Full-Coverage Premium Bra Trio", "Modal Sleepwear Collection", "Leather Court Heels", "Cushioned Leather Loafers",
      "Italian Suede Ankle Boots", "Handwoven Leather Sandals", "Structured Leather Tote", "Quilted Crossbody Bag",
      "Pebbled-Leather Shoulder Bag", "Premium Travel Wallet", "Full-Grain Card Holder Set", "Freshwater Pearl Necklace",
      "Gold-Vermeil Bracelet Set", "Sterling Silver Hoop Earrings", "Lab-Grown Sapphire Pendant", "Crystal-Set Dress Watch",
      "Reversible Cashmere Scarf", "Silk Twill Square Scarf", "Premium Occasion Clutch", "Leather Work Satchel",
      "Padded Sports Bra & Leggings Set", "Longline Wool Coat", "Water-Resistant Trench Coat", "Hand-Finished Brooch Set",
    ],
    specs: ["XS–XXL inclusive sizing · breathable lining", "mulberry-silk blend · hand-finished seams", "full-grain leather · adjustable strap", "sterling silver · nickel-free setting", "wide-band support · 3-piece set", "handwoven Myanmar silk · artisan finish", "responsibly sourced wool · four-season weight", "reinforced sole · cushioned all-day footbed", "colorfast lining · gift-ready presentation", "extended strap · crossbody and shoulder wear"],
    stories: ["A premium silhouette is carefully tailored with a smooth lining and considered detailing for a polished occasion or everyday look.", "Thoughtful construction pairs refined materials with practical pockets, an adjustable fit, and durable hardware.", "This versatile statement piece is finished with responsibly selected materials and a protective, travel-ready presentation."],
    min: 320_000,
    max: 9_600_000,
    art: "fashion",
  },
  {
    category: "Women's Makeup & Cosmetics",
    count: 90,
    brands: ["MAC", "NARS", "Dior", "Charlotte Tilbury", "Fenty Beauty", "Estée Lauder", "Lancôme", "Rare Beauty", "YSL Beauty", "Shiseido"],
    types: [
      "Radiant Longwear Foundation Wardrobe", "Soft-Matte Foundation Shade Set", "Hydrating Concealer Studio Kit",
      "Full-Coverage Concealer Collection", "Silky Powder Blush Palette", "Cream Blush Color Wardrobe",
      "Precision Brow Pencil Set", "Waterproof Eyeliner Atelier Set", "Volumizing Mascara Duo Collection",
      "Luxury Satin Lipstick Wardrobe", "Velvet Matte Lipstick Set", "Longwear Lip Tint Color Collection",
      "Nourishing Lip Balm Gift Wardrobe", "Artist Eye Palette Collection", "Professional Brush & Complexion Set",
      "Color-Correcting Complexion Kit", "Illuminating Highlighter Palette", "Luxury Setting Powder Set",
      "Lip Liner & Lipstick Pairing Wardrobe", "Travel Makeup Artist Case", "Premium Bridal Makeup Edit",
      "Sensitive-Eye Mascara & Liner Set", "Multi-Finish Eyeshadow Palette", "Runway Red Lip Collection",
      "Neutral Nude Lip Wardrobe", "Pro-Artist Complexion Discovery Set",
    ],
    specs: ["12 shade profiles · neutral undertones", "24-hour wear · transfer-resistant finish", "8-piece set · warm and cool undertones", "SPF25 · buildable medium-to-full coverage", "12 refillable shades · satin and matte", "10 artist shades · cruelty-free formulas", "water-resistant · 6-shade precision set", "6 premium brushes · washable travel roll", "8 curated hues · satin, velvet, and gloss", "sensitive-skin tested · fragrance-free"],
    stories: ["An artist-curated premium color wardrobe balances inclusive undertones, blendable textures, and long-wear performance.", "This gift-ready professional edit features complementary shades in carefully selected satin, matte, and luminous finishes.", "A multi-piece luxury collection pairs buildable coverage with refined packaging and complexion-conscious formulas."],
    min: 310_000,
    max: 3_900_000,
    art: "beauty",
  },
  {
    category: "Skincare & Haircare",
    count: 90,
    brands: ["La Mer", "SK-II", "Drunk Elephant", "Kérastase", "Olaplex", "Shiseido", "Augustinus Bader", "Aesop", "Tatcha", "Oribe"],
    types: [
      "Gentle pH-Balanced Facial Cleanser Collection", "Luxury Makeup Remover Balm Duo", "Barrier Repair Moisturizer Wardrobe",
      "Ceramide Night Cream Set", "Broad-Spectrum SPF50 Sunscreen Trio", "Mineral Sunscreen Family Kit",
      "Hydrating Body Wash & Lotion Collection", "Premium Body Lotion Ritual Set", "Bond-Repair Shampoo & Conditioner Duo",
      "Color-Safe Shampoo Salon Set", "Deep Repair Conditioner Wardrobe", "Restorative Hair Mask Treatment Set",
      "Scalp Balance Shampoo Collection", "Leave-In Heat Protection Ritual", "Premium Hair Oil & Serum Pairing",
      "Overnight Facial Recovery Set", "Clinical Vitamin C Brightening System", "Hydrating Hyaluronic Acid Collection",
      "Retinol Night Renewal Wardrobe", "Sensitive-Skin Cleansing Ritual", "Luxury Fragrance-Free Body Care Set",
      "Keratin Smoothing Haircare Trio", "Curl Definition Haircare Collection", "Professional Salon Styling Set",
      "LED Facial Care & Serum System", "Travel Skincare Essentials Case",
    ],
    specs: ["4-piece regimen · fragrance-free · 50ml sizes", "broad-spectrum SPF50+ · water-resistant · 3-pack", "bond-building complex · salon 1L duo", "ceramide-rich · 12-week barrier care set", "color-safe · sulfate-free · 4-piece system", "dermatologist tested · sensitive-skin edit", "peptide treatment · 30-day professional regimen", "heat protection up to 230°C · 3-piece set", "scalp-balancing · 90-day salon supply", "refillable glass bottles · gift presentation"],
    stories: ["A complete, premium routine pairs carefully selected actives with a practical sequence for consistent daily care.", "Salon-sized formulas and a coordinated regimen are selected to support healthy-looking hair while protecting color and texture.", "This considered skin and hair ritual features dermatologist-conscious ingredients and refill-ready presentation."],
    min: 320_000,
    max: 6_800_000,
    art: "skincare",
  },
  {
    category: "Kitchen Appliances & Utensils",
    count: 120,
    brands: ["Ninja", "KitchenAid", "Cuisinart", "Tefal", "Le Creuset", "Zojirushi", "Breville", "Philips", "WMF", "Zwilling"],
    types: [
      "Tri-Ply Stainless Steel Cookware Set", "Forged Aluminum Frying Pan Trio", "Enameled Cast-Iron Dutch Oven",
      "Induction Pressure Cooker", "Smart Fuzzy-Logic Rice Cooker", "Commercial-Grade Rice Cooker",
      "Temperature-Control Electric Kettle", "Convection Microwave Oven", "Steam-Assisted Countertop Oven",
      "High-Speed Personal Blender System", "Professional 1200W Blender", "Dual-Zone Air Fryer",
      "Large-Capacity Smart Air Fryer", "Espresso Machine & Grinder Set", "Automatic Burr Coffee Grinder",
      "Digital Food Processor Suite", "Premium Stand Mixer Bundle", "Sous-Vide Precision Cooking System",
      "Four-Burner Induction Cooktop", "Built-In Dishwasher Collection", "Granite Composite Sink & Tap Set",
      "Acacia End-Grain Cutting Board Trio", "Japanese Chef Knife & Block Set", "Forged Stainless Knife Collection",
      "Fine-Porcelain Dinnerware Service", "Hand-Blown Crystal Tableware Set", "Vacuum-Sealed Food Storage Suite",
      "Borosilicate Meal Prep Container Collection", "Professional Stainless Mixing Bowl Set", "Copper-Core Sauté Pan Set",
      "Ceramic Nonstick Bakeware Collection", "Temperature-Control Wine Cabinet", "Smart Pressure Cooker & Steamer",
      "Countertop Ice Maker & Water Filter", "Restaurant-Grade Tableware Collection", "Premium Food Dehydrator System",
      "Multi-Function Bread Maker", "Automatic Pasta Maker & Roller Kit", "Precision Digital Kitchen Scale Set",
      "Commercial-Style Range Hood", "Premium Tabletop Induction Hob", "High-Capacity Planetary Mixer",
    ],
    specs: ["induction-ready · 5-layer bonded base · 8-piece set", "6.5L capacity · 12 smart programs · 1,000W", "stainless steel 18/10 · 7-piece professional set", "dual-zone control · 8L total capacity", "220–240V · precise 1°C temperature control", "BPA-free borosilicate · airtight 16-piece set", "Japanese steel · 15° edge · 7-piece block", "5-year motor warranty · 1200W variable speed", "12 place settings · scratch-resistant glaze", "food-safe silicone seals · stackable 20-piece set"],
    stories: ["Engineered for dependable daily service with heat-safe materials, precise controls, and a premium finish for modern kitchens.", "A chef-ready configuration combines balanced heat distribution, durable construction, and accessories chosen for versatile meal preparation.", "Thoughtful safety details and efficient performance make this an elevated, long-lasting addition to a busy household."],
    min: 310_000,
    max: 10_800_000,
    art: "kitchen",
  },
  {
    category: "Home Cleaning, Decor & Building Materials",
    count: 130,
    brands: ["Dyson", "Miele", "Bosch", "LG", "Samsung", "Panasonic", "Daikin", "IKEA", "Tempur", "Dulux"],
    types: [
      "Cordless HEPA Vacuum & Accessory System", "Robot Vacuum Mop Station", "Commercial Canister Vacuum Cleaner",
      "Front-Load Washing Machine", "Heat-Pump Washer-Dryer Tower", "Steam-Assist Smart Ironing Station",
      "Premium Garment Steamer & Press Set", "Silent DC Ceiling Fan Collection", "Smart Tower Air Purifier",
      "Whole-Room HEPA Air Purifier & Filter Set", "Hotel-Grade Down-Alternative Bedding Suite", "Temperature-Regulating Mattress System",
      "Premium Latex Pillow Pair", "Four-Season Goose-Down Blanket", "Handwoven Cotton Duvet & Sheet Set",
      "Blackout Curtain & Track System", "Motorized Linen Drapery Collection", "Handblown Glass Vase Collection",
      "Gallery-Grade Framed Landscape Triptych", "Silent Automatic Wall Clock", "Designer Floor Lamp & Dimmer",
      "Solid-Wood Entryway Console", "Upholstered Modular Sofa Section", "Hand-Knotted Wool Area Rug",
      "Premium Ceramic Table Lamp Pair", "All-Weather Teak Outdoor Lounge Set", "Smart Door Lock & Camera Bundle",
      "Home Energy Storage Backup System", "Whole-Home Water Filtration System", "Large-Format Porcelain Tile Pallet",
      "Standard-Grade Portland Cement Pallet", "Contractor-Grade Portland Cement Pallet", "Structural Reinforcement Steel Bundle",
      "Marine-Grade Hardwood Flooring Pack", "Exterior Waterproofing Membrane System", "High-Performance Double-Glazed Window Set",
      "Architectural Steel Roof Sheet Bundle", "Premium Modular Kitchen Cabinet Set", "Heavy-Duty Construction Mixer",
      "Variable-Speed Water Pressure Pump", "Commercial Water Heater & Circulation Set", "Workshop Dust Extraction System",
      "Solid Teak Dining Table Suite", "Premium Wall Art & Gallery Rail Set", "Designer Upholstered Bed Frame",
      "Air-Conditioned Dehumidifier Collection", "Smart Split Inverter Air Conditioner", "Natural-Stone Vanity & Basin Set",
      "Contractor-Grade Ceramic Adhesive Pallet", "High-Strength Structural Concrete Additive Set",
    ],
    specs: ["HEPA H13 filtration · 90-minute runtime", "9kg capacity · inverter motor · steam program", "energy efficient · 5-year motor warranty", "hotel-grade 800-fill warmth · king size", "UV-resistant finish · 12-piece installation kit", "water-resistant · tested for heavy contractor use", "A-grade teak · kiln dried · hand-finished joinery", "high-efficiency inverter · quiet 19dB operation", "double-sealed moisture barrier · 20-year system warranty", "2,500kg bulk pallet · quality-certified batch"],
    stories: ["Specified for dependable long-term residential or contractor use, with durable materials and clear installation considerations.", "This premium home collection pairs considered finishes with practical performance, serviceable components, and carefully packed delivery.", "A substantial, quality-focused system is selected for consistent performance under regular household or professional use."],
    min: 330_000,
    max: 58_000_000,
    art: "home",
    typeBrands: {
      "Standard-Grade Portland Cement Pallet": ["Max Myanmar Cement", "Apache Cement"],
      "Contractor-Grade Portland Cement Pallet": ["Apache Cement", "Max Myanmar Cement"],
      "Structural Reinforcement Steel Bundle": ["TATA Steel", "BlueScope"],
      "Architectural Steel Roof Sheet Bundle": ["BlueScope", "TATA Steel"],
      "Contractor-Grade Ceramic Adhesive Pallet": ["Sika", "Mapei"],
      "High-Strength Structural Concrete Additive Set": ["Sika", "Mapei"],
      "Marine-Grade Hardwood Flooring Pack": ["Myanmar Teak", "Evergreen Atelier"],
      "A-Grade teak": ["Myanmar Teak", "Evergreen Atelier"],
    },
    exactPrices: {
      "Standard-Grade Portland Cement Pallet": 480_000,
      "Contractor-Grade Portland Cement Pallet": 680_000,
    },
  },
];

const specFor = (config, index) => config.specs[index % config.specs.length];
const colorFor = (index) => palette[index % palette.length];
function brandFor(config, type, index) {
  if (config.typeBrands?.[type]) return config.typeBrands[type][index % config.typeBrands[type].length];
  if (config.category === "Men's Fashion & Grooming") {
    if (/Cleanser|Moisturizer|Sunscreen|Shav|Body Wash|Hair|Grooming/i.test(type)) {
      return ["Kiehl's", "Clinique", "Philips", "Bulldog", "Jack Black"][index % 5];
    }
    if (/Shoes|Boots|Sneakers|Sandals/i.test(type)) return ["Clarks", "Nike", "Adidas", "Timberland"][index % 4];
    return ["Evergreen Atelier", "Polo Ralph Lauren", "COS", "Brooks Brothers"][index % 4];
  }
  if (config.category === "Women's Fashion, Clothing & Lingerie") {
    if (/Lingerie|Bra|Underwear|Nightwear|Sleepwear|Robe|Intimate/i.test(type)) {
      return ["Aerie", "Calvin Klein", "La Perla", "Victoria's Secret"][index % 4];
    }
    if (/Pearl|Vermeil|Silver|Pendant|Watch|Bracelet|Brooch|Earring/i.test(type)) {
      return ["Swarovski", "Pandora", "Tiffany & Co.", "Mejuri"][index % 4];
    }
    if (/Bag|Wallet|Card Holder|Clutch|Satchel|Scarf/i.test(type)) {
      return ["Coach", "Kate Spade", "Charles & Keith", "Tory Burch"][index % 4];
    }
    if (/Heels|Loafers|Boots|Sandals/i.test(type)) return ["Clarks", "Tory Burch", "Charles & Keith", "Coach"][index % 4];
    return ["Evergreen Atelier", "COS", "Mango", "Reiss"][index % 4];
  }
  return config.brands[(index * 3 + Math.floor(index / config.brands.length)) % config.brands.length];
}
const escapeXml = (value) => value.replace(/[<>&'"]/g, (char) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
}[char]));

function artwork(product, color, index) {
  const backgrounds = ["#f3eee5", "#e7ece6", "#eee7ef", "#e7ebf1", "#f0e8dd", "#e5ecea"];
  const background = backgrounds[index % backgrounds.length];
  const accent = color[1];
  const seed = index + 1;
  const label = escapeXml(product.name.length > 46 ? `${product.name.slice(0, 43)}...` : product.name);
  const detail = escapeXml(product.category.toUpperCase());
  const glyph = product.art === "tech"
    ? `<rect x="292" y="145" width="256" height="386" rx="36" fill="#252a37"/><rect x="307" y="161" width="226" height="343" rx="24" fill="${accent}"/><circle cx="420" cy="516" r="8" fill="#e9e5dc"/><rect x="349" y="220" width="150" height="150" rx="75" fill="#ffffff" opacity=".23"/><path d="M369 345l44-62 29 37 24-25 35 52" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`
    : product.art === "fashion"
      ? `<path d="M343 171l77 39 77-39 76 70-54 67-35-29 26 212H329l26-212-35 29-54-67z" fill="${accent}" stroke="#fff" stroke-width="13" stroke-linejoin="round"/><path d="M384 188q36 55 72 0" fill="none" stroke="#fff" stroke-width="12"/><path d="M332 418h176" stroke="#fff" stroke-width="8" opacity=".7"/>`
      : product.art === "beauty"
        ? `<rect x="306" y="248" width="228" height="237" rx="40" fill="${accent}"/><rect x="333" y="203" width="174" height="69" rx="15" fill="#c3a36b"/><rect x="352" y="309" width="136" height="100" rx="14" fill="#fff" opacity=".78"/><circle cx="420" cy="359" r="34" fill="${accent}" opacity=".85"/><path d="M384 452h72" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`
        : product.art === "skincare"
          ? `<rect x="328" y="224" width="184" height="285" rx="42" fill="${accent}"/><rect x="371" y="182" width="98" height="61" rx="12" fill="#c3a36b"/><path d="M414 181v-35h72" fill="none" stroke="#252a37" stroke-width="13" stroke-linecap="round"/><rect x="350" y="302" width="140" height="105" rx="14" fill="#fff" opacity=".82"/><path d="M382 350h76m-65 22h54" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`
          : product.art === "kitchen"
            ? `<path d="M278 300h284l-24 203q-3 28-32 28H334q-29 0-32-28z" fill="${accent}"/><path d="M314 299q16-83 106-83t106 83" fill="#fff" opacity=".8" stroke="#252a37" stroke-width="12"/><path d="M276 333h-65v50h70m281-50h65v50h-70" fill="none" stroke="#252a37" stroke-width="18" stroke-linecap="round"/><path d="M357 402h126" stroke="#fff" stroke-width="12" stroke-linecap="round"/>`
            : `<path d="M285 453l135-184 135 184z" fill="${accent}"/><path d="M326 453V339h188v114" fill="#fff" opacity=".88"/><rect x="382" y="362" width="76" height="91" rx="8" fill="${accent}"/><path d="M240 485h360" stroke="#252a37" stroke-width="15" stroke-linecap="round"/><circle cx="540" cy="223" r="40" fill="#c3a36b" opacity=".8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1050" viewBox="0 0 840 1050"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#fff" stop-opacity=".72"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="#28352f" flood-opacity=".18"/></filter></defs><rect width="840" height="1050" fill="url(#bg)"/><circle cx="${130 + (seed * 37) % 580}" cy="${180 + (seed * 61) % 520}" r="${56 + (seed * 7) % 80}" fill="${accent}" opacity=".12"/><path d="M0 ${650 + (seed * 17) % 190}Q420 ${580 + (seed * 13) % 150} 840 ${670 + (seed * 11) % 120}V1050H0z" fill="${accent}" opacity=".08"/><g filter="url(#shadow)">${glyph}</g><rect x="64" y="695" width="712" height="1" fill="#252a37" opacity=".14"/><text x="68" y="755" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="${accent}">${detail}</text><text x="68" y="819" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#252a37">${label}</text><text x="68" y="875" font-family="Arial,sans-serif" font-size="19" fill="#59635d">${escapeXml(color[0])} · PREMIUM SERIES ${String(seed).padStart(3, "0")}</text><rect x="68" y="930" width="142" height="6" rx="3" fill="${accent}"/><circle cx="${730 - (seed * 19) % 90}" cy="${982 - (seed * 23) % 80}" r="13" fill="${accent}" opacity=".5"/></svg>`;
}

await mkdir(imageDirectory, { recursive: true });
await mkdir(path.dirname(outputPath), { recursive: true });

const products = [];
let catalogNumber = 0;
for (const config of catalog) {
  for (let index = 0; index < config.count; index += 1) {
    catalogNumber += 1;
    const color = colorFor(index + catalogNumber);
    const type = config.types[(index * 7 + Math.floor(index / config.types.length)) % config.types.length];
    const brand = brandFor(config, type, index + Math.floor(index / config.brands.length));
    const spec = specFor(config, index + Math.floor(index / 2));
    const model = `E${String(catalogNumber).padStart(3, "0")}`;
    const variant = `${color[0]} · ${spec}`;
    const name = `${brand} ${type} — ${color[0]} ${model}`;
    const spread = config.max - config.min;
    const price = config.exactPrices?.[type] ??
      Math.round((config.min + ((index * 7919 + catalogNumber * 104729) % spread)) / 1000) * 1000;
    const usd = (price / 4500).toFixed(2);
    const description = `${config.stories[(index + catalogNumber) % config.stories.length]} ${type} in ${color[0].toLowerCase()}, model ${model}, is supplied as the ${spec.toLowerCase()} configuration. Carefully checked product specifications and premium packing are included for a dependable retail experience.`;
    const image = `/catalog/catalog-${String(catalogNumber).padStart(3, "0")}.svg`;
    const record = {
      id: `catalog-${String(catalogNumber).padStart(3, "0")}`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(catalogNumber).padStart(3, "0")}`,
      name,
      category: config.category,
      price,
      currency: "MMK",
      rating: Number((4.2 + ((catalogNumber * 7) % 8) / 10).toFixed(1)),
      reviewCount: 12 + ((catalogNumber * 37) % 489),
      badge: catalogNumber % 9 === 0 ? "Bestseller" : catalogNumber % 7 === 0 ? "New Arrival" : "",
      description,
      details: [
        `Model: ${model} · ${brand}`,
        `Color / variant: ${variant}`,
        `Specifications: ${spec}`,
        `Retail price: MMK ${price.toLocaleString("en-US")} (~ $${usd} USD)`,
        "Premium selection · protected packaging · seller listing has no upfront inventory charge.",
      ],
      images: [image],
    };
    products.push(record);
    await writeFile(path.join(root, "public", image.slice(1)), artwork({ ...config, name }, color, catalogNumber), "utf8");
  }
}

await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
console.log(`Generated ${products.length} unique products and bespoke cover images.`);
