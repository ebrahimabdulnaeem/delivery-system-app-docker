import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { parse } from "csv-parse/sync";
import { InputJsonValue } from "@prisma/client/runtime/library";

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
    
    // قراءة البيانات من ملف CSV
    const fileContent = await file.text();
    // تحليل بيانات CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // إعداد متغيرات لتتبع نتائج الاستيراد
    const result = {
      processed: records.length,
      added: 0,
      skipped: 0,
      failed: 0
    };
    
    // معالجة البيانات حسب نوعها
    switch (type) {
      case "orders":
        // استيراد بيانات الطلبات
        for (const record of records) {
          try {
            // التحقق من البيانات الإلزامية
            if (!record.recipient_name || !record.recipient_phone1 || 
                !record.recipient_city || !record.recipient_address || 
                !record.cod_amount || !record.status) {
              result.failed++;
              continue;
            }
            
            // التحقق من عدم وجود طلب بنفس الباركود
            if (record.barcode) {
              const existingOrder = await prisma.orders.findUnique({
                where: { barcode: record.barcode }
              });
              
              if (existingOrder) {
                result.skipped++;
                continue;
              }
            } else {
              // إنشاء باركود جديد إذا لم يكن موجودًا
              record.barcode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
            }
            
            // معالجة مبلغ الدفع عند الاستلام (cod_amount)
            let codAmount = 0;
            try {
              // إزالة علامات الاقتباس إذا كانت موجودة
              const cleanedAmount = record.cod_amount.toString().replace(/['"]+/g, '');
              codAmount = parseFloat(cleanedAmount);
              
              // التحقق من صحة الرقم
              if (isNaN(codAmount)) {
                console.error("قيمة غير صالحة لـ cod_amount:", record.cod_amount);
                codAmount = 0;
              }
            } catch (e) {
              console.error("خطأ في تحويل cod_amount:", e);
              codAmount = 0;
            }
            
            // التحقق من وجود معرف السائق
            let driverId: string | null = null;
            if (record.driver_id) {
              // إذا كان معرف السائق عبارة عن اسم، ابحث عن السائق بالاسم
              if (!/^[0-9a-f\-]+$/i.test(record.driver_id)) {
                const driver = await prisma.drivers.findFirst({
                  where: { driver_name: record.driver_id }
                });
                
                if (driver) {
                  driverId = driver.id;
                }
              } else {
                // استخدم المعرف كما هو إذا كان بتنسيق UUID
                driverId = record.driver_id;
              }
            }
            
            // إضافة الطلب الجديد
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
                created_by: user.id,
                order_date: record.order_date ? new Date(record.order_date) : new Date(),
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            
            result.added++;
          } catch (error) {
            console.error("خطأ في استيراد طلب:", error, record);
            result.failed++;
          }
        }
        break;
        
      case "drivers":
        // استيراد بيانات السائقين
        for (const record of records) {
          try {
            // التحقق من البيانات الإلزامية
            if (!record.driver_name || !record.driver_phone) {
              result.failed++;
              continue;
            }
            
            // التحقق من عدم وجود سائق بنفس رقم الهاتف
            const existingDriver = await prisma.drivers.findFirst({
              where: { driver_phone: record.driver_phone }
            });
            
            if (existingDriver) {
              result.skipped++;
              continue;
            }
            
            // معالجة المناطق المخصصة (يمكن أن تكون سلسلة نصية مفصولة بفواصل)
            let assignedAreas: InputJsonValue | undefined = undefined;
            if (record.assigned_areas) {
              try {
                // محاولة تحليل JSON إذا كان متاحا
                const parsedAreas = JSON.parse(record.assigned_areas);
                assignedAreas = Array.isArray(parsedAreas) ? parsedAreas : [parsedAreas];
              } catch {
                // إذا لم يكن JSON، نفترض أنها سلسلة نصية مفصولة بفواصل
                assignedAreas = record.assigned_areas.split(',').map(area => area.trim());
              }
            }
            
            // إضافة السائق الجديد
            await prisma.drivers.create({
              data: {
                id: uuidv4(),
                driver_name: record.driver_name,
                driver_phone: record.driver_phone,
                driver_id_number: record.driver_id_number || null,
                assigned_areas: assignedAreas,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            
            result.added++;
          } catch (error) {
            console.error("خطأ في استيراد سائق:", error, record);
            result.failed++;
          }
        }
        break;
        
      case "cities":
        // استيراد بيانات المدن
        for (const record of records) {
          try {
            // التحقق من البيانات الإلزامية
            if (!record.name) {
              result.failed++;
              continue;
            }
            
            // التحقق من عدم وجود مدينة بنفس الاسم
            const existingCity = await prisma.cities.findFirst({
              where: { 
                name: { 
                  equals: record.name,
                  mode: 'insensitive'
                }
              }
            });
            
            if (existingCity) {
              result.skipped++;
              continue;
            }
            
            // إضافة المدينة الجديدة
            await prisma.cities.create({
              data: {
                id: uuidv4(),
                name: record.name,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            
            result.added++;
          } catch (error) {
            console.error("خطأ في استيراد مدينة:", error, record);
            result.failed++;
          }
        }
        break;
        
      case "users":
        // استيراد بيانات المستخدمين
        for (const record of records) {
          try {
            // التحقق من البيانات الإلزامية
            if (!record.username || !record.email || !record.password || !record.role) {
              result.failed++;
              continue;
            }
            
            // التحقق من صحة دور المستخدم
            if (record.role !== "admin" && record.role !== "user") {
              result.failed++;
              continue;
            }
            
            // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
            const existingUser = await prisma.user.findUnique({
              where: { email: record.email }
            });
            
            if (existingUser) {
              result.skipped++;
              continue;
            }
            
            // إضافة المستخدم الجديد
            await prisma.user.create({
              data: {
                id: uuidv4(),
                username: record.username,
                email: record.email,
                password: record.password, // يجب تشفير كلمة المرور في الواقع
                role: record.role,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            result.added++;
          } catch (error) {
            console.error("خطأ في استيراد مستخدم:", error, record);
            result.failed++;
          }
        }
        break;
        
      default:
        return NextResponse.json(
          { message: "نوع البيانات غير صالح" },
          { status: 400 }
        );
    }
    
    // إرجاع نتائج الاستيراد
    return NextResponse.json(
      { 
        success: true, 
        message: "تم استيراد البيانات بنجاح",
        ...result
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