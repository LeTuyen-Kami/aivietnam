import type { Listing, ListingCategory, Media, User } from '@/payload-types'
import type { File, Payload, PayloadRequest } from 'payload'

import { slugifyTitle } from '@/utilities/slugify'

type ListingSeedInput = {
  payload: Payload
  req: PayloadRequest
  author: User
  categoryDocs?: ListingCategory[]
  mediaDocs?: Media[]
}

type ListingSeedDef = {
  title: string
  listingType: 'job-seeking' | 'job-offer' | 'service' | 'other'
  priceLabel: string
  summary: string
  description: string
  contactPhone: string
  city: string
  district?: string
  address?: string
  packageName?: string
  categories: string[]
  contactName: string
  supportPhone?: string
  statusLabel?: 'available' | 'hidden' | 'closed'
  zaloUrl?: string
}

const lexicalParagraph = (text: string): NonNullable<Listing['description']> =>
  ({
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text,
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }) as NonNullable<Listing['description']>

type ListingCategorySeedDef = {
  title: string
  picsumSeed: string
}

export const LISTING_CATEGORY_SEED_DEFS: ListingCategorySeedDef[] = [
  { title: 'Sản phẩm AI', picsumSeed: 'listing-category-san-pham-ai' },
  { title: 'Dịch vụ AI', picsumSeed: 'listing-category-dich-vu-ai' },
  { title: 'Việc làm & Tuyển dụng AI', picsumSeed: 'listing-category-viec-lam-tuyen-dung-ai' },
  { title: 'Khóa học và tài liệu AI', picsumSeed: 'listing-category-khoa-hoc-tai-lieu-ai' },
  { title: 'Dữ liệu và mô hình AI', picsumSeed: 'listing-category-du-lieu-mo-hinh-ai' },
  { title: 'Phần cứng hỗ trợ AI', picsumSeed: 'listing-category-phan-cung-ho-tro-ai' },
  { title: 'Ứng dụng AI trong ngành', picsumSeed: 'listing-category-ung-dung-ai-trong-nganh' },
  { title: 'Sản phẩm AI cho cá nhân', picsumSeed: 'listing-category-san-pham-ai-ca-nhan' },
  { title: 'Sự kiện và hội thảo AI', picsumSeed: 'listing-category-su-kien-hoi-thao-ai' },
  { title: 'Hợp tác và đầu tư AI', picsumSeed: 'listing-category-hop-tac-dau-tu-ai' },
]

const LISTING_SEED_DATA: ListingSeedDef[] = [
  {
    title: 'Tuyển AI Engineer xây chatbot RAG cho doanh nghiệp',
    listingType: 'job-offer',
    priceLabel: '30 - 45 triệu/tháng',
    summary: 'Startup SaaS cần AI Engineer có kinh nghiệm LLM, RAG, eval và triển khai production.',
    description:
      'Công việc tập trung vào xây dựng hệ thống hỏi đáp nội bộ dùng RAG, tối ưu prompt, đánh giá chất lượng phản hồi và tích hợp với workflow CSKH. Ưu tiên ứng viên đã làm với OpenAI API, vector database, observability và deployment trên cloud.',
    contactPhone: '0901234567',
    city: 'TP Hồ Chí Minh',
    district: 'Quận 1',
    address: 'Nguyễn Huệ, Quận 1, TP Hồ Chí Minh',
    packageName: 'Tin nổi bật 7 ngày',
    categories: ['Việc làm & Tuyển dụng AI', 'Dữ liệu và mô hình AI'],
    contactName: 'Nguyễn Minh Anh',
    supportPhone: '02873008899',
    statusLabel: 'available',
    zaloUrl: 'https://zalo.me/0901234567',
  },
  {
    title: 'Data Analyst freelance làm dashboard marketing bằng GA4 và BigQuery',
    listingType: 'job-offer',
    priceLabel: '800.000 VNĐ/buổi',
    summary: 'Nhận phân tích funnel, attribution, dashboard chỉ số chiến dịch cho team growth.',
    description:
      'Cần freelancer theo dự án 2 tháng để chuẩn hóa tracking, gom dữ liệu quảng cáo và dựng dashboard phân tích hiệu quả chiến dịch. Có thể làm remote, yêu cầu giao tiếp rõ ràng và bàn giao tài liệu.',
    contactPhone: '0912345678',
    city: 'TP Hồ Chí Minh',
    district: 'Quận 3',
    address: 'Võ Văn Tần, Quận 3, TP Hồ Chí Minh',
    packageName: 'Tin tiêu chuẩn',
    categories: ['Dịch vụ AI', 'Dữ liệu và mô hình AI'],
    contactName: 'Trần Khánh Linh',
    supportPhone: '02836225566',
    statusLabel: 'available',
  },
  {
    title: 'Ứng viên ML Engineer tìm cơ hội full-time về Computer Vision',
    listingType: 'job-seeking',
    priceLabel: 'Mong muốn từ 28 triệu/tháng',
    summary: '3 năm kinh nghiệm CV, OCR, tracking, deploy model tối ưu inference cho edge devices.',
    description:
      'Đã triển khai các bài toán nhận diện sản phẩm, OCR chứng từ và kiểm tra lỗi sản xuất bằng camera. Tìm môi trường có team kỹ thuật mạnh, review code tốt và cơ hội làm sản phẩm thật.',
    contactPhone: '0987654321',
    city: 'TP Hồ Chí Minh',
    district: 'Bình Thạnh',
    address: 'Phan Đăng Lưu, Bình Thạnh, TP Hồ Chí Minh',
    packageName: 'Miễn phí',
    categories: ['Việc làm & Tuyển dụng AI', 'Ứng dụng AI trong ngành'],
    contactName: 'Lê Quốc Bảo',
    statusLabel: 'available',
    zaloUrl: 'https://zalo.me/0987654321',
  },
  {
    title: 'Dịch vụ xây dựng AI agent nội bộ cho sales và vận hành',
    listingType: 'service',
    priceLabel: 'Từ 25 triệu/gói',
    summary: 'Nhận tư vấn và triển khai AI agent kết nối CRM, sheet, email, knowledge base.',
    description:
      'Phù hợp với doanh nghiệp cần tự động hóa lead qualification, hỗ trợ sales hoặc tổng hợp báo cáo vận hành. Có quy trình discovery, prototype 2 tuần, đánh giá ROI và chuyển giao tài liệu vận hành.',
    contactPhone: '0933334444',
    city: 'TP Hồ Chí Minh',
    district: 'Phú Nhuận',
    address: 'Phan Xích Long, Phú Nhuận, TP Hồ Chí Minh',
    packageName: 'Đối tác đề xuất',
    categories: ['Dịch vụ AI', 'Ứng dụng AI trong ngành'],
    contactName: 'Phạm Gia Huy',
    supportPhone: '19001234',
    statusLabel: 'available',
  },
  {
    title: 'Tuyển Prompt Engineer part-time cho đội sản xuất nội dung',
    listingType: 'job-offer',
    priceLabel: '12 - 18 triệu/tháng',
    summary: 'Làm việc với team content và design để chuẩn hóa prompt cho video, ảnh và social copy.',
    description:
      'Vai trò tập trung vào xây thư viện prompt, thử nghiệm workflow tạo nội dung hàng loạt và đo chất lượng đầu ra. Cần tư duy hệ thống, kỹ năng viết tốt và chủ động trong vận hành hằng ngày.',
    contactPhone: '0977001122',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: 'Duy Tân, Cầu Giấy, Hà Nội',
    packageName: 'Tin nổi bật 3 ngày',
    categories: ['Việc làm & Tuyển dụng AI', 'Khóa học và tài liệu AI'],
    contactName: 'Đỗ Thu Trang',
    supportPhone: '02462889977',
    statusLabel: 'available',
  },
  {
    title: 'Nhận setup pipeline fine-tuning và đánh giá mô hình tiếng Việt',
    listingType: 'service',
    priceLabel: 'Thỏa thuận',
    summary: 'Tư vấn data pipeline, fine-tuning, benchmark và triển khai inference cho bài toán tiếng Việt.',
    description:
      'Phù hợp với đội ngũ đang muốn nội địa hóa mô hình hoặc tối ưu chất lượng cho domain chuyên biệt. Có thể hỗ trợ từ khâu data curation, huấn luyện thử nghiệm đến đánh giá và đóng gói endpoint.',
    contactPhone: '0966112233',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    address: 'Bạch Đằng, Hải Châu, Đà Nẵng',
    packageName: 'Tin đối tác',
    categories: ['Dịch vụ AI', 'Dữ liệu và mô hình AI'],
    contactName: 'Võ Thanh Nam',
    statusLabel: 'available',
  },
  {
    title: 'Tìm cofounder technical cho sản phẩm AI trong giáo dục',
    listingType: 'other',
    priceLabel: 'Trao đổi equity + phụ cấp',
    summary: 'Nhóm sáng lập cần technical cofounder có thể dựng MVP nhanh với stack AI hiện đại.',
    description:
      'Sản phẩm hướng tới trợ lý học tập cá nhân hóa cho học sinh THPT. Cần người có thể vừa code full-stack vừa hiểu cơ bản về LLM, search, analytics và tối ưu chi phí hạ tầng giai đoạn đầu.',
    contactPhone: '0944556677',
    city: 'TP Hồ Chí Minh',
    district: 'Thủ Đức',
    address: 'Khu đô thị Sala, Thủ Đức, TP Hồ Chí Minh',
    packageName: 'Miễn phí',
    categories: ['Hợp tác và đầu tư AI', 'Sản phẩm AI'],
    contactName: 'Ngô Hải Đăng',
    statusLabel: 'available',
  },
  {
    title: 'Backend engineer chuyển hướng sang AI, nhận việc junior AI integration',
    listingType: 'job-seeking',
    priceLabel: 'Mong muốn 18 - 22 triệu/tháng',
    summary: '5 năm backend Node.js, mới chuyển sang tích hợp LLM, workflow automation và internal tools.',
    description:
      'Đã tự xây một số tool dùng OpenAI API, queue jobs, logging và dashboard theo dõi chi phí. Muốn tham gia team có mentor tốt để phát triển sang AI application engineer trong 6-12 tháng tới.',
    contactPhone: '0922887766',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    address: 'Mễ Trì, Nam Từ Liêm, Hà Nội',
    packageName: 'Miễn phí',
    categories: ['Việc làm & Tuyển dụng AI', 'Ứng dụng AI trong ngành'],
    contactName: 'Bùi Thành Công',
    statusLabel: 'available',
  },
]

export async function seedListings({
  payload,
  req,
  author,
  categoryDocs = [],
  mediaDocs = [],
}: ListingSeedInput): Promise<void> {
  let created = 0
  const categoryMap = new Map(categoryDocs.map((doc) => [doc.title.trim().toLowerCase(), doc.id]))

  for (const [index, item] of LISTING_SEED_DATA.entries()) {
    const avatar = mediaDocs[index % mediaDocs.length]
    const thumbnail = mediaDocs[(index + 1) % mediaDocs.length]
    const gallery = mediaDocs.length > 2
      ? [mediaDocs[(index + 2) % mediaDocs.length], mediaDocs[(index + 3) % mediaDocs.length]].filter(
          Boolean,
        )
      : []

    await payload.create({
      collection: 'listings',
      data: {
        ...item,
        description: lexicalParagraph(item.description),
        _status: 'published',
        slug: slugifyTitle(item.title) ?? `listing-${index + 1}`,
        categories: item.categories
          .map((title) => categoryMap.get(title.trim().toLowerCase()))
          .filter((value): value is number => typeof value === 'number'),
        avatar: avatar?.id,
        thumbnail: thumbnail?.id,
        gallery: gallery.map((doc) => doc.id),
        createdBy: author.id,
      },
      draft: false,
      req,
      context: {
        disableRevalidate: true,
      },
    })

    created += 1
  }

  payload.logger.info(`— Created ${created} seed listings.`)
}

export async function seedListingCategories({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<ListingCategory[]> {
  const categoryDocs: ListingCategory[] = []

  for (const [index, item] of LISTING_CATEGORY_SEED_DEFS.entries()) {
    const imageFile = await fetchImageFileByURL(
      `https://picsum.photos/seed/${item.picsumSeed}/600/600`,
      `listing-category-${index + 1}`,
    )

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: `${item.title} thumbnail`,
      },
      file: imageFile,
      req,
      context: { disableRevalidate: true },
    })

    const categoryDoc = await payload.create({
      collection: 'listing-categories',
      data: {
        title: item.title,
        slug: slugifyTitle(item.title) ?? `listing-category-${index + 1}`,
        thumbnail: mediaDoc.id,
      },
      draft: false,
      req,
      context: { disableRevalidate: true },
    })

    categoryDocs.push(categoryDoc)
  }

  payload.logger.info(`— Created ${categoryDocs.length} listing categories with thumbnails.`)
  return categoryDocs
}

async function fetchImageFileByURL(url: string, fallbackName: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${url}, status: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const data = await res.arrayBuffer()

  return {
    name: `${fallbackName}.${extension}`,
    data: Buffer.from(data),
    mimetype: contentType,
    size: data.byteLength,
  }
}
