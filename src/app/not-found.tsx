import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="mb-4 text-2xl">الصفحة غير موجودة</h2>
      <p className="mb-8 text-center text-gray-600">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
      >
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
} 