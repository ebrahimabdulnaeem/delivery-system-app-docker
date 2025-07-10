import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import JSZip from 'jszip';

// دالة لتحويل بيانات الجدول إلى تنسيق CSV
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // استخراج أسماء الأعمدة من الكائن الأول
  const headers = Object.keys(data[0]);
  
  // إنشاء سطر العناوين
  const headerRow = headers.join(',');
  
  // إنشاء سطور البيانات
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // معالجة القيم الخاصة
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        // تحويل الكائنات إلى نص JSON
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else if (typeof value === 'string') {
        // إضافة علامات اقتباس للنصوص وإلغاء علامات الاقتباس الموجودة
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // دمج الصفوف في نص واحد
  return [headerRow, ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    // @ts-expect-error - Workaround for authOptions type issue
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ message: "ليس لديك صلاحية للقيام بهذه العملية" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ message: "يجب تحديد نوع البيانات" }, { status: 400 });
    }

    if (type === 'all') {
      const zip = new JSZip();
      const dataTypes = ['orders', 'drivers', 'cities', 'users'];

      const promises = dataTypes.map(async (dataType) => {
        let data: Record<string, unknown>[] = [];
        switch (dataType) {
          case 'orders':
            const orders = await prisma.orders.findMany({ orderBy: { created_at: 'desc' } });
            data = orders.map(o => ({ ...o, order_date: o.order_date?.toISOString().split('T')[0], created_at: o.created_at.toISOString(), updated_at: o.updated_at.toISOString() }));
            break;
          case 'drivers':
            const drivers = await prisma.drivers.findMany({ orderBy: { created_at: 'desc' } });
            data = drivers.map(d => ({ ...d, assigned_areas: JSON.stringify(d.assigned_areas), created_at: d.created_at.toISOString(), updated_at: d.updated_at.toISOString() }));
            break;
          case 'cities':
            const cities = await prisma.cities.findMany({ orderBy: { name: 'asc' } });
            data = cities.map(c => ({ ...c, created_at: c.created_at.toISOString(), updated_at: c.updated_at.toISOString() }));
            break;
          case 'users':
            const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
            data = users.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() }));
            break;
        }
        const csv = convertToCSV(data);
        zip.file(`${dataType}.csv`, csv);
      });

      await Promise.all(promises);

      const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

      return new Response(zipContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="all_data_export_${new Date().toISOString().split('T')[0]}.zip"`,
        },
      });
    } else {
      let data: Record<string, unknown>[] = [];
      switch (type) {
        case 'orders':
          const orders = await prisma.orders.findMany({ orderBy: { created_at: 'desc' } });
          data = orders.map(o => ({ ...o, order_date: o.order_date?.toISOString().split('T')[0], created_at: o.created_at.toISOString(), updated_at: o.updated_at.toISOString() }));
          break;
        case 'drivers':
          const drivers = await prisma.drivers.findMany({ orderBy: { created_at: 'desc' } });
          data = drivers.map(d => ({ ...d, assigned_areas: JSON.stringify(d.assigned_areas), created_at: d.created_at.toISOString(), updated_at: d.updated_at.toISOString() }));
          break;
        case 'cities':
          data = await prisma.cities.findMany({ orderBy: { name: 'asc' } });
          break;
        case 'users':
          data = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
          break;
        default:
          return NextResponse.json({ message: 'نوع البيانات غير صالح' }, { status: 400 });
      }

      const csv = convertToCSV(data);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('خطأ في تصدير البيانات:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع في الخادم' }, { status: 500 });
  }
}