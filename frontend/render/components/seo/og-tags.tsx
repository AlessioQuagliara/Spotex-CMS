/**
 * Open Graph Tags Component
 * Comprehensive OG tags for social media sharing
 */
import Head from 'next/head';

export interface OGTagsProps {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article' | 'product' | 'video.movie' | 'video.episode' | 'music.song' | 'profile';
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  siteName?: string;
  locale?: string;
  localeAlternate?: string[];
  
  // Article specific
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTag?: string[];
  
  // Product specific
  productPrice?: number;
  productCurrency?: string;
  productAvailability?: 'instock' | 'oos' | 'pending';
  productBrand?: string;
  
  // Video specific
  videoUrl?: string;
  videoSecureUrl?: string;
  videoType?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoDuration?: number;
  
  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

export function OGTags({
  title,
  description,
  url,
  type = 'website',
  image,
  imageWidth = 1200,
  imageHeight = 630,
  siteName = 'CMS',
  locale = 'it_IT',
  localeAlternate,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTag,
  productPrice,
  productCurrency = 'EUR',
  productAvailability,
  productBrand,
  videoUrl,
  videoSecureUrl,
  videoType,
  videoWidth,
  videoHeight,
  videoDuration,
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
}: OGTagsProps) {
  return (
    <Head>
      {/* Basic Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Alternate locales */}
      {localeAlternate?.map((alt) => (
        <meta key={alt} property="og:locale:alternate" content={alt} />
      ))}
      
      {/* Image */}
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content={imageWidth.toString()} />
          <meta property="og:image:height" content={imageHeight.toString()} />
          <meta property="og:image:alt" content={title} />
        </>
      )}
      
      {/* Article specific tags */}
      {type === 'article' && (
        <>
          {articlePublishedTime && (
            <meta property="article:published_time" content={articlePublishedTime} />
          )}
          {articleModifiedTime && (
            <meta property="article:modified_time" content={articleModifiedTime} />
          )}
          {articleAuthor && <meta property="article:author" content={articleAuthor} />}
          {articleSection && <meta property="article:section" content={articleSection} />}
          {articleTag?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Product specific tags */}
      {type === 'product' && (
        <>
          {productPrice !== undefined && (
            <>
              <meta property="product:price:amount" content={productPrice.toString()} />
              <meta property="product:price:currency" content={productCurrency} />
            </>
          )}
          {productAvailability && (
            <meta property="product:availability" content={productAvailability} />
          )}
          {productBrand && <meta property="product:brand" content={productBrand} />}
        </>
      )}
      
      {/* Video specific tags */}
      {(type === 'video.movie' || type === 'video.episode') && (
        <>
          {videoUrl && <meta property="og:video" content={videoUrl} />}
          {videoSecureUrl && <meta property="og:video:secure_url" content={videoSecureUrl} />}
          {videoType && <meta property="og:video:type" content={videoType} />}
          {videoWidth && <meta property="og:video:width" content={videoWidth.toString()} />}
          {videoHeight && <meta property="og:video:height" content={videoHeight.toString()} />}
          {videoDuration && <meta property="video:duration" content={videoDuration.toString()} />}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
    </Head>
  );
}
