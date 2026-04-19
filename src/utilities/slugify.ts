export function slugifyTitle(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const str = String(value).trim()
  if (!str) return undefined

  const slug = str
    .normalize('NFD') // Tách dấu
    .replace(/\p{M}/gu, '') // Xóa dấu
    .replace(/[đĐ]/g, 'd') // Xử lý riêng chữ đ
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Thay thế ký tự không hợp lệ bằng -
    .replace(/-+/g, '-') // Nén nhiều dấu gạch ngang liên tiếp thành một
    .replace(/^-+|-+$/g, '') // Xóa dấu gạch ngang ở đầu và cuối

  return slug.length > 0 ? slug : undefined
}
