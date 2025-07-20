import { getTranslations } from 'next-intl/server';
import HomeClient from '../home-client';

export default async function HomePage() {
  const t = await getTranslations();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* SEO H1 Tag */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black dark:text-white">
            {t('home.title')}
          </h1>
          {/* Removed description - it's now in the HomeClient component */}
        </div>
        
        {/* Main content */}
        <HomeClient />
      </div>
    </div>
  );
} 