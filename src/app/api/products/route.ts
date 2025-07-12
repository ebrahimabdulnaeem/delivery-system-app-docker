import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Zod schema for product validation
const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون رقمًا صحيحًا موجبًا'),
  price: z.coerce.number().min(0, 'السعر يجب أن يكون رقمًا موجبًا'),
  unit: z.enum(['PIECE', 'KG', 'CARTON']),
  variants: z.any().optional(), // Can be refined further if variants structure is known
  barcode: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, quantity, price, unit, variants, barcode, expiry_date } = validation.data;

    // Generate a barcode if not provided
    const finalBarcode = barcode || `prod-${uuidv4()}`;

    const newProduct = await prisma.product.create({
      data: {
        id: uuidv4(),
        name,
        quantity,
        price,
        unit,
        variants: variants || {},
        barcode: finalBarcode,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ message: 'فشل في إنشاء المنتج' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ message: 'فشل في جلب المنتجات' }, { status: 500 });
  }
}
