import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { parse } from "csv-parse/sync";
import { InputJsonValue } from "@prisma/client/runtime/library";
import JSZip from 'jszip';

// معالجة طلبات استيراد البيانات
export async function POST(request: NextRequest) {
  try {
    // الحصول على جلسة المستخدم الحالي
    // @ts-expect-error - تجاوز التحقق من النوع للحصول على الجلسة
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }
    
    // التحقق من دور المستخدم (للمدراء فقط)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية للقيام بهذه العملية" },
        { status: 403 }
      );
    }
    
    // الحصول على الملف من الطلب
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    
    if (!file || !type) {
      return NextResponse.json(
        { message: "يجب تحديد الملف ونوع البيانات" },
        { status: 400 }
      );
    }
    
    const totalResult = {
      processed: 0,
      added: 0,
      skipped: 0,
      failed: 0,
    };

    if (type === 'all') {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const fileNames = Object.keys(zip.files);

      for (const fileName of fileNames) {
        const fileInZip = zip.files[fileName];
        if (fileInZip.dir || !fileName.endsWith('.csv')) continue;

        const fileContent = await fileInZip.async('string');
        const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
        totalResult.processed += records.length;

        const dataType = fileName.replace('.csv', '');
        let result = { added: 0, skipped: 0, failed: 0 };

        switch (dataType) {
          case 'orders':
            result = await importOrders(records, user.id);
            break;
          case 'drivers':
            result = await importDrivers(records);
            break;
          case 'cities':
            result = await importCities(records);
            break;
          case 'users':
            result = await importUsers(records);
            break;
        }
        totalResult.added += result.added;
        totalResult.skipped += result.skipped;
        totalResult.failed += result.failed;
      }
    } else {
      const fileContent = await file.text();
      const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
      totalResult.processed = records.length;
      let result = { added: 0, skipped: 0, failed: 0 };

      switch (type) {
        case 'orders':
          result = await importOrders(records, user.id);
          break;
        case 'drivers':
          result = await importDrivers(records);
          break;
        case 'cities':
          result = await importCities(records);
          break;
        case 'users':
          result = await importUsers(records);
          break;
        default:
          return NextResponse.json({ message: 'نوع البيانات غير صالح' }, { status: 400 });
      }
      totalResult.added = result.added;
      totalResult.skipped = result.skipped;
      totalResult.failed = result.failed;
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: "تم استيراد البيانات بنجاح",
        ...totalResult
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("خطأ في استيراد البيانات:", error);
    
    return NextResponse.json(
      { 
        message: "حدث خطأ أثناء استيراد البيانات", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// الدوال المساعدة للاستيراد

async function importOrders(records: { [key: string]: string }[], userId: string) {
  const result = { added: 0, skipped: 0, failed: 0 };
  for (const record of records) {
    try {
      if (!record.recipient_name || !record.recipient_phone1 || !record.recipient_city || !record.recipient_address || !record.cod_amount || !record.status) {
        result.failed++;
        continue;
      }
      if (record.barcode) {
        const existingOrder = await prisma.orders.findUnique({ where: { barcode: record.barcode } });
        if (existingOrder) {
          result.skipped++;
          continue;
        }
      } else {
        record.barcode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }
      const codAmount = parseFloat(record.cod_amount.toString().replace(/['"]+/g, '')) || 0;
      let driverId: string | null = null;
      if (record.driver_id) {
        if (!/^[0-9a-f\-]+$/i.test(record.driver_id)) {
          const driver = await prisma.drivers.findFirst({ where: { driver_name: record.driver_id } });
          if (driver) driverId = driver.id;
        } else {
          driverId = record.driver_id;
        }
      }
      await prisma.orders.create({
        data: {
          id: uuidv4(),
          barcode: record.barcode,
          recipient_name: record.recipient_name,
          recipient_phone1: record.recipient_phone1,
          recipient_phone2: record.recipient_phone2 || null,
          recipient_city: record.recipient_city,
          recipient_address: record.recipient_address,
          cod_amount: codAmount,
          status: record.status,
          number_of_pieces: record.number_of_pieces ? parseInt(record.number_of_pieces) : 1,
          order_description: record.order_description || null,
          special_instructions: record.special_instructions || null,
          sender_reference: record.sender_reference || null,
          driver_id: driverId,
          created_by: userId,
          order_date: record.order_date ? new Date(record.order_date) : new Date(),
        },
      });
      result.added++;
    } catch (error) {
      console.error("خطأ في استيراد طلب:", error, record);
      result.failed++;
    }
  }
  return result;
}

async function importDrivers(records: { [key: string]: string }[]) {
  const result = { added: 0, skipped: 0, failed: 0 };
  for (const record of records) {
    try {
      if (!record.driver_name || !record.driver_phone) {
        result.failed++;
        continue;
      }
      const existingDriver = await prisma.drivers.findFirst({ where: { driver_phone: record.driver_phone } });
      if (existingDriver) {
        result.skipped++;
        continue;
      }
      let assignedAreas: InputJsonValue | undefined = undefined;
      if (record.assigned_areas) {
        try {
          const parsedAreas = JSON.parse(record.assigned_areas);
          assignedAreas = Array.isArray(parsedAreas) ? parsedAreas : [parsedAreas];
        } catch {
          assignedAreas = record.assigned_areas.split(',').map((area: string) => area.trim());
        }
      }
      await prisma.drivers.create({
        data: {
          id: uuidv4(),
          driver_name: record.driver_name,
          driver_phone: record.driver_phone,
          driver_id_number: record.driver_id_number || null,
          assigned_areas: assignedAreas,
        },
      });
      result.added++;
    } catch (error) {
      console.error("خطأ في استيراد سائق:", error, record);
      result.failed++;
    }
  }
  return result;
}

async function importCities(records: { [key: string]: string }[]) {
  const result = { added: 0, skipped: 0, failed: 0 };
  for (const record of records) {
    try {
      if (!record.name) {
        result.failed++;
        continue;
      }
      const existingCity = await prisma.cities.findFirst({ where: { name: { equals: record.name, mode: 'insensitive' } } });
      if (existingCity) {
        result.skipped++;
        continue;
      }
      await prisma.cities.create({
        data: {
          id: uuidv4(),
          name: record.name,
        },
      });
      result.added++;
    } catch (error) {
      console.error("خطأ في استيراد مدينة:", error, record);
      result.failed++;
    }
  }
  return result;
}

async function importUsers(records: { [key: string]: string }[]) {
  const result = { added: 0, skipped: 0, failed: 0 };
  for (const record of records) {
    try {
      if (!record.username || !record.email || !record.password || !record.role) {
        result.failed++;
        continue;
      }
      if (record.role !== 'admin' && record.role !== 'user') {
        result.failed++;
        continue;
      }
      const existingUser = await prisma.user.findUnique({ where: { email: record.email } });
      if (existingUser) {
        result.skipped++;
        continue;
      }
      await prisma.user.create({
        data: {
          id: uuidv4(),
          username: record.username,
          email: record.email,
          password: record.password, // Note: Password should be hashed in a real app
          role: record.role,
        },
      });
      result.added++;
    } catch (error) {
      console.error("خطأ في استيراد مستخدم:", error, record);
      result.failed++;
    }
  }
  return result;
} 