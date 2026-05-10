import { EnhancedMediaBlock } from '@/blocks/EnhancedMediaBlock/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  RichText as ConvertRichText,
  JSXConvertersFunction,
  LinkJSXConverter,
} from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import Image from 'next/image'

import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  EnhancedMediaBlock as EnhancedMediaBlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { cn } from '@/utilities/ui'

function toYouTubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const u = new URL(trimmed)

    if (u.protocol !== 'https:') return null

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return trimmed
      }

      if (u.pathname === '/watch' || u.pathname === '/watch/') {
        const id = u.searchParams.get('v')
        return id ? `https://www.youtube.com/embed/${id}` : null
      }

      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`
      }
    }

    return null
  } catch {
    return null
  }
}

function renderYouTubeEmbed(embedUrl: string): ReactNode {
  return (
    <div className="my-6 overflow-hidden border border-border">
      <div className="aspect-video w-full">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={embedUrl}
          title="YouTube video"
        />
      </div>
    </div>
  )
}

function getPlainNodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''

  const maybeNode = node as {
    text?: unknown
    children?: unknown[]
  }

  if (typeof maybeNode.text === 'string') {
    return maybeNode.text
  }

  if (Array.isArray(maybeNode.children)) {
    return maybeNode.children.map(getPlainNodeText).join('')
  }

  return ''
}

function renderNodeChildren(node: unknown): ReactNode {
  if (!node || typeof node !== 'object') return null

  const maybeNode = node as {
    text?: unknown
    children?: unknown[]
  }

  if (typeof maybeNode.text === 'string') {
    return maybeNode.text
  }

  if (Array.isArray(maybeNode.children)) {
    return maybeNode.children.map((child, index) => (
      <span key={index}>{renderNodeChildren(child)}</span>
    ))
  }

  return null
}

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      CTABlockProps | MediaBlockProps | EnhancedMediaBlockProps | BannerBlockProps | CodeBlockProps
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value?.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => {
  const linkConverters = LinkJSXConverter({ internalDocToHref })

  return {
    ...defaultConverters,
    ...linkConverters,
    paragraph: (args) => {
      const plainText = getPlainNodeText(args.node).trim()
      const embedUrl = toYouTubeEmbedUrl(plainText)

      if (embedUrl) {
        return renderYouTubeEmbed(embedUrl)
      }

      return <p>{renderNodeChildren(args.node)}</p>
    },
    link: (args) => {
      const href = args.node.fields.url
      const embedUrl = toYouTubeEmbedUrl(href)
      const plainText = getPlainNodeText(args.node).trim()

      if (embedUrl && plainText === href?.trim()) {
        return renderYouTubeEmbed(embedUrl)
      }

      return (
        <a
          href={href}
          rel={args.node.fields.newTab ? 'noopener noreferrer' : undefined}
          target={args.node.fields.newTab ? '_blank' : undefined}
        >
          {renderNodeChildren(args.node)}
        </a>
      )
    },
    upload: ({ node }) => {
      if (node.relationTo === 'media') {
        const uploadDoc = node.value
        if (!uploadDoc || typeof uploadDoc !== 'object') {
          return null
        }
        const { alt, height, url, width } = uploadDoc
        const aspectRatio = width ? (height ? width / height : 1) : 1
        return (
          <span className="block w-full text-center">
            <Image
              src={url || ''}
              alt={alt || ''}
              width={width || 0}
              height={height || 0}
              className={'w-full h-auto my-0!'}
              style={{ aspectRatio }}
            />
            {node.fields?.caption && (
              <span className="mt-2 block text-sm text-muted-foreground italic">
                {node.fields.caption}
              </span>
            )}
          </span>
        )
      }

      return null
    },
    blocks: {
      banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,

      mediaBlock: ({ node }) => (
        <MediaBlock
          className="col-start-1 col-span-3"
          imgClassName="m-0"
          {...node.fields}
          captionClassName="mx-auto max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      enhancedMediaBlock: ({ node }) => (
        <EnhancedMediaBlock
          className="col-start-1 col-span-3"
          imgClassName="m-0"
          {...node.fields}
          captionClassName="mx-auto max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
      cta: ({ node }) => <CallToActionBlock {...node.fields} />,
    },
  }
}

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext text-lg font-arial [&_p,&_span,&_h1,&_h2,&_h3,&_h4,&_h5,&_h6,&_li,&_ol,&_ul,&_a,&_em,&_strong]:font-arial!',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
