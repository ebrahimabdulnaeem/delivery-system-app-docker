import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * التحقق من وجود باركود في قاعدة البيانات
 * GET /api/orders/check-barcode?barcode=123456789
 */
export async function GET(req: NextRequest) {
  try {
    // الحصول على الباركود من استعلام URL
    const url = new URL(req.url);
    const barcode = url.searchParams.get('barcode');

    // التحقق من توفر الباركود
    if (!barcode) {
      return NextResponse.json(
        { error: 'يجب توفير الباركود' },
        { status: 400 }
      );
    }

    // البحث عن الباركود في قاعدة البيانات
    const existingOrder = await prisma.orders.findUnique({
      where: { barcode },
      select: { id: true }, // نحتاج فقط معرف الطلب للتحقق من وجوده
    });

    // إرجاع النتيجة
    return NextResponse.json({ exists: !!existingOrder });
  } catch (error: unknown) {
    console.error('خطأ في التحقق من الباركود:', error);
    
    // معالجة الخطأ مع نوع أكثر أمانًا
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من الباركود', details: errorMessage },
      { status: 500 }
    );
  }
} 