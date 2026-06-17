/**
 * Database Seeder — National Industries
 *
 * Run:  npm run seed
 *
 * Seeds:
 *  1. Admin account
 *  2. Categories
 *  3. Sample items (one per category)
 */

import '../load-env';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { connectionSource } from '../config/databaseConfig';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ADMIN = {
  email: 'watercoolern@gmail.com',
  password: 'CoolerAdmin@2026',
  adminId: 'ADM-001',
  role: 'admin',
};

const CATEGORIES = [
  'Electric Water Coolers',
  'Air Coolers',
  'Geysers',
  'Water Dispensers',
  'Fans',
];

// Image URLs — replace with real S3 URLs after uploading product photos
const PLACEHOLDER = 'https://placehold.co/600x600?text=Product+Image';

const ITEMS = [
  {
    category: 'Electric Water Coolers',
    name: 'National 35 Gallon Electric Water Cooler',
    price: 28000,
    discountedPrice: 25500,
    image: PLACEHOLDER,
    description:
      'National 35 gallon stainless steel electric water cooler. Ideal for offices, schools, and large households. Energy-efficient cooling with long-lasting durability. Available in single and double tap options.',
  },
  {
    category: 'Electric Water Coolers',
    name: 'National 65 Gallon Electric Water Cooler',
    price: 38000,
    discountedPrice: 34500,
    image: PLACEHOLDER,
    description:
      'Heavy-duty 65 gallon electric water cooler built for industrial and commercial use. Fast cooling, corrosion-resistant tank, and easy-to-clean design. Perfect for factories and large offices.',
  },
  {
    category: 'Electric Water Coolers',
    name: 'National 90 Gallon Electric Water Cooler',
    price: 52000,
    discountedPrice: null,
    image: PLACEHOLDER,
    description:
      'Premium 90 gallon electric water cooler — our largest capacity model. Designed for hospitals, large factories, and institutions. Stainless steel interior, powerful compressor, low electricity consumption.',
  },
  {
    category: 'Air Coolers',
    name: 'National Room Air Cooler (Inverter)',
    price: 22000,
    discountedPrice: 19999,
    image: PLACEHOLDER,
    description:
      'Energy-saving inverter air cooler for medium-sized rooms. Three-speed fan, honeycomb cooling pads, and large water tank. Cools effectively even in dry heat. Low power consumption.',
  },
  {
    category: 'Air Coolers',
    name: 'National Desert Air Cooler',
    price: 18500,
    discountedPrice: null,
    image: PLACEHOLDER,
    description:
      'High-performance desert air cooler with extra-large water tank. Ideal for open spaces, warehouses, and outdoor areas. Powerful fan motor and thick evaporative pads for maximum cooling.',
  },
  {
    category: 'Geysers',
    name: 'National 30 Litre Electric Geyser',
    price: 14000,
    discountedPrice: 12500,
    image: PLACEHOLDER,
    description:
      'Durable 30-litre electric geyser with glass-lined inner tank and magnesium anode rod for corrosion protection. Adjustable thermostat, safety valve, and energy-efficient insulation. Suitable for families of 3–5.',
  },
  {
    category: 'Geysers',
    name: 'National 50 Litre Electric Geyser',
    price: 19500,
    discountedPrice: null,
    image: PLACEHOLDER,
    description:
      'Large 50-litre electric geyser for big households. Anti-corrosion inner tank, auto cut-off safety feature, and foam insulation for heat retention. Easy wall-mount installation.',
  },
  {
    category: 'Water Dispensers',
    name: 'National Top-Load Water Dispenser',
    price: 11000,
    discountedPrice: 9800,
    image: PLACEHOLDER,
    description:
      'Convenient top-load water dispenser with hot and cold water taps. Fits standard 19-litre water bottles. Child-safety lock on hot tap. Stainless steel drip tray. Compact design for home or office.',
  },
  {
    category: 'Water Dispensers',
    name: 'National Bottom-Load Water Dispenser',
    price: 16000,
    discountedPrice: null,
    image: PLACEHOLDER,
    description:
      'Elegant bottom-load water dispenser — no heavy lifting required. Electric pump draws water from the bottle placed at the bottom. Hot, cold, and normal water options. LED display, auto-clean function.',
  },
  {
    category: 'Fans',
    name: 'National Pedestal Fan (3-Speed)',
    price: 6500,
    discountedPrice: 5800,
    image: PLACEHOLDER,
    description:
      'Powerful 18-inch pedestal fan with 3-speed settings and 360-degree oscillation. Adjustable height, easy-to-clean grille, and silent motor. Perfect for bedrooms, living rooms, and small offices.',
  },
  {
    category: 'Fans',
    name: 'National Ceiling Fan (Inverter)',
    price: 9500,
    discountedPrice: null,
    image: PLACEHOLDER,
    description:
      'High-efficiency inverter ceiling fan with brushless DC motor. Saves up to 70% electricity compared to conventional fans. 5 blades, remote control, 7-speed settings, and reversible airflow for winter mode.',
  },
];

// ─── Seeder Logic ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  National Industries — Database Seeder\n');

  const ds: DataSource = connectionSource;
  if (!ds.isInitialized) {
    await ds.initialize();
    console.log('✅  Database connected');
  }

  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── 1. Admin ──────────────────────────────────────────────────────────────
    console.log('\n── Seeding Admin ──');
    const existingAdmin = await queryRunner.query(
      `SELECT id FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [ADMIN.email],
    );

    if (existingAdmin.length > 0) {
      console.log(`   ⚠️  Admin already exists (${ADMIN.email}) — skipped`);
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
      await queryRunner.query(
        `INSERT INTO admins (email, password, "adminId", role)
         VALUES ($1, $2, $3, $4)`,
        [ADMIN.email, hashedPassword, ADMIN.adminId, ADMIN.role],
      );
      console.log(`   ✅  Admin seeded: ${ADMIN.email} / ${ADMIN.password}`);
    }

    // ── 2. Categories ─────────────────────────────────────────────────────────
    console.log('\n── Seeding Categories ──');
    const categoryIds: Record<string, number> = {};

    for (const name of CATEGORIES) {
      const existing = await queryRunner.query(
        `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [name],
      );
      if (existing.length > 0) {
        categoryIds[name] = existing[0].id;
        console.log(`   ⚠️  "${name}" already exists (id: ${existing[0].id}) — skipped`);
      } else {
        const result = await queryRunner.query(
          `INSERT INTO categories (name) VALUES ($1) RETURNING id`,
          [name],
        );
        categoryIds[name] = result[0].id;
        console.log(`   ✅  "${name}" created (id: ${result[0].id})`);
      }
    }

    // ── 3. Items ──────────────────────────────────────────────────────────────
    console.log('\n── Seeding Items ──');

    for (const item of ITEMS) {
      const existing = await queryRunner.query(
        `SELECT id FROM items WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [item.name],
      );

      if (existing.length > 0) {
        console.log(`   ⚠️  "${item.name}" already exists — skipped`);
        continue;
      }

      const catId = categoryIds[item.category] ?? null;
      const result = await queryRunner.query(
        `INSERT INTO items (name, price, "discountedPrice", image, description, "categoryId")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          item.name,
          item.price,
          item.discountedPrice ?? null,
          item.image,
          item.description,
          catId,
        ],
      );

      // Also insert into item_images table so gallery works
      await queryRunner.query(
        `INSERT INTO item_images (url, "sortOrder", "itemId") VALUES ($1, 0, $2)`,
        [item.image, result[0].id],
      );

      console.log(`   ✅  "${item.name}" (PKR ${item.price.toLocaleString()})`);
    }

    await queryRunner.commitTransaction();

    console.log('\n──────────────────────────────────────────');
    console.log('🎉  Seeding complete!');
    console.log('──────────────────────────────────────────');
    console.log(`   Admin    →  ${ADMIN.email} / ${ADMIN.password}`);
    console.log(`   Categories →  ${CATEGORIES.length} total`);
    console.log(`   Items      →  ${ITEMS.length} total`);
    console.log('──────────────────────────────────────────\n');
    console.log(
      '💡  Tip: Replace PLACEHOLDER image URLs with real S3 URLs after uploading product photos via admin panel.\n',
    );
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('\n❌  Seeding failed — rolled back\n', err);
    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

seed();
